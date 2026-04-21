import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { rateLimit } from "@/app/api/_ratelimit";
import { validateAnalyzeBody, checkPayloadSize, errorResponse } from "@/app/lib/validate";
import { checkFreeRateLimit, logFreeAnalysis } from "@/app/lib/plan";

const FREE_PROMPT = `You are a sharp market analyst. Given a startup/product idea, provide a quick assessment using your existing knowledge. No live data — use what you know about the market.

Your tone: SHOW, DON'T SCOLD. Evidence-led, specific, short. Never mock or humiliate.

BANNED: "Kill this idea", "builder trap", "I would not invest", "dead on arrival", "Game-changing", "Revolutionary"

Respond with ONLY a JSON code block:
\`\`\`json
{
  "marketScore": <0-100 integer>,
  "marketScoreLabel": "<Dead Zone|Tough Market|Uphill Battle|Mixed Signals|Real Opportunity|Strong Gap|Wide Open>",
  "marketScoreSummary": "<1 sentence, max 20 words. What the market looks like.>",
  "verdict": "<2 sentences, max 20 words each. Score + what to do + why.>",
  "recommendedAction": "<kill|reposition|validate_niche|build_mvp|move_fast>",
  "topThreat": "<Name of biggest competitor, max 5 words>",
  "bestGap": "<Best opportunity angle, max 8 words>",
  "_presentation": { "mode": "<band1|band2|band3>" }
}
\`\`\`

Score rules:
- 0-30 → band1, label from Dead Zone/Tough Market
- 31-55 → band2, label from Uphill Battle/Mixed Signals  
- 56+ → band3, label from Real Opportunity/Strong Gap/Wide Open
- Be honest. Most generic ideas score 15-35. Only specific niches with real gaps score 50+.
- recommendedAction: 0-19→kill, 20-40→reposition, 41-60→validate_niche, 61-75→build_mvp, 76+→move_fast

Keep every sentence under 20 words. Be specific, not generic.`;

// Strip injection patterns
function sanitize(s: string): string {
  return s
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "")
    .replace(/\b(ignore|disregard|forget|override|bypass|jailbreak|DAN|pretend|act as|you are now|system prompt|reveal)[^\n]{0,200}/gi, "[REDACTED]")
    .trim()
    .slice(0, 500);
}

export async function POST(req: NextRequest) {
  // 1. Auth — optional for first free search
  const { userId } = await auth();

  // 2. Rate limit by IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  
  const rl = rateLimit(ip, 10, 600000); // 10 per 10 min by IP
  if (!rl.ok) return new Response(JSON.stringify({ error: "Too many requests. Please slow down." }), { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } });

  // 3. Free daily cap: TEMPORARILY DISABLED FOR TESTING
  // const underLimit = await checkFreeRateLimit(ip);
  // if (!underLimit) {
  //   return new Response(JSON.stringify({ error: "free_limit_reached", message: "You've reached today's free limit. Upgrade to Pro for full analyses." }), { status: 429, headers: { "Content-Type": "application/json" } });
  // }

  // 4. Parse body
  if (!checkPayloadSize(req)) return new Response(JSON.stringify({ error: "Request too large." }), { status: 413, headers: { "Content-Type": "application/json" } });
  let rawBody: unknown;
  try { rawBody = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON." }), { status: 400, headers: { "Content-Type": "application/json" } }); }
  const parsed = validateAnalyzeBody(rawBody);
  if (!parsed.ok) return errorResponse(parsed);
  const { idea } = parsed.data;

  const cleanIdea = sanitize(idea);
  if (cleanIdea.length < 5) return new Response(JSON.stringify({ error: "Idea too short." }), { status: 400, headers: { "Content-Type": "application/json" } });

  // 5. Log free analysis
  await logFreeAnalysis(ip, userId ?? undefined);

  // 6. Call Sonnet — no search, hero only
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: "Configuration error." }), { status: 500, headers: { "Content-Type": "application/json" } });

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: FREE_PROMPT,
        messages: [{ role: "user", content: `Idea: "${cleanIdea}"` }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[analyze-free] Sonnet error:", res.status, errText);
      return new Response(JSON.stringify({ error: "Analysis failed. Try again." }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text ?? "";

    // Parse JSON from response
    let cleaned = text.replace(/^[\s\S]*?```json\s*/m, "").replace(/```[\s\S]*$/, "").trim();
    if (!cleaned.startsWith("{")) {
      const idx = cleaned.indexOf("{");
      if (idx >= 0) cleaned = cleaned.substring(idx);
    }

    // Validate it's parseable JSON
    try {
      JSON.parse(cleaned);
    } catch {
      console.error("[analyze-free] Invalid JSON from Sonnet:", cleaned.substring(0, 200));
      return new Response(JSON.stringify({ error: "Analysis failed. Try again." }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    // Return as SSE-compatible stream (same format as full analyze for frontend compat)
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ meta: { cached: false, free: true } })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: cleaned })}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  } catch (err) {
    console.error("[analyze-free] Error:", err);
    return new Response(JSON.stringify({ error: "Analysis failed. Try again." }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
