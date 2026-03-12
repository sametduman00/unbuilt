import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { getCached, setCached, TTL_MS } from "../_cache";
import { normalizeQuery } from "../_normalize";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are a hard-nosed competitive intelligence analyst. No corporate speak, no fluff.
You give founders the real picture of their competition — ugly truths included.

Format with ## sections, bullet points, **bold** for names/terms, and markdown tables where useful.
Be specific: name real companies, real products, real numbers where you know them.`;

const PROMPT = (idea: string) => `Deep competitive analysis for: "${idea}"

## 🎯 The Real Competitive Landscape
Who they're actually up against — including indirect competitors and non-obvious threats most founders overlook.

## 💪 What Competitors Do Well
A markdown table: | Competitor | Core Strength | Why It's Hard to Beat |
Be honest. Don't downplay what's working for them.

## 🩸 Exploitable Weaknesses
Specific, actionable vulnerabilities — not generic "bad UX" complaints. Real strategic gaps.

## 📣 Recent Moves
What have key players launched, changed, or pivoted to? What does it signal about where they're headed?

## 🗺️ Positioning Map
How are they differentiated from each other? Where is the white space?

## ⚔️ How to Win
The 2–3 most viable strategic angles to outmaneuver these players specifically.

## 📋 Weekly Watch List
Specific things to monitor: pages to check, job postings to watch, signals that mean they're coming for your space.

Be direct. Name names. Skip generic advice.`;

export async function POST(req: NextRequest) {
  const { idea } = await req.json();

  if (!idea || typeof idea !== "string" || idea.trim().length < 3)
    return Response.json({ error: "Please describe what you're building (min 3 chars)." }, { status: 400 });
  if (idea.length > 600)
    return Response.json({ error: "Too long — keep it under 600 characters." }, { status: 400 });

  const normalizedKey = await normalizeQuery(idea);
  const cached = getCached(normalizedKey, TTL_MS.radar);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
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
          max_tokens: 2048,
          thinking: { type: "adaptive" },
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
