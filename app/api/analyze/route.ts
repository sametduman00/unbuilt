import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import gplay from "google-play-scraper";
import { getCached, setCached, TTL_MS } from "../_cache";
import { normalizeQuery } from "../_normalize";
import { auth } from "@clerk/nextjs/server";
import { deductCredit } from "@/app/lib/credits";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a sharp, experienced market analyst and startup advisor. You produce concise, highly actionable competitor analysis and market gap reports. Your tone is direct, insightful, and slightly contrarian â you cut through hype. IMPORTANT: You MUST respond with ONLY a single JSON code block. No text before or after. The JSON must match the exact schema provided. Be specific: name real competitors, real products, real pain points.`;

const USER_PROMPT = (idea: string, youtubeContext: string, appStoreContext: string, serperContext: string) => `Analyze the market for: "${idea}"
${youtubeContext}
${appStoreContext}
${serperContext}
Respond with ONLY a JSON code block matching this exact schema:
\`\`\`json
{
  "appStoreQuery": "photo calorie recognition",
  "marketScore": 72,
  "marketScoreLabel": "Real Opportunity",
  "marketScoreSummary": "One sentence summary of the overall market opportunity level",
  "competitors": [
    {
      "name": "Competitor Name",
      "tagline": "What they do in one line",
      "threatLevel": 3,
      "strengths": ["Strength 1", "Strength 2"],
      "weaknesses": ["Weakness 1", "Weakness 2"]
    }
  ],
  "painPoints": [
    {
      "quote": "The actual complaint or pain description users have",
      "source": "Where this sentiment comes from (Reddit, G2, Twitter, etc)",
      "severity": "high"
    }
  ],
  "marketGaps": [
    {
      "title": "Gap Name",
      "description": "What's missing and why it matters â be specific",
      "opportunityScore": 8,
      "status": "untapped"
    }
  ],
  "swot": {
    "strengths": ["Advantage 1", "Advantage 2", "Advantage 3"],
    "weaknesses": ["Challenge 1", "Challenge 2", "Challenge 3"],
    "opportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"],
    "threats": ["Threat 1", "Threat 2", "Threat 3"]
  },
  "opportunity": {
    "headline": "One bold sentence describing the core opportunity",
    "urgency": "high",
    "actionItems": [
      { "step": 1, "action": "Action title", "detail": "Brief explanation" },
      { "step": 2, "action": "Action title", "detail": "Brief explanation" },
      { "step": 3, "action": "Action title", "detail": "Brief explanation" }
    ]
  },
  "targetCustomer": {
    "persona": "The Frustrated [Role]",
    "jobTitle": "Specific job title or role",
    "demographics": "Age range, company size, industry",
    "painPoints": ["Pain 1", "Pain 2", "Pain 3"],
    "currentTools": ["Tool they currently use 1", "Tool 2"],
    "willingnessToPay": "What they'd pay and why"
  }
}
\`\`\`
Rules:
- "appStoreQuery": 2-3 specific words to find direct competitors for this EXACT idea on the App Store. Not the generic category â the specific niche. E.g. for "app that calculates calories by pictures" use "photo calorie recognition", not "calorie tracker".
- "marketScore": 1-100 integer assessing overall market opportunity. "marketScoreLabel": one of "No Gap" (0-20), "Crowded" (21-40), "Some Room" (41-60), "Real Opportunity" (61-80), "Wide Open" (81-100). "marketScoreSummary": one sentence explaining the score.
- "competitors": 4-6 real companies. Prioritize competitors found in the LIVE APP STORE DATA provided above â use their real names, ratings, and download counts. "threatLevel": 1-5 integer (1=minor, 5=dominant). "tagline": max 1 sentence. "strengths": exactly 1 item. "weaknesses": exactly 1 item. Keep each under 12 words.
- "painPoints": 4-6 items. "severity": "high" | "medium" | "low". Keep the full quote â never truncate. "source" should be a real platform name.
- "marketGaps": 3-5 items. "opportunityScore": 1-10 integer. "status": "untapped" | "emerging" | "contested". "description": max 2 complete sentences.
- "swot": 3-4 bullet points per quadrant. Max 10 words per bullet point. Frame from the perspective of a NEW entrant in this market.
- "opportunity": 3-4 actionItems. "urgency": "high" | "medium" | "low". "detail": max 2 sentences per step.
- "targetCustomer": be specific and concrete, not generic. Keep "willingnessToPay" to 1 sentence.
- Be brutally honest. Name real companies and real products. Skip generic advice.
- CONCISENESS IS CRITICAL. Every string value should be as short as possible while retaining key information. No filler words.`;

// Fetch real App Store results via iTunes Search API (free, no key needed)
async function fetchAppStoreContext(query: string): Promise<string> {
  try {
    const params = new URLSearchParams({
      term: query,
      entity: "software",
      limit: "8",
      country: "us",
    });
    const res = await fetch(
      `https://itunes.apple.com/search?${params}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return "";
    const data = await res.json();
    const results = data.results ?? [];
    if (results.length === 0) return "";

    const lines = results.slice(0, 6).map((app: {
      trackName: string;
      sellerName: string;
      averageUserRating?: number;
      userRatingCount?: number;
      price?: number;
      formattedPrice?: string;
      description?: string;
    }) => {
      const rating = app.averageUserRating ? app.averageUserRating.toFixed(1) : "N/A";
      const reviews = app.userRatingCount
        ? app.userRatingCount >= 1000
          ? `${Math.round(app.userRatingCount / 1000)}K reviews`
          : `${app.userRatingCount} reviews`
        : "no reviews";
      const price = app.price === 0 ? "Free" : (app.formattedPrice || "Paid");
      const desc = (app.description || "").slice(0, 120).replace(/\n/g, " ");
      return `- "${app.trackName}" by ${app.sellerName} | ${rating}â­ ${reviews} | ${price} | ${desc}`;
    });

    console.log("[Analyze] App Store context:", lines.length, "apps found for query:", query);
    return `\nHere are REAL App Store apps currently live in this space (fetched right now from iTunes Search API). Use these as your primary competitor sources â these are real products with real ratings:\n${lines.join("\n")}\n`;
  } catch (err) {
    console.log("[Analyze] App Store context fetch failed:", err);
    return "";
  }
}

// Fetch real Google Play results
async function fetchGPlayContext(query: string): Promise<string> {
  try {
    const results = await gplay.search({ term: query, num: 6 });
    if (!results || results.length === 0) return "";

    const lines = results.slice(0, 5).map((app) => {
      const rating = app.score ? app.score.toFixed(1) : "N/A";
      const price = app.free ? "Free" : (app.priceText || "Paid");
      const desc = (app.summary || "").slice(0, 100).replace(/\n/g, " ");
      return `- "${app.title}" by ${app.developer} | ${rating}â­ | ${price} | ${desc}`;
    });

    console.log("[Analyze] Google Play context:", lines.length, "apps found for query:", query);
    return `\nHere are REAL Google Play apps currently live in this space:\n${lines.join("\n")}\n`;
  } catch (err) {
    console.log("[Analyze] Google Play context fetch failed:", err);
    return "";
  }
}

// Fetch live Google Search results via Serper â closes Claude's training data gap
async function fetchSerperContext(idea: string): Promise<string> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return "";
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ q: idea + " app software tool", num: 8, hl: "en", gl: "us" }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return "";
    const data = await res.json();

    const organic = data.organic ?? [];
    if (organic.length === 0) return "";

    const lines = organic.slice(0, 6).map((r: { title: string; link: string; snippet?: string }) => {
      const snippet = (r.snippet || "").slice(0, 120).replace(/\n/g, " ");
      return `- "${r.title}" (${r.link}) â ${snippet}`;
    });

    // Related searches as signals
    const related = (data.relatedSearches ?? []).slice(0, 4).map((r: { query: string }) => r.query);

    console.log("[Analyze] Serper context:", lines.length, "results for:", idea);
    return `\nHere are LIVE Google search results for this idea right now (use these to identify new competitors, products, and trends that may have emerged after your training cutoff):\n${lines.join("\n")}${related.length ? `\nPeople also search: ${related.join(", ")}` : ""}\n`;
  } catch (err) {
    console.log("[Analyze] Serper context fetch failed:", err);
    return "";
  }
}


// Fetch top YouTube videos for the idea to give Claude real-time context
async function fetchYouTubeContext(idea: string): Promise<string> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return "";
  try {
    const publishedAfter = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
    const searchParams = new URLSearchParams({
      part: "snippet",
      type: "video",
      order: "viewCount",
      q: `${idea} app startup OR "we built" OR "why doesn't" OR "I need" OR launching`,
      maxResults: "5",
      publishedAfter,
      key: apiKey,
    });
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${searchParams}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!searchRes.ok) return "";
    const searchData = await searchRes.json();
    const items = searchData.items ?? [];
    if (items.length === 0) return "";

    const videoIds = items.map((item: { id: { videoId: string } }) => item.id.videoId).join(",");
    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${apiKey}`,
      { signal: AbortSignal.timeout(5000) }
    );
    const statsMap = new Map<string, number>();
    if (statsRes.ok) {
      const statsData = await statsRes.json();
      for (const v of statsData.items ?? []) {
        statsMap.set(v.id, parseInt(v.statistics?.viewCount || "0", 10));
      }
    }
    const lines = items.map((item: { id: { videoId: string }; snippet: { title: string; channelTitle: string } }) => {
      const views = statsMap.get(item.id.videoId) ?? 0;
      const fmtViews =
        views >= 1_000_000 ? `${(views / 1_000_000).toFixed(1)}M` :
        views >= 1_000 ? `${Math.round(views / 1_000)}K` : String(views);
      return `- "${item.snippet.title}" by ${item.snippet.channelTitle} (${fmtViews} views)`;
    });
    console.log("[Analyze] YouTube context:", lines.length, "videos found");
    return `\nHere are recent YouTube videos in this space (new product launches, founder stories, user frustrations, problem callouts) â use these to identify real pain points and emerging signals:\n${lines.join("\n")}\n`;
  } catch (err) {
    console.log("[Analyze] YouTube context fetch failed:", err);
    return "";
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  const hasCredits = await deductCredit(userId);
  if (!hasCredits) return new Response(JSON.stringify({ error: "No credits remaining" }), { status: 402, headers: { "Content-Type": "application/json" } });
  const { idea } = await req.json();
  if (!idea || typeof idea !== "string" || idea.trim().length < 3)
    return Response.json({ error: "Please provide a valid idea (min 3 characters)." }, { status: 400 });
  if (idea.length > 500)
    return Response.json({ error: "Idea is too long (max 500 characters)." }, { status: 400 });

  const normalizedKey = await normalizeQuery(idea);
  const cached = getCached(normalizedKey, TTL_MS.analyze);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ meta: { cached: !!cached, key: normalizedKey } })}\n\n`)
      );

      if (cached) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: cached })}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
        return;
      }

      try {
        // Fetch all live data sources in parallel
        const [youtubeContext, appStoreContext, gplayContext, serperContext] = await Promise.all([
          fetchYouTubeContext(idea),
          fetchAppStoreContext(idea),
          fetchGPlayContext(idea),
          fetchSerperContext(idea),
        ]);

        const combinedAppContext = [appStoreContext, gplayContext].filter(Boolean).join("");

        let full = "";
        const anthropicStream = client.messages.stream({
          model: "claude-opus-4-6",
          max_tokens: 16000,
          thinking: { type: "enabled", budget_tokens: 10000 },
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: USER_PROMPT(idea, youtubeContext, combinedAppContext, serperContext) }],
        });

        for await (const event of anthropicStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            full += event.delta.text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
          }
        }

        if (full) setCached(normalizedKey, full);
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
