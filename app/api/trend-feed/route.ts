import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/* ── Step 1: Generate sub-categories ─────────────────────────── */
async function generateSubCategories(query: string): Promise<{ name: string; trendQuery: string }[]> {
  const res = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 600,
    messages: [{
      role: "user",
      content: `Generate 6 sub-categories that are DIRECT sub-niches within the space "${query}". These must be specific market segments a founder could build a product IN, not adjacent industries or tools for the space.

For each sub-category, also provide a SHORT search term (2-3 words max) optimized for Google Trends.

Example: "mobile gaming" →
[{"name":"hyper-casual mobile games","trendQuery":"hyper casual games"},{"name":"mobile battle royale games","trendQuery":"battle royale mobile"},{"name":"mobile puzzle games","trendQuery":"puzzle games"},{"name":"mobile RPG games","trendQuery":"mobile RPG"},{"name":"mobile sports games","trendQuery":"sports games mobile"},{"name":"mobile strategy games","trendQuery":"strategy games"}]

Example: "fitness app" →
[{"name":"strength training tracker","trendQuery":"strength training"},{"name":"running and cardio app","trendQuery":"running app"},{"name":"yoga and flexibility app","trendQuery":"yoga app"},{"name":"nutrition tracking app","trendQuery":"nutrition tracker"},{"name":"HIIT workout app","trendQuery":"HIIT workout"},{"name":"recovery and sleep app","trendQuery":"sleep tracker"}]

Return ONLY a JSON array of 6 objects with "name" and "trendQuery" fields, nothing else.`,
    }],
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(cleaned);
}

/* ── Data fetchers ───────────────────────────────────────────── */

async function fetchGoogleTrends(query: string) {
  const key = process.env.SERPAPI_KEY;
  if (!key) return null;
  try {
    const url = `https://serpapi.com/search.json?engine=google_trends&q=${encodeURIComponent(query)}&date=today%203-m&api_key=${key}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const data = await res.json();
    const points = data.interest_over_time?.timeline_data ?? [];
    const allValues = points.map((p: any) => p.values?.[0]?.extracted_value ?? 0);
    const currentScore = allValues.length > 0 ? allValues[allValues.length - 1] : 0;
    const firstScore = allValues.length > 1 ? allValues[0] : currentScore;
    const trendPercent = firstScore > 0 ? Math.round(((currentScore - firstScore) / firstScore) * 100) : 0;
    const direction = trendPercent > 10 ? "rising" : trendPercent < -10 ? "falling" : "stable";
    return { currentScore, trendPercent, direction };
  } catch {
    return null;
  }
}

async function fetchITunes(query: string) {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=software&limit=10`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).map((r: any) => ({
      name: r.trackName ?? "",
      rating: r.averageUserRating ?? 0,
      reviewCount: r.userRatingCount ?? 0,
      releaseDate: r.releaseDate ?? "",
      price: r.formattedPrice ?? "Free",
    }));
  } catch {
    return [];
  }
}

async function fetchGooglePlay(query: string) {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(
      `${base}/api/gplay?q=${encodeURIComponent(query)}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) {
      console.log("GPlay: error", res.status);
      return [];
    }
    const data = await res.json();
    const results = (data.results ?? []).map((r: any) => ({
      name: r.title ?? "",
      rating: r.score ?? 0,
      reviewCount: r.ratings ?? 0,
      releaseDate: "",
      price: r.price ?? "Free",
    }));
    console.log("GPlay:", results.length, "results for:", query);
    return results;
  } catch (err) {
    console.log("GPlay: fetch error:", err instanceof Error ? err.message : err);
    return [];
  }
}

async function fetchProductHunt(query: string) {
  const token = process.env.PRODUCTHUNT_API_KEY;
  if (!token) {
    console.log("PH: no PRODUCTHUNT_API_KEY configured");
    return [];
  }
  try {
    // Topic slug mapping for better filtering
    const topicMap: Record<string, string> = {
      ai: "artificial-intelligence", fitness: "fitness", health: "health",
      gaming: "gaming", productivity: "productivity", developer: "developer-tools",
      design: "design-tools", marketing: "marketing", fintech: "fintech",
      education: "education", saas: "saas", crypto: "crypto",
      social: "social-media", ecommerce: "e-commerce", analytics: "analytics",
      video: "video", music: "music", travel: "travel",
    };
    const q = query.toLowerCase().trim();
    let topicSlug: string | null = null;
    for (const [key, slug] of Object.entries(topicMap)) {
      if (q.includes(key)) { topicSlug = slug; break; }
    }

    const topicFilter = topicSlug ? `, topic: "${topicSlug}"` : "";
    const gqlQuery = `query { posts(order: VOTES${topicFilter}, first: 20) { edges { node { name tagline votesCount commentsCount url createdAt topics { edges { node { name } } } } } } }`;

    console.log("PH: fetching with topic:", topicSlug ?? "(none)", "for query:", query);

    const res = await fetch("https://api.producthunt.com/v2/api/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query: gqlQuery }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const body = await res.text();
      console.log("PH: error response:", res.status, body.slice(0, 200));
      return [];
    }

    const data = await res.json();
    if (data.errors) {
      console.log("PH: GraphQL errors:", JSON.stringify(data.errors).slice(0, 300));
    }

    const edges = data?.data?.posts?.edges ?? [];

    // If we had a topic filter, use all results. Otherwise filter by query terms.
    const terms = query.toLowerCase().split(/\s+/);
    const filtered = topicSlug
      ? edges
      : edges.filter((e: any) => {
          const text = `${e.node?.name ?? ""} ${e.node?.tagline ?? ""} ${(e.node?.topics?.edges ?? []).map((t: any) => t.node?.name ?? "").join(" ")}`.toLowerCase();
          return terms.some((t: string) => text.includes(t));
        });

    const results = filtered.slice(0, 10).map((e: any) => ({
      name: e.node?.name ?? "",
      tagline: e.node?.tagline ?? "",
      votesCount: e.node?.votesCount ?? 0,
      commentsCount: e.node?.commentsCount ?? 0,
      url: e.node?.url ?? "",
    }));

    console.log("PH RAW:", JSON.stringify({ total: edges.length, filtered: filtered.length, results: results.slice(0, 3) }));
    return results;
  } catch (err) {
    console.log("PH: fetch error:", err instanceof Error ? err.message : err);
    return [];
  }
}

/* ── Score & Label calculation ────────────────────────────────── */

function calculateScore(
  appStoreData: any[],
  trendsData: any,
  phData: any[],
  subCategoryTrends: any[]
) {
  let score = 30;

  // 1. MARKET SIZE (how many people use this?)
  const maxReviews = Math.max(...(appStoreData?.map(a => a.reviewCount || 0) || [0]));
  if (maxReviews > 10000000) score += 15;
  else if (maxReviews > 1000000) score += 10;
  else if (maxReviews > 100000) score += 6;
  else if (maxReviews > 10000) score += 3;

  // 2. MOMENTUM (growing or shrinking?)
  const trendPercent = trendsData?.trendPercent || 0;
  const currentScore = trendsData?.currentScore || 0;
  if (trendPercent > 30) score += 20;
  else if (trendPercent > 10) score += 12;
  else if (trendPercent > 0) score += 6;
  else if (trendPercent < -50) score -= 15;
  else if (trendPercent < -20) score -= 8;
  else if (trendPercent < 0) score -= 3;

  // Bonus if search interest itself is high
  if (currentScore > 60) score += 10;
  else if (currentScore > 30) score += 5;

  // 3. GAP (is there room?)
  const risingSubCats = (subCategoryTrends || [])
    .filter((s: any) => s.direction === "rising" || s.trendPercent > 5).length;
  score += risingSubCats * 4;

  // Product Hunt innovation signal
  const phTopVotes = Math.max(...(phData?.map(p => p.votesCount) || [0]));
  if (phTopVotes > 500) score += 8;
  else if (phTopVotes > 100) score += 4;
  else if (phTopVotes > 20) score += 2;

  // If ALL sub-categories are 0, penalize
  const allSubCatsZero = (subCategoryTrends || []).every((s: any) => s.currentScore === 0);
  if (allSubCatsZero) score -= 10;

  return Math.min(92, Math.max(8, Math.round(score)));
}

function calculateLabel(score: number, trendsData: any, appStoreData: any[]) {
  const maxReviews = Math.max(...(appStoreData?.map(a => a.reviewCount || 0) || [0]));
  const trendPercent = trendsData?.trendPercent || 0;

  // Large active markets (500K+ reviews) can NEVER be Fading or Dead Zone
  if (maxReviews > 500000) {
    if (score >= 72) return "Explosive";
    if (score >= 58) return "Growing";
    return "Crowded";
  }

  if (score >= 75) return "Explosive";
  if (score >= 60) return "Growing";
  if (score >= 45) return "Warming Up";
  if (score >= 32) {
    if (trendPercent < -40) return "Fading";
    return "Crowded";
  }
  if (trendPercent < -50 && maxReviews < 5000) return "Dead Zone";
  return "Uncharted";
}

/* ── Step 2: Fetch all data for sub-categories in parallel ───── */
async function fetchAllData(query: string, subCategories: { name: string; trendQuery: string }[]) {
  // Fetch trends using short trendQuery for each sub-category + main query
  const trendQueries = [query, ...subCategories.map(s => s.trendQuery)];
  const trendResults = await Promise.all(trendQueries.map(fetchGoogleTrends));
  const mainTrend = trendResults[0];
  const subTrends = subCategories.map((sub, i) => ({
    name: sub.name,
    trend: trendResults[i + 1],
  }));

  // Fetch app stores + PH for the main query
  const [itunes, gplay, ph] = await Promise.all([
    fetchITunes(query),
    fetchGooglePlay(query),
    fetchProductHunt(query),
  ]);

  return { mainTrend, subTrends, itunes, gplay, ph };
}

/* ── Step 3: Analyze with Claude ─────────────────────────────── */
async function analyzeWithClaude(
  query: string,
  subCategories: { name: string; trendQuery: string }[],
  data: Awaited<ReturnType<typeof fetchAllData>>,
  score: number,
  label: string
) {
  const prompt = `You are a market analyst. Analyze this data for the space "${query}" and return ONLY valid JSON (no markdown, no code fences).

Market score: ${score}/100. Label: ${label}.
Use these values as context for your analysis — reference them in your verdict and summary.

## Sub-categories and their Google Trends data
${JSON.stringify(data.subTrends.map(s => ({
  name: s.name,
  googleTrends: s.trend ? { currentScore: s.trend.currentScore, trendPercent: s.trend.trendPercent, direction: s.trend.direction } : "No data",
})), null, 2)}

## Main query Google Trends
${data.mainTrend ? JSON.stringify(data.mainTrend, null, 2) : "No data available"}

## iTunes App Store results for "${query}"
${JSON.stringify(data.itunes.slice(0, 10), null, 2)}

## Google Play results for "${query}"
${JSON.stringify(data.gplay.slice(0, 10), null, 2)}

## Product Hunt recent top posts
${JSON.stringify(data.ph.slice(0, 10), null, 2)}

BEST OPPORTUNITY RULES:
- Must be something that NO existing app in the data already does well
- Never suggest a feature that an existing top app could easily add
- "distribution" must be a realistic, specific channel (not "social media marketing")
- Must cite specific numbers from the data to justify "why now"
- "who" must be a specific persona (not "fitness enthusiasts" — instead "remote workers with back pain who sit 8+ hours")

GAP OPPORTUNITY RULES:
- Each gap must be SPECIFIC to this space, not generic business advice
- "evidence" must cite a specific data point (app rating gap, missing feature, trend direction)
- Never include generic gaps like "better UX" or "AI-powered features" without specific context
- At least one gap must reference an underserved sub-category from the trends data

Return this exact JSON structure (do NOT include "score" or "label" fields — they are calculated separately):
{
  "verdict": "<max 12 words, direct assessment>",
  "summary": "<3-4 sentences with specific numbers from the data>",
  "relevantPlatforms": ["appstore", "googleplay", "producthunt"],
  "risingSubcategories": [
    { "name": "<sub-category>", "trendScore": <0-100>, "direction": "rising|falling|stable", "why": "<1 sentence>" }
  ],
  "appStoreWins": [
    { "name": "<app name>", "platform": "appstore|googleplay", "rating": <number>, "reviews": <number>, "why": "<1 sentence why this app matters>" }
  ],
  "productHuntWins": [
    { "name": "<product name>", "votes": <number>, "tagline": "<tagline>", "why": "<1 sentence why this matters>" }
  ],
  "gapOpportunities": [
    { "gap": "<what's missing>", "evidence": "<data-backed reason>", "difficulty": "Easy|Medium|Hard" }
  ],
  "bestOpportunity": {
    "title": "<catchy 5-8 word title>",
    "who": "<exact target customer>",
    "what": "<exact product to build>",
    "why": "<why now, with evidence>",
    "distribution": "<exact channel and strategy>"
  }
}

IMPORTANT:
- Do NOT include "score" or "label" in your JSON output.
- relevantPlatforms: include "appstore" and "googleplay" ONLY if the space is consumer/mobile. Exclude for B2B, SaaS, developer tools, services.
- appStoreWins: max 3 items, ONLY from platforms in relevantPlatforms. Pick the most interesting/dominant apps. If appstore/googleplay not in relevantPlatforms, return empty array [].
- productHuntWins: max 3 items. ALWAYS include productHuntWins if "producthunt" is in relevantPlatforms. Pick the most relevant products from the PH data provided. If no PH data was provided, return empty array [].
- gapOpportunities: minimum 3 items. Based on what users search for but is underbuilt.
- risingSubcategories: include ALL 6 sub-categories with their trend data.
- Even if external data is sparse, produce full analysis using your training knowledge.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const parsed = JSON.parse(cleaned);

  // Inject backend-calculated score and label
  parsed.score = score;
  parsed.label = label;

  console.log("TREND-FEED ANALYSIS:", JSON.stringify({
    score: parsed.score,
    label: parsed.label,
    relevantPlatforms: parsed.relevantPlatforms,
    productHuntWins: parsed.productHuntWins?.length ?? 0,
    appStoreWins: parsed.appStoreWins?.length ?? 0,
    gapOpportunities: parsed.gapOpportunities?.length ?? 0,
    keys: Object.keys(parsed),
  }));
  return parsed;
}

/* ── GET handler ──────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ error: "Query parameter 'q' is required (min 2 chars)." }, { status: 400 });
  }
  if (query.length > 300) {
    return NextResponse.json({ error: "Query too long (max 300 chars)." }, { status: 400 });
  }

  try {
    // Step 1: Generate sub-categories
    const subCategories = await generateSubCategories(query);

    // Step 2: Fetch all data in parallel
    const data = await fetchAllData(query, subCategories);

    // Step 2.5: Calculate score and label from raw data
    const allApps = [...data.itunes, ...data.gplay];
    const subTrendData = data.subTrends.map(s => s.trend).filter(Boolean);
    const score = calculateScore(allApps, data.mainTrend, data.ph, subTrendData);
    const label = calculateLabel(score, data.mainTrend, allApps);
    console.log("CALCULATED:", { score, label, apps: allApps.length, subTrends: subTrendData.length });

    // Step 3: Analyze with Claude (score/label pre-calculated)
    const analysis = await analyzeWithClaude(query, subCategories, data, score, label);

    return NextResponse.json({ query, analysis });
  } catch (err) {
    console.error("trend-feed error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
