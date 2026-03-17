import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";
import type { AppSnapshot } from "../shared";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { fetchAppStore, fetchPlayStore, saveSnapshots, loadPreviousSnapshots, loadSnapshotsAt, cleanupOldSnapshots } = await import("../shared");
    const FETCH_HEADERS = { "User-Agent": "Mozilla/5.0" };

    // 1. Fetch all sources
    const [appRes, playRes, phRes] = await Promise.allSettled([
      fetchAppStore(), fetchPlayStore(), fetchProductHuntLast24h(FETCH_HEADERS),
    ]);
    const appSnaps = appRes.status === "fulfilled" ? appRes.value : [];
    const playSnaps = playRes.status === "fulfilled" ? playRes.value : [];
    const freshPHSignals = phRes.status === "fulfilled" ? phRes.value : [];
    console.log(`[CRON] AppStore: ${appSnaps.length}, PlayStore: ${playSnaps.length}, PH fresh: ${freshPHSignals.length}`);

    const allSnapshots = [...appSnaps, ...playSnaps];
    await saveSnapshots(allSnapshots);

    // 2. Movement detection
    const [hourlySnaps, weeklySnaps, monthlySnaps] = await Promise.all([
      loadPreviousSnapshots().catch(() => null),
      loadSnapshotsAt(7 * 24 * 3600 * 1000, 30 * 60 * 1000).catch(() => null),
      loadSnapshotsAt(30 * 24 * 3600 * 1000, 30 * 60 * 1000).catch(() => null),
    ]);
    let hourlySignals: any[] = [];
    let weeklySignals: any[] = [];
    let monthlySignals: any[] = [];
    let hasMovementData = false;
    if (hourlySnaps?.length) { hasMovementData = true; hourlySignals = detectMovements(allSnapshots, hourlySnaps); }
    if (weeklySnaps?.length) weeklySignals = detectLongTermMovements(allSnapshots, weeklySnaps, "weekly");
    if (monthlySnaps?.length) monthlySignals = detectLongTermMovements(allSnapshots, monthlySnaps, "monthly");
    const fallbackSignals = !hasMovementData ? generateFallbackSignals(allSnapshots) : [];

    // 3. Load existing analyses from ph_analyses table (permanent store)
    const sb = getSupabase();
    const freshUrls = freshPHSignals.map((s: any) => s.url).filter(Boolean);
    
    let analysisMap = new Map<string, { what: string; different: string; missing: string }>();
    if (freshUrls.length > 0) {
      const { data: existingAnalyses } = await sb
        .from("ph_analyses")
        .select("product_url, what, different, missing")
        .in("product_url", freshUrls);
      
      for (const a of existingAnalyses ?? []) {
        analysisMap.set(a.product_url, { what: a.what, different: a.different, missing: a.missing });
      }
    }
    console.log(`[CRON] Found ${analysisMap.size} existing analyses for ${freshUrls.length} live products`);

    // 4. Analyze only NEW products not yet in ph_analyses (max 60 per run)
    const needsAnalysis = freshPHSignals
      .filter((s: any) => s.url && !analysisMap.has(s.url))
      .slice(0, 60);

    if (needsAnalysis.length > 0) {
      console.log(`[CRON] Analyzing ${needsAnalysis.length} new products...`);
      const newAnalyses = await analyzeProducts(needsAnalysis);
      
      if (newAnalyses.length > 0) {
        // Save to ph_analyses (permanent, never repeat)
        const rows = newAnalyses.map((a: any) => {
          const sig = needsAnalysis.find((s: any) => s.title?.trim().toLowerCase() === a.name?.trim().toLowerCase());
          return { product_url: sig?.url ?? "", product_name: a.name, what: a.what, different: a.different, missing: a.missing };
        }).filter((r: any) => r.product_url);

        if (rows.length > 0) {
          const { error: insertErr } = await sb.from("ph_analyses").upsert(rows, { onConflict: "product_url" });
          if (insertErr) console.log("[CRON] ph_analyses insert error:", insertErr.message);
        }

        // Add to in-memory map
        for (const a of newAnalyses) {
          const sig = needsAnalysis.find((s: any) => s.title?.trim().toLowerCase() === a.name?.trim().toLowerCase());
          if (sig?.url) analysisMap.set(sig.url, { what: a.what, different: a.different, missing: a.missing });
        }
        console.log(`[CRON] Saved ${newAnalyses.length} new analyses to ph_analyses`);
      }
    }

    // 5. Load previous cache for frozen PH products
    const { data: prevCache } = await sb.from("pulse_feed_cache").select("signals").order("generated_at", { ascending: false }).limit(1).single();
    const prevPHByTitle = new Map<string, any>();
    if (prevCache?.signals) {
      for (const s of prevCache.signals as any[]) {
        if (s.source === "producthunt") prevPHByTitle.set(s.title?.trim(), s);
      }
    }

    const freshTitles = new Set(freshPHSignals.map((s: any) => s.title?.trim()));

    // 6. Build live PH signals with analyses from ph_analyses table
    const mergedLivePH = freshPHSignals.map((s: any) => {
      const analysis = analysisMap.get(s.url);
      const claudeGap = analysis
        ? `${analysis.what} \u2726 Different: ${analysis.different} \u2726 Missing: ${analysis.missing}`
        : undefined;
      return { ...s, isLive: true, claudeGap };
    });

    // 7. Frozen products (> 24h): keep as-is from previous cache
    const frozenPH = Array.from(prevPHByTitle.values())
      .filter((s: any) => !freshTitles.has(s.title?.trim()))
      .map((s: any) => ({ ...s, isLive: false }));

    const liveAnalyzed = mergedLivePH.filter((s: any) => s.claudeGap).length;
    console.log(`[CRON] Live: ${mergedLivePH.length} (${liveAnalyzed} analyzed), Frozen: ${frozenPH.length}`);

    // 8. Sort and combine
    const sortedLivePH = [...mergedLivePH].sort((a, b) => (b.votesCount ?? 0) - (a.votesCount ?? 0));
    const sortedFrozenPH = [...frozenPH].sort((a, b) => (b.votesCount ?? 0) - (a.votesCount ?? 0));
    const allPHSignals = [...sortedLivePH, ...sortedFrozenPH];

    const priority: Record<string, number> = { rank_jump: 0, new_entry: 1, review_spike: 2, top_mover: 3, weekly_mover: 4, monthly_mover: 5, ph_trending: 6, trending: 7 };
    const signals = [...hourlySignals, ...weeklySignals, ...monthlySignals, ...allPHSignals, ...fallbackSignals].sort((a, b) => {
      const pa = priority[a.movementType ?? "trending"] ?? 7;
      const pb = priority[b.movementType ?? "trending"] ?? 7;
      if (pa !== pb) return pa - pb;
      if (a.movementType === "ph_trending") return 0;
      return Math.abs(b.rankChange ?? 0) - Math.abs(a.rankChange ?? 0);
    });

    // 9. Save cache
    const { error } = await sb.from("pulse_feed_cache").insert({
      signals, has_movement_data: hasMovementData,
      sources: { appStore: appSnaps.length, playStore: playSnaps.length, productHunt: allPHSignals.length, productHuntLive: mergedLivePH.length, productHuntFrozen: frozenPH.length },
      generated_at: new Date().toISOString(),
    });
    if (error) console.log("[CRON] cache insert error:", error.message);

    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    await sb.from("pulse_feed_cache").delete().lt("generated_at", cutoff);
    cleanupOldSnapshots();

    const totalAnalyzed = signals.filter((s: any) => s.source === "producthunt" && s.claudeGap).length;
    console.log(`[CRON] DONE: ${signals.length} signals | PH analyzed: ${totalAnalyzed}/${allPHSignals.length}`);

    return NextResponse.json({ ok: true, signals: signals.length, phLive: mergedLivePH.length, phFrozen: frozenPH.length, phAnalyzed: totalAnalyzed, hasMovementData });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[CRON] FAILED:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/* ── Analyze products — called only for truly new products ──── */
async function analyzeProducts(signals: any[]): Promise<any[]> {
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const BATCH_SIZE = 20;
    let all: any[] = [];
    for (let i = 0; i < signals.length; i += BATCH_SIZE) {
      const batch = signals.slice(i, i + BATCH_SIZE);
      const productList = batch.map((s: any) =>
        `Product: ${s.title}\nTagline: ${s.tagline || s.signal}\nTopics: ${(s.topics ?? []).join(", ")}`
      ).join("\n\n---\n\n");
      try {
        const msg = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 2000,
          messages: [{ role: "user", content: `Analyze each Product Hunt product. For each answer 3 things in English (max 12 words each):
1. "what": What it does and who it's for (concrete)
2. "different": What makes it genuinely different from alternatives (no "uses AI" generics)
3. "missing": The most obvious gap or missing feature (specific)

Return ONLY a JSON array, no markdown, no other text:
[{"name":"...","what":"...","different":"...","missing":"..."}]

Products:
${productList}` }],
        });
        const text = msg.content[0]?.type === "text" ? msg.content[0].text : "";
        const match = text.replace(/```json|\n```|```/g, "").trim().match(/\[[\s\S]*\]/);
        if (match) all = [...all, ...JSON.parse(match[0])];
        console.log(`[CRON ANALYZE] batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} done`);
      } catch (e) {
        console.log(`[CRON ANALYZE] batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, e instanceof Error ? e.message : e);
      }
    }
    return all;
  } catch (e) {
    console.log("[CRON ANALYZE] error:", e instanceof Error ? e.message : e);
    return [];
  }
}

/* ── PH: fetch last 24h ─────────────────────────────────────── */
async function fetchProductHuntLast24h(headers: Record<string, string>): Promise<any[]> {
  const token = process.env.PRODUCTHUNT_API_KEY;
  if (!token) return [];
  const postedAfter = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const query = `query($postedAfter: DateTime!, $after: String) {
    posts(order: NEWEST, first: 50, postedAfter: $postedAfter, after: $after) {
      pageInfo { hasNextPage endCursor }
      edges { node { name tagline votesCount url website createdAt thumbnail { url } topics(first: 5) { edges { node { name } } } makers { name } } }
    }
  }`;
  let edges: any[] = [], cursor: string | null = null, hasNext = true, page = 0;
  while (hasNext && page < 10) {
    page++;
    const res: Response = await fetch("https://api.producthunt.com/v2/api/graphql", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...headers },
      body: JSON.stringify({ query, variables: { postedAfter: postedAfter.toISOString(), after: cursor } }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) break;
    const data = await res.json();
    if (data?.errors) break;
    const posts = data?.data?.posts;
    edges = [...edges, ...(posts?.edges ?? [])];
    hasNext = posts?.pageInfo?.hasNextPage ?? false;
    cursor = posts?.pageInfo?.endCursor ?? null;
  }
  console.log(`[CRON] PH: ${edges.length} products fetched`);
  return edges.map((e: any) => {
    const n = e.node;
    const votes = n?.votesCount ?? 0;
    const createdAt = n?.createdAt ?? new Date().toISOString();
    const hours = Math.floor((Date.now() - new Date(createdAt).getTime()) / 3_600_000);
    const timeAgo = hours < 1 ? "just now" : `${hours}h ago`;
    const topics = (n?.topics?.edges ?? []).map((t: any) => t.node?.name).filter(Boolean).slice(0, 5);
    return {
      source: "producthunt", sourceLabel: "Product Hunt", emoji: "\u{1F680}",
      title: n?.name ?? "", subtitle: `${votes} upvotes \u2014 launched ${timeAgo}`,
      signal: `${votes} upvotes \u2014 launched ${timeAgo}. ${n?.tagline ?? ""}`,
      url: n?.url ?? "", timestamp: createdAt, movementType: "ph_trending",
      imageUrl: n?.thumbnail?.url ?? undefined, topics: topics.length > 0 ? topics : undefined,
      tagline: n?.tagline ?? undefined, makerName: n?.makers?.[0]?.name ?? undefined,
      externalUrl: n?.website || n?.url || "", votesCount: votes, isLive: true,
    };
  });
}

function detectMovements(current: AppSnapshot[], previous: AppSnapshot[]): any[] {
  const signals: any[] = [], now = new Date().toISOString();
  const prevMap = new Map<string, AppSnapshot>();
  for (const s of previous) prevMap.set(`${s.source}:${s.category}:${s.app_id}`, s);
  const prevIds = new Set(previous.map(s => `${s.source}:${s.app_id}`));
  let top: { snap: AppSnapshot; prevRank: number; diff: number } | null = null;
  for (const snap of current) {
    const prev = prevMap.get(`${snap.source}:${snap.category}:${snap.app_id}`);
    const lbl = snap.source === "appstore" ? "App Store" : "Google Play";
    if (prev) {
      const d = prev.rank - snap.rank;
      if (prev.rank >= 20 && snap.rank <= 10 && d >= 10) signals.push({ source: snap.source, sourceLabel: lbl, emoji: "\u{1F4C8}", title: snap.app_name, subtitle: `#${prev.rank} \u2192 #${snap.rank} in ${snap.category}`, signal: `Jumped #${prev.rank}\u2192#${snap.rank} (\u25B2${d})`, url: snap.url, timestamp: now, movementType: "rank_jump", prevRank: prev.rank, newRank: snap.rank, rankChange: d });
      if (prev.review_count && snap.review_count) { const g = snap.review_count - prev.review_count; if (g >= 500) signals.push({ source: snap.source, sourceLabel: lbl, emoji: "\u{1F4AC}", title: snap.app_name, subtitle: `${g.toLocaleString()} new reviews`, signal: `${g.toLocaleString()} new reviews (+${Math.round(g/prev.review_count*100)}%)`, url: snap.url, timestamp: now, movementType: "review_spike", prevRank: prev.rank, newRank: snap.rank, rankChange: prev.rank - snap.rank }); }
      if (d > 0 && (!top || d > top.diff)) top = { snap, prevRank: prev.rank, diff: d };
    } else if (snap.rank <= 10 && !prevIds.has(`${snap.source}:${snap.app_id}`)) {
      signals.push({ source: snap.source, sourceLabel: lbl, emoji: "\u{1F195}", title: snap.app_name, subtitle: `New at #${snap.rank} in ${snap.category}`, signal: `New entry #${snap.rank} in ${snap.category}`, url: snap.url, timestamp: now, movementType: "new_entry", newRank: snap.rank, rankChange: 0 });
    }
  }
  if (top && top.diff >= 10 && !signals.some(s => s.movementType === "rank_jump" && s.title === top!.snap.app_name)) {
    const lbl = top.snap.source === "appstore" ? "App Store" : "Google Play";
    signals.push({ source: top.snap.source, sourceLabel: lbl, emoji: "\u{1F680}", title: top.snap.app_name, subtitle: `Biggest mover \u2014 up ${top.diff}`, signal: `Biggest mover +${top.diff} (#${top.prevRank}\u2192#${top.snap.rank})`, url: top.snap.url, timestamp: now, movementType: "top_mover", prevRank: top.prevRank, newRank: top.snap.rank, rankChange: top.diff });
  }
  return signals;
}

function detectLongTermMovements(current: AppSnapshot[], previous: AppSnapshot[], period: "weekly" | "monthly"): any[] {
  const signals: any[] = [], now = new Date().toISOString();
  const emoji = period === "weekly" ? "\u{1F4C5}" : "\u{1F4C6}";
  const label = period === "weekly" ? "Last week" : "Last month";
  const prevMap = new Map<string, AppSnapshot>();
  for (const s of previous) prevMap.set(`${s.source}:${s.category}:${s.app_id}`, s);
  for (const snap of current) {
    const prev = prevMap.get(`${snap.source}:${snap.category}:${snap.app_id}`);
    if (!prev) continue;
    const d = prev.rank - snap.rank;
    if (Math.abs(d) < 5) continue;
    const lbl = snap.source === "appstore" ? "App Store" : "Google Play";
    signals.push({ source: snap.source, sourceLabel: lbl, emoji, title: snap.app_name, subtitle: `${label} #${prev.rank}\u2192#${snap.rank}`, signal: `${label} #${prev.rank}\u2192#${snap.rank} (${d > 0 ? "\u25B2" : "\u25BC"}${Math.abs(d)})`, url: snap.url, timestamp: now, movementType: period === "weekly" ? "weekly_mover" : "monthly_mover", prevRank: prev.rank, newRank: snap.rank, rankChange: d });
  }
  return signals.sort((a, b) => Math.abs(b.rankChange) - Math.abs(a.rankChange)).slice(0, 10);
}

function generateFallbackSignals(snapshots: AppSnapshot[]): any[] {
  const now = new Date().toISOString();
  const byCat = new Map<string, AppSnapshot[]>();
  for (const s of snapshots) { const k = `${s.source}:${s.category}`; if (!byCat.has(k)) byCat.set(k, []); byCat.get(k)!.push(s); }
  const signals: any[] = [];
  for (const [key, apps] of byCat) {
    const src = key.split(":")[0], cat = key.split(":").slice(1).join(":"), lbl = src === "appstore" ? "App Store" : "Google Play";
    for (const app of apps.slice(0, 3)) {
      const r = app.rating ? ` \u2022 ${app.rating.toFixed(1)}\u2605` : "";
      signals.push({ source: src, sourceLabel: lbl, emoji: "\u{1F4F1}", title: app.app_name, subtitle: `#${app.rank} in ${cat}${r}`, signal: `#${app.rank} in ${lbl} ${cat}${r}`, url: app.url, timestamp: now, movementType: "trending", newRank: app.rank, rating: app.rating ?? undefined, reviewCount: app.review_count ?? undefined });
    }
  }
  return signals;
}
