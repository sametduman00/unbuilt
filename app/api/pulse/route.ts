import { NextResponse } from "next/server";
import type { AppSnapshot } from "./shared";

/* ── Types (local to this route) ─────────────────────────────── */

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
  imageUrl?: string;
  topics?: string[];
  tagline?: string;
  makerName?: string;
  externalUrl?: string;
  claudeGap?: string;
  rating?: number;
  reviewCount?: number;
}

/* ── GET handler — everything lives here, zero module-level init ── */

export async function GET() {
  console.log("PULSE START");

  try {
    // ── Step 1: Import shared helpers (lazy, inside handler) ────
    const {
      FETCH_HEADERS,
      fetchAppStore,
      fetchPlayStore,
      saveSnapshots,
      loadPreviousSnapshots,
      loadSnapshotsAt,
      cleanupOldSnapshots,
    } = await import("./shared");
    console.log("[PULSE] shared imports OK");

    // ── Step 2: Fetch all 3 sources in parallel ────────────────
    let appStoreSnaps: AppSnapshot[] = [];
    let playStoreSnaps: AppSnapshot[] = [];
    let phSignals: Signal[] = [];

    const [appRes, playRes, phRes] = await Promise.allSettled([
      fetchAppStore(),
      fetchPlayStore(),
      fetchProductHunt(FETCH_HEADERS),
    ]);

    if (appRes.status === "fulfilled") {
      appStoreSnaps = appRes.value;
    } else {
      console.log("[PULSE] AppStore REJECTED:", appRes.reason);
    }

    if (playRes.status === "fulfilled") {
      playStoreSnaps = playRes.value;
    } else {
      console.log("[PULSE] PlayStore REJECTED:", playRes.reason);
    }

    if (phRes.status === "fulfilled") {
      phSignals = phRes.value;
    } else {
      console.log("[PULSE] PH REJECTED:", phRes.reason);
    }

    console.log(`[PULSE] fetched — AppStore: ${appStoreSnaps.length}, PlayStore: ${playStoreSnaps.length}, PH: ${phSignals.length}`);

    const allSnapshots = [...appStoreSnaps, ...playStoreSnaps];

    // ── Step 3: Save current snapshots to Supabase ─────────────
    try {
      await saveSnapshots(allSnapshots);
      console.log("[PULSE] snapshots saved");
    } catch (err) {
      console.log("[PULSE] save error:", err instanceof Error ? err.message : err);
    }

    // ── Step 4: Load previous snapshots & detect movements ─────
    let hourlySignals: Signal[] = [];
    let weeklySignals: Signal[] = [];
    let monthlySignals: Signal[] = [];
    let hasMovementData = false;

    try {
      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
      const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

      const [hourlySnaps, weeklySnaps, monthlySnaps] = await Promise.all([
        loadPreviousSnapshots().catch(() => null),
        loadSnapshotsAt(SEVEN_DAYS, 30 * 60 * 1000).catch(() => null),
        loadSnapshotsAt(THIRTY_DAYS, 30 * 60 * 1000).catch(() => null),
      ]);
      console.log(`[PULSE] loaded — hourly: ${hourlySnaps?.length ?? 0}, weekly: ${weeklySnaps?.length ?? 0}, monthly: ${monthlySnaps?.length ?? 0}`);

      if (hourlySnaps && hourlySnaps.length > 0) {
        hasMovementData = true;
        hourlySignals = detectMovements(allSnapshots, hourlySnaps);
        console.log(`[PULSE] hourly movements: ${hourlySignals.length}`);
      }

      if (weeklySnaps && weeklySnaps.length > 0) {
        weeklySignals = detectLongTermMovements(allSnapshots, weeklySnaps, "weekly");
        console.log(`[PULSE] weekly movements: ${weeklySignals.length}`);
      }

      if (monthlySnaps && monthlySnaps.length > 0) {
        monthlySignals = detectLongTermMovements(allSnapshots, monthlySnaps, "monthly");
        console.log(`[PULSE] monthly movements: ${monthlySignals.length}`);
      }
    } catch (err) {
      console.log("[PULSE] snapshot compare error:", err instanceof Error ? err.message : err);
    }

    // ── Step 5: Fallback if no movement history ────────────────
    let fallbackSignals: Signal[] = [];
    if (!hasMovementData) {
      fallbackSignals = generateFallbackSignals(allSnapshots);
      console.log(`[PULSE] fallback: ${fallbackSignals.length} signals`);
    }

    // ── Step 6: Combine & sort ─────────────────────────────────
    const priority: Record<string, number> = {
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
      const pa = priority[a.movementType ?? "trending"] ?? 7;
      const pb = priority[b.movementType ?? "trending"] ?? 7;
      if (pa !== pb) return pa - pb;
      return Math.abs(b.rankChange ?? 0) - Math.abs(a.rankChange ?? 0);
    });

    // ── Step 7: Cleanup old snapshots (fire & forget) ──────────
    cleanupOldSnapshots();

    console.log("PULSE END:", signals.length);

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
    console.log("PULSE FATAL:", msg);
    console.log("PULSE FATAL stack:", err instanceof Error ? err.stack : "n/a");
    return NextResponse.json({
      signals: [],
      count: 0,
      hasMovementData: false,
      error: msg,
    });
  }
}

/* ── Product Hunt fetch ──────────────────────────────────────── */

async function fetchProductHunt(fetchHeaders: Record<string, string>): Promise<Signal[]> {
  const token = process.env.PRODUCTHUNT_API_KEY;
  if (!token) {
    console.log("[PULSE] PH: no API key, skipping");
    return [];
  }

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
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
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...fetchHeaders,
      },
      body: JSON.stringify({ query, variables: { postedAfter: sevenDaysAgo } }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.log("[PULSE] PH HTTP", res.status);
      return [];
    }

    const data = await res.json();
    if (data?.errors) {
      console.log("[PULSE] PH GraphQL errors:", JSON.stringify(data.errors).slice(0, 200));
    }

    const edges = (data?.data?.posts?.edges ?? [])
      .sort((a: any, b: any) => (b.node?.votesCount ?? 0) - (a.node?.votesCount ?? 0))
      .slice(0, 30);

    console.log("[PULSE] PH:", edges.length, "posts");

    const signals: Signal[] = edges.map((e: any) => {
      const n = e.node;
      const votes = n?.votesCount ?? 0;
      const createdAt = n?.createdAt ?? new Date().toISOString();
      const hours = Math.floor((Date.now() - new Date(createdAt).getTime()) / 3_600_000);
      const timeAgo = hours < 1 ? "just now" : hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
      const topics = (n?.topics?.edges ?? []).map((t: any) => t.node?.name).filter(Boolean).slice(0, 3);
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

    // Claude gap analysis for top 5 (best-effort)
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
      console.log("[PULSE] PH Claude gaps OK");
    } catch (err) {
      console.log("[PULSE] PH Claude gap failed:", err instanceof Error ? err.message : err);
    }

    return signals;
  } catch (err) {
    console.log("[PULSE] PH fetch FAILED:", err instanceof Error ? err.message : err);
    return [];
  }
}

/* ── Detect hourly movements ─────────────────────────────────── */

function detectMovements(current: AppSnapshot[], previous: AppSnapshot[]): Signal[] {
  const signals: Signal[] = [];
  const now = new Date().toISOString();

  const prevMap = new Map<string, AppSnapshot>();
  for (const snap of previous) {
    prevMap.set(`${snap.source}:${snap.category}:${snap.app_id}`, snap);
  }

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

      // Big rank jump: was >=20, now <=10, jumped >=10
      if (prev.rank >= 20 && snap.rank <= 10 && rankDiff >= 10) {
        signals.push({
          source: snap.source, sourceLabel,
          emoji: "\u{1F4C8}",
          title: snap.app_name,
          subtitle: `#${prev.rank} \u2192 #${snap.rank} in ${snap.category}`,
          signal: `Jumped from #${prev.rank} to #${snap.rank} in ${snap.category} (\u25B2${rankDiff} positions)`,
          url: snap.url, timestamp: now,
          movementType: "rank_jump",
          prevRank: prev.rank, newRank: snap.rank, rankChange: rankDiff,
        });
      }

      // Review spike: >=500 new reviews in 1 hour
      if (prev.review_count && snap.review_count) {
        const gained = snap.review_count - prev.review_count;
        if (gained >= 500) {
          const pct = Math.round((gained / prev.review_count) * 100);
          signals.push({
            source: snap.source, sourceLabel,
            emoji: "\u{1F4AC}",
            title: snap.app_name,
            subtitle: `${gained.toLocaleString()} new reviews in 1 hour`,
            signal: `${gained.toLocaleString()} new reviews in 1 hour (+${pct}%)`,
            url: snap.url, timestamp: now,
            movementType: "review_spike",
            prevRank: prev.rank, newRank: snap.rank, rankChange: prev.rank - snap.rank,
          });
        }
      }

      if (rankDiff > 0 && (!biggestMover || rankDiff > biggestMover.diff)) {
        biggestMover = { snap, prevRank: prev.rank, diff: rankDiff };
      }
    } else if (snap.rank <= 10 && !allPrevAppIds.has(`${snap.source}:${snap.app_id}`)) {
      signals.push({
        source: snap.source, sourceLabel,
        emoji: "\u{1F195}",
        title: snap.app_name,
        subtitle: `New entry at #${snap.rank} in ${snap.category}`,
        signal: `New entry at #${snap.rank} in ${snap.category} \u2014 wasn't in any top 50 last hour`,
        url: snap.url, timestamp: now,
        movementType: "new_entry",
        newRank: snap.rank, rankChange: 0,
      });
    }
  }

  // Add biggest mover if not already signaled
  if (biggestMover && biggestMover.diff >= 10) {
    const { snap, prevRank, diff } = biggestMover;
    const already = signals.some(
      (s) => s.movementType === "rank_jump" && s.title === snap.app_name && s.source === snap.source,
    );
    if (!already) {
      const sourceLabel = snap.source === "appstore" ? "App Store" : "Google Play";
      signals.push({
        source: snap.source, sourceLabel,
        emoji: "\u{1F680}",
        title: snap.app_name,
        subtitle: `Biggest mover \u2014 up ${diff} positions`,
        signal: `Biggest mover this hour \u2014 up ${diff} positions in ${snap.category} (#${prevRank} \u2192 #${snap.rank})`,
        url: snap.url, timestamp: new Date().toISOString(),
        movementType: "top_mover",
        prevRank, newRank: snap.rank, rankChange: diff,
      });
    }
  }

  return signals;
}

/* ── Detect weekly/monthly movements ─────────────────────────── */

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
    const prev = prevMap.get(`${snap.source}:${snap.category}:${snap.app_id}`);
    if (!prev) continue;

    const rankDiff = prev.rank - snap.rank;
    if (Math.abs(rankDiff) < 5) continue;

    const sourceLabel = snap.source === "appstore" ? "App Store" : "Google Play";
    const direction = rankDiff > 0 ? "\u25B2" : "\u25BC";

    signals.push({
      source: snap.source, sourceLabel, emoji,
      title: snap.app_name,
      subtitle: `${label} #${prev.rank} \u2192 now #${snap.rank} in ${snap.category}`,
      signal: `${label} #${prev.rank} \u2192 now #${snap.rank} in ${snap.category} (${direction}${Math.abs(rankDiff)})`,
      url: snap.url, timestamp: now, movementType,
      prevRank: prev.rank, newRank: snap.rank, rankChange: rankDiff,
    });
  }

  signals.sort((a, b) => Math.abs(b.rankChange ?? 0) - Math.abs(a.rankChange ?? 0));
  return signals.slice(0, 10);
}

/* ── Fallback: top 3 per category + PH top 20 (first run) ──── */

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
        source, sourceLabel,
        emoji: "\u{1F4F1}",
        title: app.app_name,
        subtitle: `#${app.rank} in ${catName}${ratingStr}`,
        signal: `Currently #${app.rank} in ${sourceLabel} ${catName}${ratingStr}${reviewStr}`,
        url: app.url, timestamp: now,
        movementType: "trending",
        newRank: app.rank,
        rating: app.rating ?? undefined,
        reviewCount: app.review_count ?? undefined,
      });
    }
  }

  return signals;
}
