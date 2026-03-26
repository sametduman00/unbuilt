import { NextRequest, NextResponse } from "next/server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "x-cockpit-key, content-type",
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
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
      limit: null, // no hard limit, just balance
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

  const manualApis = [
    { name: "YouTube Data API", subtitle: "Video search & metadata", icon: "▶️", limit: 10000, resetInfo: "Daily at midnight PT", dashboardUrl: "https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas", note: "Units/day", live: false },
    { name: "Anthropic", subtitle: "Claude AI models", icon: "🤖", limit: null, resetInfo: "Pay-per-use", dashboardUrl: "https://console.anthropic.com/workspaces/default/cost", note: "See Console for live costs", live: false },
    { name: "ProductHunt", subtitle: "Launch & product data", icon: "🐱", limit: null, resetInfo: "Token-based", dashboardUrl: "https://www.producthunt.com/v2/oauth/applications", note: "No hard limit", live: false },
  ];

  return NextResponse.json({ liveApis: [serperData, scData], manualApis }, { headers: CORS });
}
