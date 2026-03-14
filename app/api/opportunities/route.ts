import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CATEGORY_LABELS: Record<string, string> = {
  "gaming": "Gaming",
  "health-fitness": "Health & Fitness",
  "finance-fintech": "Finance & Fintech",
  "education": "Education",
  "developer-tools": "Developer Tools",
  "home-lifestyle": "Home & Lifestyle",
  "business-productivity": "Business & Productivity",
  "social-relationships": "Social & Relationships",
};

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category")?.trim();

  if (!category || !CATEGORY_LABELS[category]) {
    return NextResponse.json(
      { error: "Valid category parameter required.", valid: Object.keys(CATEGORY_LABELS) },
      { status: 400 },
    );
  }

  const label = CATEGORY_LABELS[category];

  try {
    const res = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `You are a market opportunity analyst for indie developers and small teams.

For the category "${label}", generate 6 genuine market opportunities.

Each opportunity must meet ALL three criteria:
1. Real demand exists (people are searching for or complaining about this)
2. Current solutions are missing, expensive, or poor quality
3. Buildable by 1-2 developers in 3-6 months

Return ONLY valid JSON array (no markdown, no code fences):
[
  {
    "title": "<max 8 words>",
    "type": "<exactly one of: Mobile App | Web SaaS | Developer Tool | Marketplace | Community>",
    "difficulty": "<exactly one of: Easy | Medium | Hard>",
    "targetAudience": "<max 15 words>",
    "whyNow": "<max 25 words>",
    "searchQuery": "<2-4 words, for trend analysis>"
  }
]

Be specific. No generic ideas. Each opportunity must be something a developer could start building this week.`,
      }],
    });

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const opportunities = JSON.parse(cleaned);

    return NextResponse.json({ category, label, opportunities });
  } catch (err) {
    console.error("opportunities error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
