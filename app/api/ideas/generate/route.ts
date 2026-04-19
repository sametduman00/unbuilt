import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabase } from "@/app/lib/supabase";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CATEGORIES = [
  "saas", "ai_tools", "developer_tools", "productivity", "marketing",
  "automation", "ecommerce", "finance", "freelancing", "health",
  "education", "community", "design", "analytics", "sustainability",
  "food", "travel", "fitness", "parenting", "pet", "legal", "hr",
  "real_estate", "content_creation", "gaming",
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function POST(req: NextRequest) {
  // Verify auth: CRON_SECRET or IDEAS_CRON_KEY
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const ideasKey = process.env.IDEAS_CRON_KEY;
  const queryKey = req.nextUrl.searchParams.get("key");

  const isAuthed =
    !cronSecret ||
    authHeader === `Bearer ${cronSecret}` ||
    (ideasKey && authHeader === `Bearer ${ideasKey}`) ||
    (ideasKey && queryKey === ideasKey);

  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = getSupabase();

  // Fetch last 30 ideas to avoid repetition
  const { data: recent } = await sb
    .from("startup_ideas")
    .select("title")
    .order("created_at", { ascending: false })
    .limit(30);

  const recentTitles = (recent || []).map((r: { title: string }) => r.title).join(", ");
  const randomCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

  const prompt = `You are a startup idea generator for vibe coders (people who build apps using AI tools like Cursor, Lovable, Bolt, Replit).

Generate ONE unique, specific startup idea in the "${randomCategory}" category.

${recentTitles ? `ALREADY GENERATED (do NOT repeat these or similar): ${recentTitles}` : ""}

Requirements:
- The idea should be specific, not generic (e.g. "Invoice app with auto-tax for freelancers in EU" not "Invoice app")
- It should be buildable by a solo vibe coder in weeks, not months
- Focus on real market gaps — things people actually need but don't have good options for
- Be creative but realistic

Respond ONLY with valid JSON, no markdown, no backticks:
{
  "title": "Short product name (3-6 words)",
  "one_liner": "One sentence describing what it does and for whom",
  "problem": "The specific problem this solves (2-3 sentences)",
  "target_audience": "Who would use this (be specific)",
  "market_size": "Small / Medium / Large — with brief reasoning",
  "competition_level": "Low / Medium / High — name 1-2 existing alternatives if any",
  "difficulty": "Easy / Medium / Hard — considering vibe coding tools",
  "why_now": "Why this idea makes sense right now (1-2 sentences)",
  "gap_reason": "What's missing in existing solutions (1-2 sentences)",
  "opportunity_score": "A number 30-95 representing how big the opportunity is (higher = bigger gap)",
  "competitor_count": "Estimated number of direct competitors (integer)",
  "key_insight": "One sharp sentence about why this opportunity exists — be opinionated and specific"
}`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const slug = slugify(parsed.title) + "-" + Date.now().toString(36);

    const { data, error } = await sb
      .from("startup_ideas")
      .insert({
        title: parsed.title,
        slug,
        category: randomCategory,
        one_liner: parsed.one_liner,
        problem: parsed.problem,
        target_audience: parsed.target_audience,
        market_size: parsed.market_size,
        competition_level: parsed.competition_level,
        difficulty: parsed.difficulty,
        why_now: parsed.why_now,
        gap_reason: parsed.gap_reason,
        opportunity_score: Math.min(95, Math.max(10, parseInt(parsed.opportunity_score) || 50)),
        competitor_count: Math.max(0, parseInt(parsed.competitor_count) || 5),
        key_insight: parsed.key_insight || parsed.one_liner,
        status: "published",
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, idea: data });
  } catch (e: any) {
    console.error("Idea generation error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
