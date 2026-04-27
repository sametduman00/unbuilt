import { rateLimit } from "@/app/api/_ratelimit";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserPlan, initUserSubscription } from "@/app/lib/plan";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ plan: "free", monthlyAnalyses: 0, purchasedAnalyses: 0, totalAnalyses: 0, isPro: false }, { status: 200 });

  const rl = rateLimit(userId, 60, 60000);
  if (!rl.ok) return new Response(JSON.stringify({ error: "Too many requests." }), { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } });

  try {
    await initUserSubscription(userId);
    const plan = await getUserPlan(userId);
    return NextResponse.json(plan);
  } catch (err) {
    // Surface Supabase failures as 503 so the client can preserve cached Pro state
    // instead of treating the user as free.
    console.error("plan API error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "plan_fetch_failed" }, { status: 503 });
  }
}
