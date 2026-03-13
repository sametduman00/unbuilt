import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/* ── Google Trends via SerpAPI ─────────────────────────────────── */
async function fetchGoogleTrends(query: string) {
  const key = process.env.SERPAPI_KEY;
  if (!key) return null;

  try {
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google_trends");
    url.searchParams.set("q", query);
    url.searchParams.set("date", "today 3-m");
    url.searchParams.set("api_key", key);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;

    const data = await res.json();
    const timeline: { date: string; value: number }[] = [];
    const points = data.interest_over_time?.timeline_data ?? [];

    // Last ~30 days worth of points (weekly data → last 4-5 points)
    const recent = points.slice(-5);
    for (const pt of recent) {
      timeline.push({
        date: pt.date ?? "",
        value: pt.values?.[0]?.extracted_value ?? 0,
      });
    }

    const allValues = points.map((p: { values?: { extracted_value?: number }[] }) => p.values?.[0]?.extracted_value ?? 0);
    const currentScore = allValues.length > 0 ? allValues[allValues.length - 1] : 0;
    const firstScore = allValues.length > 1 ? allValues[0] : currentScore;
    const trendPercent = firstScore > 0 ? Math.round(((currentScore - firstScore) / firstScore) * 100) : 0;
    const direction: "rising" | "falling" | "stable" =
      trendPercent > 10 ? "rising" : trendPercent < -10 ? "falling" : "stable";

    return { currentScore, trendPercent, direction, timeline };
  } catch {
    return null;
  }
}

/* ── YouTube via YouTube Data API v3 ──────────────────────────── */
async function fetchYouTube(query: string) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return [];

  try {
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    // Search for videos
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("q", query);
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("order", "viewCount");
    searchUrl.searchParams.set("publishedAfter", since);
    searchUrl.searchParams.set("maxResults", "10");
    searchUrl.searchParams.set("key", key);

    const searchRes = await fetch(searchUrl.toString(), { signal: AbortSignal.timeout(10000) });
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();

    const items = searchData.items ?? [];
    if (items.length === 0) return [];

    // Get statistics for each video
    const ids = items.map((i: { id?: { videoId?: string } }) => i.id?.videoId).filter(Boolean).join(",");
    const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    statsUrl.searchParams.set("part", "statistics");
    statsUrl.searchParams.set("id", ids);
    statsUrl.searchParams.set("key", key);

    const statsRes = await fetch(statsUrl.toString(), { signal: AbortSignal.timeout(10000) });
    if (!statsRes.ok) return [];
    const statsData = await statsRes.json();

    const statsMap = new Map<string, { viewCount: number; likeCount: number }>();
    for (const v of statsData.items ?? []) {
      statsMap.set(v.id, {
        viewCount: parseInt(v.statistics?.viewCount ?? "0", 10),
        likeCount: parseInt(v.statistics?.likeCount ?? "0", 10),
      });
    }

    return items.map((item: { id?: { videoId?: string }; snippet?: { title?: string; channelTitle?: string; publishedAt?: string } }) => {
      const videoId = item.id?.videoId ?? "";
      const stats = statsMap.get(videoId) ?? { viewCount: 0, likeCount: 0 };
      return {
        videoId,
        title: item.snippet?.title ?? "",
        channel: item.snippet?.channelTitle ?? "",
        publishedAt: item.snippet?.publishedAt ?? "",
        viewCount: stats.viewCount,
        likeCount: stats.likeCount,
      };
    });
  } catch {
    return [];
  }
}

/* ── Hacker News via Algolia API ──────────────────────────────── */
async function fetchHackerNews(query: string) {
  try {
    const since = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);

    const url = new URL("https://hn.algolia.com/api/v1/search");
    url.searchParams.set("query", query);
    url.searchParams.set("tags", "story");
    url.searchParams.set("numericFilters", `created_at_i>${since}`);
    url.searchParams.set("hitsPerPage", "10");

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.hits ?? []).map((hit: { title?: string; points?: number; num_comments?: number; url?: string; objectID?: string; created_at_i?: number }) => {
      const createdAt = (hit.created_at_i ?? 0) * 1000;
      const daysAgo = Math.floor((Date.now() - createdAt) / (24 * 60 * 60 * 1000));
      return {
        title: hit.title ?? "",
        points: hit.points ?? 0,
        comments: hit.num_comments ?? 0,
        url: hit.url ?? "",
        objectID: hit.objectID ?? "",
        daysAgo,
      };
    });
  } catch {
    return [];
  }
}

/* ── GitHub via GitHub API ─────────────────────────────────────── */
async function fetchGitHub(query: string) {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const token = process.env.GITHUB_TOKEN;

    const url = new URL("https://api.github.com/search/repositories");
    url.searchParams.set("q", `${query} created:>${since}`);
    url.searchParams.set("sort", "stars");
    url.searchParams.set("order", "desc");
    url.searchParams.set("per_page", "10");

    const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url.toString(), { headers, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.items ?? []).map((repo: { name?: string; description?: string; stargazers_count?: number; language?: string; html_url?: string; created_at?: string }) => {
      const createdAt = new Date(repo.created_at ?? "").getTime();
      const daysAgo = Math.floor((Date.now() - createdAt) / (24 * 60 * 60 * 1000));
      return {
        name: repo.name ?? "",
        description: repo.description ?? "",
        stars: repo.stargazers_count ?? 0,
        language: repo.language ?? "",
        url: repo.html_url ?? "",
        daysAgo,
      };
    });
  } catch {
    return [];
  }
}

/* ── Claude Analysis ──────────────────────────────────────────── */
async function analyzeWithClaude(
  query: string,
  trends: Awaited<ReturnType<typeof fetchGoogleTrends>>,
  youtube: Awaited<ReturnType<typeof fetchYouTube>>,
  hn: Awaited<ReturnType<typeof fetchHackerNews>>,
  github: Awaited<ReturnType<typeof fetchGitHub>>,
) {
  const prompt = `You are a market trend analyst. Analyze the following real-time data for the query "${query}" and return a JSON assessment.

## Google Trends (last 3 months)
${trends ? JSON.stringify(trends, null, 2) : "No data available"}

## YouTube Videos (last 90 days, sorted by views)
${JSON.stringify(youtube.map((v: any, i: number) => ({ index: i, ...v })), null, 2)}

## Hacker News Stories (last 30 days)
${JSON.stringify(hn.map((h: any, i: number) => ({ index: i, ...h })), null, 2)}

## GitHub Repositories (created in last 7 days)
${JSON.stringify(github.map((r: any, i: number) => ({ index: i, ...r })), null, 2)}

IMPORTANT — Score calibration rules:
- Score measures OPPORTUNITY for a new entrant, NOT raw activity level.
- High activity in a SATURATED space = LOW score (crowded, hard to compete).
- If GitHub has 8+ new repos this week AND YouTube has 10+ videos → score MUST be ≤70. This signals saturation.
- Spaces like "calorie app", "todo app", "habit tracker" are crowded by definition → score should be 20-45.
- Score 80+ is reserved for genuinely emerging niches with low competition and strong demand signals.
- Score 90+ requires a clear greenfield opportunity with almost no existing solutions.

Return ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "score": <integer 0-100, opportunity score — high activity + high competition = LOW score>,
  "verdict": "<max 12 words, direct assessment>",
  "summary": "<3-4 sentences combining all signals with specific numbers>",
  "googleTrendsInsight": "<1-2 sentences interpreting the Google Trends data>",
  "whatsRising": "<3-5 things gaining traction, one per line starting with '- ', use **bold** for names>",
  "whatsDying": "<2-4 approaches/tools losing steam, one per line starting with '- ', use **bold** for names>",
  "patternToBetOn": "<2-3 sentences: the emerging structural shift that will define this market in 12-18 months. Be specific and contrarian.>",
  "underexploredNiches": "<2-3 specific underserved segments, one per line starting with '- '. Name the customer and their unsolved problem.>",
  "bestOpportunity": "<2-3 sentences: who to build for, what to build, and why now. Be specific.>",
  "youtube": {
    "insight": "<1-2 sentences about YouTube signal>",
    "picks": [{"index": <0-based index>, "reason": "<why this video matters, max 12 words>"}, ...]
  },
  "hn": {
    "insight": "<1-2 sentences about Hacker News activity>",
    "picks": [{"index": <0-based index>, "reason": "<why this post matters, max 12 words>"}, ...]
  },
  "github": {
    "insight": "<1-2 sentences about GitHub activity>",
    "picks": [{"index": <0-based index>, "reason": "<why this repo matters, max 12 words>"}, ...]
  }
}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  // Try to parse JSON — strip code fences if Claude adds them despite instructions
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
    // Fetch all 4 sources in parallel
    const [trends, youtube, hn, github] = await Promise.all([
      fetchGoogleTrends(query),
      fetchYouTube(query),
      fetchHackerNews(query),
      fetchGitHub(query),
    ]);

    // Send all data to Claude for analysis
    const analysis = await analyzeWithClaude(query, trends, youtube, hn, github);

    return NextResponse.json({
      query,
      analysis,
      rawData: {
        trends,
        youtube: youtube.map((v: any, i: number) => ({ index: i, ...v })),
        hn: hn.map((h: any, i: number) => ({ index: i, ...h })),
        github: github.map((r: any, i: number) => ({ index: i, ...r })),
      },
    });
  } catch (err) {
    console.error("trend-feed error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
