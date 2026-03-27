import { NextRequest, NextResponse } from "next/server";
import { addCredits } from "@/app/lib/credits";
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

export async function POST(req: NextRequest) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  const signature = req.headers.get("paddle-signature") ?? "";
  const body = await req.text();

  if (!secret) {
    console.error("[Paddle] PADDLE_WEBHOOK_SECRET not set - rejecting request");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  // ── Signature verification ──────────────────────────────────────────────────
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

  // ── Event processing ────────────────────────────────────────────────────────
  const event = JSON.parse(body);

  if (event.event_type === "transaction.completed") {
    const userId      = event.data?.custom_data?.user_id;
    const packageSlug = event.data?.custom_data?.package_slug;
    const paddleOrderId = event.data?.id as string | undefined; // Paddle transaction ID
    const amount      = event.data?.details?.totals?.total;
    const currency    = event.data?.currency_code ?? "USD";
    const email       = event.data?.customer?.email ?? "unknown";

    if (!userId || !packageSlug) {
      console.error("[Paddle] Missing user_id or package_slug in custom_data");
      return NextResponse.json({ ok: true }); // ack so Paddle doesn't retry
    }

    const credits = PACKAGES[packageSlug] ?? 0;
    if (credits <= 0) {
      console.error("[Paddle] Unknown package_slug:", packageSlug);
      return NextResponse.json({ ok: true });
    }

    // ── IDEMPOTENCY: Insert order with paddle_order_id UNIQUE constraint ───────
    // ON CONFLICT DO NOTHING = if this transaction was already processed, skip.
    // This is the atomic guard against replay attacks and duplicate webhooks.
    const supabase = getSupabase();
    const amountUsd = amount ? parseInt(amount) / 100 : null;

    const { error: insertError, count } = await supabase
      .from("orders")
      .insert({
        user_id:       userId,
        paddle_order_id: paddleOrderId ?? null,
        package_slug:  packageSlug,
        credits_added: credits,
        amount_usd:    amountUsd,
        status:        "completed",
      })
      .select("id", { count: "exact", head: true });

    if (insertError) {
      // Unique constraint violation = duplicate event → skip credit grant
      if (insertError.code === "23505") {
        console.log("[Paddle] Duplicate transaction, skipping:", paddleOrderId);
        return NextResponse.json({ ok: true });
      }
      // Other DB error — return 500 so Paddle retries (safe: we haven't added credits yet)
      console.error("[Paddle] DB insert error:", insertError);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    // ── Only add credits AFTER successful order insert ─────────────────────────
    await addCredits(userId, credits);

    const amountFormatted = amount
      ? `${(parseInt(amount) / 100).toFixed(2)} ${currency}`
      : "?";
    await sendTelegram(
      `💰 <b>New purchase!</b>\n📦 Package: <b>${packageSlug}</b> (${credits} credits)\n💵 Amount: <b>${amountFormatted}</b>\n📧 ${email}`
    );
  }

  return NextResponse.json({ ok: true });
}
