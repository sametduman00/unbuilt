// Simple in-memory rate limiter — no external deps required
// Works per-instance but sufficient for Vercel serverless (each function has its own scope)

const store = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  entry.count++;
  if (entry.count > limit) {
    return { ok: false, remaining: 0 };
  }

  return { ok: true, remaining: limit - entry.count };
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store.entries()) {
    if (now > val.reset) store.delete(key);
  }
}, 60_000);
