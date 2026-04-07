import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";

function getVoteCount(s: any): number {
  if (s.votesCount && s.votesCount > 0) return s.votesCount;
  const m = s.subtitle?.match(/^(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const FETCH_HEADERS = { "User-Agent": "Mozilla/5.0" };

    // Fetch Product Hunt products from last 24h
    const freshPHSignals = await fetchProductHuntLast24h(FETCH_HEADERS);
    console.log(`[CRON] PH fresh: ${freshPHSignals.length}`);

    const sb = getSupabase();

    // Load existing analyses
    const freshUrls = freshPHSignals.map((s: any) => s.url).filter(Boolean);
    let analysisMap = new Map<string, { what: string; different: string; missing: string }>();
    if (freshUrls.length > 0) {
      const { data: existing } = await sb.from("ph_analyses").select("product_url, what, different, missing").in("product_url", freshUrls);
      for (const a of existing ?? []) analysisMap.set(a.product_url, a);
    }
    console.log(`[CRON] Analyses loaded: ${analysisMap.size}/${freshUrls.length}`);

    // Load previous cache for frozen products
    const { data: prevCache } = await sb.from("pulse_feed_cache").select("signals").order("generated_at", { ascending: false }).limit(1).single();
    const prevPHByTitle = new Map<string, any>();
    if (prevCache?.signals) {
      for (const s of prevCache.signals as any[]) {
        if (s.source === "producthunt") prevPHByTitle.set(s.title?.trim(), s);
      }
    }
    const freshTitles = new Set(freshPHSignals.map((s: any) => s.title?.trim()));

    // Build live signals with existing analyses
    const mergedLivePH = freshPHSignals.map((s: any) => {
      const a = analysisMap.get(s.url);
      const claudeGap = a ? `${a.what} \u2726 Different: ${a.different} \u2726 Missing: ${a.missing}` : undefined;
      return { ...s, isLive: true, claudeGap };
    });
    const frozenPH = Array.from(prevPHByTitle.values())
      .filter((s: any) => !freshTitles.has(s.title?.trim()))
      .map((s: any) => ({ ...s, isLive: false }));

    const sortedLivePH = [...mergedLivePH].sort((a, b) => getVoteCount(b) - getVoteCount(a));
    const sortedFrozenPH = [...frozenPH].sort((a, b) => getVoteCount(b) - getVoteCount(a));
    const allPHSignals = [...sortedLivePH, ...sortedFrozenPH];

    // Save cache
    const { error: cacheErr } = await sb.from("pulse_feed_cache").insert({
      signals: allPHSignals,
      has_movement_data: false,
      sources: { productHunt: allPHSignals.length, productHuntLive: mergedLivePH.length, productHuntFrozen: frozenPH.length },
      generated_at: new Date().toISOString(),
    });
    if (cacheErr) console.log("[CRON] cache insert error:", cacheErr.message);
    else console.log(`[CRON] Cache saved: ${allPHSignals.length} PH signals`);

    // Cleanup old cache (keep 48h)
    await sb.from("pulse_feed_cache").delete().lt("generated_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

    // Analyze NEW products (max 20 per run)
    const needsAnalysis = freshPHSignals.filter((s: any) => s.url && !analysisMap.has(s.url)).slice(0, 20);
    if (needsAnalysis.length > 0) {
      console.log(`[CRON] Analyzing ${needsAnalysis.length} new products...`);
      const newAnalyses = await analyzeProducts(needsAnalysis);
      if (newAnalyses.length > 0) {
        const rows = newAnalyses.map((a: any) => {
          const sig = needsAnalysis.find((s: any) => s.title?.trim().toLowerCase() === a.name?.trim().toLowerCase());
          return { product_url: sig?.url ?? "", product_name: a.name, what: a.what, different: a.different, missing: a.missing };
        }).filter((r: any) => r.product_url);
        if (rows.length > 0) await sb.from("ph_analyses").upsert(rows, { onConflict: "product_url" });
        console.log(`[CRON] Analyzed ${newAnalyses.length} new products`);
      }
    }

    console.log(`[CRON] DONE: ${allPHSignals.length} PH signals (${mergedLivePH.length} live, ${frozenPH.length} frozen)`);
    return NextResponse.json({ ok: true, phLive: mergedLivePH.length, phFrozen: frozenPH.length });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[CRON] FAILED:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

async function analyzeProducts(signals: any[]): Promise<any[]> {
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const list = signals.map((s: any) => `Product: ${s.title}\nTagline: ${s.tagline || s.signal}\nTopics: ${(s.topics ?? []).join(", ")}`).join("\n\n---\n\n");
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001", max_tokens: 2000,
      messages: [{ role: "user", content: `Analyze each Product Hunt product. For each answer 3 things in English (max 12 words each):\n1. "what": What it does and who it's for\n2. "different": What genuinely differentiates it (not generic "uses AI")\n3. "missing": Most obvious gap or missing feature\n\nReturn ONLY a JSON array, no markdown:\n[{"name":"...","what":"...","different":"...","missing":"..."}]\n\nProducts:\n${list}` }],
    });
    const text = msg.content[0]?.type === "text" ? msg.content[0].text : "";
    const match = text.replace(/\`\`\`json|\n\`\`\`|\`\`\`/g, "").trim().match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch(e) {
    console.log("[CRON ANALYZE] failed:", e instanceof Error ? e.message : e);
    return [];
  }
}

async function fetchProductHuntLast24h(headers: Record<string, string>): Promise<any[]> {
  const token = process.env.PRODUCTHUNT_API_KEY;
  if (!token) return [];
  const postedAfter = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const query = `query($postedAfter: DateTime!, $after: String) { posts(order: NEWEST, first: 50, postedAfter: $postedAfter, after: $after) { pageInfo { hasNextPage endCursor } edges { node { name tagline votesCount url website createdAt thumbnail { url } topics(first: 5) { edges { node { name } } } makers { name } } } } }`;
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
  console.log(`[CRON] PH: ${edges.length} products`);
  return edges.map((e: any) => {
    const n = e.node;
    const votes = n?.votesCount ?? 0;
    const createdAt = n?.createdAt ?? new Date().toISOString();
    const hours = Math.floor((Date.now() - new Date(createdAt).getTime()) / 3_600_000);
    const timeAgo = hours < 1 ? "just now" : `${hours}h ago`;
    const topics = (n?.topics?.edges ?? []).map((t: any) => t.node?.name).filter(Boolean).slice(0, 5);
    return { source: "producthunt", sourceLabel: "Product Hunt", emoji: "\u{1F680}", title: n?.name ?? "", subtitle: `${votes} upvotes \u2014 launched ${timeAgo}`, signal: `${votes} upvotes \u2014 launched ${timeAgo}. ${n?.tagline ?? ""}`, url: n?.url ?? "", timestamp: createdAt, movementType: "ph_trending", imageUrl: n?.thumbnail?.url ?? undefined, topics: topics.length > 0 ? topics : undefined, tagline: n?.tagline ?? undefined, makerName: n?.makers?.[0]?.name ?? undefined, externalUrl: n?.website || n?.url || "", votesCount: votes, isLive: true };
  });
}
