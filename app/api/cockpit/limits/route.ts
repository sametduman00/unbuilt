  const upstashData = await getUpstashUsage();
  import { NextRequest, NextResponse } from "next/server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "x-cockpit-key, content-type",
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}

// -- Upstash Redis daily usage --------------------------------------------------
async function getUpstashUsage(): Promise<{ dailyCommands: number; dailyLimit: number; pct: number; ok: boolean }> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return { dailyCommands: 0, dailyLimit: 10000, pct: 0, ok: false };
  try {
    // Upstash REST API: /info returns server stats including daily_commands_count
    const res = await fetch(url + "/info", {
      headers: { Authorization: "Bearer " + token },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return { dailyCommands: 0, dailyLimit: 10000, pct: 0, ok: false };
    const data = await res.json();
    // Parse "# Stats\r\ninstantaneous_ops_per_sec:0\r\n..."
    const raw: string = typeof data.result === "string" ? data.result : JSON.stringify(data.result ?? "");
    const cmdMatch = raw.match(/total_commands_processed:([0-9]+)/);
    const dailyCommands = cmdMatch ? parseInt(cmdMatch[1], 10) : 0;
    // Upstash free plan: 10,000 commands/day
    const dailyLimit = 10000;
    const pct = Math.round((dailyCommands / dailyLimit) * 100);
    return { dailyCommands, dailyLimit, pct, ok: true };
  } catch {
    return { dailyCommands: 0, dailyLimit: 10000, pct: 0, ok: false };
  }
}

export async function GET(req: NextRequest) {
  const key = req.headers.get("x-cockpit-key");
  if (!key || key !== process.env.COCKPIT_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS });
  }

  // Serper: returns { balance, rateLimit }
  let serperData: any = { name: "Serper", subtitle: "Google Search API", icon: "🔍", dashboardUrl: "https://serper.dev/dashboard", resetInfo: "Pay-as-you-go", live: true, remaining: null, used: null, limit: null, error: true };
  try {
    const r = await fetch("https://google.serper.dev/account", {
      headers: { "X-API-KEY": process.env.SERPER_API_KEY ?? "" },
      signal: AbortSignal.timeout(5000),
    });
    const d = await r.json();
    serperData = {
      name: "Serper",
      subtitle: "Google Search API",
      icon: "🔍",
      dashboardUrl: "https://serper.dev/dashboard",
      resetInfo: "Pay-as-you-go credits",
      live: true,
      remaining: d.balance ?? null,
      used: null,
      limit: 2500, // free plan starts with 2500 credits
      note: `Rate limit: ${d.rateLimit ?? "?"} req/s`,
    };
  } catch {}

  // ScrapeCreators — try multiple endpoints
  let scData: any = { name: "ScrapeCreators", subtitle: "Reddit + X/Twitter", icon: "🕷️", dashboardUrl: "https://scrapecreators.com/dashboard", resetInfo: "Monthly reset", live: true, remaining: null, used: null, limit: null, error: true };
  const scEndpoints = [
    "https://api.scrapecreators.com/v1/user",
    "https://api.scrapecreators.com/v1/me",
    "https://api.scrapecreators.com/v1/credits",
    "https://api.scrapecreators.com/v1/usage",
  ];
  for (const url of scEndpoints) {
    try {
      const r = await fetch(url, {
        headers: { "x-api-key": process.env.SCRAPECREATORS_API_KEY ?? "" },
        signal: AbortSignal.timeout(4000),
      });
      if (r.ok) {
        const d = await r.json();
        const remaining = d.credits ?? d.balance ?? d.remaining ?? d.credits_remaining ?? d.queriesLeft ?? null;
        if (remaining !== null) {
          scData = {
            name: "ScrapeCreators",
            subtitle: "Reddit + X/Twitter",
            icon: "🕷️",
            dashboardUrl: "https://scrapecreators.com/dashboard",
            resetInfo: "Monthly reset",
            live: true,
            remaining,
            used: d.used ?? d.credits_used ?? null,
            limit: d.limit ?? d.credits_limit ?? d.total ?? null,
          };
          break;
        }
      }
    } catch {}
  }

  // RapidAPI - Twttr API usage
  let rapidApiData: any = { name: "Twttr API (RapidAPI)", subtitle: "X / Twitter search", icon: "𝕏", dashboardUrl: "https://rapidapi.com/davethebeast/api/twitter241", resetInfo: "Monthly reset", live: true, remaining: null, used: null, limit: null, error: true };
  try {
    const r = await fetch("https://rapidapi.com/api/v1/limits", {
      headers: { "X-RapidAPI-Key": process.env.RAPIDAPI_KEY ?? "", "X-RapidAPI-Host": "twitter241.p.rapidapi.com" },
      signal: AbortSignal.timeout(5000),
    });
    if (r.ok) {
      const d = await r.json();
      rapidApiData = { ...rapidApiData, remaining: d.remaining ?? d.limit_remaining ?? null, used: d.used ?? null, limit: d.limit ?? d.monthly_limit ?? null, error: false };
    }
  } catch {}

  // NOTE: Previously had a fallback that made a REAL Twitter search API call
  // just to read rate-limit headers. This was burning 1 credit per cockpit refresh (every 60s).
  // Now using HEAD request which returns rate-limit headers without consuming credits.
  if (rapidApiData.remaining === null) {
    try {
      const r = await fetch("https://twitter241.p.rapidapi.com/search-v3?type=Top&count=1&query=test", {
        method: "HEAD",
        headers: { "x-rapidapi-key": process.env.RAPIDAPI_KEY ?? "", "x-rapidapi-host": "twitter241.p.rapidapi.com" },
        signal: AbortSignal.timeout(5000),
      });
      const remaining = r.headers.get("x-ratelimit-requests-remaining") ?? r.headers.get("x-rapidapi-ratelimit-requests-remaining");
      const limit = r.headers.get("x-ratelimit-requests-limit") ?? r.headers.get("x-rapidapi-ratelimit-requests-limit");
      if (remaining !== null) {
        rapidApiData = { ...rapidApiData, remaining: parseInt(remaining), limit: limit ? parseInt(limit) : null, error: false };
      }
    } catch {}
  }

  const manualApis = [
    { name: "YouTube Data API", subtitle: "Video search & metadata", icon: "▶️", limit: 10000, resetInfo: "Daily at midnight PT", dashboardUrl: "https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas", note: "Units/day", live: false },
    { name: "Anthropic", subtitle: "Claude AI models", icon: "🤖", limit: null, resetInfo: "Pay-per-use", dashboardUrl: "https://console.anthropic.com/settings/billing", note: "Open billing ↗", live: false },
    { name: "ProductHunt", subtitle: "Launch & product data", icon: "🐱", limit: null, resetInfo: "Token-based", dashboardUrl: "https://www.producthunt.com/v2/oauth/applications", note: "No hard limit", live: false },
  ];

  return NextResponse.json({ liveApis: [serperData, scData, rapidApiData], manualApis, upstash: upstashData }, { headers: CORS });
}
