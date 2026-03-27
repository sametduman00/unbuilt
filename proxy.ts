import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// ── Security event counter (fire-and-forget, never blocks request) ───────────
function incrSecurityEvent(event: string): void {
  const url  = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;
  const key  = `sec:${event}:${new Date().toISOString().slice(0,13)}`; // hourly bucket
  fetch(`${url}/incr/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }).then(() => {
    // Set expiry 48h so keys auto-clean
    fetch(`${url}/expire/${encodeURIComponent(key)}/172800`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  }).catch(() => {});
}


// ── Path normalizer ──────────────────────────────────────────────────────────
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

// ── IP: only trust Vercel-appended LAST entry in XFF ────────────────────────
function getIP(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const ips = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (ips.length > 0) return ips[ips.length - 1];
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

// ── Upstash rate limiter — FAIL CLOSED ──────────────────────────────────────
async function rateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<{ ok: boolean; status: number }> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.error("[proxy] UPSTASH_REDIS not set — fail-closed");
    return { ok: false, status: 503 };
  }
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSec;
  const member = `${now}:${Math.random().toString(36).slice(2)}`;
  try {
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["ZREMRANGEBYSCORE", key, "0", windowStart.toString()],
        ["ZADD", key, now.toString(), member],
        ["ZCARD", key],
        ["EXPIRE", key, (windowSec + 10).toString()],
      ]),
    });
    if (!res.ok) return { ok: false, status: 503 };
    const data = await res.json();
    const count: number = data[2]?.result ?? limit + 1;
    return { ok: count <= limit, status: count <= limit ? 200 : 429 };
  } catch {
    return { ok: false, status: 503 };
  }
}

function deny(status: number): NextResponse {
  incrSecurityEvent('429');
  return new NextResponse(
    JSON.stringify({
      error:
        status === 429
          ? "Rate limit exceeded. Slow down."
          : "Service temporarily unavailable.",
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "60",
      },
    }
  );
}

// ── Route sets ───────────────────────────────────────────────────────────────
const AI_ROUTES      = new Set(["/api/analyze", "/api/radar", "/api/stack"]);
const AUTH_ROUTES    = new Set(["/api/credits", "/api/reports"]);
const PUBLIC_ROUTES  = new Set(["/api/pulse", "/api/pulse/appstore", "/api/gplay", "/api/youtube"]);
const WEBHOOK_ROUTES = new Set(["/api/webhooks/paddle"]);
const BLOCKED_ROUTES = new Set(["/api/admin", "/api/debug", "/api/internal"]);

// ── Main ─────────────────────────────────────────────────────────────────────

// ── Alert counter (fire-and-forget) ─────────────────────────────────────────
async function incAlertCounter(key: string, windowSec: number): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;
  const bucket = Math.floor(Date.now() / 1000 / windowSec);
  const rk = encodeURIComponent(`alert:${key}:${bucket}`);
  try {
    await fetch(`${url}/incr/${rk}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(2000) });
    await fetch(`${url}/expire/${rk}/${windowSec * 2}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(2000) });
  } catch {}
}

// ── CSRF: validate Origin/Referer on all state-changing API routes ──────────
const ALLOWED_ORIGINS = [
  "https://www.unbuilt.me",
  "https://unbuilt.me",
];

function csrfCheck(req: NextRequest): NextResponse | null {
  // Only check state-changing methods on API routes (webhooks excluded — they use HMAC)
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return null;
  const path = req.nextUrl.pathname;
  if (!path.startsWith("/api/")) return null;
  // Paddle webhook uses its own HMAC signature verification — skip
  if (path.startsWith("/api/webhooks/")) return null;

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  // Allow requests with no origin (server-to-server, curl, Postman in dev)
  // but block requests with a cross-origin origin header
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    incrSecurityEvent('csrf_403');
    incAlertCounter("auth_fail", 300).catch(() => {});
    return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // If no origin header, check Referer as fallback
  if (!origin && referer) {
    const refererOrigin = new URL(referer).origin;
    if (!ALLOWED_ORIGINS.includes(refererOrigin)) {
      incAlertCounter("auth_fail", 300).catch(() => {});
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return null;
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // 1. CSRF check first — reject cross-origin state-changing requests
  const csrfResult = csrfCheck(req);
  if (csrfResult) return csrfResult;

  const path = normalizePath(req.nextUrl.pathname);
  const ip   = getIP(req);

  // Hard-block forbidden paths
  if (
    BLOCKED_ROUTES.has(path) ||
    [...BLOCKED_ROUTES].some((r) => path.startsWith(r + "/"))
  ) {
    return new NextResponse(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Non-API pages: pass through to Clerk
  if (!path.startsWith("/api/")) return NextResponse.next();

  // Helper: 401 response
  const unauth = () =>
    new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });

  // ── AI endpoints ────────────────────────────────────────────────────────
  if (AI_ROUTES.has(path)) {
    // Clerk v5: auth() is async, must be awaited
    const { userId } = await auth();
    if (!userId) return unauth();

    const [r1, r2, r3] = await Promise.all([
      rateLimit(`rl:ip:${path}:${ip}`, 20, 60),
      rateLimit(`rl:user:${path}:${userId}`, 10, 60),
      rateLimit(`rl:user:${path}:h:${userId}`, 50, 3600),
    ]);
    for (const r of [r1, r2, r3]) if (!r.ok) return deny(r.status);
    return NextResponse.next();
  }

  // ── Auth-only endpoints ──────────────────────────────────────────────────
  if (
    AUTH_ROUTES.has(path) ||
    [...AUTH_ROUTES].some((r) => path.startsWith(r + "/"))
  ) {
    const { userId } = await auth();
    if (!userId) return unauth();

    const r = await rateLimit(`rl:user:${path}:${userId}`, 120, 60);
    if (!r.ok) return deny(r.status);
    return NextResponse.next();
  }

  // ── Webhook endpoints ────────────────────────────────────────────────────
  if (WEBHOOK_ROUTES.has(path)) {
    const r = await rateLimit(`rl:ip:${path}:${ip}`, 30, 60);
    if (!r.ok) return deny(r.status);
    return NextResponse.next();
  }

  // ── Public endpoints ─────────────────────────────────────────────────────
  if (
    PUBLIC_ROUTES.has(path) ||
    [...PUBLIC_ROUTES].some((r) => path.startsWith(r + "/"))
  ) {
    const r = await rateLimit(`rl:ip:${path}:${ip}`, 60, 60);
    if (!r.ok) return deny(r.status);
    return NextResponse.next();
  }

  // ── Default catch-all: any unclassified /api route ───────────────────────
  // New routes are automatically protected — nothing falls through unguarded
  const r = await rateLimit(`rl:ip:default:${ip}`, 60, 60);
  if (!r.ok) return deny(r.status);
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\.ico|robots\.txt|sitemap\.xml|\.well-known/).*)",
  ],
};
