import { NextRequest, NextResponse } from "next/server";
import { addCredits } from "@/app/lib/credits";
import { incrementAlert } from "@/app/lib/alerts";
import { getSupabase } from "@/app/lib/supabase";

const PACKAGES: Record<string, number> = { starter: 5, popular: 10, pro: 25 };

async function sendTelegram(msg: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: "HTML" }),
  }).then(() => {}, () => {});
}

/**
 * Meta Conversions API (CAPI) — server-side Purchase event.
 * Client-side fbq() is unreliable (ad blockers, iOS ITP, timing).
 * CAPI sends directly from server → Meta. 100% delivery.
 *
 * Setup: Add META_CAPI_TOKEN env var in Vercel dashboard.
 * Get it from: Meta Events Manager → Settings → Generate access token
 */
async function sendMetaPurchaseEvent(email: string, amountUsd: number, currency: string) {
  const pixelId = "2766426413706285";
  const token = process.env.META_CAPI_TOKEN;
  if (!token) {
    console.log("[Meta CAPI] META_CAPI_TOKEN not set, skipping");
    return;
  }

  // Hash email for privacy (Meta requires SHA256)
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(email.toLowerCase().trim()));
  const hashedEmail = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

  const payload = {
    data: [{
      event_name: "Purchase",
      event_time: Math.floor(Date.now() / 1000),
      action_source: "website",
      event_source_url: "https://unbuilt.me/pricing",
      user_data: {
        em: [hashedEmail],
      },
      custom_data: {
        value: amountUsd,
        currency: currency.toUpperCase(),
        content_name: "Unbuilt Credits",
      },
    }],
  };

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    console.log("[Meta CAPI] Purchase event sent:", result?.events_received ?? 0, "events received");
  } catch (err) {
    console.error("[Meta CAPI] Failed to send event:", err);
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  const signature = req.headers.get("paddle-signature") ?? "";
  const body = await req.text();

  if (!secret) {
    console.error("[Paddle] PADDLE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  // ── Signature verification ───────────────────────────────────────────────────
  const ts = signature.match(/ts=(\d+)/)?.[1];
  const h1 = signature.match(/h1=([a-f0-9]+)/)?.[1];
  if (!ts || !h1) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(`${ts}:${body}`));
  const expected = Array.from(new Uint8Array(signed))
    .map(b => b.toString(16).padStart(2, "0")).join("");
  if (expected !== h1) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  // ── Event processing ─────────────────────────────────────────────────────────
  const event = JSON.parse(body);

  if (event.event_type === "transaction.completed") {
    const userId        = event.data?.custom_data?.user_id as string | undefined;
    const packageSlug   = event.data?.custom_data?.package_slug as string | undefined;
    const paddleOrderId = event.data?.id as string | undefined;
    const amount        = event.data?.details?.totals?.total as string | undefined;
    const currency      = event.data?.currency_code ?? "USD";
    const email         = event.data?.customer?.email ?? "unknown";

    if (!userId || !packageSlug) {
      console.error("[Paddle] Missing user_id or package_slug");
      return NextResponse.json({ ok: true }); // ack so Paddle doesn't retry forever
    }

    const credits = PACKAGES[packageSlug] ?? 0;
    if (credits <= 0) {
      console.error("[Paddle] Unknown package_slug received.");
      return NextResponse.json({ ok: true });
    }

    const supabase = getSupabase();

    // ── IDEMPOTENCY: check if this paddle_order_id was already processed ────────
    // paddle_order_id has a UNIQUE constraint in the orders table.
    // Checking first then inserting is safe here because:
    // - Paddle sends each event_id once (and retries are rare)
    // - The UNIQUE constraint is the true atomic guard against duplicates
    if (paddleOrderId) {
      const { data: existing } = await supabase
        .from("orders")
        .select("id")
        .eq("paddle_order_id", paddleOrderId)
        .maybeSingle();

      if (existing) {
        console.log("[Paddle] Duplicate transaction, skipping.");
        return NextResponse.json({ ok: true });
      }
    }

    // ── Insert order record ──────────────────────────────────────────────────────
    const amountUsd = amount ? parseInt(amount) / 100 : null;
    const { error: insertError } = await supabase.from("orders").insert({
      user_id:         userId,
      paddle_order_id: paddleOrderId ?? null,
      package_slug:    packageSlug,
      credits_added:   credits,
      amount_usd:      amountUsd,
      status:          "completed",
    });

    if (insertError) {
      // Unique constraint violation = race condition duplicate → skip
      if (insertError.code === "23505") {
        console.log("[Paddle] Race-condition duplicate, skipping.");
        return NextResponse.json({ ok: true });
      }
      // Other DB error — return 500 so Paddle retries (credits NOT added yet = safe)
      console.error("[Paddle] DB insert error code:", insertError.code ?? "unknown");
      incrementAlert("webhook_fail", 3600).catch(() => {});
      incrementAlert("webhook_fail", 3600).catch(() => {});
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    // ── Add credits AFTER successful order insert ─────────────────────────────
    await addCredits(userId, credits);

    const amountFormatted = amount
      ? `${(parseInt(amount) / 100).toFixed(2)} ${currency}`
      : "?";
    await sendTelegram(
      `💰 <b>New purchase!</b>\n📦 Package: <b>${packageSlug}</b> (${credits} credits)\n💵 Amount: <b>${amountFormatted}</b>\n📧 ${email}`
    );

    // Meta CAPI — server-side Purchase event (reliable, ad-blocker proof)
    await sendMetaPurchaseEvent(email, amountUsd ?? 0, currency);
  }

  return NextResponse.json({ ok: true });
}
