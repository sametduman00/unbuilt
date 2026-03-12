// Normalize user queries to canonical keys using Claude Haiku (cheap + fast)
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Cache normalization results so we don't re-call the API for identical raw queries
const normCache = new Map<string, string>();

export async function normalizeQuery(query: string): Promise<string> {
  const raw = query.toLowerCase().trim();
  if (normCache.has(raw)) return normCache.get(raw)!;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 20,
      messages: [
        {
          role: "user",
          content: `Convert to a short canonical form (2–5 lowercase words, no filler). Examples:
"AI for attorneys" → "legal ai tools"
"B2B SaaS productivity apps for remote teams" → "b2b saas productivity"
"subscription box for pet owners" → "pet subscription boxes"

Query: "${query}"
Return ONLY the normalized form, nothing else.`,
        },
      ],
    });

    const normalized =
      response.content[0].type === "text"
        ? response.content[0].text.trim().toLowerCase().slice(0, 100)
        : raw.slice(0, 100);

    normCache.set(raw, normalized);
    return normalized;
  } catch {
    // Fallback: basic string normalization — still deterministic
    const fallback = raw.replace(/[^\w\s]/g, "").replace(/\s+/g, " ").slice(0, 100);
    normCache.set(raw, fallback);
    return fallback;
  }
}
