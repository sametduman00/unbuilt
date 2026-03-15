import { NextResponse } from "next/server";
import {
  AppSnapshot,
  FETCH_HEADERS,
  fetchAppStore,
  fetchPlayStore,
  saveSnapshots,
  loadPreviousSnapshots,
  cleanupOldSnapshots,
} from "./shared";

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

/* ── Detect movements ─────────────────────────────────────────── */

function detectMovements(
  current: AppSnapshot[],
  previous: AppSnapshot[],
): Signal[] {
  const signals: Signal[] = [];
  const now = new Date().toISOString();

  const prevMap = new Map<string, AppSnapshot>();
  for (const snap of previous) {
    prevMap.set(`${snap.source}:${snap.category}:${snap.app_id}`, snap);
  }

  const prevAppsPerCat = new Map<string, Set<string>>();
  for (const snap of previous) {
    const key = `${snap.source}:${snap.category}`;
    if (!prevAppsPerCat.has(key)) prevAppsPerCat.set(key, new Set());
    prevAppsPerCat.get(key)!.add(snap.app_id);
  }

  let biggestMover: { snap: AppSnapshot; prevRank: number; diff: number } | null = null;

  for (const snap of current) {
    const key = `${snap.source}:${snap.category}:${snap.app_id}`;
    const prev = prevMap.get(key);
    const catKey = `${snap.source}:${snap.category}`;
    const prevApps = prevAppsPerCat.get(catKey);
    const sourceLabel = snap.source === "appstore" ? "App Store" : "Google Play";

    if (prev) {
      const rankDiff = prev.rank - snap.rank;

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

      if (rankDiff > 0 && (!biggestMover || rankDiff > biggestMover.diff)) {
        biggestMover = { snap, prevRank: prev.rank, diff: rankDiff };
      }
    } else if (prevApps && !prevApps.has(snap.app_id) && snap.rank <= 20) {
      signals.push({
        source: snap.source,
        sourceLabel,
        emoji: "\u{1F195}",
        title: snap.app_name,
        subtitle: `New entry at #${snap.rank} in ${snap.category}`,
        signal: `New entry at #${snap.rank} in ${snap.category} \u2014 wasn't in top 100 last hour`,
        url: snap.url,
        timestamp: now,
        movementType: "new_entry",
        newRank: snap.rank,
        rankChange: 0,
      });
    }
  }

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
        subtitle: `Biggest mover \u2014 up ${diff} positions`,
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

  const byCat = new Map<string, AppSnapshot[]>();
  for (const snap of snapshots) {
    const key = `${snap.source}:${snap.category}`;
    if (!byCat.has(key)) byCat.set(key, []);
    byCat.get(key)!.push(snap);
  }

  const signals: Signal[] = [];

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

    // 2. Save current snapshots to Supabase (best-effort)
    try {
      await saveSnapshots(allSnapshots);
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
        console.log(`[PULSE] No previous snapshots found — using fallback`);
      }
    } catch (err) {
      console.log(`[PULSE] Supabase load error:`, err instanceof Error ? err.message : err);
    }

    // 4. If no movement data, generate fallback signals
    if (!hasMovementData) {
      movementSignals = generateFallbackSignals(allSnapshots);
      console.log(`[PULSE] Using fallback: ${movementSignals.length} trending signals`);
    }

    // 5. Sort: rank jumps first, then new entries, then top movers, then PH, then fallback
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

    // 6. Cleanup old snapshots (non-blocking)
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
