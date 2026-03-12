import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { getCached, setCached, TTL_MS } from "../_cache";
import { normalizeQuery } from "../_normalize";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const BUDGET_LABELS: Record<string, string> = {
  bootstrap: "Bootstrapped — under $50/month total",
  growing: "Growing — $50–200/month",
  funded: "Funded — $200–1,000/month",
  scale: "Scale — $1,000+/month",
};

const TECH_LABELS: Record<string, string> = {
  nocode: "No-code (uses tools like Notion, Webflow, Zapier — no real coding)",
  lowcode: "Low-code (can edit HTML/CSS, use APIs, follow tutorials)",
  developer: "Developer (can code, comfortable with CLIs, databases, deployment)",
};

const SYSTEM = `You are a pragmatic CTO who has launched dozens of products.
You hate over-engineering and gold-plating. Your job is to give founders the fastest, cheapest,
most appropriate path to a working product — matched exactly to their skill level and budget.

Be specific: name exact tools, real monthly prices, real tradeoffs. No vague advice.
Format with ## sections, bullet points, **bold** for tool names, and markdown tables for cost breakdowns.`;

const PROMPT = (idea: string, budget: string, techLevel: string) =>
  `Stack recommendation for:

**What they're building:** ${idea}
**Budget:** ${BUDGET_LABELS[budget] ?? budget}
**Technical level:** ${TECH_LABELS[techLevel] ?? techLevel}

## 🛠️ Recommended Stack
The specific tools they should use — matched to their budget and skill level.
For each tool: what it does, why this one, and what it costs.

## 💰 Full Cost Breakdown
A markdown table: | Tool | Purpose | Free Tier? | Paid Cost |
Total it up at the bottom. Stay within their budget.

## 🚀 Build Order
Step-by-step — what to set up first, what to defer, what to skip entirely.
Be opinionated. Most people get this order wrong.

## 🔄 When to Upgrade
At what stage (users, revenue, team size) should they reconsider each tool?
What triggers an upgrade and what's the migration path?

## ⚠️ Mistakes People at This Level Make
The 3 most common wrong choices someone with their skill level and budget makes.
Be blunt.

## 🔮 The Scalability Ceiling
Where does this stack break down? What breaks first, at what scale, and what's the escape route?

Be specific, realistic, and opinionated. Name actual tools and real dollar amounts.`;

export async function POST(req: NextRequest) {
  const { idea, budget, techLevel } = await req.json();

  if (!idea || typeof idea !== "string" || idea.trim().length < 3)
    return Response.json({ error: "Please describe what you want to build (min 3 chars)." }, { status: 400 });
  if (idea.length > 600)
    return Response.json({ error: "Too long — keep it under 600 characters." }, { status: 400 });
  if (!budget || !techLevel)
    return Response.json({ error: "Please select a budget and technical level." }, { status: 400 });

  // Cache key includes budget + tech level so different configs get different results
  const normalizedIdea = await normalizeQuery(idea);
  const normalizedKey = `${normalizedIdea}::${budget}::${techLevel}`;
  const cached = getCached(normalizedKey, TTL_MS.stack);

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
          max_tokens: 2500,
          thinking: { type: "adaptive" },
          system: SYSTEM,
          messages: [{ role: "user", content: PROMPT(idea, budget, techLevel) }],
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
