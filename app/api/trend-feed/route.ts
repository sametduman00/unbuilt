import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/* ── Step 1: Generate sub-categories ─────────────────────────── */
async function generateSubCategories(query: string): Promise<string[]> {
  const res = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [{
      role: "user",
      content: `For the market space "${query}", generate exactly 6 specific sub-categories that represent distinct segments within this space. These should work for any type of business (B2B SaaS, consumer apps, developer tools, services, hardware, etc.) — do NOT assume mobile apps.

Return ONLY a JSON array of 6 strings, no markdown, no explanation.
Example: ["Sub-category 1", "Sub-category 2", "Sub-category 3", "Sub-category 4", "Sub-category 5", "Sub-category 6"]`,
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
    // Use internal API route since google-play-scraper needs server-side
    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(
      `${base}/api/gplay?q=${encodeURIComponent(query)}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).map((r: any) => ({
      name: r.title ?? "",
      rating: r.score ?? 0,
      reviewCount: r.ratings ?? 0,
      releaseDate: "",
      price: r.price ?? "Free",
    }));
  } catch {
    return [];
  }
}

async function fetchProductHunt(query: string) {
  const token = process.env.PRODUCTHUNT_API_KEY;
  if (!token) return [];
  try {
    const gqlQuery = `query { posts(order: VOTES, first: 10) { edges { node { name tagline votesCount commentsCount url createdAt topics { edges { node { name } } } } } } }`;
    const res = await fetch("https://api.producthunt.com/v2/api/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query: gqlQuery }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const edges = data?.data?.posts?.edges ?? [];
    return edges.map((e: any) => ({
      name: e.node?.name ?? "",
      tagline: e.node?.tagline ?? "",
      votesCount: e.node?.votesCount ?? 0,
      commentsCount: e.node?.commentsCount ?? 0,
      url: e.node?.url ?? "",
    }));
  } catch {
    return [];
  }
}

/* ── Step 2: Fetch all data for sub-categories in parallel ───── */
async function fetchAllData(query: string, subCategories: string[]) {
  // Fetch trends for each sub-category + main query in parallel
  const trendQueries = [query, ...subCategories];
  const trendResults = await Promise.all(trendQueries.map(fetchGoogleTrends));
  const mainTrend = trendResults[0];
  const subTrends = subCategories.map((name, i) => ({
    name,
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
  subCategories: string[],
  data: Awaited<ReturnType<typeof fetchAllData>>
) {
  const prompt = `You are a market analyst. Analyze this data for the space "${query}" and return ONLY valid JSON (no markdown, no code fences).

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

SCORE RULES — YOU MUST FOLLOW THESE:
- Google Trends below 20 AND minimal data across sources: score max 35
- Large markets with well-known incumbents: score 30-55
- Score 80+ ONLY with strong growth signals across multiple sources
- label must match market reality, not just score number
- When score below 30 and data sparse: label must be "Uncharted" or "Dead Zone"
- "Fading": has competitors but search interest declining more than 50%
- "Crowded": many competitors, high competition — NEVER use for score below 30

BEST OPPORTUNITY RULES:
- Must be hyper-specific: exact customer, exact pain point, exact distribution channel
- Never generic advice like "build a platform for X"
- Must name the person, the problem, and how to reach them

Return this exact JSON structure:
{
  "score": <integer 0-100>,
  "label": "<exactly one of: Dead Zone | Uncharted | Fading | Crowded | Warming Up | Growing | Explosive>",
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
- relevantPlatforms: include "appstore" and "googleplay" ONLY if the space is consumer/mobile. Exclude for B2B, SaaS, developer tools, services.
- appStoreWins: max 3 items, ONLY from platforms in relevantPlatforms. Pick the most interesting/dominant apps. If appstore/googleplay not in relevantPlatforms, return empty array [].
- productHuntWins: max 3 items. If no relevant PH posts, return empty array [].
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
  return JSON.parse(cleaned);
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

    // Step 3: Analyze with Claude
    const analysis = await analyzeWithClaude(query, subCategories, data);

    return NextResponse.json({ query, analysis });
  } catch (err) {
    console.error("trend-feed error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
