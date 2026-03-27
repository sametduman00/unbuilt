// app/lib/abuse.ts — Abuse prevention for credit-based AI SaaS
async function redisIncr(key: string, exSec: number): Promise<number> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return 0;
  try {
    const r = await fetch(`${url}/incr/${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(2000) });
    const count = (await r.json()).result ?? 0;
    await fetch(`${url}/expire/${encodeURIComponent(key)}/${exSec}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(2000) });
    return count;
  } catch { return 0; }
}
async function redisGet(key: string): Promise<number> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return 0;
  try {
    const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(2000) });
    return parseInt((await res.json()).result ?? "0", 10) || 0;
  } catch { return 0; }
}

const DISPOSABLE_DOMAINS = new Set(["mailinator.com","guerrillamail.com","tempmail.com","throwaway.email","yopmail.com","sharklasers.com","grr.la","guerrillamail.info","guerrillamail.biz","guerrillamail.de","guerrillamail.net","guerrillamail.org","spam4.me","trashmail.com","trashmail.me","trashmail.net","dispostable.com","maildrop.cc","spamgourmet.com","fakeinbox.com","tempr.email","discard.email","10minutemail.com","10minutemail.net","20minutemail.com","filzmail.com","anonbox.net","mintemail.com","mytrashmail.com","spamex.com","throwam.com","deadaddress.com","spam.la","inboxbear.com","mailtemp.net","mailtemp.org"]);

export function isDisposableEmail(email: string): boolean {
  if (!email?.includes("@")) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  if (DISPOSABLE_DOMAINS.has(domain)) return true;
  const parts = domain.split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    if (DISPOSABLE_DOMAINS.has(parts.slice(i).join("."))) return true;
  }
  return false;
}

export async function checkSignupRateLimit(ip: string, maxPerHour = 3, maxPerDay = 8): Promise<{ allowed: boolean; reason?: string }> {
  if (!ip || ip === "unknown") return { allowed: true };
  const hour = Math.floor(Date.now() / 3600000);
  const day  = Math.floor(Date.now() / 86400000);
  const [h, d] = await Promise.all([redisIncr(`signup:ip:${ip}:h:${hour}`, 3600), redisIncr(`signup:ip:${ip}:d:${day}`, 86400)]);
  if (h > maxPerHour) return { allowed: false, reason: "Too many accounts created from this IP. Please try again later." };
  if (d > maxPerDay)  return { allowed: false, reason: "Daily signup limit reached for this IP." };
  return { allowed: true };
}

export async function checkDailyCreditQuota(userId: string, dailyMax = 20): Promise<{ allowed: boolean }> {
  const day = Math.floor(Date.now() / 86400000);
  const count = await redisGet(`quota:user:${userId}:d:${day}`);
  return { allowed: count < dailyMax };
}

export async function incrementDailyCredits(userId: string): Promise<void> {
  const day = Math.floor(Date.now() / 86400000);
  await redisIncr(`quota:user:${userId}:d:${day}`, 86400 + 3600);
}

export async function checkPublicIPRateLimit(ip: string, maxPerMinute = 10, maxPerHour = 60): Promise<{ allowed: boolean }> {
  if (!ip || ip === "unknown") return { allowed: true };
  const minute = Math.floor(Date.now() / 60000);
  const hour   = Math.floor(Date.now() / 3600000);
  const [m, h] = await Promise.all([redisIncr(`public:ip:${ip}:m:${minute}`, 120), redisIncr(`public:ip:${ip}:h:${hour}`, 7200)]);
  return { allowed: m <= maxPerMinute && h <= maxPerHour };
}

export function getClientIP(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    for (const ip of xff.split(",").map(s => s.trim())) {
      if (!isPrivateIP(ip)) return ip;
    }
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

function isPrivateIP(ip: string): boolean {
  return ip.startsWith("10.") || ip.startsWith("172.16.") || ip.startsWith("172.17.") || ip.startsWith("192.168.") || ip === "127.0.0.1" || ip === "::1";
}
