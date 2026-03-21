import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// ── Rate limiting (30 req/min per IP on /api/ routes) ──────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

function applyRateLimit(req: NextRequest): NextResponse | null {
  if (!req.nextUrl.pathname.startsWith("/api/")) return null;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }
  entry.count++;
  if (entry.count > MAX_REQUESTS) {
    return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": "60" },
    });
  }
  return null;
}

// ── Public routes (accessible without login) ──────────────────────────────
const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing(.*)",
  "/legal(.*)",
  "/how-it-works(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/pulse(.*)",
  "/api/webhooks(.*)",
]);

// ── Middleware ─────────────────────────────────────────────────────────────
export default clerkMiddleware(async (auth, req: NextRequest) => {
  const rateLimitResponse = applyRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
