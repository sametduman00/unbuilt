import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { signals } = await req.json();
    if (!signals || signals.length === 0) return NextResponse.json({ analyses: [] });

    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // 20'şerli batch'ler halinde analiz et
    const BATCH_SIZE = 20;
    let allAnalyses: { name: string; different: string; missing: string }[] = [];

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
            content: `Analyze each Product Hunt product. For each, answer 2 things in English:
1. "different": What makes it genuinely different from alternatives? (1 sharp sentence, be specific — not generic like "uses AI")
2. "missing": The most obvious gap or missing feature? (1 sharp sentence, be specific)

Return ONLY JSON array, no other text:
[{"name":"...","different":"...","missing":"..."}]

Products:
${productList}`,
          }],
        });

        const text = msg.content[0]?.type === "text" ? msg.content[0].text : "";
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
          const batch_analyses = JSON.parse(match[0]);
          allAnalyses = [...allAnalyses, ...batch_analyses];
        }
        console.log(`[ANALYZE-PH] batch ${Math.floor(i/BATCH_SIZE)+1}: ${batch.length} ürün analiz edildi`);
      } catch (err) {
        console.log(`[ANALYZE-PH] batch ${Math.floor(i/BATCH_SIZE)+1} failed:`, err instanceof Error ? err.message : err);
      }
    }

    console.log("[ANALYZE-PH] toplam analiz:", allAnalyses.length);
    return NextResponse.json({ analyses: allAnalyses });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ANALYZE-PH] FAILED:", msg);
    return NextResponse.json({ analyses: [], error: msg });
  }
}
