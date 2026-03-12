import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { getCached, setCached, TTL_MS } from "../_cache";
import { normalizeQuery } from "../_normalize";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a sharp, experienced market analyst and startup advisor.
You produce concise, highly actionable competitor analysis and market gap reports.
Your tone is direct, insightful, and slightly contrarian — you cut through hype.

IMPORTANT: You MUST respond with ONLY a single JSON code block. No text before or after.
The JSON must match the exact schema provided. Be specific: name real competitors, real products, real pain points.`;

const USER_PROMPT = (idea: string) => `Analyze the market for: "${idea}"

Respond with ONLY a JSON code block matching this exact schema:

\`\`\`json
{
  "appStoreQuery": "photo calorie recognition",
  "marketScore": 72,
  "marketScoreLabel": "Real Opportunity",
  "marketScoreSummary": "One sentence summary of the overall market opportunity level",
  "competitors": [
    {
      "name": "Competitor Name",
      "tagline": "What they do in one line",
      "threatLevel": 3,
      "strengths": ["Strength 1", "Strength 2"],
      "weaknesses": ["Weakness 1", "Weakness 2"]
    }
  ],
  "painPoints": [
    {
      "quote": "The actual complaint or pain description users have",
      "source": "Where this sentiment comes from (Reddit, G2, Twitter, etc)",
      "severity": "high"
    }
  ],
  "marketGaps": [
    {
      "title": "Gap Name",
      "description": "What's missing and why it matters — be specific",
      "opportunityScore": 8,
      "status": "untapped"
    }
  ],
  "swot": {
    "strengths": ["Advantage 1", "Advantage 2", "Advantage 3"],
    "weaknesses": ["Challenge 1", "Challenge 2", "Challenge 3"],
    "opportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"],
    "threats": ["Threat 1", "Threat 2", "Threat 3"]
  },
  "opportunity": {
    "headline": "One bold sentence describing the core opportunity",
    "urgency": "high",
    "actionItems": [
      { "step": 1, "action": "Action title", "detail": "Brief explanation" },
      { "step": 2, "action": "Action title", "detail": "Brief explanation" },
      { "step": 3, "action": "Action title", "detail": "Brief explanation" }
    ]
  },
  "targetCustomer": {
    "persona": "The Frustrated [Role]",
    "jobTitle": "Specific job title or role",
    "demographics": "Age range, company size, industry",
    "painPoints": ["Pain 1", "Pain 2", "Pain 3"],
    "currentTools": ["Tool they currently use 1", "Tool 2"],
    "willingnessToPay": "What they'd pay and why"
  }
}
\`\`\`

Rules:
- "appStoreQuery": 2-3 specific words to find direct competitors for this EXACT idea on the App Store. Not the generic category — the specific niche. E.g. for "app that calculates calories by pictures" use "photo calorie recognition", not "calorie tracker".
- "marketScore": 1-100 integer assessing overall market opportunity. "marketScoreLabel": one of "No Gap" (0-20), "Crowded" (21-40), "Some Room" (41-60), "Real Opportunity" (61-80), "Wide Open" (81-100). "marketScoreSummary": one sentence explaining the score.
- "competitors": 4-6 real companies. "threatLevel": 1-5 integer (1=minor, 5=dominant). "tagline": max 1 sentence. "strengths": exactly 1 item. "weaknesses": exactly 1 item. Keep each under 12 words.
- "painPoints": 4-6 items. "severity": "high" | "medium" | "low". Keep the full quote — never truncate. "source" should be a real platform name.
- "marketGaps": 3-5 items. "opportunityScore": 1-10 integer. "status": "untapped" | "emerging" | "contested". "description": max 2 complete sentences.
- "swot": 3-4 bullet points per quadrant. Max 10 words per bullet point. Frame from the perspective of a NEW entrant in this market.
- "opportunity": 3-4 actionItems. "urgency": "high" | "medium" | "low". "detail": max 2 sentences per step.
- "targetCustomer": be specific and concrete, not generic. Keep "willingnessToPay" to 1 sentence.
- Be brutally honest. Name real companies and real products. Skip generic advice.
- CONCISENESS IS CRITICAL. Every string value should be as short as possible while retaining key information. No filler words.`;

export async function POST(req: NextRequest) {
  const { idea } = await req.json();

  if (!idea || typeof idea !== "string" || idea.trim().length < 3)
    return Response.json({ error: "Please provide a valid idea (min 3 characters)." }, { status: 400 });
  if (idea.length > 500)
    return Response.json({ error: "Idea is too long (max 500 characters)." }, { status: 400 });

  const normalizedKey = await normalizeQuery(idea);
  const cached = getCached(normalizedKey, TTL_MS.analyze);

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
        const anthropicStream = client.messages.stream({
          model: "claude-opus-4-6",
          max_tokens: 16000,
          thinking: { type: "enabled", budget_tokens: 10000 },
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: USER_PROMPT(idea) }],
        });
        for await (const event of anthropicStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            full += event.delta.text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
          }
        }
        if (full) setCached(normalizedKey, full);
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
