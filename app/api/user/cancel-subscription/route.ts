import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserPlan, cancelProSubscription } from "@/app/lib/plan";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = await getUserPlan(userId);
  if (!plan.isPro || !plan.paddleSubscriptionId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Paddle API key not configured" }, { status: 500 });
  }

  // Cancel at end of billing period (not immediately)
  const res = await fetch(
    `https://api.paddle.com/subscriptions/${plan.paddleSubscriptionId}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ effective_from: "next_billing_period" }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("[Cancel] Paddle API error:", err);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }

  // Mark as pending cancellation in our DB
  await cancelProSubscription(userId);

  return NextResponse.json({ ok: true, message: "Subscription will cancel at the end of your billing period" });
}
