import { clerkMiddleware, getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ── Fail-closed rate limiter ────────────────────────────────────────────────
async function rateLimit(key: string, limit: number, windowSec: number): Promise<{ ok: boolean; status: number }> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // FAIL CLOSED: no Redis = deny all requests
  if (!url || !token) {
    console.error("[middleware] UPSTASH_REDIS not configured — denying request (fail-closed)");
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

    if (!res.ok) {
      console.error("[middleware] Redis pipeline error:", res.status);
      return { ok: false, status: 503 }; // fail-closed
    }

    const data = await res.json();
    const count = data[2]?.result ?? limit + 1;
    return { ok: count <= limit, status: count <= limit ? 200 : 429 };
  } catch (err) {
    console.error("[middleware] Redis error:", err);
    return { ok: false, status: 503 }; // fail-closed on any error
  }
}

// ── Path normalizer ─────────────────────────────────────────────────────────
function normalizePath(pathname: string): string {
  let p = pathname.replace(/\/+/g, "/");
  const parts = p.split("/");
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === "..") resolved.pop();
    else if (part !== ".") resolved.push(part);
  }
  p = resolved.join("/") || "/";
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

// ── IP extraction — only trust Vercel-appended last IP ─────────────────────
function getClientIP(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const ips = xff.split(",").map((s) => s.trim()).filter(Boolean);
    // Vercel always appends the real IP last — user-controlled entries are ignored
    const last = ips[ips.length - 1];
    if (last) return last;
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

// ── Route config ────────────────────────────────────────────────────────────
const AI_ROUTES    = new Set(["/api/analyze", "/api/radar", "/api/stack"]);
const AUTH_ROUTES  = new Set(["/api/credits", "/api/reports"]);
const PUBLIC_ROUTES = new Set(["/api/pulse", "/api/pulse/appstore", "/api/gplay", "/api/youtube"]);
const WEBHOOK_ROUTES = new Set(["/api/webhooks/paddle"]);
const BLOCKED_ROUTES = new Set(["/api/admin", "/api/debug", "/api/internal"]);

// ── Middleware ──────────────────────────────────────────────────────────────
export default clerkMiddleware(async (auth, request: NextRequest) => {
  const raw = request.nextUrl.pathname;
  const path = normalizePath(raw);
  const ip = getClientIP(request);

  // Block forbidden paths immediately
  if (BLOCKED_ROUTES.has(path) || [...BLOCKED_ROUTES].some((r) => path.startsWith(r + "/"))) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404, headers: { "Content-Type": "application/json" },
    });
  }

  // Only rate-limit /api routes
  if (!path.startsWith("/api/")) return NextResponse.next();

  // Helper to build 429/503 response
  const deny = (status: number, retryAfter = 60) =>
    new Response(
      JSON.stringify({ error: status === 429 ? "Rate limit exceeded. Slow down." : "Service temporarily unavailable." }),
      { status, headers: { "Content-Type": "application/json", "Retry-After": String(retryAfter) } }
    );

  // ── AI routes: auth + per-user/min + per-user/hour + per-IP/min ──────────
  if (AI_ROUTES.has(path)) {
    const { userId } = auth();
    if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });

    const [ipMin, userMin, userHour] = await Promise.all([
      rateLimit(`rl:ip:${path}:${ip}`, 20, 60),
      rateLimit(`rl:user:${path}:${userId}`, 10, 60),
      rateLimit(`rl:user:${path}:hour:${userId}`, 50, 3600),
    ]);
    for (const r of [ipMin, userMin, userHour]) {
      if (!r.ok) return deny(r.status);
    }
    return NextResponse.next();
  }

  // ── Auth-only routes ─────────────────────────────────────────────────────
  if (AUTH_ROUTES.has(path) || [...AUTH_ROUTES].some((r) => path.startsWith(r + "/"))) {
    const { userId } = auth();
    if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });

    const r = await rateLimit(`rl:user:${path}:${userId}`, 120, 60);
    if (!r.ok) return deny(r.status);
    return NextResponse.next();
  }

  // ── Webhook routes ───────────────────────────────────────────────────────
  if (WEBHOOK_ROUTES.has(path)) {
    const r = await rateLimit(`rl:ip:${path}:${ip}`, 30, 60);
    if (!r.ok) return deny(r.status);
    return NextResponse.next();
  }

  // ── Public routes ────────────────────────────────────────────────────────
  if (PUBLIC_ROUTES.has(path) || [...PUBLIC_ROUTES].some((r) => path.startsWith(r + "/"))) {
    const r = await rateLimit(`rl:ip:${path}:${ip}`, 60, 60);
    if (!r.ok) return deny(r.status);
    return NextResponse.next();
  }

  // ── Default catch-all: any unclassified /api route ───────────────────────
  // New routes get IP rate limiting automatically — no route falls through unprotected
  const r = await rateLimit(`rl:ip:default:${ip}`, 60, 60);
  if (!r.ok) return deny(r.status);
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\.ico|robots\.txt|sitemap\.xml|\.well-known/).*)"],
};
