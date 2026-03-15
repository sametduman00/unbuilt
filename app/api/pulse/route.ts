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

/* ── iTunes Genre IDs ─────────────────────────────────────────── */

const ITUNES_CATEGORIES: { name: string; genreId: number }[] = [
  { name: "Overall", genreId: 36 },
  { name: "Games", genreId: 6014 },
  { name: "Business", genreId: 6000 },
  { name: "Education", genreId: 6017 },
  { name: "Entertainment", genreId: 6016 },
  { name: "Finance", genreId: 6015 },
  { name: "Food & Drink", genreId: 6023 },
  { name: "Health & Fitness", genreId: 6013 },
  { name: "Lifestyle", genreId: 6012 },
  { name: "Music", genreId: 6011 },
  { name: "News", genreId: 6009 },
  { name: "Photo & Video", genreId: 6008 },
  { name: "Productivity", genreId: 6007 },
  { name: "Shopping", genreId: 6024 },
  { name: "Social Networking", genreId: 6005 },
  { name: "Sports", genreId: 6004 },
  { name: "Travel", genreId: 6003 },
  { name: "Utilities", genreId: 6002 },
];

const FETCH_HEADERS = { "User-Agent": "Mozilla/5.0" };

/* ── Fetch App Store via iTunes RSS feed ──────────────────────── */

async function fetchAppStoreCategory(cat: { name: string; genreId: number }): Promise<AppSnapshot[]> {
  try {
    // iTunes RSS feed — works reliably from Vercel
    const url = `https://itunes.apple.com/us/rss/topfreeapplications/limit=50/genre=${cat.genreId}/json`;
    const res = await fetch(url, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.log(`APPSTORE ${cat.name}: HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    const entries = data?.feed?.entry ?? [];
    console.log(`APPSTORE ${cat.name}: ${entries.length} apps`);

    return entries.map((entry: any, i: number): AppSnapshot => {
      const appId = entry.id?.attributes?.["im:id"] ?? entry["im:name"]?.label ?? `unknown-${i}`;
      const appName = entry["im:name"]?.label ?? "Unknown";
      const rating = parseFloat(entry["im:rating"]?.label) || null;
      const reviewCount = parseInt(entry["im:ratingCount"]?.label) || null;
      const appUrl = entry.link?.attributes?.href ?? "";

      return {
        source: "appstore",
        category: cat.name,
        app_id: String(appId),
        app_name: appName,
        rank: i + 1,
        review_count: reviewCount,
        rating,
        url: appUrl,
      };
    });
  } catch (err) {
    console.log(`APPSTORE ${cat.name}: ERROR ${err instanceof Error ? err.message : err}`);
    return [];
  }
}

async function fetchAppStore(): Promise<AppSnapshot[]> {
  console.log("APP STORE: fetching", ITUNES_CATEGORIES.length, "categories via iTunes RSS");

  // Fetch in 2 sequential batches of 9 to avoid overwhelming iTunes
  const batch1 = ITUNES_CATEGORIES.slice(0, 9);
  const batch2 = ITUNES_CATEGORIES.slice(9);

  const results1 = await Promise.all(batch1.map(fetchAppStoreCategory));
  const results2 = await Promise.all(batch2.map(fetchAppStoreCategory));
  const results = [...results1, ...results2];

  const flat = results.flat();
  const successCount = results.filter((r) => r.length > 0).length;
  console.log("APP STORE: got", flat.length, "total apps from", successCount, "/", ITUNES_CATEGORIES.length, "categories");
  return flat;
}

/* ── Fetch Google Play (top 50 free) ──────────────────────────── */

async function fetchPlayStore(): Promise<AppSnapshot[]> {
  // Try real Play Store HTML scrape
  try {
    const res = await fetch(
      "https://play.google.com/store/apps/collection/topselling_free?hl=en&gl=US",
      {
        headers: { "Accept": "text/html", ...FETCH_HEADERS },
        signal: AbortSignal.timeout(15000),
      },
    );
    console.log(`[PULSE] Play Store HTML: HTTP ${res.status}`);
    if (!res.ok) {
      console.log(`[PULSE] Play Store: HTTP error, skipping (no fake data)`);
      return [];
    }

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

    console.log(`[PULSE] Play Store parsed: ${snapshots.length} apps`);
    return snapshots;
  } catch (err) {
    console.log(`[PULSE] Play Store scrape failed:`, err instanceof Error ? err.message : err);
    console.log(`[PULSE] Play Store: returning empty (no fake data)`);
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
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...FETCH_HEADERS },
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

async function saveSnapshots(snapshots: AppSnapshot[]): Promise<boolean> {
  if (snapshots.length === 0) return false;
  const sb = getSupabase();
  const now = new Date().toISOString();
  let totalInserted = 0;

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
    const { error } = await sb.from("pulse_snapshots").insert(batch);
    if (error) {
      console.log("SUPABASE INSERT ERROR:", error.message, "| batch:", i, "-", i + batch.length);
      return false;
    }
    totalInserted += batch.length;
  }

  console.log(`[PULSE] Supabase: inserted ${totalInserted} snapshots`);
  return true;
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

  // Group by source:category
  const byCat = new Map<string, AppSnapshot[]>();
  for (const snap of snapshots) {
    const key = `${snap.source}:${snap.category}`;
    if (!byCat.has(key)) byCat.set(key, []);
    byCat.get(key)!.push(snap);
  }

  const signals: Signal[] = [];

  // Show top 3 from EVERY successfully fetched category
  for (const [key, apps] of byCat) {
    const source = key.split(":")[0];
    const catName = key.split(":").slice(1).join(":");
    const sourceLabel = source === "appstore" ? "App Store" : "Google Play";

    for (const app of apps.slice(0, 3)) {
      const ratingStr = app.rating ? ` \u2022 ${app.rating.toFixed(1)}\u2605` : "";
      const reviewStr = app.review_count ? ` \u2022 ${app.review_count.toLocaleString()} reviews` : "";
      signals.push({
        source,
        sourceLabel,
        emoji: "\u{1F4F1}",
        title: app.app_name,
        subtitle: `#${app.rank} in ${catName}${ratingStr}`,
        signal: `Currently #${app.rank} in ${sourceLabel} ${catName}${ratingStr}${reviewStr}`,
        url: app.url,
        timestamp: now,
        movementType: "trending",
        newRank: app.rank,
      });
    }
  }

  console.log(`[PULSE] Fallback signals: ${signals.length} from ${byCat.size} categories`);
  return signals;
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
    let saveOk = false;
    try {
      saveOk = await saveSnapshots(allSnapshots);
    } catch (err) {
      console.log("[PULSE] Supabase save threw:", err instanceof Error ? err.message : err);
    }

    // 3. Load previous snapshots and detect movements
    let movementSignals: Signal[] = [];
    let hasMovementData = false;

    try {
      const previous = await loadPreviousSnapshots();
      if (previous && previous.length > 0) {
        hasMovementData = true;
        movementSignals = detectMovements(allSnapshots, previous);
        console.log(`[PULSE] Movement detection: ${movementSignals.length} signals from ${previous.length} previous snapshots`);
      } else {
        console.log(`[PULSE] No previous snapshots found — first run, using fallback`);
      }
    } catch (err) {
      console.log(`[PULSE] Supabase load error:`, err instanceof Error ? err.message : err);
    }

    // 4. If no movement data, generate fallback signals (top 5 from each category)
    if (!hasMovementData) {
      movementSignals = generateFallbackSignals(allSnapshots);
      console.log(`[PULSE] Using fallback: ${movementSignals.length} trending signals`);
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
