import { NextResponse } from "next/server";
import {
  AppSnapshot,
  FETCH_HEADERS,
  fetchAppStore,
  fetchPlayStore,
  saveSnapshots,
  loadPreviousSnapshots,
  loadSnapshotsAt,
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
  // PH-specific fields
  imageUrl?: string;
  topics?: string[];
  tagline?: string;
  makerName?: string;
  externalUrl?: string;
  claudeGap?: string;
  // App Store fields
  rating?: number;
  reviewCount?: number;
}

/* ── Fetch Product Hunt ───────────────────────────────────────── */

async function fetchProductHunt(): Promise<Signal[]> {
  const token = process.env.PRODUCTHUNT_API_KEY;
  if (!token) {
    console.log("[PULSE] PH: no PRODUCTHUNT_API_KEY set, skipping");
    return [];
  }

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const query = `query($postedAfter: DateTime!) {
      posts(order: VOTES, first: 50, postedAfter: $postedAfter) {
        edges {
          node {
            name
            tagline
            votesCount
            url
            website
            createdAt
            thumbnail { url }
            topics(first: 3) { edges { node { name } } }
            makers(first: 1) { name headline }
          }
        }
      }
    }`;
    const res = await fetch("https://api.producthunt.com/v2/api/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...FETCH_HEADERS },
      body: JSON.stringify({ query, variables: { postedAfter: sevenDaysAgo } }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.log("[PULSE] PH: HTTP", res.status);
      return [];
    }
    const data = await res.json();
    if (data?.errors) {
      console.log("[PULSE] PH GraphQL errors:", JSON.stringify(data.errors).slice(0, 200));
    }
    const edges = (data?.data?.posts?.edges ?? [])
      .sort((a: any, b: any) => (b.node?.votesCount ?? 0) - (a.node?.votesCount ?? 0))
      .slice(0, 30);
    console.log("[PULSE] PH: got", edges.length, "posts");

    const signals: Signal[] = edges.map((e: any) => {
      const n = e.node;
      const votes = n?.votesCount ?? 0;
      const createdAt = n?.createdAt ?? new Date().toISOString();
      const diff = Date.now() - new Date(createdAt).getTime();
      const hours = Math.floor(diff / 3600000);
      const timeAgo = hours < 1 ? "just now" : hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
      const topicEdges = n?.topics?.edges ?? [];
      const topics = topicEdges.map((t: any) => t.node?.name).filter(Boolean).slice(0, 3);
      const maker = n?.makers?.[0];

      return {
        source: "producthunt",
        sourceLabel: "Product Hunt",
        emoji: "\u{1F680}",
        title: n?.name ?? "",
        subtitle: `${votes} upvotes \u2014 launched ${timeAgo}`,
        signal: `${votes} upvotes \u2014 launched ${timeAgo}. ${n?.tagline ?? ""}`,
        url: n?.url ?? "",
        timestamp: createdAt,
        movementType: "ph_trending",
        imageUrl: n?.thumbnail?.url ?? undefined,
        topics: topics.length > 0 ? topics : undefined,
        tagline: n?.tagline ?? undefined,
        makerName: maker?.name ?? undefined,
        externalUrl: n?.website || n?.url || "",
      };
    });

    // Claude gap analysis for top 5
    try {
      const top5 = signals.slice(0, 5);
      const productList = top5.map((s) => `${s.title}: ${s.tagline ?? s.subtitle}`).join("\n");
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: `For each product, write max 12 words about what feature or user segment is missing. Be specific.\nReturn JSON array only: [{"name":"...","gap":"..."}]\nProducts:\n${productList}`,
        }],
      });
      const text = msg.content[0]?.type === "text" ? msg.content[0].text : "";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const gaps: { name: string; gap: string }[] = JSON.parse(jsonMatch[0]);
        for (const g of gaps) {
          const sig = top5.find((s) => s.title === g.name);
          if (sig) sig.claudeGap = g.gap;
        }
      }
    } catch (err) {
      console.log("[PULSE] Claude gap analysis failed:", err instanceof Error ? err.message : err);
    }

    return signals;
  } catch (err) {
    console.log("[PULSE] PH fetch FAILED:", err instanceof Error ? err.message : err);
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

  // Build set of ALL app_ids that existed anywhere in previous snapshot
  const allPrevAppIds = new Set<string>();
  for (const snap of previous) {
    allPrevAppIds.add(`${snap.source}:${snap.app_id}`);
  }

  let biggestMover: { snap: AppSnapshot; prevRank: number; diff: number } | null = null;

  for (const snap of current) {
    const key = `${snap.source}:${snap.category}:${snap.app_id}`;
    const prev = prevMap.get(key);
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
    } else if (snap.rank <= 10 && !allPrevAppIds.has(`${snap.source}:${snap.app_id}`)) {
      // Truly new: not in ANY category of previous snapshot, and now in top 10
      signals.push({
        source: snap.source,
        sourceLabel,
        emoji: "\u{1F195}",
        title: snap.app_name,
        subtitle: `New entry at #${snap.rank} in ${snap.category}`,
        signal: `New entry at #${snap.rank} in ${snap.category} \u2014 wasn't in any top 50 last hour`,
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
    if (!alreadySignaled && diff >= 10) {
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

/* ── Detect weekly/monthly movements ──────────────────────────── */

function detectLongTermMovements(
  current: AppSnapshot[],
  previous: AppSnapshot[],
  period: "weekly" | "monthly",
): Signal[] {
  const signals: Signal[] = [];
  const now = new Date().toISOString();
  const emoji = period === "weekly" ? "\u{1F4C5}" : "\u{1F4C6}";
  const movementType = period === "weekly" ? "weekly_mover" : "monthly_mover";
  const label = period === "weekly" ? "Last week" : "Last month";

  const prevMap = new Map<string, AppSnapshot>();
  for (const snap of previous) {
    prevMap.set(`${snap.source}:${snap.category}:${snap.app_id}`, snap);
  }

  for (const snap of current) {
    const key = `${snap.source}:${snap.category}:${snap.app_id}`;
    const prev = prevMap.get(key);
    if (!prev) continue;

    const rankDiff = prev.rank - snap.rank;
    if (Math.abs(rankDiff) < 5) continue;

    const sourceLabel = snap.source === "appstore" ? "App Store" : "Google Play";
    const direction = rankDiff > 0 ? "\u25B2" : "\u25BC";

    signals.push({
      source: snap.source,
      sourceLabel,
      emoji,
      title: snap.app_name,
      subtitle: `${label} #${prev.rank} \u2192 now #${snap.rank} in ${snap.category}`,
      signal: `${label} #${prev.rank} \u2192 now #${snap.rank} in ${snap.category} (${direction}${Math.abs(rankDiff)})`,
      url: snap.url,
      timestamp: now,
      movementType,
      prevRank: prev.rank,
      newRank: snap.rank,
      rankChange: rankDiff,
    });
  }

  // Sort by absolute rank change, take top 10
  signals.sort((a, b) => Math.abs(b.rankChange ?? 0) - Math.abs(a.rankChange ?? 0));
  return signals.slice(0, 10);
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
        rating: app.rating ?? undefined,
        reviewCount: app.review_count ?? undefined,
      });
    }
  }

  console.log(`[PULSE] Fallback signals: ${signals.length} from ${byCat.size} categories`);
  return signals;
}

/* ── GET handler ──────────────────────────────────────────────── */

export async function GET() {
  console.log("PULSE GET: starting");
  try {
    console.log("PULSE GET: inside try block");

    let appStoreSnaps: AppSnapshot[] = [];
    let playStoreSnaps: AppSnapshot[] = [];
    let phSignals: Signal[] = [];

    console.log("PULSE GET: about to fetch");
    try {
      const results = await Promise.allSettled([
        fetchAppStore(),
        fetchPlayStore(),
        fetchProductHunt(),
      ]);
      console.log("PULSE GET: fetch done", results.map(r => r.status));

      if (results[0].status === "fulfilled") {
        appStoreSnaps = results[0].value;
      } else {
        console.log("[PULSE] AppStore fetch REJECTED:", results[0].reason);
      }
      if (results[1].status === "fulfilled") {
        playStoreSnaps = results[1].value;
      } else {
        console.log("[PULSE] PlayStore fetch REJECTED:", results[1].reason);
      }
      if (results[2].status === "fulfilled") {
        phSignals = results[2].value;
      } else {
        console.log("[PULSE] PH fetch REJECTED:", results[2].reason);
      }
    } catch (err) {
      console.log("[PULSE] Promise.allSettled threw:", err instanceof Error ? err.message : err);
    }

    console.log(`[PULSE] Fetch results — AppStore: ${appStoreSnaps.length}, PlayStore: ${playStoreSnaps.length}, PH: ${phSignals.length}`);

    const allSnapshots = [...appStoreSnaps, ...playStoreSnaps];

    // 2. Save current snapshots to Supabase (best-effort)
    try {
      await saveSnapshots(allSnapshots);
    } catch (err) {
      console.log("[PULSE] Supabase save threw:", err instanceof Error ? err.message : err);
    }

    // 3. Load previous snapshots and detect movements (all 3 windows in parallel)
    let hourlySignals: Signal[] = [];
    let weeklySignals: Signal[] = [];
    let monthlySignals: Signal[] = [];
    let hasMovementData = false;

    try {
      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
      const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

      console.log("[PULSE] Loading comparison snapshots from Supabase...");
      const [hourlySnaps, weeklySnaps, monthlySnaps] = await Promise.all([
        loadPreviousSnapshots().catch(e => { console.log("[PULSE] hourly load error:", e); return null; }),
        loadSnapshotsAt(SEVEN_DAYS, 30 * 60 * 1000).catch(e => { console.log("[PULSE] weekly load error:", e); return null; }),
        loadSnapshotsAt(THIRTY_DAYS, 30 * 60 * 1000).catch(e => { console.log("[PULSE] monthly load error:", e); return null; }),
      ]);
      console.log(`[PULSE] Snapshots loaded — hourly: ${hourlySnaps?.length ?? 0}, weekly: ${weeklySnaps?.length ?? 0}, monthly: ${monthlySnaps?.length ?? 0}`);

      if (hourlySnaps && hourlySnaps.length > 0) {
        hasMovementData = true;
        hourlySignals = detectMovements(allSnapshots, hourlySnaps);
        console.log(`[PULSE] Hourly: ${hourlySignals.length} signals from ${hourlySnaps.length} snapshots`);
      } else {
        console.log(`[PULSE] No hourly snapshots found — will use fallback`);
      }

      if (weeklySnaps && weeklySnaps.length > 0) {
        weeklySignals = detectLongTermMovements(allSnapshots, weeklySnaps, "weekly");
        console.log(`[PULSE] Weekly: ${weeklySignals.length} signals from ${weeklySnaps.length} snapshots`);
      }

      if (monthlySnaps && monthlySnaps.length > 0) {
        monthlySignals = detectLongTermMovements(allSnapshots, monthlySnaps, "monthly");
        console.log(`[PULSE] Monthly: ${monthlySignals.length} signals from ${monthlySnaps.length} snapshots`);
      }
    } catch (err) {
      console.log(`[PULSE] Supabase load error:`, err instanceof Error ? err.message : err);
    }

    // 4. If no hourly movement data, generate fallback signals
    let fallbackSignals: Signal[] = [];
    if (!hasMovementData) {
      fallbackSignals = generateFallbackSignals(allSnapshots);
      console.log(`[PULSE] Using fallback: ${fallbackSignals.length} trending signals`);
    }

    // 5. Combine all signals and sort by priority
    const movementOrder: Record<string, number> = {
      rank_jump: 0,
      new_entry: 1,
      review_spike: 2,
      top_mover: 3,
      weekly_mover: 4,
      monthly_mover: 5,
      ph_trending: 6,
      trending: 7,
    };

    const signals = [
      ...hourlySignals,
      ...weeklySignals,
      ...monthlySignals,
      ...phSignals,
      ...fallbackSignals,
    ].sort((a, b) => {
      const orderA = movementOrder[a.movementType ?? "trending"] ?? 7;
      const orderB = movementOrder[b.movementType ?? "trending"] ?? 7;
      if (orderA !== orderB) return orderA - orderB;
      return Math.abs(b.rankChange ?? 0) - Math.abs(a.rankChange ?? 0);
    });

    console.log(`[PULSE] Final: ${signals.length} signals (hourly=${hourlySignals.length} weekly=${weeklySignals.length} monthly=${monthlySignals.length} ph=${phSignals.length} fallback=${fallbackSignals.length})`);

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
    const msg = err instanceof Error ? err.message : String(err);
    console.log("FATAL ERROR:", msg);
    console.log("FATAL ERROR stack:", err instanceof Error ? err.stack : "no stack");
    return NextResponse.json({
      signals: [],
      count: 0,
      hasMovementData: false,
      error: msg,
    });
  }
}
