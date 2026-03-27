import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// ── Path normalizer — prevents bypass via /api//analyze or /api/./analyze ──
function normalizePath(pathname: string): string {
  let p = pathname.replace(/\/+/g, "/");
  const parts = p.split("/");
  const out: string[] = [];
  for (const part of parts) {
    if (part === "..") out.pop();
    else if (part !== ".") out.push(part);
  }
  p = out.join("/") || "/";
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

// ── IP extraction — only trust Vercel-appended LAST entry in XFF ────────────
function getIP(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const ips = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (ips.length > 0) return ips[ips.length - 1]; // Vercel appends real IP last
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

// ── Upstash Redis rate limiter — FAIL CLOSED ────────────────────────────────
async function rateLimit(key: string, limit: number, windowSec: number): Promise<{ ok: boolean; status: number }> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // FAIL CLOSED: no Redis = deny all
  if (!url || !token) {
    console.error("[proxy] UPSTASH_REDIS not configured — fail-closed");
    return { ok: false, status: 503 };
  }

  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSec;
  const member = `${now}:${Math.random().toString(36).slice(2)}`;

  try {
    const pipeline = [
      ["ZREMRANGEBYSCORE", key, "0", windowStart.toString()],
      ["ZADD", key, now.toString(), member],
      ["ZCARD", key],
      ["EXPIRE", key, (windowSec + 10).toString()],
    ];
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(pipeline),
    });
    if (!res.ok) return { ok: false, status: 503 };
    const data = await res.json();
    const count = data[2]?.result ?? limit + 1;
    return { ok: count <= limit, status: count <= limit ? 200 : 429 };
  } catch {
    return { ok: false, status: 503 }; // fail-closed on any error
  }
}

// ── Route config ─────────────────────────────────────────────────────────────
const AI_ROUTES     = new Set(["/api/analyze", "/api/radar", "/api/stack"]);
const AUTH_ROUTES   = new Set(["/api/credits", "/api/reports"]);
const PUBLIC_ROUTES = new Set(["/api/pulse", "/api/pulse/appstore", "/api/gplay", "/api/youtube"]);
const WEBHOOK_ROUTES = new Set(["/api/webhooks/paddle"]);
const BLOCKED_ROUTES = new Set(["/api/admin", "/api/debug", "/api/internal"]);

function deny(status: number): NextResponse {
  const msg = status === 429 ? "Rate limit exceeded. Slow down." : "Service temporarily unavailable.";
  return new NextResponse(JSON.stringify({ error: msg }), {
    status,
    headers: { "Content-Type": "application/json", "Retry-After": "60" },
  });
}

// ── Main middleware ──────────────────────────────────────────────────────────
export default clerkMiddleware(async (auth, req: NextRequest) => {
  const path = normalizePath(req.nextUrl.pathname);
  const ip   = getIP(req);

  // Hard-block forbidden paths
  if (BLOCKED_ROUTES.has(path) || [...BLOCKED_ROUTES].some((r) => path.startsWith(r + "/"))) {
    return new NextResponse(JSON.stringify({ error: "Not found" }), {
      status: 404, headers: { "Content-Type": "application/json" },
    });
  }

  // Non-API routes — pass through (Clerk handles auth)
  if (!path.startsWith("/api/")) return NextResponse.next();

  // ── AI endpoints: auth + per-IP + per-user (min + hour) ──────────────────
  if (AI_ROUTES.has(path)) {
    const { userId } = auth();
    if (!userId) return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    const [r1, r2, r3] = await Promise.all([
      rateLimit(`rl:ip:${path}:${ip}`, 20, 60),
      rateLimit(`rl:user:${path}:${userId}`, 10, 60),
      rateLimit(`rl:user:${path}:h:${userId}`, 50, 3600),
    ]);
    for (const r of [r1, r2, r3]) if (!r.ok) return deny(r.status);
    return NextResponse.next();
  }

  // ── Auth-only routes ──────────────────────────────────────────────────────
  if (AUTH_ROUTES.has(path) || [...AUTH_ROUTES].some((r) => path.startsWith(r + "/"))) {
    const { userId } = auth();
    if (!userId) return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    const r = await rateLimit(`rl:user:${path}:${userId}`, 120, 60);
    if (!r.ok) return deny(r.status);
    return NextResponse.next();
  }

  // ── Webhook routes ────────────────────────────────────────────────────────
  if (WEBHOOK_ROUTES.has(path)) {
    const r = await rateLimit(`rl:ip:${path}:${ip}`, 30, 60);
    if (!r.ok) return deny(r.status);
    return NextResponse.next();
  }

  // ── Public routes ─────────────────────────────────────────────────────────
  if (PUBLIC_ROUTES.has(path) || [...PUBLIC_ROUTES].some((r) => path.startsWith(r + "/"))) {
    const r = await rateLimit(`rl:ip:${path}:${ip}`, 60, 60);
    if (!r.ok) return deny(r.status);
    return NextResponse.next();
  }

  // ── Default catch-all: ALL unclassified /api routes get IP rate limit ──────
  // New routes added later are automatically protected — nothing falls through
  const r = await rateLimit(`rl:ip:default:${ip}`, 60, 60);
  if (!r.ok) return deny(r.status);
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\.ico|robots\.txt|sitemap\.xml|\.well-known/).*)"],
};
