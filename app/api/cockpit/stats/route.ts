import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";

/**
 * Cockpit stats — extended.
 *
 * Surfaces enough signal that a single page can answer:
 *   "what's happening right now?"  (today + live counts)
 *   "is the trend healthy?"        (7d vs prior 7d, 30d daily series)
 *   "where are people getting stuck?" (funnel)
 *   "are users sticking?"          (weekly cohort retention)
 *   "when do they show up?"        (hourly heatmap, last 14d × 24h)
 *   "what's selling?"              (package mix, daily revenue)
 *   "anything broken?"             (pulse cron freshness, anomaly flags)
 *   "what should I do today?"      (rule-based action items)
 *
 * All heavy computation happens here so the cockpit ships small JSON
 * and renders fast. CORS is wide-open because the cockpit is a separate
 * Vercel project that calls this from another origin.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "x-cockpit-key, content-type",
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}

// Small util: ISO date key (YYYY-MM-DD) in UTC.
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

// Small util: percent delta with safe handling of zero baseline.
const delta = (current: number, prev: number) => {
  if (!prev) return current > 0 ? 100 : 0;
  return Math.round(((current - prev) / prev) * 100);
};

export async function GET(req: NextRequest) {
  const key = req.headers.get("x-cockpit-key");
  if (!key || key !== process.env.COCKPIT_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS });
  }

  const sb = getSupabase();
  const now = new Date();
  const today = new Date(now); today.setUTCHours(0, 0, 0, 0);
  const week = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const prevWeek = new Date(now.getTime() - 14 * 24 * 3600 * 1000);
  const month = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  const fortnight = new Date(now.getTime() - 14 * 24 * 3600 * 1000);
  const eightWeeks = new Date(now.getTime() - 56 * 24 * 3600 * 1000);

  // Phase 1: lots of light count queries in parallel. These are cheap because
  // they all use { head:true, count:'exact' } — Postgres returns the count
  // header without serialising rows.
  const [
    { count: usersTotal }, { count: usersToday }, { count: usersWeek }, { count: usersPrevWeek },
    { count: reportsTotal }, { count: reportsToday }, { count: reportsWeek }, { count: reportsPrevWeek },
    { count: digTotal }, { count: stackTotal }, { count: digToday }, { count: stackToday },
    { count: proUsers }, { count: freeAnalysesToday }, { count: freeAnalysesWeek },
  ] = await Promise.all([
    sb.from("user_credits").select("*", { count: "exact", head: true }),
    sb.from("user_credits").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
    sb.from("user_credits").select("*", { count: "exact", head: true }).gte("created_at", week.toISOString()),
    sb.from("user_credits").select("*", { count: "exact", head: true }).gte("created_at", prevWeek.toISOString()).lt("created_at", week.toISOString()),
    sb.from("user_reports").select("*", { count: "exact", head: true }),
    sb.from("user_reports").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
    sb.from("user_reports").select("*", { count: "exact", head: true }).gte("created_at", week.toISOString()),
    sb.from("user_reports").select("*", { count: "exact", head: true }).gte("created_at", prevWeek.toISOString()).lt("created_at", week.toISOString()),
    sb.from("user_reports").select("*", { count: "exact", head: true }).eq("tool", "gap-analysis"),
    sb.from("user_reports").select("*", { count: "exact", head: true }).eq("tool", "stack-advisor"),
    sb.from("user_reports").select("*", { count: "exact", head: true }).eq("tool", "gap-analysis").gte("created_at", today.toISOString()),
    sb.from("user_reports").select("*", { count: "exact", head: true }).eq("tool", "stack-advisor").gte("created_at", today.toISOString()),
    sb.from("user_subscriptions").select("*", { count: "exact", head: true }).eq("plan", "pro"),
    sb.from("free_analysis_log").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
    sb.from("free_analysis_log").select("*", { count: "exact", head: true }).gte("created_at", week.toISOString()),
  ]);

  // Phase 2: row-fetching queries. These each return real rows we'll
  // crunch in JS for derived series (daily, hourly, cohorts, etc).
  const [
    { data: orders },
    { data: pulseLatest },
    { data: pulseRecent },
    { data: reportsLast30d },     // for daily / hourly / category / funnel
    { data: usersLast60d },       // for cohort retention
    { data: subscriptionData },
    { data: ordersLast30d },      // for daily revenue series
    { data: freeLogToday },
  ] = await Promise.all([
    sb.from("orders").select("id,package_slug,credits_added,amount_usd,created_at,user_id").order("created_at", { ascending: false }).limit(200),
    sb.from("pulse_feed_cache").select("generated_at,signals").order("generated_at", { ascending: false }).limit(1).single(),
    sb.from("pulse_feed_cache").select("generated_at").order("generated_at", { ascending: false }).limit(50),
    sb.from("user_reports").select("created_at,tool,user_id,idea").gte("created_at", month.toISOString()).order("created_at", { ascending: true }),
    sb.from("user_credits").select("user_id,created_at").gte("created_at", eightWeeks.toISOString()).order("created_at", { ascending: true }),
    sb.from("user_subscriptions").select("plan,monthly_analyses,purchased_analyses,user_id").eq("plan", "pro"),
    sb.from("orders").select("amount_usd,created_at,package_slug").gte("created_at", month.toISOString()).order("created_at", { ascending: true }),
    sb.from("free_analysis_log").select("ip,created_at").gte("created_at", today.toISOString()),
  ]);

  // ─── Daily reports series (last 30 days) ──────────────────────
  // Fill in zero days too so the chart doesn't have gaps.
  const dailyMap: Record<string, { dig: number; stack: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
    dailyMap[dayKey(d)] = { dig: 0, stack: 0 };
  }
  for (const r of reportsLast30d ?? []) {
    const k = (r.created_at as string).slice(0, 10);
    if (!dailyMap[k]) dailyMap[k] = { dig: 0, stack: 0 };
    if (r.tool === "gap-analysis") dailyMap[k].dig++; else dailyMap[k].stack++;
  }

  // ─── Hourly heatmap: last 14 days × 24 hours ─────────────────
  // Initialised as 14 rows of 24 zeros. Row 0 = oldest day.
  const heatmap: number[][] = Array.from({ length: 14 }, () => new Array(24).fill(0));
  const heatmapDays: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
    heatmapDays.push(dayKey(d));
  }
  for (const r of reportsLast30d ?? []) {
    const ts = new Date(r.created_at as string);
    if (ts < fortnight) continue;
    const dayIndex = heatmapDays.indexOf(dayKey(ts));
    if (dayIndex < 0) continue;
    heatmap[dayIndex][ts.getUTCHours()]++;
  }

  // ─── Cohort retention: weekly cohorts × weeks-since-signup ───
  // Bucket users into the ISO-week-ish bin of their signup; track
  // what fraction of each cohort showed up (made a report) in
  // subsequent weeks.
  const cohortBucket = (d: Date) => {
    // Floor a date to the most recent Monday (UTC).
    const x = new Date(d);
    x.setUTCHours(0, 0, 0, 0);
    const day = x.getUTCDay() || 7; // Mon=1..Sun=7
    if (day !== 1) x.setUTCDate(x.getUTCDate() - (day - 1));
    return dayKey(x);
  };

  // Map: user_id -> signup week
  const userSignupWeek: Record<string, string> = {};
  for (const u of usersLast60d ?? []) {
    if (u.user_id) userSignupWeek[u.user_id] = cohortBucket(new Date(u.created_at));
  }

  // Build cohort matrix. Rows: 8 weeks oldest→newest. Columns: weeks
  // 0..N where 0 is the signup week itself.
  const cohortWeeks: string[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 7 * 24 * 3600 * 1000);
    cohortWeeks.push(cohortBucket(d));
  }
  const cohortSize: Record<string, Set<string>> = {};
  for (const w of cohortWeeks) cohortSize[w] = new Set();
  for (const [uid, w] of Object.entries(userSignupWeek)) {
    if (cohortSize[w]) cohortSize[w].add(uid);
  }
  // Activity per (cohort, week). active = made any report that week.
  const cohortActive: Record<string, Record<string, Set<string>>> = {};
  for (const w of cohortWeeks) cohortActive[w] = {};
  for (const r of reportsLast30d ?? []) {
    const uid = r.user_id as string | null;
    if (!uid) continue;
    const cohort = userSignupWeek[uid];
    if (!cohort || !cohortActive[cohort]) continue;
    const reportWeek = cohortBucket(new Date(r.created_at as string));
    if (!cohortActive[cohort][reportWeek]) cohortActive[cohort][reportWeek] = new Set();
    cohortActive[cohort][reportWeek].add(uid);
  }
  // Serialise cohort matrix: array of { cohort, size, retention: number[] (% per week offset) }
  const cohorts = cohortWeeks.map(w => {
    const size = cohortSize[w].size;
    const cohortIndex = cohortWeeks.indexOf(w);
    const retention = cohortWeeks.slice(cohortIndex).map(targetWeek => {
      const active = cohortActive[w]?.[targetWeek]?.size ?? 0;
      return size === 0 ? null : Math.round((active / size) * 100);
    });
    return { cohort: w, size, retention };
  });

  // ─── Conversion funnel ───────────────────────────────────────
  // Stages: signups (last 30d) → made_first_report → made_5_reports → upgraded_to_pro
  const proUserSet = new Set((subscriptionData ?? []).map(s => s.user_id as string));
  const reportCountPerUser: Record<string, number> = {};
  for (const r of reportsLast30d ?? []) {
    const uid = r.user_id as string | null;
    if (!uid) continue;
    reportCountPerUser[uid] = (reportCountPerUser[uid] ?? 0) + 1;
  }

  let signups = 0, firstReport = 0, fiveReports = 0, upgraded = 0;
  for (const u of usersLast60d ?? []) {
    if (new Date(u.created_at as string) < month) continue;
    signups++;
    const uid = u.user_id as string | null;
    if (!uid) continue;
    const n = reportCountPerUser[uid] ?? 0;
    if (n >= 1) firstReport++;
    if (n >= 5) fiveReports++;
    if (proUserSet.has(uid)) upgraded++;
  }

  // ─── Daily revenue (last 30 days) ────────────────────────────
  const revenueDaily: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
    revenueDaily[dayKey(d)] = 0;
  }
  for (const o of ordersLast30d ?? []) {
    const k = (o.created_at as string).slice(0, 10);
    if (revenueDaily[k] === undefined) revenueDaily[k] = 0;
    revenueDaily[k] += (o.amount_usd as number) ?? 0;
  }

  // ─── Package mix ─────────────────────────────────────────────
  const packageMix: Record<string, { count: number; revenue: number }> = {};
  for (const o of orders ?? []) {
    const slug = (o.package_slug as string) || "unknown";
    if (!packageMix[slug]) packageMix[slug] = { count: 0, revenue: 0 };
    packageMix[slug].count++;
    packageMix[slug].revenue += (o.amount_usd as number) ?? 0;
  }
  const packageMixSorted = Object.entries(packageMix)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([slug, v]) => ({ slug, ...v }));

  // ─── Top idea keywords (last 30 days) ────────────────────────
  // Naive but effective: tokenize idea text, drop stopwords, count.
  // Lets the operator see what people are actually building this week.
  const STOP = new Set([
    "the", "a", "an", "and", "or", "but", "with", "for", "to", "of", "in", "on", "at",
    "by", "from", "as", "is", "are", "was", "were", "be", "been", "being", "have", "has",
    "had", "do", "does", "did", "will", "would", "could", "should", "may", "might",
    "this", "that", "these", "those", "it", "its", "their", "they", "them", "we", "our",
    "us", "you", "your", "i", "my", "me", "app", "tool", "platform", "service",
    "system", "users", "user", "people", "want", "need", "make", "create", "build",
    "based", "use", "uses", "using", "via", "like", "than", "into", "out", "more",
    "most", "some", "any", "all", "very", "just", "also", "such", "each", "every",
  ]);
  const wordCounts: Record<string, number> = {};
  for (const r of reportsLast30d ?? []) {
    const text = ((r.idea as string) || "").toLowerCase();
    const words = text.match(/[a-z][a-z0-9-]{2,}/g) ?? [];
    for (const w of words) {
      if (STOP.has(w) || w.length < 4) continue;
      wordCounts[w] = (wordCounts[w] ?? 0) + 1;
    }
  }
  const topKeywords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([word, count]) => ({ word, count }));

  // ─── Pulse cron health (last 7 days) ─────────────────────────
  // Cron is supposed to run daily. Count unique days with a fresh
  // pulse_feed_cache row in the last 7. Anything < 7 means missed runs.
  const pulseDaysFresh = new Set<string>();
  for (const p of pulseRecent ?? []) {
    const ts = new Date(p.generated_at as string);
    if (ts < week) continue;
    pulseDaysFresh.add(dayKey(ts));
  }

  // ─── DAU / WAU / MAU ─────────────────────────────────────────
  // Active = made at least one report in that window.
  const dau = new Set<string>();
  const wau = new Set<string>();
  const mau = new Set<string>();
  for (const r of reportsLast30d ?? []) {
    const uid = r.user_id as string | null;
    if (!uid) continue;
    mau.add(uid);
    const ts = new Date(r.created_at as string);
    if (ts >= week) wau.add(uid);
    if (ts >= today) dau.add(uid);
  }

  // ─── Top free abusers (today) ────────────────────────────────
  const ipCounts: Record<string, number> = {};
  for (const row of freeLogToday ?? []) {
    ipCounts[row.ip as string] = (ipCounts[row.ip as string] ?? 0) + 1;
  }
  const topFreeIPs = Object.entries(ipCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }));

  // ─── Live activity feed (last 50 events, mixed) ──────────────
  // Combines recent reports and recent orders so the operator can
  // watch activity stream past in real time.
  type Event = { type: "report" | "order"; ts: string; payload: any };
  const events: Event[] = [];
  for (const r of (reportsLast30d ?? []).slice(-50)) {
    events.push({ type: "report", ts: r.created_at as string, payload: { tool: r.tool, idea: ((r.idea as string) || "").slice(0, 80), user: (r.user_id as string)?.slice(0, 12) ?? "anon" } });
  }
  for (const o of (orders ?? []).slice(0, 30)) {
    events.push({ type: "order", ts: o.created_at as string, payload: { package: o.package_slug, amount: o.amount_usd, credits: o.credits_added } });
  }
  events.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
  const liveFeed = events.slice(0, 40);

  // ─── Anomaly detection (rule-based) ──────────────────────────
  // Surfaces 4-7 things the operator should look at. Each has a
  // severity and a short label.
  const anomalies: Array<{ severity: "info" | "warn" | "alert"; text: string }> = [];
  const reportsDelta = delta(reportsWeek ?? 0, reportsPrevWeek ?? 0);
  if (reportsDelta <= -25) anomalies.push({ severity: "alert", text: `Reports this week down ${Math.abs(reportsDelta)}% vs last week` });
  if (reportsDelta >= 50) anomalies.push({ severity: "info", text: `Reports up ${reportsDelta}% week-over-week — trend hot` });
  const usersDelta = delta(usersWeek ?? 0, usersPrevWeek ?? 0);
  if (usersDelta <= -30) anomalies.push({ severity: "alert", text: `Signups down ${Math.abs(usersDelta)}% this week` });
  if ((freeAnalysesToday ?? 0) === 0 && (reportsToday ?? 0) === 0) anomalies.push({ severity: "warn", text: "Zero activity today — check rate limits / Clerk / homepage" });
  if (pulseDaysFresh.size < 7) anomalies.push({ severity: "warn", text: `Pulse cron missed ${7 - pulseDaysFresh.size} of last 7 days` });
  if (topFreeIPs[0]?.count >= 20) anomalies.push({ severity: "warn", text: `IP ${topFreeIPs[0].ip} hit free tier ${topFreeIPs[0].count}× today — possible abuse` });
  if (signups > 0 && firstReport / signups < 0.5) anomalies.push({ severity: "warn", text: `Only ${Math.round((firstReport / signups) * 100)}% of new signups (last 30d) made a report — onboarding leak` });
  const proConversionRate = (usersTotal ?? 0) > 0 ? ((proUsers ?? 0) / (usersTotal ?? 1)) * 100 : 0;
  if (proConversionRate < 2 && (usersTotal ?? 0) > 100) anomalies.push({ severity: "info", text: `Free→Pro conversion is ${proConversionRate.toFixed(1)}% — paywall may need work` });
  if (anomalies.length === 0) anomalies.push({ severity: "info", text: "No anomalies detected — everything within normal ranges" });

  // ─── Action items (rule-based, prioritised) ──────────────────
  // What you should DO today, ranked. Each has a why-string.
  const actions: Array<{ priority: 1 | 2 | 3; text: string; why: string }> = [];
  if ((freeAnalysesToday ?? 0) === 0 && (reportsToday ?? 0) === 0) {
    actions.push({ priority: 1, text: "Investigate zero activity", why: "Both signed-in reports and free analyses are 0 today" });
  }
  if (pulseDaysFresh.size < 7) {
    actions.push({ priority: 1, text: "Check pulse cron status", why: `Missed ${7 - pulseDaysFresh.size} of the last 7 daily runs` });
  }
  if (topFreeIPs[0]?.count >= 20) {
    actions.push({ priority: 2, text: `Review IP ${topFreeIPs[0].ip}`, why: `Hit free endpoint ${topFreeIPs[0].count}× today — block or tighten rate limit` });
  }
  if (signups > 0 && firstReport / signups < 0.5) {
    actions.push({ priority: 2, text: "Improve first-report onboarding", why: `${Math.round((1 - firstReport / signups) * 100)}% of new signups (30d) never ran a report` });
  }
  if (reportsDelta <= -25) {
    actions.push({ priority: 1, text: "Diagnose report decline", why: `${Math.abs(reportsDelta)}% drop vs prior 7d — check homepage funnel, ad spend, GA` });
  }
  if (proConversionRate < 2 && (usersTotal ?? 0) > 100) {
    actions.push({ priority: 3, text: "A/B test pricing copy", why: `Free→Pro at ${proConversionRate.toFixed(1)}% — try different paywall framing` });
  }
  if ((freeAnalysesWeek ?? 0) > 100 && (proUsers ?? 0) < 5) {
    actions.push({ priority: 2, text: "Add Pro nudge to free results", why: `${freeAnalysesWeek} free analyses/wk but only ${proUsers} Pro subs — value isn't being communicated` });
  }
  if (actions.length === 0) {
    actions.push({ priority: 3, text: "Ship one new feature today", why: "All metrics in normal range — momentum is the bottleneck now" });
  }
  actions.sort((a, b) => a.priority - b.priority);

  // ─── Done. Build response. ───────────────────────────────────
  const totalRevenue = orders?.reduce((s, o) => s + ((o.amount_usd as number) ?? 0), 0) ?? 0;
  const todayRevenue = orders?.filter(o => new Date(o.created_at as string) >= today).reduce((s, o) => s + ((o.amount_usd as number) ?? 0), 0) ?? 0;
  const weekRevenue = orders?.filter(o => new Date(o.created_at as string) >= week).reduce((s, o) => s + ((o.amount_usd as number) ?? 0), 0) ?? 0;
  const creditsGiven = orders?.reduce((s, o) => s + ((o.credits_added as number) ?? 0), 0) ?? 0;
  const pulseSignals = Array.isArray(pulseLatest?.signals) ? (pulseLatest.signals as unknown[]).length : 0;
  const pulseAge = pulseLatest?.generated_at ? Math.floor((Date.now() - new Date(pulseLatest.generated_at).getTime()) / 60000) : null;

  const totalMonthlyRemaining = subscriptionData?.reduce((s: number, u: any) => s + (u.monthly_analyses ?? 0), 0) ?? 0;
  const totalPurchasedRemaining = subscriptionData?.reduce((s: number, u: any) => s + (u.purchased_analyses ?? 0), 0) ?? 0;

  return NextResponse.json({
    users: { total: usersTotal ?? 0, today: usersToday ?? 0, week: usersWeek ?? 0, prevWeek: usersPrevWeek ?? 0, deltaPct: usersDelta },
    reports: {
      total: reportsTotal ?? 0, today: reportsToday ?? 0, week: reportsWeek ?? 0, prevWeek: reportsPrevWeek ?? 0, deltaPct: reportsDelta,
      dig: { total: digTotal ?? 0, today: digToday ?? 0 },
      stack: { total: stackTotal ?? 0, today: stackToday ?? 0 },
    },
    revenue: { total: totalRevenue, today: todayRevenue, week: weekRevenue, daily: revenueDaily },
    orders: {
      total: orders?.length ?? 0,
      today: orders?.filter(o => new Date(o.created_at as string) >= today).length ?? 0,
      credits: creditsGiven,
      recent: orders?.slice(0, 15) ?? [],
      packageMix: packageMixSorted,
    },
    pulse: {
      generatedAt: pulseLatest?.generated_at ?? null,
      signals: pulseSignals,
      ageMinutes: pulseAge,
      cronHealth: { freshDays: pulseDaysFresh.size, expected: 7 },
    },
    daily: dailyMap,
    heatmap: { days: heatmapDays, grid: heatmap },
    cohorts: { weeks: cohortWeeks, rows: cohorts },
    funnel: { signups, firstReport, fiveReports, upgraded },
    activity: { dau: dau.size, wau: wau.size, mau: mau.size },
    topKeywords,
    liveFeed,
    anomalies,
    actions,
    freemium: {
      proSubscribers: proUsers ?? 0,
      freeAnalyses: { today: freeAnalysesToday ?? 0, week: freeAnalysesWeek ?? 0 },
      monthlyAnalysesRemaining: totalMonthlyRemaining,
      purchasedAnalysesRemaining: totalPurchasedRemaining,
      topFreeIPs,
      proConversionRate: Number(proConversionRate.toFixed(2)),
    },
  }, { headers: CORS });
}
