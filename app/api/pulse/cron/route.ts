import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";
import type { AppSnapshot } from "../shared";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      fetchAppStore, fetchPlayStore, saveSnapshots,
      loadPreviousSnapshots, loadSnapshotsAt, cleanupOldSnapshots,
    } = await import("../shared");

    const FETCH_HEADERS = { "User-Agent": "Mozilla/5.0" };

    const [appRes, playRes, phRes] = await Promise.allSettled([
      fetchAppStore(),
      fetchPlayStore(),
      fetchProductHuntLast24h(FETCH_HEADERS),
    ]);

    const appSnaps = appRes.status === "fulfilled" ? appRes.value : [];
    const playSnaps = playRes.status === "fulfilled" ? playRes.value : [];
    const freshPHSignals = phRes.status === "fulfilled" ? phRes.value : [];

    console.log(`[CRON] AppStore: ${appSnaps.length}, PlayStore: ${playSnaps.length}, PH fresh: ${freshPHSignals.length}`);

    const allSnapshots = [...appSnaps, ...playSnaps];
    await saveSnapshots(allSnapshots);

    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

    const [hourlySnaps, weeklySnaps, monthlySnaps] = await Promise.all([
      loadPreviousSnapshots().catch(() => null),
      loadSnapshotsAt(SEVEN_DAYS, 30 * 60 * 1000).catch(() => null),
      loadSnapshotsAt(THIRTY_DAYS, 30 * 60 * 1000).catch(() => null),
    ]);

    let hourlySignals: any[] = [];
    let weeklySignals: any[] = [];
    let monthlySignals: any[] = [];
    let hasMovementData = false;

    if (hourlySnaps && hourlySnaps.length > 0) { hasMovementData = true; hourlySignals = detectMovements(allSnapshots, hourlySnaps); }
    if (weeklySnaps && weeklySnaps.length > 0) { weeklySignals = detectLongTermMovements(allSnapshots, weeklySnaps, "weekly"); }
    if (monthlySnaps && monthlySnaps.length > 0) { monthlySignals = detectLongTermMovements(allSnapshots, monthlySnaps, "monthly"); }

    const fallbackSignals = !hasMovementData ? generateFallbackSignals(allSnapshots) : [];

    const sb = getSupabase();
    const { data: prevCache } = await sb
      .from("pulse_feed_cache").select("signals")
      .order("generated_at", { ascending: false }).limit(1).single();

    const prevPHByTitle = new Map<string, any>();
    if (prevCache?.signals) {
      for (const s of prevCache.signals as any[]) {
        if (s.source === "producthunt") prevPHByTitle.set(s.title?.trim(), s);
      }
    }
    console.log("[CRON] Previous cache has", prevPHByTitle.size, "PH products (all-time)");

    const freshTitles = new Set(freshPHSignals.map((s: any) => s.title?.trim()));

    // Live (< 24h): update upvotes, preserve claudeGap, mark isLive=true
    const mergedLivePH = freshPHSignals.map((s: any) => {
      const prev = prevPHByTitle.get(s.title?.trim());
      return { ...s, isLive: true, claudeGap: prev?.claudeGap ?? undefined };
    });

    // Frozen (> 24h): keep as-is, upvotes stay frozen, mark isLive=false
    const frozenPH = Array.from(prevPHByTitle.values())
      .filter((s: any) => !freshTitles.has(s.title?.trim()))
      .map((s: any) => ({ ...s, isLive: false }));

    console.log(`[CRON] Live: ${mergedLivePH.length}, Frozen: ${frozenPH.length}`);

    const sortedLivePH = [...mergedLivePH].sort((a, b) => (b.votesCount ?? 0) - (a.votesCount ?? 0));
    const sortedFrozenPH = [...frozenPH].sort((a, b) => (b.votesCount ?? 0) - (a.votesCount ?? 0));
    const allPHSignals = [...sortedLivePH, ...sortedFrozenPH];

    const priority: Record<string, number> = {
      rank_jump: 0, new_entry: 1, review_spike: 2, top_mover: 3,
      weekly_mover: 4, monthly_mover: 5, ph_trending: 6, trending: 7,
    };

    const signals = [
      ...hourlySignals, ...weeklySignals, ...monthlySignals,
      ...allPHSignals, ...fallbackSignals,
    ].sort((a, b) => {
      const pa = priority[a.movementType ?? "trending"] ?? 7;
      const pb = priority[b.movementType ?? "trending"] ?? 7;
      if (pa !== pb) return pa - pb;
      if (a.movementType === "ph_trending") return 0;
      return Math.abs(b.rankChange ?? 0) - Math.abs(a.rankChange ?? 0);
    });

    const { error } = await sb.from("pulse_feed_cache").insert({
      signals, has_movement_data: hasMovementData,
      sources: {
        appStore: appSnaps.length, playStore: playSnaps.length,
        productHunt: allPHSignals.length,
        productHuntLive: mergedLivePH.length,
        productHuntFrozen: frozenPH.length,
      },
      generated_at: new Date().toISOString(),
    });

    if (error) console.log("[CRON] cache insert error:", error.message);

    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    await sb.from("pulse_feed_cache").delete().lt("generated_at", cutoff);
    cleanupOldSnapshots();

    console.log(`[CRON] DONE: ${signals.length} signals (${mergedLivePH.length} live + ${frozenPH.length} frozen PH)`);

    return NextResponse.json({
      ok: true, signals: signals.length,
      appStore: appSnaps.length, playStore: playSnaps.length,
      phLive: mergedLivePH.length, phFrozen: frozenPH.length, hasMovementData,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[CRON] FAILED:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/* PH: fetch products from last 24 hours (rolling window, no PH Pacific midnight logic) */
async function fetchProductHuntLast24h(fetchHeaders: Record<string, string>): Promise<any[]> {
  const token = process.env.PRODUCTHUNT_API_KEY;
  if (!token) return [];

  const postedAfter = new Date(Date.now() - 24 * 60 * 60 * 1000);
  console.log(`[CRON] PH fetching since: ${postedAfter.toISOString()} (last 24h)`);

  const query = `query($postedAfter: DateTime!, $after: String) {
    posts(order: NEWEST, first: 50, postedAfter: $postedAfter, after: $after) {
      pageInfo { hasNextPage endCursor }
      totalCount
      edges {
        node {
          name tagline votesCount url website createdAt
          thumbnail { url }
          topics(first: 5) { edges { node { name } } }
          makers { name }
        }
      }
    }
  }`;

  let allEdges: any[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;
  let page = 0;
  let totalCount: number | undefined;

  while (hasNextPage && page < 10) {
    page++;
    const res = await fetch("https://api.producthunt.com/v2/api/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...fetchHeaders },
      body: JSON.stringify({ query, variables: { postedAfter: postedAfter.toISOString(), after: cursor } }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) break;
    const data = await res.json();
    if (data?.errors) break;
    const postsData = data?.data?.posts;
    allEdges = [...allEdges, ...(postsData?.edges ?? [])];
    if (totalCount === undefined) totalCount = postsData?.totalCount;
    hasNextPage = postsData?.pageInfo?.hasNextPage ?? false;
    cursor = postsData?.pageInfo?.endCursor ?? null;
  }

  console.log(`[CRON] PH: ${allEdges.length} products fetched (total: ${totalCount ?? "unknown"})`);

  return allEdges.map((e: any) => {
    const n = e.node;
    const votes = n?.votesCount ?? 0;
    const createdAt = n?.createdAt ?? new Date().toISOString();
    const hours = Math.floor((Date.now() - new Date(createdAt).getTime()) / 3_600_000);
    const timeAgo = hours < 1 ? "just now" : `${hours}h ago`;
    const topics = (n?.topics?.edges ?? []).map((t: any) => t.node?.name).filter(Boolean).slice(0, 5);
    return {
      source: "producthunt", sourceLabel: "Product Hunt", emoji: "\u{1F680}",
      title: n?.name ?? "",
      subtitle: `${votes} upvotes — launched ${timeAgo}`,
      signal: `${votes} upvotes — launched ${timeAgo}. ${n?.tagline ?? ""}`,
      url: n?.url ?? "", timestamp: createdAt, movementType: "ph_trending",
      imageUrl: n?.thumbnail?.url ?? undefined,
      topics: topics.length > 0 ? topics : undefined,
      tagline: n?.tagline ?? undefined,
      makerName: n?.makers?.[0]?.name ?? undefined,
      externalUrl: n?.website || n?.url || "",
      votesCount: votes,
      isLive: true,
    };
  });
}

/* Detect hourly movements */
function detectMovements(current: AppSnapshot[], previous: AppSnapshot[]): any[] {
  const signals: any[] = [];
  const now = new Date().toISOString();
  const prevMap = new Map<string, AppSnapshot>();
  for (const snap of previous) prevMap.set(`${snap.source}:${snap.category}:${snap.app_id}`, snap);
  const allPrevAppIds = new Set<string>();
  for (const snap of previous) allPrevAppIds.add(`${snap.source}:${snap.app_id}`);
  let biggestMover: { snap: AppSnapshot; prevRank: number; diff: number } | null = null;
  for (const snap of current) {
    const key = `${snap.source}:${snap.category}:${snap.app_id}`;
    const prev = prevMap.get(key);
    const sl = snap.source === "appstore" ? "App Store" : "Google Play";
    if (prev) {
      const rd = prev.rank - snap.rank;
      if (prev.rank >= 20 && snap.rank <= 10 && rd >= 10) signals.push({ source: snap.source, sourceLabel: sl, emoji: "\u{1F4C8}", title: snap.app_name, subtitle: `#${prev.rank} → #${snap.rank} in ${snap.category}`, signal: `Jumped #${prev.rank} to #${snap.rank} in ${snap.category} (▲${rd})`, url: snap.url, timestamp: now, movementType: "rank_jump", prevRank: prev.rank, newRank: snap.rank, rankChange: rd });
      if (prev.review_count && snap.review_count) {
        const gained = snap.review_count - prev.review_count;
        if (gained >= 500) { const pct = Math.round((gained / prev.review_count) * 100); signals.push({ source: snap.source, sourceLabel: sl, emoji: "\u{1F4AC}", title: snap.app_name, subtitle: `${gained.toLocaleString()} new reviews in 1h`, signal: `${gained.toLocaleString()} new reviews in 1h (+${pct}%)`, url: snap.url, timestamp: now, movementType: "review_spike", prevRank: prev.rank, newRank: snap.rank, rankChange: prev.rank - snap.rank }); }
      }
      if (rd > 0 && (!biggestMover || rd > biggestMover.diff)) biggestMover = { snap, prevRank: prev.rank, diff: rd };
    } else if (snap.rank <= 10 && !allPrevAppIds.has(`${snap.source}:${snap.app_id}`)) {
      signals.push({ source: snap.source, sourceLabel: sl, emoji: "\u{1F195}", title: snap.app_name, subtitle: `New entry #${snap.rank} in ${snap.category}`, signal: `New entry #${snap.rank} in ${snap.category}`, url: snap.url, timestamp: now, movementType: "new_entry", newRank: snap.rank, rankChange: 0 });
    }
  }
  if (biggestMover && biggestMover.diff >= 10) {
    const { snap, prevRank, diff } = biggestMover;
    if (!signals.some((s) => s.movementType === "rank_jump" && s.title === snap.app_name)) {
      const sl = snap.source === "appstore" ? "App Store" : "Google Play";
      signals.push({ source: snap.source, sourceLabel: sl, emoji: "\u{1F680}", title: snap.app_name, subtitle: `Biggest mover — up ${diff}`, signal: `Biggest mover this hour — up ${diff} in ${snap.category} (#${prevRank} → #${snap.rank})`, url: snap.url, timestamp: now, movementType: "top_mover", prevRank, newRank: snap.rank, rankChange: diff });
    }
  }
  return signals;
}

/* Detect weekly/monthly movements */
function detectLongTermMovements(current: AppSnapshot[], previous: AppSnapshot[], period: "weekly" | "monthly"): any[] {
  const signals: any[] = [];
  const now = new Date().toISOString();
  const emoji = period === "weekly" ? "\u{1F4C5}" : "\u{1F4C6}";
  const movementType = period === "weekly" ? "weekly_mover" : "monthly_mover";
  const label = period === "weekly" ? "Last week" : "Last month";
  const prevMap = new Map<string, AppSnapshot>();
  for (const snap of previous) prevMap.set(`${snap.source}:${snap.category}:${snap.app_id}`, snap);
  for (const snap of current) {
    const prev = prevMap.get(`${snap.source}:${snap.category}:${snap.app_id}`);
    if (!prev) continue;
    const rd = prev.rank - snap.rank;
    if (Math.abs(rd) < 5) continue;
    const sl = snap.source === "appstore" ? "App Store" : "Google Play";
    signals.push({ source: snap.source, sourceLabel: sl, emoji, title: snap.app_name, subtitle: `${label} #${prev.rank} → #${snap.rank} in ${snap.category}`, signal: `${label} #${prev.rank} → #${snap.rank} (${rd > 0 ? "▲" : "▼"}${Math.abs(rd)})`, url: snap.url, timestamp: now, movementType, prevRank: prev.rank, newRank: snap.rank, rankChange: rd });
  }
  signals.sort((a: any, b: any) => Math.abs(b.rankChange ?? 0) - Math.abs(a.rankChange ?? 0));
  return signals.slice(0, 10);
}

/* Fallback: top 3 per category (first run) */
function generateFallbackSignals(snapshots: AppSnapshot[]): any[] {
  const now = new Date().toISOString();
  const byCat = new Map<string, AppSnapshot[]>();
  for (const snap of snapshots) { const k = `${snap.source}:${snap.category}`; if (!byCat.has(k)) byCat.set(k, []); byCat.get(k)!.push(snap); }
  const signals: any[] = [];
  for (const [key, apps] of byCat) {
    const src = key.split(":")[0];
    const cat = key.split(":").slice(1).join(":");
    const sl = src === "appstore" ? "App Store" : "Google Play";
    for (const app of apps.slice(0, 3)) {
      signals.push({ source: src, sourceLabel: sl, emoji: "\u{1F4F1}", title: app.app_name, subtitle: `#${app.rank} in ${cat}`, signal: `Currently #${app.rank} in ${sl} ${cat}`, url: app.url, timestamp: now, movementType: "trending", newRank: app.rank, rating: app.rating ?? undefined, reviewCount: app.review_count ?? undefined });
    }
  }
  return signals;
}
