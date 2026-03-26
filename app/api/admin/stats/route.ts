import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/app/lib/supabase";

const OWNER_ID = process.env.ADMIN_CLERK_USER_ID;

export async function GET() {
  const { userId } = await auth();
  if (!userId || userId !== OWNER_ID) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = getSupabase();
  const today = new Date(); today.setHours(0,0,0,0);
  const week = new Date(Date.now() - 7*24*3600*1000);
  const month = new Date(Date.now() - 30*24*3600*1000);

  const [
    { count: usersTotal },
    { count: usersToday },
    { count: usersWeek },
    { count: reportsTotal },
    { count: reportsToday },
    { count: reportsWeek },
    { count: digTotal },
    { count: stackTotal },
    { count: digToday },
    { count: stackToday },
    { data: orders },
    { data: pulseCache },
    { data: recentErrors },
    { data: dailyActivity },
  ] = await Promise.all([
    sb.from("user_credits").select("*", { count: "exact", head: true }),
    sb.from("user_credits").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
    sb.from("user_credits").select("*", { count: "exact", head: true }).gte("created_at", week.toISOString()),
    sb.from("user_reports").select("*", { count: "exact", head: true }),
    sb.from("user_reports").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
    sb.from("user_reports").select("*", { count: "exact", head: true }).gte("created_at", week.toISOString()),
    sb.from("user_reports").select("*", { count: "exact", head: true }).eq("tool", "gap-analysis"),
    sb.from("user_reports").select("*", { count: "exact", head: true }).eq("tool", "stack-advisor"),
    sb.from("user_reports").select("*", { count: "exact", head: true }).eq("tool", "gap-analysis").gte("created_at", today.toISOString()),
    sb.from("user_reports").select("*", { count: "exact", head: true }).eq("tool", "stack-advisor").gte("created_at", today.toISOString()),
    sb.from("orders").select("id,package_slug,credits_added,amount_usd,created_at,status").order("created_at", { ascending: false }).limit(50),
    sb.from("pulse_feed_cache").select("generated_at,signals").order("generated_at", { ascending: false }).limit(1).single(),
    sb.from("user_credits").select("credits,updated_at").order("credits", { ascending: true }).limit(5),
    sb.from("user_reports").select("created_at,tool").gte("created_at", month.toISOString()).order("created_at", { ascending: true }),
  ]);

  // Revenue stats
  const totalRevenue = orders?.reduce((s, o) => s + (o.amount_usd ?? 0), 0) ?? 0;
  const todayRevenue = orders?.filter(o => new Date(o.created_at) >= today).reduce((s, o) => s + (o.amount_usd ?? 0), 0) ?? 0;
  const weekRevenue = orders?.filter(o => new Date(o.created_at) >= week).reduce((s, o) => s + (o.amount_usd ?? 0), 0) ?? 0;
  const orderCount = orders?.length ?? 0;
  const todayOrders = orders?.filter(o => new Date(o.created_at) >= today).length ?? 0;

  // Credits distributed
  const creditsGiven = orders?.reduce((s, o) => s + (o.credits_added ?? 0), 0) ?? 0;

  // Pulse
  const pulseSignals = Array.isArray(pulseCache?.signals) ? (pulseCache.signals as any[]).length : 0;
  const pulseAge = pulseCache?.generated_at ? Math.floor((Date.now() - new Date(pulseCache.generated_at).getTime()) / 60000) : null;

  // Daily breakdown (last 30 days)
  const dailyMap: Record<string, { dig: number; stack: number }> = {};
  for (const r of dailyActivity ?? []) {
    const d = r.created_at.slice(0, 10);
    if (!dailyMap[d]) dailyMap[d] = { dig: 0, stack: 0 };
    if (r.tool === "gap-analysis") dailyMap[d].dig++;
    else dailyMap[d].stack++;
  }

  return NextResponse.json({
    users: { total: usersTotal ?? 0, today: usersToday ?? 0, week: usersWeek ?? 0 },
    reports: {
      total: reportsTotal ?? 0, today: reportsToday ?? 0, week: reportsWeek ?? 0,
      dig: { total: digTotal ?? 0, today: digToday ?? 0 },
      stack: { total: stackTotal ?? 0, today: stackToday ?? 0 },
    },
    revenue: { total: totalRevenue, today: todayRevenue, week: weekRevenue },
    orders: { total: orderCount, today: todayOrders, credits: creditsGiven, recent: orders?.slice(0, 10) ?? [] },
    pulse: { generatedAt: pulseCache?.generated_at ?? null, signals: pulseSignals, ageMinutes: pulseAge },
    daily: dailyMap,
    timestamp: new Date().toISOString(),
  });
}
