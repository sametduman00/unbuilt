import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { isDisposableEmail, checkSignupRateLimit, getClientIP } from "@/app/lib/abuse";
import { incrementAlert } from "@/app/lib/alerts";

// Verify Clerk webhook signature using svix
async function verifySignature(req: NextRequest): Promise<{ valid: boolean; payload?: Record<string, unknown> }> {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return { valid: false };

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) return { valid: false };

  const body = await req.text();
  try {
    const wh = new Webhook(secret);
    const payload = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as Record<string, unknown>;
    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

// Delete user via Clerk API (called when signup is rejected)
async function deleteClerkUser(userId: string): Promise<void> {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) return;
  await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${secret}` },
    signal: AbortSignal.timeout(5000),
  }).catch(() => {});
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Verify signature
  const { valid, payload } = await verifySignature(req);
  if (!valid || !payload) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const eventType = payload.type as string;

  // 2. Only handle user.created
  if (eventType !== "user.created") {
    return NextResponse.json({ ok: true });
  }

  const data = payload.data as Record<string, unknown>;
  const userId = data.id as string;
  const emailAddresses = (data.email_addresses as { email_address: string }[]) ?? [];
  const primaryEmail = emailAddresses[0]?.email_address ?? "";

  // 3. Disposable email check
  if (isDisposableEmail(primaryEmail)) {
    await deleteClerkUser(userId);
    incrementAlert("signup_wave", 600).catch(() => {});
    return NextResponse.json({ error: "Disposable email not allowed" }, { status: 403 });
  }

  // 4. IP-based signup rate limit
  const ip = getClientIP(req);
  const ipCheck = await checkSignupRateLimit(ip);
  if (!ipCheck.allowed) {
    await deleteClerkUser(userId);
    incrementAlert("signup_wave", 600).catch(() => {});
    return NextResponse.json({ error: "Signup rate limit exceeded" }, { status: 429 });
  }

  return NextResponse.json({ ok: true });
}
