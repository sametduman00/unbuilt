// Shared in-memory cache for all API routes

interface CacheEntry {
  result: string;
  timestamp: number;
}

const store = new Map<string, CacheEntry>();

export const TTL_MS = {
  trends: 6 * 60 * 60 * 1000,   // 6 h
  analyze: 24 * 60 * 60 * 1000, // 24 h
  radar: 12 * 60 * 60 * 1000,   // 12 h
  stack: 24 * 60 * 60 * 1000,   // 24 h
} as const;

export function getCached(key: string, ttlMs: number): string | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) {
    store.delete(key);
    return null;
  }
  return entry.result;
}

export function setCached(key: string, result: string): void {
  store.set(key, { result, timestamp: Date.now() });
}
