/**
 * lib/idempotency.ts
 * Atomic idempotency using Lua script — zero TOCTOU race conditions.
 * FAIL CLOSED: Redis unavailable = request blocked (503).
 */

export type IdempotencyStatus = "processing" | "completed" | "failed";

export interface IdempotencyEntry {
  status: IdempotencyStatus;
  result?: unknown;
  errorCode?: number;
  createdAt: number;
}

const LOCK_TTL = 90;       // seconds — max time for AI request to complete
const DONE_TTL = 86400;    // 24h — keep completed results for replay
const FAIL_TTL = 300;      // 5min — keep failed results (short, allow retry)

// Lua script: atomic GET-or-SET. Runs as a single Redis operation — no TOCTOU possible.
const CLAIM_LUA = `
local existing = redis.call('GET', KEYS[1])
if existing then return existing end
redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2])
return 'claimed'
`;

async function redisEval(script: string, keys: string[], args: string[]): Promise<string | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null; // signal unavailable

  // Upstash REST eval endpoint
  const resp = await fetch(`${url}/eval`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ script, keys, args }),
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  return data.result ?? null;
}

async function redisSet(key: string, value: string, ex: number): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;
  await fetch(`${url}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify([value, "EX", ex]),
  });
}

export type ClaimResult =
  | { outcome: "claimed" }
  | { outcome: "replay"; entry: IdempotencyEntry }
  | { outcome: "unavailable" };

function key(userId: string, idempotencyKey: string): string {
  return `idem:${userId}:${idempotencyKey}`;
}

/** Atomically claim an idempotency key. Fail-closed if Redis unavailable. */
export async function atomicClaim(userId: string, idempotencyKey: string): Promise<ClaimResult> {
  const k = key(userId, idempotencyKey);
  const processing: IdempotencyEntry = { status: "processing", createdAt: Date.now() };

  try {
    const result = await redisEval(CLAIM_LUA, [k], [JSON.stringify(processing), String(LOCK_TTL)]);
    if (result === null) return { outcome: "unavailable" }; // fail-closed
    if (result === "claimed") return { outcome: "claimed" };
    const entry = JSON.parse(result) as IdempotencyEntry;
    return { outcome: "replay", entry };
  } catch {
    return { outcome: "unavailable" }; // fail-closed
  }
}

/** Store final result so duplicate requests get cached response. */
export async function storeResult(
  userId: string,
  idempotencyKey: string,
  result: unknown,
  success: boolean,
  errorCode?: number
): Promise<void> {
  const entry: IdempotencyEntry = {
    status: success ? "completed" : "failed",
    result,
    errorCode,
    createdAt: Date.now(),
  };
  await redisSet(key(userId, idempotencyKey), JSON.stringify(entry), success ? DONE_TTL : FAIL_TTL);
}

/** Validate UUID v4 format. */
export function validateIdempotencyKey(raw: string | null | undefined): raw is string {
  if (!raw || typeof raw !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw);
}

export function replayResponse(entry: IdempotencyEntry): Response {
  const status = entry.status === "completed" ? 200 : (entry.errorCode ?? 500);
  return new Response(JSON.stringify(entry.result ?? { error: "Previous request failed" }), {
    status,
    headers: { "Content-Type": "application/json", "X-Idempotency-Replayed": "true" },
  });
}

export function conflictResponse(): Response {
  return new Response(JSON.stringify({ error: "Request already in progress. Please wait." }), {
    status: 409, headers: { "Content-Type": "application/json" },
  });
}

export function unavailableResponse(): Response {
  return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
    status: 503, headers: { "Content-Type": "application/json", "Retry-After": "10" },
  });
}
