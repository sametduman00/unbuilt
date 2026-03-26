import { NextRequest, NextResponse } from "next/server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "x-cockpit-key, content-type",
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}

const BASE = "https://www.unbuilt.me";

// Tests: [name, url, method, expectedStatus, note]
const CHECKS: { name: string; url: string; method: string; expect: number; note?: string }[] = [
  { name: "Homepage",      url: `${BASE}/`,               method: "GET",  expect: 200 },
  { name: "Pulse API",     url: `${BASE}/api/pulse`,      method: "GET",  expect: 200 },
  { name: "Pricing page",  url: `${BASE}/pricing`,        method: "GET",  expect: 200 },
  { name: "How it works",  url: `${BASE}/how-it-works`,   method: "GET",  expect: 200 },
  { name: "Credits API",   url: `${BASE}/api/credits`,    method: "GET",  expect: 401 },
  { name: "Reports API",   url: `${BASE}/api/reports`,    method: "GET",  expect: 401 },
  // Analyze/Stack: POST-only so GET returns 405 — but we also test POST with bad body = 401/400 (means endpoint is alive)
  { name: "Analyze API",   url: `${BASE}/api/analyze`,    method: "POST", expect: 401, note: "POST without auth → 401 means alive" },
  { name: "Stack API",     url: `${BASE}/api/stack`,      method: "POST", expect: 401, note: "POST without auth → 401 means alive" },
  // Anthropic reachability
  { name: "Anthropic",     url: "https://api.anthropic.com/v1/models", method: "GET", expect: 401, note: "401 = reachable" },
];

export async function GET(req: NextRequest) {
  const key = req.headers.get("x-cockpit-key");
  if (!key || key !== process.env.COCKPIT_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS });
  }

  const results = await Promise.all(
    CHECKS.map(async (ep) => {
      const start = Date.now();
      try {
        const res = await fetch(ep.url, {
          method: ep.method,
          signal: AbortSignal.timeout(6000),
          redirect: "follow",
          headers: ep.method === "POST" ? { "Content-Type": "application/json" } : {},
          body: ep.method === "POST" ? JSON.stringify({}) : undefined,
        });
        const latency = Date.now() - start;
        const ok = res.status === ep.expect || (ep.expect === 200 && res.ok);
        if (!ok) {
          const token = process.env.TELEGRAM_BOT_TOKEN;
          const chatId = process.env.TELEGRAM_CHAT_ID;
          if (token && chatId) fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: `🚨 <b>Health alert!</b>\n${ep.name} returned HTTP ${res.status} (expected ${ep.expect})`, parse_mode: "HTML" }),
          }).catch(() => {});
        }
        return { name: ep.name, status: res.status, expected: ep.expect, ok, latency, note: ep.note ?? null, error: null };
      } catch (e) {
        const latency = Date.now() - start;
        const error = e instanceof Error ? e.message : "Timeout";
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (token && chatId) fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: `🚨 <b>Health alert!</b>\n${ep.name} is DOWN\n${error}`, parse_mode: "HTML" }),
        }).catch(() => {});
        return { name: ep.name, status: 0, expected: ep.expect, ok: false, latency, note: ep.note ?? null, error };
      }
    })
  );

  return NextResponse.json({ checks: results, allOk: results.every(r => r.ok), timestamp: new Date().toISOString() }, { headers: CORS });
}
