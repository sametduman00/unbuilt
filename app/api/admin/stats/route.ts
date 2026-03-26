import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabase } from "@/app/lib/supabase";

const OWNER_ID = process.env.ADMIN_CLERK_USER_ID;

export async function GET() {
  const { userId } = await auth();
  if (!userId || userId !== OWNER_ID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = getSupabase();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const week = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
  const month = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString();

  const [
    { count: usersTotal },
    { count: usersToday },
    { count: usersWeek },
    { count: reportsTotal },
    { count: reportsToday },
    { count: reportsWeek },
    { data: recentReports },
    { data: orders },
    { data: pulseCache },
    { data: helpMessages },
    { data: topIdeas },
    { data: dailyReports },
  ] = await Promise.all([
    sb.from("user_credits").select("*", { count: "exact", head: true }),
    sb.from("user_credits").select("*", { count: "exact", head: true }).gte("created_at", today),
    sb.from("user_credits").select("*", { count: "exact", head: true }).gte("created_at", week),
    sb.from("user_reports").select("*", { count: "exact", head: true }),
    sb.from("user_reports").select("*", { count: "exact", head: true }).gte("created_at", today),
    sb.from("user_reports").select("*", { count: "exact", head: true }).gte("created_at", week),
    sb.from("user_reports").select("id,tool,idea,created_at,user_id").order("created_at", { ascending: false }).limit(10),
    sb.from("orders").select("id,user_id,package_slug,credits_added,amount_usd,created_at").order("created_at", { ascending: false }).limit(20),
    sb.from("pulse_feed_cache").select("generated_at,signals").order("generated_at", { ascending: false }).limit(1).single(),
    sb.from("help_messages").select("*").order("created_at", { ascending: false }).limit(20),
    sb.from("user_reports").select("idea").gte("created_at", month),
    sb.from("user_reports").select("created_at,tool").gte("created_at", week).order("created_at", { ascending: true }),
  ]);

  // Revenue
  const totalRevenue = orders?.reduce((sum, o) => sum + (o.amount_usd ?? 0), 0) ?? 0;
  const todayRevenue = orders?.filter(o => o.created_at >= today).reduce((sum, o) => sum + (o.amount_usd ?? 0), 0) ?? 0;

  // Pulse signals count
  const pulseSignals = Array.isArray(pulseCache?.signals) ? pulseCache.signals.length : 0;

  return NextResponse.json({
    users: { total: usersTotal ?? 0, today: usersToday ?? 0, week: usersWeek ?? 0 },
    reports: { total: reportsTotal ?? 0, today: reportsToday ?? 0, week: reportsWeek ?? 0 },
    revenue: { total: totalRevenue, today: todayRevenue },
    recentReports: recentReports ?? [],
    orders: orders ?? [],
    pulse: { generatedAt: pulseCache?.generated_at ?? null, signals: pulseSignals },
    helpMessages: helpMessages ?? [],
    topIdeas: topIdeas ?? [],
    dailyReports: dailyReports ?? [],
    timestamp: now.toISOString(),
  });
}
