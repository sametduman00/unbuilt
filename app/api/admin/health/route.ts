import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sendTelegram } from "@/app/lib/telegram";

const OWNER_ID = process.env.ADMIN_CLERK_USER_ID;
const BASE = "https://www.unbuilt.me";

const CHECKS = [
  { name: "Homepage",     url: `${BASE}/`,              expect: 200 },
  { name: "Pulse API",    url: `${BASE}/api/pulse`,     expect: 200 },
  { name: "Pricing",      url: `${BASE}/pricing`,       expect: 200 },
  { name: "How it works", url: `${BASE}/how-it-works`,  expect: 200 },
  { name: "Analyze API",  url: `${BASE}/api/analyze`,   expect: 405 },
  { name: "Stack API",    url: `${BASE}/api/stack`,     expect: 405 },
  { name: "Credits API",  url: `${BASE}/api/credits`,   expect: 401 },
  { name: "Reports API",  url: `${BASE}/api/reports`,   expect: 401 },
];

export async function GET() {
  const { userId } = await auth();
  if (!userId || userId !== OWNER_ID) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const results = await Promise.all(
    CHECKS.map(async (ep) => {
      const start = Date.now();
      try {
        const res = await fetch(ep.url, { method: "GET", signal: AbortSignal.timeout(6000), redirect: "follow" });
        const latency = Date.now() - start;
        const ok = res.status === ep.expect || (ep.expect === 200 && res.ok);
        if (!ok) await sendTelegram(`🚨 <b>Health alert!</b>\n${ep.name} returned HTTP ${res.status} (expected ${ep.expect})`);
        return { name: ep.name, status: res.status, expected: ep.expect, ok, latency, error: null };
      } catch (e) {
        const latency = Date.now() - start;
        const error = e instanceof Error ? e.message : "Timeout";
        await sendTelegram(`🚨 <b>Health alert!</b>\n${ep.name} is DOWN\nError: ${error}`);
        return { name: ep.name, status: 0, expected: ep.expect, ok: false, latency, error };
      }
    })
  );

  return NextResponse.json({ checks: results, allOk: results.every(r => r.ok), timestamp: new Date().toISOString() });
}
