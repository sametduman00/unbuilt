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

  const results = await Promise.allSettled([

    // Serper (Google Search)
    fetch("https://google.serper.dev/account", {
      headers: { "X-API-KEY": process.env.SERPER_API_KEY ?? "" },
      signal: AbortSignal.timeout(5000),
    }).then(r => r.json()).then(d => ({
      name: "Serper",
      subtitle: "Google Search API",
      icon: "🔍",
      used: d.billingInfo?.creditsUsed ?? null,
      remaining: d.billingInfo?.creditsLeft ?? null,
      limit: d.billingInfo?.creditsIncluded ?? null,
      resetInfo: "Monthly reset",
      dashboardUrl: "https://serper.dev/dashboard",
      live: true,
    })),

    // ScrapeCreators (Reddit + X/Twitter)
    fetch("https://api.scrapecreators.com/v1/user/info", {
      headers: { "x-api-key": process.env.SCRAPECREATORS_API_KEY ?? "" },
      signal: AbortSignal.timeout(5000),
    }).then(r => r.json()).then(d => ({
      name: "ScrapeCreators",
      subtitle: "Reddit + X/Twitter",
      icon: "🕷️",
      used: d.usage?.used ?? null,
      remaining: d.credits ?? d.remaining ?? d.quota?.remaining ?? null,
      limit: d.usage?.limit ?? null,
      resetInfo: "Monthly reset",
      dashboardUrl: "https://scrapecreators.com/dashboard",
      live: true,
    })),

  ]);

  const liveApis = results.map((r, i) => {
    const base = i === 0
      ? { name: "Serper", subtitle: "Google Search API", icon: "🔍", dashboardUrl: "https://serper.dev/dashboard", resetInfo: "Monthly reset" }
      : { name: "ScrapeCreators", subtitle: "Reddit + X/Twitter", icon: "🕷️", dashboardUrl: "https://scrapecreators.com/dashboard", resetInfo: "Monthly reset" };
    if (r.status === "fulfilled") return r.value;
    return { ...base, used: null, remaining: null, limit: null, live: true, error: true };
  });

  const manualApis = [
    {
      name: "YouTube Data API",
      subtitle: "Video search & metadata",
      icon: "▶️",
      limit: 10000,
      resetInfo: "Daily at midnight PT",
      dashboardUrl: "https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas",
      note: "Units/day",
      live: false,
    },
    {
      name: "Anthropic",
      subtitle: "Claude AI models",
      icon: "🤖",
      limit: null,
      resetInfo: "Pay-per-use",
      dashboardUrl: "https://console.anthropic.com/workspaces/default/cost",
      note: "See Console for live costs",
      live: false,
    },
    {
      name: "ProductHunt",
      subtitle: "Launch & product data",
      icon: "🐱",
      limit: null,
      resetInfo: "Token-based",
      dashboardUrl: "https://www.producthunt.com/v2/oauth/applications",
      note: "No hard limit",
      live: false,
    },
  ];

  return NextResponse.json({ liveApis, manualApis }, { headers: CORS });
}
