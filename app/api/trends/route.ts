import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { getCached, setCached, TTL_MS } from "../_cache";
import { normalizeQuery } from "../_normalize";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are a sharp market analyst who spots weak signals before they become obvious.
You read early trends, not mainstream ones. Your job is to find what's rising before everyone else does.

No hype. No buzzwords. Call out things that are dying as clearly as things that are growing.
Format with ## sections and bullet points. Bold specific names, tools, companies, and numbers.`;

const PROMPT = (niche: string) => `Trend analysis for the space: "${niche}"

## 🌡️ Space Temperature
Score: [integer 1-100, where 1=dead/completely saturated and 100=explosive greenfield opportunity right now]
[Write exactly 2 sentences: the single dominant signal driving this score and what it means for a founder entering now. Be specific and direct.]

## 📈 What's Rising
Each bullet MUST begin with a bold signal badge — exactly one of:
**🔥 High Activity** = explosive momentum, clear evidence of 3x+ growth
**📈 Growing** = steady consistent growth, compounding
**⚡ Emerging** = early signal, under 6 months old, watch closely

Format each bullet as: **[badge]** — **[specific thing]**: [why, with numbers if possible]

## 💀 What's Dying (Get Out)
Approaches, features, pricing models, or assumptions in this space that are losing steam.
What are smart founders quietly abandoning?

## 🔥 The Pattern to Bet On
One emerging structural shift that will define this market in the next 12–18 months.
Be specific and contrarian — if everyone already knows it, it doesn't count.

## 💡 Underexplored Niches
Specific sub-segments within this space that are genuinely underserved.
Name the customer, their problem, and why nobody has properly solved it.

## 🧲 The Contrarian Take
The thing most founders in this space believe that is probably wrong.
What assumption is the market making that will look naive in 2 years?

## 🧠 Best Opportunity Right Now
Given these trends, what's the single highest-signal opportunity to build in this space today?
Be specific: who, what, why now.

Be sharp. Be specific. Name names.`;

export async function POST(req: NextRequest) {
  const { idea } = await req.json();

  if (!idea || typeof idea !== "string" || idea.trim().length < 3)
    return Response.json({ error: "Please describe a space or industry (min 3 chars)." }, { status: 400 });
  if (idea.length > 500)
    return Response.json({ error: "Too long — keep it under 500 characters." }, { status: 400 });

  const normalizedKey = await normalizeQuery(idea);
  const cached = getCached(normalizedKey, TTL_MS.trends);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Always send meta first so the client knows cache status
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ meta: { cached: !!cached, key: normalizedKey } })}\n\n`)
      );

      if (cached) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: cached })}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
        return;
      }

      try {
        let full = "";
        const s = client.messages.stream({
          model: "claude-opus-4-6",
          max_tokens: 16000,
          thinking: { type: "enabled", budget_tokens: 10000 },
          system: SYSTEM,
          messages: [{ role: "user", content: PROMPT(idea) }],
        });
        for await (const event of s) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            full += event.delta.text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
          }
        }
        if (full) setCached(normalizedKey, full);
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
