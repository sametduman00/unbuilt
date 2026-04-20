import { getSupabase } from "@/app/lib/supabase";

export interface UserPlan {
  plan: "free" | "pro";
  monthlyAnalyses: number;
  purchasedAnalyses: number;
  totalAnalyses: number;
  isPro: boolean;
  currentPeriodEnd: string | null;
  paddleSubscriptionId: string | null;
}

export async function getUserPlan(userId: string): Promise<UserPlan> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!data) {
    // Check legacy user_credits table for backward compat
    const { data: legacy } = await supabase
      .from("user_credits")
      .select("credits")
      .eq("user_id", userId)
      .single();

    const purchased = legacy?.credits ?? 0;
    return {
      plan: "free",
      monthlyAnalyses: 0,
      purchasedAnalyses: purchased,
      totalAnalyses: purchased,
      isPro: false,
      currentPeriodEnd: null,
      paddleSubscriptionId: null,
    };
  }

  const monthly = data.monthly_analyses ?? 0;
  const purchased = data.purchased_analyses ?? 0;

  return {
    plan: data.plan ?? "free",
    monthlyAnalyses: monthly,
    purchasedAnalyses: purchased,
    totalAnalyses: monthly + purchased,
    isPro: data.plan === "pro",
    currentPeriodEnd: data.current_period_end ?? null,
    paddleSubscriptionId: data.paddle_subscription_id ?? null,
  };
}

/** Deduct 1 analysis. Returns true if successful. Consumes monthly first, then purchased. */
export async function deductAnalysis(userId: string): Promise<boolean> {
  const supabase = getSupabase();

  // Try to deduct from monthly first
  const { data: monthlyResult } = await supabase.rpc("deduct_monthly_analysis", { p_user_id: userId });
  if (monthlyResult === true) return true;

  // Try purchased analyses
  const { data: purchasedResult } = await supabase.rpc("deduct_purchased_analysis", { p_user_id: userId });
  if (purchasedResult === true) return true;

  // Also try legacy credits table as fallback
  const { data: legacyResult } = await supabase.rpc("deduct_credit", { p_user_id: userId });
  return legacyResult === true;
}

/** Add purchased analyses (from credit pack purchase) */
export async function addPurchasedAnalyses(userId: string, amount: number): Promise<void> {
  const supabase = getSupabase();
  await supabase.rpc("add_purchased_analyses", { p_user_id: userId, p_amount: amount });
}

/** Initialize subscription row for a new user */
export async function initUserSubscription(userId: string): Promise<void> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("user_subscriptions")
    .select("user_id")
    .eq("user_id", userId)
    .single();
  if (!data) {
    await supabase.from("user_subscriptions").insert({
      user_id: userId,
      plan: "free",
      monthly_analyses: 0,
      purchased_analyses: 0,
    });
  }
}

/** Activate Pro subscription. monthlyQuota: 10 for Pro, 25 for Pro+ */
export async function activateProSubscription(
  userId: string,
  paddleSubscriptionId: string,
  periodEnd: string,
  monthlyQuota: number = 10
): Promise<void> {
  const supabase = getSupabase();
  await supabase.from("user_subscriptions").upsert({
    user_id: userId,
    plan: "pro",
    monthly_analyses: monthlyQuota,
    paddle_subscription_id: paddleSubscriptionId,
    current_period_end: periodEnd,
  }, { onConflict: "user_id" });
}

/** Renew Pro subscription — reset monthly analyses */
export async function renewProSubscription(userId: string, periodEnd: string, monthlyQuota: number = 10): Promise<void> {
  const supabase = getSupabase();
  await supabase.from("user_subscriptions")
    .update({ monthly_analyses: monthlyQuota, current_period_end: periodEnd })
    .eq("user_id", userId);
}

/** Cancel Pro subscription — plan stays pro until period end, then cron flips to free */
export async function cancelProSubscription(userId: string): Promise<void> {
  const supabase = getSupabase();
  await supabase.from("user_subscriptions")
    .update({ paddle_subscription_id: null })
    .eq("user_id", userId);
}

/** Check free tier daily rate limit. Returns true if under limit. */
export async function checkFreeRateLimit(ip: string): Promise<boolean> {
  const supabase = getSupabase();
  const today = new Date().toISOString().split("T")[0];
  const { count } = await supabase
    .from("free_analysis_log")
    .select("*", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("created_at", today + "T00:00:00Z");
  return (count ?? 0) < 5;
}

/** Log a free analysis for rate limiting */
export async function logFreeAnalysis(ip: string, userId?: string): Promise<void> {
  const supabase = getSupabase();
  await supabase.from("free_analysis_log").insert({
    ip,
    user_id: userId ?? null,
    created_at: new Date().toISOString(),
  });
}
