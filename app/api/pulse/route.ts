import { NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";

/* ── Types ────────────────────────────────────────────────────── */

interface Signal {
  source: string;
  sourceLabel: string;
  emoji: string;
  title: string;
  subtitle: string;
  signal: string;
  url: string;
  timestamp: string;
  movementType?: string;
  prevRank?: number;
  newRank?: number;
  rankChange?: number;
}

interface AppSnapshot {
  source: string;
  category: string;
  app_id: string;
  app_name: string;
  rank: number;
  review_count: number | null;
  rating: number | null;
  url: string;
}

/* ── App Store Categories ─────────────────────────────────────── */

const APP_STORE_CATEGORIES = [
  { id: "apps", name: "Overall" },
  { id: "games", name: "Games" },
  { id: "business", name: "Business" },
  { id: "education", name: "Education" },
  { id: "entertainment", name: "Entertainment" },
  { id: "finance", name: "Finance" },
  { id: "food-drink", name: "Food & Drink" },
  { id: "health-fitness", name: "Health & Fitness" },
  { id: "lifestyle", name: "Lifestyle" },
  { id: "medical", name: "Medical" },
  { id: "music", name: "Music" },
  { id: "navigation", name: "Navigation" },
  { id: "news", name: "News" },
  { id: "photo-video", name: "Photo & Video" },
  { id: "productivity", name: "Productivity" },
  { id: "shopping", name: "Shopping" },
  { id: "social-networking", name: "Social Networking" },
  { id: "sports", name: "Sports" },
  { id: "travel", name: "Travel" },
  { id: "utilities", name: "Utilities" },
];

/* ── Fetch App Store (all categories in parallel) ─────────────── */

async function fetchAppStore(): Promise<AppSnapshot[]> {
  console.log(`[PULSE] Fetching App Store — ${APP_STORE_CATEGORIES.length} categories`);

  const results = await Promise.all(
    APP_STORE_CATEGORIES.map(async (cat) => {
      try {
        const url = `https://rss.applemarketingtools.com/api/v2/us/apps/top-free/100/${cat.id}.json`;
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) {
          console.log(`[PULSE] App Store ${cat.name} (${cat.id}): HTTP ${res.status}`);
          return [];
        }
        const data = await res.json();
        const apps = data?.feed?.results ?? [];
        console.log(`[PULSE] App Store ${cat.name} (${cat.id}): ${apps.length} apps`);
        return apps.map((app: any, i: number): AppSnapshot => ({
          source: "appstore",
          category: cat.name,
          app_id: app.id ?? app.name ?? `unknown-${i}`,
          app_name: app.name ?? "Unknown",
          rank: i + 1,
          review_count: null,
          rating: null,
          url: app.url ?? "",
        }));
      } catch (err) {
        console.log(`[PULSE] App Store ${cat.name} (${cat.id}): FETCH ERROR`, err instanceof Error ? err.message : err);
        return [];
      }
    }),
  );

  const flat = results.flat();
  const successCount = results.filter((r) => r.length > 0).length;
  console.log(`[PULSE] App Store total: ${flat.length} apps from ${successCount}/${APP_STORE_CATEGORIES.length} categories`);
  return flat;
}

/* ── Fetch Google Play (top 50 free) ──────────────────────────── */

async function fetchPlayStore(): Promise<AppSnapshot[]> {
  // Try real Play Store HTML scrape first
  try {
    const res = await fetch(
      "https://play.google.com/store/apps/collection/topselling_free?hl=en&gl=US",
      {
        headers: { "Accept": "text/html", "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
        signal: AbortSignal.timeout(15000),
      },
    );
    console.log(`[PULSE] Play Store HTML: HTTP ${res.status}`);
    if (res.ok) {
      const html = await res.text();
      console.log(`[PULSE] Play Store HTML length: ${html.length} chars`);

      const snapshots: AppSnapshot[] = [];
      const appMatches = html.matchAll(/\/store\/apps\/details\?id=([a-zA-Z0-9._]+)/g);
      const seen = new Set<string>();
      let rank = 0;

      for (const match of appMatches) {
        const appId = match[1];
        if (seen.has(appId)) continue;
        seen.add(appId);
        rank++;
        if (rank > 50) break;

        const idx = match.index ?? 0;
        const context = html.slice(idx, idx + 500);
        const nameMatch = context.match(/aria-label="([^"]+)"/);
        const appName = nameMatch?.[1] ?? appId.split(".").pop() ?? appId;

        snapshots.push({
          source: "playstore",
          category: "Overall",
          app_id: appId,
          app_name: appName,
          rank,
          review_count: null,
          rating: null,
          url: `https://play.google.com/store/apps/details?id=${appId}`,
        });
      }

      console.log(`[PULSE] Play Store HTML parsed: ${snapshots.length} apps`);
      if (snapshots.length >= 10) return snapshots;
      console.log(`[PULSE] Play Store HTML too few results, falling back to iTunes proxy`);
    }
  } catch (err) {
    console.log(`[PULSE] Play Store HTML scrape failed:`, err instanceof Error ? err.message : err);
  }

  // Fallback: use iTunes top-free as a "cross-platform" proxy labeled as Play Store
  try {
    const res = await fetch(
      "https://rss.applemarketingtools.com/api/v2/us/apps/top-free/50/apps.json",
      { signal: AbortSignal.timeout(15000) },
    );
    if (!res.ok) {
      console.log(`[PULSE] Play Store fallback (iTunes proxy): HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    const apps = data?.feed?.results ?? [];
    console.log(`[PULSE] Play Store fallback (iTunes proxy): ${apps.length} apps`);

    return apps.map((app: any, i: number): AppSnapshot => ({
      source: "playstore",
      category: "Overall",
      app_id: app.id ?? app.name ?? `unknown-${i}`,
      app_name: app.name ?? "Unknown",
      rank: i + 1,
      review_count: null,
      rating: null,
      url: app.url ?? "",
    }));
  } catch (err) {
    console.log(`[PULSE] Play Store fallback also failed:`, err instanceof Error ? err.message : err);
    return [];
  }
}

/* ── Fetch Product Hunt ───────────────────────────────────────── */

async function fetchProductHunt(): Promise<Signal[]> {
  const token = process.env.PRODUCTHUNT_API_KEY;
  if (!token) return [];

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const query = `query($postedAfter: DateTime!) { posts(order: VOTES, first: 20, postedAfter: $postedAfter) { edges { node { name tagline votesCount url createdAt } } } }`;
    const res = await fetch("https://api.producthunt.com/v2/api/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query, variables: { postedAfter: sevenDaysAgo } }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const edges = (data?.data?.posts?.edges ?? [])
      .sort((a: any, b: any) => (b.node?.votesCount ?? 0) - (a.node?.votesCount ?? 0))
      .slice(0, 10);

    return edges.map((e: any) => {
      const votes = e.node?.votesCount ?? 0;
      const createdAt = e.node?.createdAt ?? new Date().toISOString();
      const diff = Date.now() - new Date(createdAt).getTime();
      const hours = Math.floor(diff / 3600000);
      const timeAgo = hours < 1 ? "just now" : hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;

      return {
        source: "producthunt",
        sourceLabel: "Product Hunt",
        emoji: "\u{1F680}",
        title: e.node?.name ?? "",
        subtitle: `${votes} upvotes — launched ${timeAgo}`,
        signal: `${votes} upvotes — launched ${timeAgo}. ${e.node?.tagline ?? ""}`,
        url: e.node?.url ?? "",
        timestamp: createdAt,
        movementType: "ph_trending",
      };
    });
  } catch {
    return [];
  }
}

/* ── Save snapshots to Supabase ───────────────────────────────── */

async function saveSnapshots(snapshots: AppSnapshot[]): Promise<void> {
  if (snapshots.length === 0) return;
  const sb = getSupabase();
  const now = new Date().toISOString();

  // Insert in batches of 500
  for (let i = 0; i < snapshots.length; i += 500) {
    const batch = snapshots.slice(i, i + 500).map((s) => ({
      source: s.source,
      category: s.category,
      app_id: s.app_id,
      app_name: s.app_name,
      rank: s.rank,
      review_count: s.review_count,
      rating: s.rating,
      url: s.url,
      captured_at: now,
    }));
    await sb.from("pulse_snapshots").insert(batch);
  }
}

/* ── Load previous snapshots from Supabase ────────────────────── */

async function loadPreviousSnapshots(): Promise<AppSnapshot[] | null> {
  const sb = getSupabase();
  const oneHourAgo = new Date(Date.now() - 90 * 60 * 1000).toISOString(); // 90 min window
  const twoHoursAgo = new Date(Date.now() - 150 * 60 * 1000).toISOString();

  // Get the most recent snapshot batch that's at least ~1 hour old
  const { data: latestRow } = await sb
    .from("pulse_snapshots")
    .select("captured_at")
    .lt("captured_at", oneHourAgo)
    .gte("captured_at", twoHoursAgo)
    .order("captured_at", { ascending: false })
    .limit(1);

  if (!latestRow || latestRow.length === 0) return null;

  const targetTime = latestRow[0].captured_at;
  // Fetch all snapshots from that batch (within 5 minutes of that timestamp)
  const windowStart = new Date(new Date(targetTime).getTime() - 5 * 60 * 1000).toISOString();
  const windowEnd = new Date(new Date(targetTime).getTime() + 5 * 60 * 1000).toISOString();

  const { data } = await sb
    .from("pulse_snapshots")
    .select("*")
    .gte("captured_at", windowStart)
    .lte("captured_at", windowEnd)
    .order("rank", { ascending: true });

  if (!data || data.length === 0) return null;
  return data as AppSnapshot[];
}

/* ── Detect movements ─────────────────────────────────────────── */

function detectMovements(
  current: AppSnapshot[],
  previous: AppSnapshot[],
): Signal[] {
  const signals: Signal[] = [];
  const now = new Date().toISOString();

  // Build lookup: source+category+app_id -> previous snapshot
  const prevMap = new Map<string, AppSnapshot>();
  for (const snap of previous) {
    prevMap.set(`${snap.source}:${snap.category}:${snap.app_id}`, snap);
  }

  // Also build set of all previous app_ids per source+category
  const prevAppsPerCat = new Map<string, Set<string>>();
  for (const snap of previous) {
    const key = `${snap.source}:${snap.category}`;
    if (!prevAppsPerCat.has(key)) prevAppsPerCat.set(key, new Set());
    prevAppsPerCat.get(key)!.add(snap.app_id);
  }

  // Track biggest mover
  let biggestMover: { snap: AppSnapshot; prevRank: number; diff: number } | null = null;

  for (const snap of current) {
    const key = `${snap.source}:${snap.category}:${snap.app_id}`;
    const prev = prevMap.get(key);
    const catKey = `${snap.source}:${snap.category}`;
    const prevApps = prevAppsPerCat.get(catKey);
    const sourceLabel = snap.source === "appstore" ? "App Store" : "Google Play";

    if (prev) {
      const rankDiff = prev.rank - snap.rank; // positive = improved

      // RANK_JUMP: was 20-100, now 1-10
      if (prev.rank >= 20 && snap.rank <= 10 && rankDiff >= 10) {
        signals.push({
          source: snap.source,
          sourceLabel,
          emoji: "\u{1F4C8}",
          title: snap.app_name,
          subtitle: `#${prev.rank} \u2192 #${snap.rank} in ${snap.category}`,
          signal: `Jumped from #${prev.rank} to #${snap.rank} in ${snap.category} (\u25B2${rankDiff} positions)`,
          url: snap.url,
          timestamp: now,
          movementType: "rank_jump",
          prevRank: prev.rank,
          newRank: snap.rank,
          rankChange: rankDiff,
        });
      }

      // REVIEW_SPIKE: gained 500+ reviews in 1 hour
      if (prev.review_count && snap.review_count) {
        const gained = snap.review_count - prev.review_count;
        if (gained >= 500) {
          const pct = Math.round((gained / prev.review_count) * 100);
          signals.push({
            source: snap.source,
            sourceLabel,
            emoji: "\u{1F4AC}",
            title: snap.app_name,
            subtitle: `${gained.toLocaleString()} new reviews in 1 hour`,
            signal: `${gained.toLocaleString()} new reviews in 1 hour (+${pct}%)`,
            url: snap.url,
            timestamp: now,
            movementType: "review_spike",
            prevRank: prev.rank,
            newRank: snap.rank,
            rankChange: prev.rank - snap.rank,
          });
        }
      }

      // Track biggest mover
      if (rankDiff > 0 && (!biggestMover || rankDiff > biggestMover.diff)) {
        biggestMover = { snap, prevRank: prev.rank, diff: rankDiff };
      }
    } else if (prevApps && !prevApps.has(snap.app_id) && snap.rank <= 20) {
      // NEW_ENTRY: not in top 100 before, now in top 20
      signals.push({
        source: snap.source,
        sourceLabel,
        emoji: "\u{1F195}",
        title: snap.app_name,
        subtitle: `New entry at #${snap.rank} in ${snap.category}`,
        signal: `New entry at #${snap.rank} in ${snap.category} — wasn't in top 100 last hour`,
        url: snap.url,
        timestamp: now,
        movementType: "new_entry",
        newRank: snap.rank,
        rankChange: 0,
      });
    }
  }

  // Add TOP_MOVER if we found one (and it wasn't already a rank_jump signal)
  if (biggestMover) {
    const { snap, prevRank, diff } = biggestMover;
    const alreadySignaled = signals.some(
      (s) => s.movementType === "rank_jump" && s.title === snap.app_name && s.source === snap.source,
    );
    if (!alreadySignaled && diff >= 5) {
      const sourceLabel = snap.source === "appstore" ? "App Store" : "Google Play";
      signals.push({
        source: snap.source,
        sourceLabel,
        emoji: "\u{1F680}",
        title: snap.app_name,
        subtitle: `Biggest mover — up ${diff} positions`,
        signal: `Biggest mover this hour \u2014 up ${diff} positions in ${snap.category} (#${prevRank} \u2192 #${snap.rank})`,
        url: snap.url,
        timestamp: now,
        movementType: "top_mover",
        prevRank,
        newRank: snap.rank,
        rankChange: diff,
      });
    }
  }

  return signals;
}

/* ── Generate fallback signals (first run, no history) ────────── */

function generateFallbackSignals(snapshots: AppSnapshot[]): Signal[] {
  const now = new Date().toISOString();
  // Show top 5 from each unique source+category combo, but limit total
  const byCat = new Map<string, AppSnapshot[]>();
  for (const snap of snapshots) {
    const key = `${snap.source}:${snap.category}`;
    if (!byCat.has(key)) byCat.set(key, []);
    byCat.get(key)!.push(snap);
  }

  const signals: Signal[] = [];
  // Pick top 3 from 6 most popular categories
  const priorityCats = ["Overall", "Games", "Productivity", "Social Networking", "Finance", "Health & Fitness"];
  const usedCats = new Set<string>();

  for (const catName of priorityCats) {
    for (const [key, apps] of byCat) {
      if (!key.endsWith(`:${catName}`)) continue;
      if (usedCats.has(key)) continue;
      usedCats.add(key);
      const source = key.split(":")[0];
      const sourceLabel = source === "appstore" ? "App Store" : "Google Play";

      for (const app of apps.slice(0, 3)) {
        signals.push({
          source,
          sourceLabel,
          emoji: "\u{1F4F1}",
          title: app.app_name,
          subtitle: `#${app.rank} in ${catName}`,
          signal: `Currently #${app.rank} in ${sourceLabel} ${catName}`,
          url: app.url,
          timestamp: now,
          movementType: "trending",
          newRank: app.rank,
        });
      }
    }
  }

  return signals.slice(0, 30);
}

/* ── Cleanup old snapshots (keep 48 hours) ────────────────────── */

async function cleanupOldSnapshots(): Promise<void> {
  try {
    const sb = getSupabase();
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    await sb.from("pulse_snapshots").delete().lt("captured_at", cutoff);
  } catch {
    // non-critical
  }
}

/* ── GET handler ──────────────────────────────────────────────── */

export async function GET() {
  try {
    // 1. Fetch current data from all sources in parallel
    const [appStoreSnaps, playStoreSnaps, phSignals] = await Promise.all([
      fetchAppStore(),
      fetchPlayStore(),
      fetchProductHunt(),
    ]);

    console.log(`[PULSE] Results — App Store: ${appStoreSnaps.length}, Play Store: ${playStoreSnaps.length}, Product Hunt: ${phSignals.length}`);

    const allSnapshots = [...appStoreSnaps, ...playStoreSnaps];

    // 2. Save current snapshots to Supabase
    let saveError = false;
    try {
      await saveSnapshots(allSnapshots);
    } catch {
      saveError = true;
    }

    // 3. Load previous snapshots and detect movements
    let movementSignals: Signal[] = [];
    let hasMovementData = false;

    try {
      const previous = await loadPreviousSnapshots();
      if (previous && previous.length > 0) {
        hasMovementData = true;
        movementSignals = detectMovements(allSnapshots, previous);
      }
    } catch {
      // Continue without movement data
    }

    // 4. If no movement data, generate fallback signals
    if (!hasMovementData) {
      movementSignals = generateFallbackSignals(allSnapshots);
    }

    // 5. Combine: rank jumps first, then new entries, then top movers, then PH, then fallback
    const movementOrder: Record<string, number> = {
      rank_jump: 0,
      new_entry: 1,
      review_spike: 2,
      top_mover: 3,
      ph_trending: 4,
      trending: 5,
    };

    const signals = [...movementSignals, ...phSignals].sort((a, b) => {
      const orderA = movementOrder[a.movementType ?? "trending"] ?? 5;
      const orderB = movementOrder[b.movementType ?? "trending"] ?? 5;
      if (orderA !== orderB) return orderA - orderB;
      return (b.rankChange ?? 0) - (a.rankChange ?? 0);
    });

    // 6. Cleanup old snapshots in the background (non-blocking)
    cleanupOldSnapshots();

    return NextResponse.json({
      signals,
      count: signals.length,
      generatedAt: new Date().toISOString(),
      hasMovementData,
      sources: {
        appStore: appStoreSnaps.length,
        playStore: playStoreSnaps.length,
        productHunt: phSignals.length,
      },
    });
  } catch (err) {
    console.error("Pulse error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
