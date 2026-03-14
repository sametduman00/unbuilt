import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/* ── Step 1: Generate sub-categories ─────────────────────────── */
async function generateSubCategories(query: string): Promise<string[]> {
  const res = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 400,
    messages: [{
      role: "user",
      content: `Generate 6 sub-categories that are DIRECT sub-niches within the space "${query}". These must be specific market segments a founder could build a product IN, not adjacent industries or tools for the space.

Example: "mobile gaming" → ["hyper-casual mobile games","mobile battle royale games","mobile puzzle games","mobile RPG games","mobile sports games","mobile strategy games"]

Example: "fitness app" → ["strength training tracker","running and cardio app","yoga and flexibility app","nutrition tracking app","HIIT workout app","recovery and sleep app"]

Return ONLY a JSON array of 6 strings, nothing else.`,
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

async function fetchITunes(query: string) {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=software&limit=50`,
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

function filterNewReleases(apps: any[]) {
  const now = Date.now();
  const cutoff = 180 * 24 * 60 * 60 * 1000;
  const withDates = apps.filter(a => a.releaseDate);
  const recent = withDates.filter(a => {
    const released = new Date(a.releaseDate).getTime();
    return now - released <= cutoff;
  });
  console.log("filterNewReleases:", {
    total: apps.length,
    withDates: withDates.length,
    within180Days: recent.length,
    sampleDates: withDates.slice(0, 3).map((a: any) => ({ name: a.name, releaseDate: a.releaseDate })),
  });
  return recent
    .map(a => {
      const daysAgo = Math.floor((now - new Date(a.releaseDate).getTime()) / (24 * 60 * 60 * 1000));
      const sortScore = (a.rating || 0) * Math.log10(Math.max(a.reviewCount || 1, 1));
      return { ...a, daysAgo, sortScore };
    })
    .sort((a, b) => b.sortScore - a.sortScore)
    .slice(0, 5)
    .map(({ sortScore: _, ...rest }) => rest);
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
    const gqlQuery = `query { posts(order: VOTES, first: 20) { edges { node { name tagline votesCount commentsCount url createdAt topics { edges { node { name slug } } } } } } }`;

    console.log("PH: fetching top posts, will filter by query:", query);

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
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);

    // Keep only posts where topics match OR name/tagline matches query keywords
    const filtered = edges.filter((e: any) => {
      const node = e.node;
      if (!node) return false;
      const topicText = (node.topics?.edges ?? [])
        .map((t: any) => `${t.node?.name ?? ""} ${t.node?.slug ?? ""}`)
        .join(" ")
        .toLowerCase();
      const nameTagline = `${node.name ?? ""} ${node.tagline ?? ""}`.toLowerCase();
      return terms.some((t: string) => topicText.includes(t) || nameTagline.includes(t));
    });

    // If nothing matches, return empty — do NOT fall back to unrelated top posts
    if (filtered.length === 0) {
      console.log("PH: no relevant posts found for:", query, "(checked", edges.length, "posts)");
      return [];
    }

    const results = filtered.slice(0, 10).map((e: any) => ({
      name: e.node?.name ?? "",
      tagline: e.node?.tagline ?? "",
      votesCount: e.node?.votesCount ?? 0,
      commentsCount: e.node?.commentsCount ?? 0,
      url: e.node?.url ?? "",
    }));

    console.log("PH:", JSON.stringify({ total: edges.length, matched: filtered.length, results: results.slice(0, 3) }));
    return results;
  } catch (err) {
    console.log("PH: fetch error:", err instanceof Error ? err.message : err);
    return [];
  }
}

/* ── Score & Label calculation ────────────────────────────────── */

function calculateScore(
  appStoreData: any[],
  newReleases: any[],
  phData: any[],
) {
  let score = 30;

  // Market size (existing apps)
  const maxReviews = Math.max(...(appStoreData?.map((a: any) => a.reviewCount || 0) || [0]));
  if (maxReviews > 10000000) score += 15;
  else if (maxReviews > 1000000) score += 10;
  else if (maxReviews > 100000) score += 6;
  else if (maxReviews > 10000) score += 3;

  // Momentum: new releases in last 90 days
  const recentCount = newReleases?.length || 0;
  if (recentCount >= 5) score += 12;
  else if (recentCount >= 3) score += 7;
  else if (recentCount >= 1) score += 3;

  // Quality of new releases (are they rated well?)
  const avgNewRating = newReleases?.length
    ? newReleases.reduce((a: number, b: any) => a + (b.rating || 0), 0) / newReleases.length
    : 0;
  if (avgNewRating > 4.5) score += 8;
  else if (avgNewRating > 4.0) score += 4;

  // Product Hunt innovation signal
  const phTopVotes = Math.max(...(phData?.map((p: any) => p.votesCount) || [0]));
  if (phTopVotes > 500) score += 10;
  else if (phTopVotes > 100) score += 6;
  else if (phTopVotes > 20) score += 3;

  // Gap signal: if new releases exist but low PH votes = underserved
  if (recentCount > 0 && phTopVotes < 20) score += 5;

  return Math.min(92, Math.max(8, Math.round(score)));
}

function calculateLabel(score: number, newReleases: any[], appStoreData: any[], phData: any[]) {
  const maxReviews = Math.max(...(appStoreData?.map((a: any) => a.reviewCount || 0) || [0]));
  const recentCount = newReleases?.length || 0;
  const phTopVotes = Math.max(...(phData?.map((p: any) => p.votesCount) || [0]));

  console.log("calculateLabel:", { score, maxReviews, recentCount, phTopVotes });

  // Large active markets (500K+ reviews) — NEVER Dead Zone or Uncharted
  if (maxReviews > 500000) {
    if (score >= 72) {
      console.log("calculateLabel: 500K+ branch → Explosive");
      return "Explosive";
    }
    if (score >= 58) {
      console.log("calculateLabel: 500K+ branch → Growing");
      return "Growing";
    }
    console.log("calculateLabel: 500K+ branch → Crowded");
    return "Crowded";
  }

  if (score >= 75) return "Explosive";
  if (score >= 60) return "Growing";
  if (score >= 45) return "Warming Up";
  if (score >= 32) {
    if (maxReviews > 10000 && recentCount === 0 && phTopVotes < 20) return "Fading";
    return "Crowded";
  }
  if (maxReviews < 5000 && recentCount === 0 && phTopVotes < 20) return "Dead Zone";
  return "Uncharted";
}

/* ── Step 2: Fetch all data in parallel ──────────────────────── */
async function fetchAllData(query: string, subCategories: string[]) {
  const [itunes, gplay, ph] = await Promise.all([
    fetchITunes(query),
    fetchGooglePlay(query),
    fetchProductHunt(query),
  ]);

  // Extract new releases from iTunes results (already fetched 50)
  const itunesNewReleases = filterNewReleases(itunes);
  const gplayNewReleases = filterNewReleases(gplay);
  const newReleases = [...itunesNewReleases, ...gplayNewReleases]
    .sort((a, b) => {
      const scoreA = (a.rating || 0) * Math.log10(Math.max(a.reviewCount || 1, 1));
      const scoreB = (b.rating || 0) * Math.log10(Math.max(b.reviewCount || 1, 1));
      return scoreB - scoreA;
    })
    .slice(0, 5);

  console.log("New releases:", newReleases.length, "iTunes:", itunesNewReleases.length, "GPlay:", gplayNewReleases.length);
  console.log("PH data:", ph.length, "results. First:", ph.length > 0 ? JSON.stringify(ph[0]) : "none");

  return { itunes, gplay, ph, newReleases, subCategories };
}

/* ── Step 3: Analyze with Claude ─────────────────────────────── */
async function analyzeWithClaude(
  query: string,
  data: Awaited<ReturnType<typeof fetchAllData>>,
  score: number,
  label: string
) {
  const prompt = `You are a market analyst. Analyze this data for the space "${query}" and return ONLY valid JSON (no markdown, no code fences).

Market score: ${score}/100. Label: ${label}.
Use these values as context for your analysis — reference them in your verdict and summary.

## Sub-categories to analyze
${JSON.stringify(data.subCategories, null, 2)}

## NEW RELEASES (last 180 days)
${JSON.stringify(data.newReleases, null, 2)}

## iTunes App Store results for "${query}" (top by reviews)
${JSON.stringify(data.itunes.slice(0, 10), null, 2)}

## Google Play results for "${query}"
${JSON.stringify(data.gplay.slice(0, 10), null, 2)}

## Product Hunt recent top posts
${JSON.stringify(data.ph.slice(0, 10), null, 2)}

RISING SUB-CATEGORIES RULES:
- Derive momentum from new release patterns, app store data, and your training knowledge
- A sub-category is "rising" if new apps are launching in it, or if it's an emerging trend
- A sub-category is "falling" if established apps exist but no new entrants
- A sub-category is "stable" if it has consistent activity
- trendScore should reflect relative opportunity (0-100)

BEST OPPORTUNITY RULES:
- Must be something that NO existing app in the data already does well
- Never suggest a feature that an existing top app could easily add
- "distribution" must be a realistic, specific channel (not "social media marketing")
- Must cite specific numbers from the data to justify "why now"
- "who" must be a specific persona (not "fitness enthusiasts" — instead "remote workers with back pain who sit 8+ hours")

GAP OPPORTUNITY RULES:
- Each gap must be SPECIFIC to this space, not generic business advice
- "evidence" must cite a specific data point (app rating gap, missing feature, new release pattern)
- Never include generic gaps like "better UX" or "AI-powered features" without specific context
- At least one gap must reference an underserved sub-category

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
    newReleases: data.newReleases.length,
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
    const score = calculateScore(allApps, data.newReleases, data.ph);
    const label = calculateLabel(score, data.newReleases, allApps, data.ph);
    console.log("CALCULATED:", { score, label, apps: allApps.length, newReleases: data.newReleases.length });

    // Step 3: Analyze with Claude (score/label pre-calculated)
    const analysis = await analyzeWithClaude(query, data, score, label);

    return NextResponse.json({ query, analysis });
  } catch (err) {
    console.error("trend-feed error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
