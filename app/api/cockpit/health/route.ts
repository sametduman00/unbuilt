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
const CHECKS = [
  { name: "Homepage",     url: `${BASE}/`,             expect: 200 },
  { name: "Pulse API",    url: `${BASE}/api/pulse`,    expect: 200 },
  { name: "Pricing",      url: `${BASE}/pricing`,      expect: 200 },
  { name: "How it works", url: `${BASE}/how-it-works`, expect: 200 },
  { name: "Analyze API",  url: `${BASE}/api/analyze`,  expect: 405 },
  { name: "Stack API",    url: `${BASE}/api/stack`,    expect: 405 },
  { name: "Credits API",  url: `${BASE}/api/credits`,  expect: 401 },
  { name: "Reports API",  url: `${BASE}/api/reports`,  expect: 401 },
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
        const res = await fetch(ep.url, { method:"GET", signal:AbortSignal.timeout(6000), redirect:"follow" });
        const latency = Date.now()-start;
        const ok = res.status===ep.expect||(ep.expect===200&&res.ok);
        if (!ok) {
          const token = process.env.TELEGRAM_BOT_TOKEN;
          const chatId = process.env.TELEGRAM_CHAT_ID;
          if (token && chatId) fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ chat_id:chatId, text:`🚨 <b>Health alert!</b>\n${ep.name} returned HTTP ${res.status}`, parse_mode:"HTML" }) }).catch(()=>{});
        }
        return { name:ep.name, status:res.status, expected:ep.expect, ok, latency, error:null };
      } catch(e) {
        const latency = Date.now()-start;
        const error = e instanceof Error?e.message:"Timeout";
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (token && chatId) fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ chat_id:chatId, text:`🚨 <b>Health alert!</b>\n${ep.name} DOWN\n${error}`, parse_mode:"HTML" }) }).catch(()=>{});
        return { name:ep.name, status:0, expected:ep.expect, ok:false, latency, error };
      }
    })
  );

  return NextResponse.json({ checks:results, allOk:results.every(r=>r.ok), timestamp:new Date().toISOString() }, { headers: CORS });
}
