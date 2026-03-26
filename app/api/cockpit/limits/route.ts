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

  // Fetch Serper account info - debug raw response
  let serperRaw: any = null;
  let serperErr: string | null = null;
  try {
    const r = await fetch("https://google.serper.dev/account", {
      headers: { "X-API-KEY": process.env.SERPER_API_KEY ?? "" },
      signal: AbortSignal.timeout(5000),
    });
    serperRaw = await r.json();
  } catch (e) {
    serperErr = e instanceof Error ? e.message : "error";
  }

  // Fetch ScrapeCreators - try multiple endpoints
  let scRaw: any = null;
  let scErr: string | null = null;
  try {
    const r = await fetch("https://api.scrapecreators.com/v1/user/info", {
      headers: { "x-api-key": process.env.SCRAPECREATORS_API_KEY ?? "" },
      signal: AbortSignal.timeout(5000),
    });
    scRaw = await r.json();
  } catch (e) {
    // Try alternative endpoint
    try {
      const r2 = await fetch("https://api.scrapecreators.com/v1/account", {
        headers: { "x-api-key": process.env.SCRAPECREATORS_API_KEY ?? "" },
        signal: AbortSignal.timeout(5000),
      });
      scRaw = await r2.json();
    } catch (e2) {
      scErr = e2 instanceof Error ? e2.message : "error";
    }
  }

  // Parse Serper - check all possible field structures
  const serperData = serperRaw ? {
    name: "Serper",
    subtitle: "Google Search API",
    icon: "🔍",
    dashboardUrl: "https://serper.dev/dashboard",
    resetInfo: "Monthly reset",
    live: true,
    // Try all known field names
    remaining: serperRaw.credits ?? serperRaw.creditsLeft ?? serperRaw.credits_left ?? 
               serperRaw.billingInfo?.creditsLeft ?? serperRaw.remaining ?? 
               serperRaw.balance ?? serperRaw.queries_left ?? null,
    used: serperRaw.creditsUsed ?? serperRaw.credits_used ?? 
          serperRaw.billingInfo?.creditsUsed ?? serperRaw.used ?? null,
    limit: serperRaw.creditsTotal ?? serperRaw.credits_total ?? 
           serperRaw.billingInfo?.creditsIncluded ?? serperRaw.limit ?? 
           serperRaw.plan_queries_limit ?? null,
    _raw: serperRaw, // debug
  } : { name: "Serper", subtitle: "Google Search API", icon: "🔍", dashboardUrl: "https://serper.dev/dashboard", resetInfo: "Monthly reset", live: true, remaining: null, used: null, limit: null, error: serperErr ?? "No response" };

  // Parse ScrapeCreators
  const scData = scRaw ? {
    name: "ScrapeCreators",
    subtitle: "Reddit + X/Twitter",
    icon: "🕷️",
    dashboardUrl: "https://scrapecreators.com/dashboard",
    resetInfo: "Monthly reset",
    live: true,
    remaining: scRaw.credits ?? scRaw.creditsLeft ?? scRaw.credits_left ?? 
               scRaw.remaining ?? scRaw.balance ?? scRaw.queries_left ?? 
               scRaw.data?.credits ?? null,
    used: scRaw.creditsUsed ?? scRaw.credits_used ?? scRaw.used ?? scRaw.data?.used ?? null,
    limit: scRaw.creditsTotal ?? scRaw.credits_total ?? scRaw.limit ?? scRaw.data?.limit ?? null,
    _raw: scRaw, // debug
  } : { name: "ScrapeCreators", subtitle: "Reddit + X/Twitter", icon: "🕷️", dashboardUrl: "https://scrapecreators.com/dashboard", resetInfo: "Monthly reset", live: true, remaining: null, used: null, limit: null, error: scErr ?? "No response" };

  const manualApis = [
    { name: "YouTube Data API", subtitle: "Video search & metadata", icon: "▶️", limit: 10000, resetInfo: "Daily at midnight PT", dashboardUrl: "https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas", note: "Units/day", live: false },
    { name: "Anthropic", subtitle: "Claude AI models", icon: "🤖", limit: null, resetInfo: "Pay-per-use", dashboardUrl: "https://console.anthropic.com/workspaces/default/cost", note: "See Console for live costs", live: false },
    { name: "ProductHunt", subtitle: "Launch & product data", icon: "🐱", limit: null, resetInfo: "Token-based", dashboardUrl: "https://www.producthunt.com/v2/oauth/applications", note: "No hard limit", live: false },
  ];

  return NextResponse.json({ liveApis: [serperData, scData], manualApis }, { headers: CORS });
}
