import { rateLimit } from "@/app/api/_ratelimit";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import gplay from "google-play-scraper";
import { getCached, setCached, TTL_MS } from "../_cache";
import { normalizeQuery } from "../_normalize";
import { auth } from "@clerk/nextjs/server";
import { deductCredit } from "@/app/lib/credits";
import { saveReport } from "@/app/lib/reports";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Redis idempotency helpers ───────────────────────────────────────────────
async function acquireIdempotencyLock(key: string, ttlSec: number): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return true;
  try {
    const res = await fetch(
      `${url}/set/${encodeURIComponent(key)}/1/NX/EX/${ttlSec}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return (await res.json()).result === "OK";
  } catch { return true; }
}
async function releaseIdempotencyLock(key: string): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;
  try { await fetch(`${url}/del/${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${token}` } }); } catch {}
}
async function storeResult(key: string, value: string, ttlSec: number): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;
  try {
    await fetch(`${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}/EX/${ttlSec}`,
      { headers: { Authorization: `Bearer ${token}` } });
  } catch {}
}
async function getStoredResult(key: string): Promise<string | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${token}` } });
    return (await res.json()).result ?? null;
  } catch { return null; }
}

// ── Main POST handler ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });

  const rl = rateLimit(userId, 10, 600000);
  if (!rl.ok) return new Response(JSON.stringify({ error: "Too many requests. Please slow down." }), { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } });

  // Parse BEFORE credits
  let body: { idea?: unknown; tool?: unknown };
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const { idea, tool: toolType } = body;
  if (!idea || typeof idea !== "string" || idea.trim().length < 3)
    return Response.json({ error: "Please provide a valid idea (min 3 characters)." }, { status: 400 });
  if (idea.length > 500)
    return Response.json({ error: "Idea is too long (max 500 characters)." }, { status: 400 });

  const normalizedKey = await normalizeQuery(idea);

  // In-memory cache → free
  const cached = getCached(normalizedKey, TTL_MS.analyze);
  if (cached) {
    const encoder = new TextEncoder();
    return new Response(new ReadableStream({ start(c) {
      c.enqueue(encoder.encode(`data: ${JSON.stringify({ meta: { cached: true, key: normalizedKey } })}\n\n`));
      c.enqueue(encoder.encode(`data: ${JSON.stringify({ text: cached })}\n\n`));
      if (userId && (toolType === "gap-analysis" || toolType === "stack-advisor"))
        saveReport(userId, toolType as "gap-analysis" | "stack-advisor", idea, cached).catch(console.error);
      c.enqueue(encoder.encode("data: [DONE]\n\n")); c.close();
    }}), { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
  }

  // Redis result store → retry protection (1hr) — no credit deduction
  const resultKey = `result:analyze:${userId}:${normalizedKey}`;
  const storedResult = await getStoredResult(resultKey);
  if (storedResult) {
    const encoder = new TextEncoder();
    return new Response(new ReadableStream({ start(c) {
      c.enqueue(encoder.encode(`data: ${JSON.stringify({ meta: { cached: true, replayed: true, key: normalizedKey } })}\n\n`));
      c.enqueue(encoder.encode(`data: ${JSON.stringify({ text: storedResult })}\n\n`));
      if (userId && (toolType === "gap-analysis" || toolType === "stack-advisor"))
        saveReport(userId, toolType as "gap-analysis" | "stack-advisor", idea, storedResult).catch(console.error);
      c.enqueue(encoder.encode("data: [DONE]\n\n")); c.close();
    }}), { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
  }

  // Idempotency lock — concurrent duplicate → 409
  const lockKey = `idem:analyze:${userId}:${normalizedKey}`;
  const locked = await acquireIdempotencyLock(lockKey, 600);
  if (!locked) return new Response(JSON.stringify({ error: "This analysis is already in progress. Please wait." }), { status: 409, headers: { "Content-Type": "application/json" } });

  // Deduct credit — only after all checks
  const hasCredits = await deductCredit(userId);
  if (!hasCredits) { await releaseIdempotencyLock(lockKey); return new Response(JSON.stringify({ error: "No credits remaining" }), { status: 402, headers: { "Content-Type": "application/json" } }); }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ meta: { cached: false, key: normalizedKey } })}\n\n`));
      try {
        const [youtubeContext,appStoreContext,gplayContext,serperContext,trendsContext,segmentsContext,customerContext,gtmContext,reviewsContext,financialContext,fundabilityContext,redditContext,twitterContext] = await Promise.all([
          fetchYouTubeContext(idea),fetchAppStoreContext(idea),fetchGPlayContext(idea),fetchSerperContext(idea),fetchTrendsContext(idea),fetchSegmentsContext(idea),fetchCustomerBehaviorContext(idea),fetchGTMContext(idea),fetchReviewsContext(idea),fetchFinancialContext(idea),fetchFundabilityContext(idea),fetchRedditContext(idea),fetchTwitterContext(idea),
        ]);
        const combinedAppContext = [appStoreContext,gplayContext].filter(Boolean).join("");
        const socialContext = [redditContext,twitterContext].filter(Boolean).join("");
        let full = "";
        const anthropicStream = client.messages.stream({ model:"claude-opus-4-6", max_tokens:24000, thinking:{type:"enabled",budget_tokens:10000}, system:SYSTEM_PROMPT, messages:[{role:"user",content:USER_PROMPT(idea,youtubeContext,combinedAppContext,serperContext,trendsContext,segmentsContext,customerContext,gtmContext,reviewsContext,financialContext,fundabilityContext,socialContext)}] });
        for await (const event of anthropicStream) {
          if (event.type==="content_block_delta" && event.delta.type==="text_delta") { full+=event.delta.text; controller.enqueue(encoder.encode(`data: ${JSON.stringify({text:event.delta.text})}\n\n`)); }
        }
        if (full) {
          setCached(normalizedKey, full);
          await storeResult(resultKey, full, 3600); // store for 1hr — retries get this free
        }
        if (full && userId && (toolType==="gap-analysis"||toolType==="stack-advisor")) {
          try {
            let jsonToSave = full;
            try {
              const fenceMatch = full.match(/```json\s*([\s\S]*?)```/);
              if (fenceMatch) {
                const parsed = JSON.parse(fenceMatch[1]);
                const [itunesRaw] = await Promise.allSettled([fetch(`https://itunes.apple.com/search?${new URLSearchParams({term:idea,entity:"software",limit:"8",country:"us"})}`,{signal:AbortSignal.timeout(5000)}).then(r=>r.json()).then(d=>d.results??[]).catch(()=>[])]);
                if (itunesRaw.status==="fulfilled"&&itunesRaw.value.length>0) parsed.itunesApps=itunesRaw.value.slice(0,8).map((a:Record<string,unknown>)=>({trackName:a.trackName,artworkUrl60:a.artworkUrl60,averageUserRating:a.averageUserRating,userRatingCount:a.userRatingCount,description:String(a.description||"").slice(0,200),formattedPrice:a.formattedPrice,sellerName:a.sellerName}));
                jsonToSave=full.replace(fenceMatch[1],JSON.stringify(parsed));
              }
            } catch { /* keep original */ }
            await saveReport(userId,toolType as "gap-analysis"|"stack-advisor",idea,jsonToSave);
          } catch(e) { console.error("saveReport:",e); }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch(err) { controller.enqueue(encoder.encode(`data: ${JSON.stringify({error:err instanceof Error?err.message:"Unknown error"})}\n\n`)); }
      finally { await releaseIdempotencyLock(lockKey); controller.close(); }
    }
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
}
