import { NextRequest, NextResponse } from "next/server";
import { isDisposableEmail, checkSignupRateLimit, getClientIP } from "@/app/lib/abuse";
import { incrementAlert } from "@/app/lib/alerts";
import { getSupabase } from "@/app/lib/supabase";

async function verifyClerkSignature(req: NextRequest): Promise<{ valid: boolean; payload?: Record<string, unknown> }> {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return { valid: false };
  const svixId = req.headers.get("svix-id") ?? "";
  const svixTimestamp = req.headers.get("svix-timestamp") ?? "";
  const svixSignature = req.headers.get("svix-signature") ?? "";
  if (!svixId || !svixTimestamp || !svixSignature) return { valid: false };
  const body = await req.text();
  const toSign = `${svixId}.${svixTimestamp}.${body}`;
  const secretBase64 = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const keyBytes = Uint8Array.from(atob(secretBase64), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(toSign));
  const expectedSig = "v1," + btoa(String.fromCharCode(...new Uint8Array(signature)));
  const valid = svixSignature.split(" ").some(s => s === expectedSig);
  if (!valid) return { valid: false };
  try { return { valid: true, payload: JSON.parse(body) }; }
  catch { return { valid: false }; }
}

async function deleteClerkUser(userId: string): Promise<void> {
  const key = process.env.CLERK_SECRET_KEY;
  if (!key) return;
  await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(5000),
  }).catch(() => {});
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { valid, payload } = await verifyClerkSignature(req);
  if (!valid || !payload) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  if (payload.type !== "user.created") return NextResponse.json({ ok: true });

  const data = payload.data as Record<string, unknown>;
  const userId = data.id as string;
  const emails = (data.email_addresses as { email_address: string }[]) ?? [];
  const primaryEmail = emails[0]?.email_address ?? "";

  if (isDisposableEmail(primaryEmail)) {
    await deleteClerkUser(userId);
    incrementAlert("signup_wave", 600).catch(() => {});
    return NextResponse.json({ error: "Disposable email not allowed" }, { status: 403 });
  }

  const ip = getClientIP(req);
  const ipCheck = await checkSignupRateLimit(ip);
  if (!ipCheck.allowed) {
    await deleteClerkUser(userId);
    incrementAlert("signup_wave", 600).catch(() => {});
    return NextResponse.json({ error: ipCheck.reason ?? "Too many signups from this IP" }, { status: 429 });
  }

  const sb = getSupabase();

  // Check if this IP already got a free credit in the last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentFree } = await sb
    .from("user_credits")
    .select("user_id")
    .eq("signup_ip", ip)
    .gt("created_at", oneDayAgo)
    .gt("credits", 0)
    .limit(1);

  const grantFreeCredit = !recentFree || recentFree.length === 0;

  const { error } = await sb.from("user_credits").upsert(
    { user_id: userId, credits: grantFreeCredit ? 1 : 0, signup_ip: ip, created_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  if (error) console.error("[Clerk webhook] Supabase upsert error:", error.message);
  if (!grantFreeCredit) console.log(`[Clerk webhook] Free credit denied — IP ${ip} already used in last 24h`);

  return NextResponse.json({ ok: true });
}
