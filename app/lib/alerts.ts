// app/lib/alerts.ts
export async function incrementAlert(key: string, windowSec: number): Promise<void> {
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
