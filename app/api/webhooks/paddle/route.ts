import { NextRequest, NextResponse } from "next/server";
import { addCredits } from "@/app/lib/credits";

const PACKAGES: Record<string, number> = {
  starter: 5,
  popular: 10,
  pro: 25,
};

export async function POST(req: NextRequest) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  const signature = req.headers.get("paddle-signature") ?? "";
  const body = await req.text();

  if (secret) {
    const ts = signature.match(/ts=(\d+)/)?.[1];
    const h1 = signature.match(/h1=([a-f0-9]+)/)?.[1];
    if (!ts || !h1) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(`${ts}:${body}`));
    const expected = Array.from(new Uint8Array(signed))
      .map(b => b.toString(16).padStart(2, "0")).join("");
    if (expected !== h1) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const event = JSON.parse(body);

  if (event.event_type === "transaction.completed") {
    const userId = event.data?.custom_data?.user_id;
    const packageSlug = event.data?.custom_data?.package_slug;
    if (userId && packageSlug) {
      const credits = PACKAGES[packageSlug] ?? 0;
      if (credits > 0) await addCredits(userId, credits);
    }
  }

  return NextResponse.json({ ok: true });
      }
