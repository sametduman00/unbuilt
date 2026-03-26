import { rateLimit } from "@/app/api/_ratelimit";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { getCached, setCached, TTL_MS } from "../_cache";
import { normalizeQuery } from "../_normalize";
import { auth } from "@clerk/nextjs/server";
import { deductCredit } from "@/app/lib/credits";
import { saveReport } from "@/app/lib/reports";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Load tool database at startup and build a compact version for the prompt
const stacksDB = JSON.parse(readFileSync(join(process.cwd(), "data/stacks.json"), "utf-8"));
const compactToolsDB = (stacksDB.tools as { name: string; category: string; description: string; freeTier: string; pricing: { plan: string; price: string; limits: string }[]; bestFor: string[]; noCode: boolean; openSource?: boolean }[])
  .map((t) => `${t.name} [${t.category}${t.noCode ? ",nocode" : ""}${t.openSource ? ",oss" : ""}]: ${t.description}. Free: ${t.freeTier}. Plans: ${t.pricing.map((p) => `${p.plan}=${p.price}`).join(", ")}. Best for: ${t.bestFor.join(", ")}`)
  .join("\n");

const PLATFORM_LABELS: Record<string, string> = {
  web:    "Web app (browser/SaaS)",
  mobile: "Mobile app (iOS and/or Android)",
  both:   "Web + Mobile (cross-platform)",
};
const BUDGET_LABELS: Record<string, string> = {
  bootstrap: "Bootstrapped Ã¢ÂÂ under $50/month total",
  growing: "Growing Ã¢ÂÂ $50Ã¢ÂÂ200/month",
  funded: "Funded Ã¢ÂÂ $200Ã¢ÂÂ1,000/month",
  scale: "Scale Ã¢ÂÂ $1,000+/month",
};

const TECH_LABELS: Record<string, string> = {
  nocode: "No-code (uses tools like Notion, Webflow, Zapier Ã¢ÂÂ no real coding)",
  lowcode: "Low-code (can edit HTML/CSS, use APIs, follow tutorials)",
  developer: "Developer (can code, comfortable with CLIs, databases, deployment)",
};

const SYSTEM = `You are a pragmatic CTO who has launched dozens of products.
You hate over-engineering and gold-plating. Your job is to give founders the fastest, cheapest,
most appropriate path to a working product Ã¢ÂÂ matched exactly to their skill level and budget.

IMPORTANT: You MUST respond with ONLY a single JSON code block. No text before or after.
The JSON must match the exact schema provided.
You have a curated database of developer tools with verified March 2026 pricing.
Use ONLY tools from this database Ã¢ÂÂ do NOT invent tools or guess prices. Use the exact pricing from the database.`;

const PROMPT = (idea: string, budget: string, techLevel: string, platform: string) =>
  `Stack recommendation for:
**What they're building:** ${idea}
**Budget:** ${BUDGET_LABELS[budget] ?? budget}
**Technical level:** ${TECH_LABELS[techLevel] ?? techLevel}
**Target platform:** ${PLATFORM_LABELS[platform] ?? platform}${platform === "both" ? `

PLATFORM INSTRUCTION: The user wants BOTH web and mobile. Structure your response so that:
- Each phase clearly separates web tools vs mobile tools where they differ (e.g. "Web: Next.js | Mobile: React Native")
- When a tool works for both, just list it once
- The headline should reflect the cross-platform strategy
- In build order, note which steps are web-specific, mobile-specific, or shared` : ""}

Respond with ONLY a JSON code block matching this exact schema:

\`\`\`json
{
  "headline": "One bold sentence summarizing the recommended approach",
  "phases": [
    {
      "name": "Phase 0: Validate",
      "subtitle": "Prove demand before building anything",
      "tools": [
        { "name": "Telegram Bot", "purpose": "Collect interest and test the flow manually", "price": "Free", "free": true, "alternatives": [{ "name": "Alt Tool", "reason": "Use if X" }] }
      ],
      "costs": {
        "tools": [{ "name": "Telegram Bot", "purpose": "Collect interest", "freeTier": true, "monthlyCost": "$0" }],
        "total": "$0/mo"
      },
      "vibeGuide": [
        {
          "tool": "ChatGPT",
          "url": "https://chat.openai.com",
          "prompt": "I want to validate a [describe idea] app. Write me a Telegram bot message I can send to 20 potential users asking if they have this problem and would pay for it.",
          "tip": "Send this to at least 20 people before writing a single line of code."
        }
      ]
    },
    {
      "name": "Phase 1: MVP",
      "subtitle": "Get it live in a weekend",
      "tools": [
        { "name": "Tool Name", "purpose": "What it does", "price": "Free", "free": true }
      ],
      "costs": {
        "tools": [{ "name": "Tool Name", "purpose": "What it handles", "freeTier": true, "monthlyCost": "$0" }],
        "total": "$0-5/mo"
      },
      "vibeGuide": [
        {
          "tool": "Lovable",
          "url": "https://lovable.dev",
          "prompt": "Build me a [describe the specific feature] with [specific tool] integration. Make it look like [style reference].",
          "tip": "Be specific — the more detail you give, the less back-and-forth you need."
        }
      ]
    }
  ],
  "buildOrder": [
    {
      "week": "Week 1",
      "title": "Foundation",
      "steps": ["Set up X", "Configure Y", "Deploy Z"]
    }
  ],
  "timeToMvp": "X days",
  "mistakes": [
    { "title": "Mistake Name", "description": "Why this is wrong and what to do instead. Max 2 sentences." }
  ],
  "scalability": [
    { "trigger": "500+ users", "whatBreaks": "Database queries slow down", "upgradeTo": "Move to Supabase Pro", "severity": "medium" }
  ],
  "upgrades": [
    { "tool": "Current Tool", "trigger": "When you hit X users or Y revenue", "migrateTo": "Better Tool" }
  ]
}
\`\`\`

Rules:
- "phases": MUST start with Phase 0 (Validate) Ã¢ÂÂ the fastest $0 way to test demand before building. Use a Telegram bot, WhatsApp group, Google Form, landing page with waitlist, or similar zero-cost tool. Phase 0 should ALWAYS cost $0. Then 2-3 more phases (MVP, Growth, Scale). Each phase has 2-5 tools. "price": show real monthly cost or "Free". "free": boolean. Each phase must include a "costs" object (see below).
- Each phase object MUST also include: "vibeGuide" — an array of 1-3 actionable steps for someone who has never coded. Each step: { "tool": "the specific tool name to open (e.g. Lovable, ChatGPT, Cursor, Replit)", "url": "direct URL to open", "prompt": "the EXACT prompt or instruction to type/do — be very specific, include what to say word-for-word or step-by-step", "tip": "one practical gotcha or shortcut (optional)" }. vibeGuide should tell the user exactly HOW to use the phase's tools — not what they are. Think: a first-time vibe-coder who knows nothing about code but can follow instructions.
- Each phase object must also include: "costs": { "tools": [{ "name": "Tool", "purpose": "What", "freeTier": true, "monthlyCost": "$0" }], "total": "$0/mo" } Ã¢ÂÂ listing ONLY the tools in that phase with their costs and the phase total.
- "buildOrder": 2-4 time blocks. Use realistic labels based on project complexity: simple projects use "Day 1-2", "Day 3-5", "Week 2"; medium projects use "Week 1", "Week 2", "Week 3-4"; complex projects use "Week 1", "Week 2-3", "Week 4-6", "Month 2+". Do NOT default to "Month 2" for simple projects Ã¢ÂÂ most no-code MVPs ship in 1-2 weeks. Be aggressive: if a skilled developer follows your plan, how long does it ACTUALLY take?
- "timeToMvp": Single realistic estimate for Phase 1 MVP completion. Examples: "3-5 days" (simple no-code), "1-2 weeks" (standard MVP), "3-4 weeks" (complex with integrations). Be honest Ã¢ÂÂ do NOT overestimate. Most MVPs take days to weeks, not months.
- Each tool in phases must include "alternatives": array of 1-2 backup options from the database. Format: [{ "name": "Tool", "reason": "Use if primary is too expensive / requires coding / unavailable in your region" }]. Pick real alternatives that genuinely replace the primary tool.
- "mistakes": exactly 3 common mistakes for someone at this skill+budget level. Be blunt. Max 2 sentences each.
- "scalability": 2-4 items. "severity": "low" | "medium" | "high". "trigger": specific metric.
- "upgrades": 2-4 items. When and what to migrate to.
- Use ONLY tools from the database below. Use their exact pricing. Do NOT invent tools or guess prices.
- CONCISENESS IS CRITICAL. Short, punchy text. No filler.

--- TOOL DATABASE (March 2026 verified pricing) ---
${compactToolsDB}`;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });

  const rl = rateLimit(userId, 10, 600000);
  if (!rl.ok) return new Response(JSON.stringify({ error: "Too many requests. Please slow down." }), { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } });
  const hasCredits = await deductCredit(userId);
  if (!hasCredits) return new Response(JSON.stringify({ error: "No credits remaining" }), { status: 402, headers: { "Content-Type": "application/json" } });
  const { idea, budget, techLevel, platform } = await req.json();

  if (!idea || typeof idea !== "string" || idea.trim().length < 3)
    return Response.json({ error: "Please describe what you want to build (min 3 chars)." }, { status: 400 });
  if (idea.length > 600)
    return Response.json({ error: "Too long Ã¢ÂÂ keep it under 600 characters." }, { status: 400 });
  if (!budget || !techLevel)
    return Response.json({ error: "Please select a budget and technical level." }, { status: 400 });

  // Cache key includes budget + tech level so different configs get different results
  const normalizedIdea = await normalizeQuery(idea);
  const normalizedKey = `${normalizedIdea}::${budget}::${techLevel}::${platform ?? "web"}`;
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
          max_tokens: 24000,
          thinking: { type: "enabled", budget_tokens: 10000 },
          system: SYSTEM,
          messages: [{ role: "user", content: PROMPT(idea, budget, techLevel, platform ?? "web") }],
        });
        for await (const event of s) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            full += event.delta.text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
          }
        }
        if (full) setCached(normalizedKey, full);
        if (full && userId) {
          try { await saveReport(userId, "stack-advisor", idea, full); } catch(e) { console.error("saveReport stack:", e); }
        }
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
