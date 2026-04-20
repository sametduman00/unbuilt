import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "x-cockpit-key, content-type",
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}

export async function GET(req: NextRequest) {
  const key = req.headers.get("x-cockpit-key");
  if (!key || key !== process.env.COCKPIT_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS });
  }

  const sb = getSupabase();
  const today = new Date(); today.setHours(0,0,0,0);
  const week  = new Date(Date.now() - 7*24*3600*1000);
  const month = new Date(Date.now() - 30*24*3600*1000);

  const [
    { count: usersTotal }, { count: usersToday }, { count: usersWeek },
    { count: reportsTotal }, { count: reportsToday }, { count: reportsWeek },
    { count: digTotal }, { count: stackTotal }, { count: digToday }, { count: stackToday },
    { data: orders }, { data: pulse }, { data: daily },
    { count: proUsers }, { count: freeAnalysesToday }, { count: freeAnalysesWeek },
    { data: subscriptionData },
  ] = await Promise.all([
    sb.from("user_credits").select("*", { count:"exact", head:true }),
    sb.from("user_credits").select("*", { count:"exact", head:true }).gte("created_at", today.toISOString()),
    sb.from("user_credits").select("*", { count:"exact", head:true }).gte("created_at", week.toISOString()),
    sb.from("user_reports").select("*", { count:"exact", head:true }),
    sb.from("user_reports").select("*", { count:"exact", head:true }).gte("created_at", today.toISOString()),
    sb.from("user_reports").select("*", { count:"exact", head:true }).gte("created_at", week.toISOString()),
    sb.from("user_reports").select("*", { count:"exact", head:true }).eq("tool","gap-analysis"),
    sb.from("user_reports").select("*", { count:"exact", head:true }).eq("tool","stack-advisor"),
    sb.from("user_reports").select("*", { count:"exact", head:true }).eq("tool","gap-analysis").gte("created_at", today.toISOString()),
    sb.from("user_reports").select("*", { count:"exact", head:true }).eq("tool","stack-advisor").gte("created_at", today.toISOString()),
    sb.from("orders").select("id,package_slug,credits_added,amount_usd,created_at").order("created_at",{ascending:false}).limit(50),
    sb.from("pulse_feed_cache").select("generated_at,signals").order("generated_at",{ascending:false}).limit(1).single(),
    sb.from("user_reports").select("created_at,tool").gte("created_at", month.toISOString()).order("created_at",{ascending:true}),
    // Freemium metrics
    sb.from("user_subscriptions").select("*", { count:"exact", head:true }).eq("plan", "pro"),
    sb.from("free_analysis_log").select("*", { count:"exact", head:true }).gte("created_at", today.toISOString()),
    sb.from("free_analysis_log").select("*", { count:"exact", head:true }).gte("created_at", week.toISOString()),
    sb.from("user_subscriptions").select("plan,monthly_analyses,purchased_analyses").eq("plan", "pro"),
  ]);

  const totalRevenue = orders?.reduce((s,o)=>s+(o.amount_usd??0),0)??0;
  const todayRevenue = orders?.filter(o=>new Date(o.created_at)>=today).reduce((s,o)=>s+(o.amount_usd??0),0)??0;
  const weekRevenue  = orders?.filter(o=>new Date(o.created_at)>=week).reduce((s,o)=>s+(o.amount_usd??0),0)??0;
  const creditsGiven = orders?.reduce((s,o)=>s+(o.credits_added??0),0)??0;
  const pulseSignals = Array.isArray(pulse?.signals)?(pulse.signals as unknown[]).length:0;
  const pulseAge     = pulse?.generated_at?Math.floor((Date.now()-new Date(pulse.generated_at).getTime())/60000):null;

  const dailyMap: Record<string,{dig:number;stack:number}> = {};
  for (const r of daily??[]) {
    const d = r.created_at.slice(0,10);
    if (!dailyMap[d]) dailyMap[d]={dig:0,stack:0};
    if (r.tool==="gap-analysis") dailyMap[d].dig++; else dailyMap[d].stack++;
  }

  const totalMonthlyRemaining = subscriptionData?.reduce((s: number, u: any) => s + (u.monthly_analyses ?? 0), 0) ?? 0;
  const totalPurchasedRemaining = subscriptionData?.reduce((s: number, u: any) => s + (u.purchased_analyses ?? 0), 0) ?? 0;

  // Abuse monitoring: top free IPs today
  const { data: freeLogToday } = await sb.from("free_analysis_log")
    .select("ip")
    .gte("created_at", today.toISOString());
  
  const ipCounts: Record<string, number> = {};
  for (const row of freeLogToday ?? []) {
    ipCounts[row.ip] = (ipCounts[row.ip] ?? 0) + 1;
  }
  const topFreeIPs = Object.entries(ipCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }));

  return NextResponse.json({
    users:   { total:usersTotal??0, today:usersToday??0, week:usersWeek??0 },
    reports: { total:reportsTotal??0, today:reportsToday??0, week:reportsWeek??0,
               dig:{total:digTotal??0,today:digToday??0}, stack:{total:stackTotal??0,today:stackToday??0} },
    revenue: { total:totalRevenue, today:todayRevenue, week:weekRevenue },
    orders:  { total:orders?.length??0, today:orders?.filter(o=>new Date(o.created_at)>=today).length??0,
               credits:creditsGiven, recent:orders?.slice(0,10)??[] },
    pulse:   { generatedAt:pulse?.generated_at??null, signals:pulseSignals, ageMinutes:pulseAge },
    daily:   dailyMap,
    freemium: {
      proSubscribers: proUsers ?? 0,
      freeAnalyses: { today: freeAnalysesToday ?? 0, week: freeAnalysesWeek ?? 0 },
      monthlyAnalysesRemaining: totalMonthlyRemaining,
      purchasedAnalysesRemaining: totalPurchasedRemaining,
      topFreeIPs,
    },
  }, { headers: CORS });
}
