import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sendTelegram } from "@/app/lib/telegram";

const OWNER_ID = process.env.ADMIN_CLERK_USER_ID;

const ENDPOINTS = [
  { name: "Pulse feed", url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.unbuilt.me"}/api/pulse` },
  { name: "Credits API", url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.unbuilt.me"}/api/credits` },
];

export async function GET() {
  const { userId } = await auth();
  if (!userId || userId !== OWNER_ID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await Promise.all(
    ENDPOINTS.map(async (ep) => {
      const start = Date.now();
      try {
        const res = await fetch(ep.url, { method: "GET", signal: AbortSignal.timeout(5000) });
        const latency = Date.now() - start;
        return { name: ep.name, url: ep.url, status: res.status, ok: res.status < 500, latency };
      } catch (e) {
        const latency = Date.now() - start;
        const msg = e instanceof Error ? e.message : "Unknown error";
        await sendTelegram(`🚨 <b>Site health alert!</b>\n\n${ep.name} is DOWN\nError: ${msg}`);
        return { name: ep.name, url: ep.url, status: 0, ok: false, latency, error: msg };
      }
    })
  );

  return NextResponse.json({ checks: results, timestamp: new Date().toISOString() });
}
