import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { rateLimit } from "@/app/api/_ratelimit";
import { validateStackBody, checkPayloadSize, errorResponse } from "@/app/lib/validate";
import { checkFreeRateLimit, logFreeAnalysis } from "@/app/lib/plan";

const FREE_STACK_PROMPT = `You are a pragmatic tech advisor for vibe coders. Given a startup/product idea, recommend the fastest $0 way to validate demand before building anything.

Respond with ONLY a JSON code block:
\`\`\`json
{
  "headline": "One sentence: what to do first to validate this idea. Max 20 words.",
  "phases": [
    {
      "name": "Phase 0: Validate",
      "subtitle": "Prove demand before writing code",
      "tools": [
        {
          "name": "Tool name",
          "purpose": "What it does for validation. 1 sentence.",
          "price": "Free",
          "free": true,
          "alternatives": [
            { "name": "Alt tool", "reason": "When to use instead. 1 sentence." }
          ]
        }
      ],
      "costs": {
        "tools": [{ "name": "Tool", "purpose": "What", "freeTier": true, "monthlyCost": "$0" }],
        "total": "$0/mo"
      },
      "vibeGuide": [
        {
          "tool": "Tool name",
          "url": "https://...",
          "prompt": "Step-by-step guide for a non-technical user. 3-5 steps.",
          "tip": "One practical tip. 1 sentence."
        }
      ]
    },
    {
      "name": "Phase 1: MVP",
      "subtitle": "Build the first version",
      "tools": [
        {
          "name": "Tool name",
          "purpose": "What it does. 1 sentence.",
          "price": "Free or $X/mo",
          "free": true,
          "alternatives": [{ "name": "Alt", "reason": "When to use." }]
        }
      ],
      "costs": {
        "tools": [{ "name": "Tool", "purpose": "What", "freeTier": true, "monthlyCost": "$0" }],
        "total": "$0-20/mo"
      }
    }
  ],
  "timeToMvp": "X days/weeks"
}
\`\`\`

Rules:
- Phase 0 must cost $0. Use Telegram bots, Google Forms, landing pages, WhatsApp groups.
- Phase 1: recommend 3-5 real tools. Include real URLs. Prefer no-code/low-code tools.
- Phase 1 tool names visible but vibeGuide only in Phase 0 (Pro unlocks the rest).
- Keep every sentence under 20 words.
- Be specific to the idea, not generic.`;

function sanitize(s: string): string {
  return s
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "")
    .replace(/\b(ignore|disregard|forget|override|bypass|jailbreak|DAN|pretend|act as|you are now|system prompt|reveal)[^\n]{0,200}/gi, "[REDACTED]")
    .trim()
    .slice(0, 500);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const rl = rateLimit(ip, 10, 600000);
  if (!rl.ok) return new Response(JSON.stringify({ error: "Too many requests." }), { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } });

  // TEMPORARILY DISABLED FOR TESTING
  // const underLimit = await checkFreeRateLimit(ip);
  // if (!underLimit) {
  //   return new Response(JSON.stringify({ error: "free_limit_reached", message: "You've reached today's free limit. Upgrade to Pro for full stack plans." }), { status: 429, headers: { "Content-Type": "application/json" } });
  // }

  if (!checkPayloadSize(req)) return new Response(JSON.stringify({ error: "Request too large." }), { status: 413, headers: { "Content-Type": "application/json" } });
  let rawBody: unknown;
  try { rawBody = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON." }), { status: 400, headers: { "Content-Type": "application/json" } }); }
  const parsed = validateStackBody(rawBody);
  if (!parsed.ok) return errorResponse(parsed);
  const { idea } = parsed.data;

  const cleanIdea = sanitize(idea);
  if (cleanIdea.length < 5) return new Response(JSON.stringify({ error: "Idea too short." }), { status: 400, headers: { "Content-Type": "application/json" } });

  await logFreeAnalysis(ip, userId ?? undefined);

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
        max_tokens: 1500,
        system: FREE_STACK_PROMPT,
        messages: [{ role: "user", content: `Idea: "${cleanIdea}"` }],
      }),
    });

    if (!res.ok) {
      console.error("[stack-free] Sonnet error:", res.status);
      return new Response(JSON.stringify({ error: "Analysis failed. Try again." }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text ?? "";

    let cleaned = text.replace(/^[\s\S]*?```json\s*/m, "").replace(/```[\s\S]*$/, "").trim();
    if (!cleaned.startsWith("{")) {
      const idx = cleaned.indexOf("{");
      if (idx >= 0) cleaned = cleaned.substring(idx);
    }

    try { JSON.parse(cleaned); } catch {
      console.error("[stack-free] Invalid JSON:", cleaned.substring(0, 200));
      return new Response(JSON.stringify({ error: "Analysis failed. Try again." }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

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
    console.error("[stack-free] Error:", err);
    return new Response(JSON.stringify({ error: "Analysis failed. Try again." }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
