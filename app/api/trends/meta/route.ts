import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { idea } = await req.json();
  if (!idea || typeof idea !== "string")
    return Response.json({ error: "idea required" }, { status: 400 });

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 150,
      messages: [{
        role: "user",
        content: `Startup idea: "${idea}"

Return JSON only — no explanation:
{
  "searchQuery": "4-6 domain-specific search terms (avoid generic words: AI, tool, app, software, startup, SaaS, platform)",
  "keywords": ["8-12 words that identify content as relevant to this specific domain — include synonyms and related concepts"]
}

Examples:
"Doctor helper" → {"searchQuery":"medical healthcare doctor clinical patient diagnosis","keywords":["medical","health","doctor","clinical","patient","healthcare","hospital","diagnosis","treatment","nurse","physician","ehr"]}
"AI for lawyers" → {"searchQuery":"legal law attorney contract compliance litigation","keywords":["legal","law","attorney","lawyer","compliance","contract","court","litigation","regulation","paralegal"]}
"Fitness tracking app" → {"searchQuery":"fitness workout exercise training nutrition","keywords":["fitness","workout","exercise","gym","training","nutrition","calories","strength","cardio","sport","wellness"]}`
      }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const meta = JSON.parse(jsonMatch[0]) as { searchQuery: string; keywords: string[] };
    if (typeof meta.searchQuery !== "string" || !Array.isArray(meta.keywords))
      throw new Error("Unexpected shape");

    return Response.json(meta);
  } catch {
    // Fallback: use raw words as keywords, raw idea as search query
    const words = idea.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter((w) => w.length > 3);
    return Response.json({ searchQuery: idea, keywords: words });
  }
}
