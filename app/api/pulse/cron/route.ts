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

    // 1. Tüm kaynakları paralel çek
    const [appRes, playRes, phRes] = await Promise.allSettled([
      fetchAppStore(),
      fetchPlayStore(),
      fetchProductHuntAll(FETCH_HEADERS),
    ]);

    const appSnaps = appRes.status === "fulfilled" ? appRes.value : [];
    const playSnaps = playRes.status === "fulfilled" ? playRes.value : [];
    const phSignals = phRes.status === "fulfilled" ? phRes.value : [];

    console.log(`[CRON] AppStore: ${appSnaps.length}, PlayStore: ${playSnaps.length}, PH: ${phSignals.length}`);

    // 2. Snapshot kaydet
    const allSnapshots = [...appSnaps, ...playSnaps];
    await saveSnapshots(allSnapshots);

    // 3. Movement detection
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

    if (hourlySnaps && hourlySnaps.length > 0) {
      hasMovementData = true;
      hourlySignals = detectMovements(allSnapshots, hourlySnaps);
    }
    if (weeklySnaps && weeklySnaps.length > 0) {
      weeklySignals = detectLongTermMovements(allSnapshots, weeklySnaps, "weekly");
    }
    if (monthlySnaps && monthlySnaps.length > 0) {
      monthlySignals = detectLongTermMovements(allSnapshots, monthlySnaps, "monthly");
    }

    const fallbackSignals = !hasMovementData ? generateFallbackSignals(allSnapshots) : [];

    // 4. PH analizini yap (burada yapıyoruz, müşteri beklemiyor)
    const analyzedPH = await analyzePHSignals(phSignals);

    // 5. Tüm sinyalleri birleştir ve sırala
    const priority: Record<string, number> = {
      rank_jump: 0, new_entry: 1, review_spike: 2,
      top_mover: 3, weekly_mover: 4, monthly_mover: 5,
      ph_trending: 6, trending: 7,
    };

    const signals = [
      ...hourlySignals, ...weeklySignals, ...monthlySignals,
      ...analyzedPH, ...fallbackSignals,
    ].sort((a, b) => {
      const pa = priority[a.movementType ?? "trending"] ?? 7;
      const pb = priority[b.movementType ?? "trending"] ?? 7;
      if (pa !== pb) return pa - pb;
      return Math.abs(b.rankChange ?? 0) - Math.abs(a.rankChange ?? 0);
    });

    // 6. Hazır feed'i Supabase'e kaydet
    const sb = getSupabase();
    const { error } = await sb.from("pulse_feed_cache").insert({
      signals,
      has_movement_data: hasMovementData,
      sources: {
        appStore: appSnaps.length,
        playStore: playSnaps.length,
        productHunt: phSignals.length,
      },
      generated_at: new Date().toISOString(),
    });

    if (error) console.log("[CRON] cache insert error:", error.message);

    // 7. 48 saatten eski cache'leri temizle
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    await sb.from("pulse_feed_cache").delete().lt("generated_at", cutoff);

    cleanupOldSnapshots();

    console.log(`[CRON] DONE: ${signals.length} sinyal cache'e yazıldı`);
    return NextResponse.json({
      ok: true,
      signals: signals.length,
      appStore: appSnaps.length,
      playStore: playSnaps.length,
      productHunt: phSignals.length,
      hasMovementData,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[CRON] FAILED:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/* ── PH: bugünün tüm ürünlerini çek ─────────────────────────── */

async function fetchProductHuntAll(fetchHeaders: Record<string, string>): Promise<any[]> {
  const token = process.env.PRODUCTHUNT_API_KEY;
  if (!token) return [];

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const query = `query($postedAfter: DateTime!, $after: String) {
    posts(order: NEWEST, first: 50, postedAfter: $postedAfter, after: $after) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          name tagline description votesCount url website createdAt
          thumbnail { url }
          topics(first: 3) { edges { node { name } } }
          makers { name }
        }
      }
    }
  }`;

  let allEdges: any[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;
  let page = 0;

  while (hasNextPage && page < 5) {
    page++;
    const res: Response = await fetch("https://api.producthunt.com/v2/api/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...fetchHeaders },
      body: JSON.stringify({ query, variables: { postedAfter: todayStart.toISOString(), after: cursor } }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) break;
    const data = await res.json();
    if (data?.errors) break;
    const postsData = data?.data?.posts;
    allEdges = [...allEdges, ...(postsData?.edges ?? [])];
    hasNextPage = postsData?.pageInfo?.hasNextPage ?? false;
    cursor = postsData?.pageInfo?.endCursor ?? null;
  }

  console.log(`[CRON] PH: ${allEdges.length} \u00FCr\u00FCn`);

  return allEdges.map((e: any) => {
    const n = e.node;
    const votes = n?.votesCount ?? 0;
    const createdAt = n?.createdAt ?? new Date().toISOString();
    const hours = Math.floor((Date.now() - new Date(createdAt).getTime()) / 3_600_000);
    const timeAgo = hours < 1 ? "just now" : `${hours}h ago`;
    const topics = (n?.topics?.edges ?? []).map((t: any) => t.node?.name).filter(Boolean).slice(0, 3);
    return {
      source: "producthunt", sourceLabel: "Product Hunt", emoji: "\u{1F680}",
      title: n?.name ?? "", subtitle: `${votes} upvotes \u2014 launched ${timeAgo}`,
      signal: `${votes} upvotes \u2014 launched ${timeAgo}. ${n?.tagline ?? ""}`,
      url: n?.url ?? "", timestamp: createdAt, movementType: "ph_trending",
      imageUrl: n?.thumbnail?.url ?? undefined,
      topics: topics.length > 0 ? topics : undefined,
      tagline: n?.tagline ?? undefined,
      makerName: n?.makers?.[0]?.name ?? undefined,
      externalUrl: n?.website || n?.url || "",
    };
  });
}

/* ── Claude ile PH analizi (20'şerli batch) ──────────────────── */

async function analyzePHSignals(signals: any[]): Promise<any[]> {
  if (signals.length === 0) return [];
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const BATCH_SIZE = 25;
    const analyzed = [...signals];

    const capped = signals.slice(0, 60);
    for (let i = 0; i < capped.length; i += BATCH_SIZE) {
      const batch = capped.slice(i, i + BATCH_SIZE);
      const productList = batch
        .map((s: any) => `Product: ${s.title}\nTagline: ${s.signal}\nTopics: ${(s.topics ?? []).join(", ")}`)
        .join("\n\n---\n\n");

      try {
        const msg = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 800,
          messages: [{
            role: "user",
            content: `Analyze each Product Hunt product. For each, answer 2 things in English:
1. "different": What makes it genuinely different from alternatives? (1 sharp sentence, be specific)
2. "missing": The most obvious gap or missing feature? (1 sharp sentence, be specific)

Return ONLY JSON array, no other text:
[{"name":"...","different":"...","missing":"..."}]

Products:
${productList}`,
          }],
        });

        const text = msg.content[0]?.type === "text" ? msg.content[0].text : "";
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
          const analyses = JSON.parse(match[0]);
          for (const a of analyses) {
            const idx = analyzed.findIndex(s => s.title === a.name);
            if (idx !== -1) {
              analyzed[idx] = {
                ...analyzed[idx],
                claudeGap: `\u2726 Different: ${a.different} \u2726 Missing: ${a.missing}`,
              };
            }
          }
        }
        console.log(`[CRON] PH analiz batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} \u00FCr\u00FCn`);
      } catch (err) {
        console.log(`[CRON] PH analiz batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, err instanceof Error ? err.message : err);
      }
    }
    return analyzed;
  } catch (err) {
    console.log("[CRON] PH analiz failed:", err instanceof Error ? err.message : err);
    return signals;
  }
}

/* ── Detect hourly movements ─────────────────────────────────── */

function detectMovements(current: AppSnapshot[], previous: AppSnapshot[]): any[] {
  const signals: any[] = [];
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
): any[] {
  const signals: any[] = [];
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

  signals.sort((a: any, b: any) => Math.abs(b.rankChange ?? 0) - Math.abs(a.rankChange ?? 0));
  return signals.slice(0, 10);
}

/* ── Fallback: top 3 per category (first run) ────────────────── */

function generateFallbackSignals(snapshots: AppSnapshot[]): any[] {
  const now = new Date().toISOString();

  const byCat = new Map<string, AppSnapshot[]>();
  for (const snap of snapshots) {
    const key = `${snap.source}:${snap.category}`;
    if (!byCat.has(key)) byCat.set(key, []);
    byCat.get(key)!.push(snap);
  }

  const signals: any[] = [];
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
