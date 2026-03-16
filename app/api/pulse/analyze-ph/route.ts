import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { signals } = await req.json();
    if (!signals || signals.length === 0) return NextResponse.json({ analyses: [] });

    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const BATCH_SIZE = 20;
    let allAnalyses: { name: string; what: string; different: string; missing: string }[] = [];

    for (let i = 0; i < signals.length; i += BATCH_SIZE) {
      const batch = signals.slice(i, i + BATCH_SIZE);
      const productList = batch
        .map((s: any) => `Product: ${s.title}\nTagline: ${s.signal}\nTopics: ${(s.topics ?? []).join(", ")}`)
        .join("\n\n---\n\n");

      try {
        const msg = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 2000,
          messages: [{
            role: "user",
            content: `Analyze each Product Hunt product. For each, answer 3 things in English (max 10 words each):
1. "what": What it does and who it's for (be concrete)
2. "different": What makes it genuinely different from alternatives (be specific, not "uses AI")
3. "missing": The most obvious gap or missing feature (be specific)

Return ONLY a JSON array, no other text:
[{"name":"...","what":"...","different":"...","missing":"..."}]

Products:
${productList}`,
          }],
        });

        const text = msg.content[0]?.type === "text" ? msg.content[0].text : "";
        // Strip markdown fences if present
        const clean = text.replace(/```json|\n```|```/g, "").trim();
        const match = clean.match(/\[[\s\S]*\]/);
        if (match) {
          const batchAnalyses = JSON.parse(match[0]);
          allAnalyses = [...allAnalyses, ...batchAnalyses];
        }
        console.log(`[ANALYZE-PH] batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} products analyzed`);
      } catch (err) {
        console.log(`[ANALYZE-PH] batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, err instanceof Error ? err.message : err);
      }
    }

    console.log("[ANALYZE-PH] total analyses:", allAnalyses.length);
    return NextResponse.json({ analyses: allAnalyses });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ANALYZE-PH] FAILED:", msg);
    return NextResponse.json({ analyses: [], error: msg });
  }
}
