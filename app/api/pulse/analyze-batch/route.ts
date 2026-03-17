import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";

// Called by GitHub Actions in a loop until done:true
// Each call analyzes 20 unanalyzed PH products and patches the cache
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = getSupabase();

  const { data: cache } = await sb
    .from("pulse_feed_cache")
    .select("id, signals")
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  if (!cache) return NextResponse.json({ ok: false, error: "No cache" });

  const allSignals = cache.signals as any[];
  const phSignals = allSignals.filter(s => s.source === "producthunt");
  const unanalyzed = phSignals.filter(s => !s.claudeGap && s.url);
  const remaining = unanalyzed.length;

  console.log(`[ANALYZE-BATCH] ${remaining} remaining / ${phSignals.length} total`);

  if (remaining === 0) {
    return NextResponse.json({ ok: true, analyzed: 0, remaining: 0, done: true });
  }

  const batch = unanalyzed.slice(0, 20);
  const analyses = await analyzeBatch(batch);

  if (analyses.length === 0) {
    return NextResponse.json({ ok: false, error: "No results from Claude" });
  }

  // Save to ph_analyses permanent table
  const rows = analyses.map((a: any) => {
    const sig = batch.find((s: any) => s.title?.trim().toLowerCase() === a.name?.trim().toLowerCase());
    return { product_url: sig?.url ?? "", product_name: a.name, what: a.what, different: a.different, missing: a.missing };
  }).filter((r: any) => r.product_url);
  if (rows.length > 0) await sb.from("ph_analyses").upsert(rows, { onConflict: "product_url" });

  // Patch cache with new analyses
  const gapMap = new Map<string, string>();
  for (const a of analyses) {
    const sig = batch.find((s: any) => s.title?.trim().toLowerCase() === a.name?.trim().toLowerCase());
    if (sig?.url) gapMap.set(sig.url, `${a.what} ✦ Different: ${a.different} ✦ Missing: ${a.missing}`);
  }
  const patched = allSignals.map((s: any) => {
    if (s.source !== "producthunt" || s.claudeGap || !s.url) return s;
    const gap = gapMap.get(s.url);
    return gap ? { ...s, claudeGap: gap } : s;
  });
  await sb.from("pulse_feed_cache").update({ signals: patched }).eq("id", cache.id);

  const newRemaining = remaining - analyses.length;
  console.log(`[ANALYZE-BATCH] analyzed: ${analyses.length}, remaining: ${newRemaining}`);
  return NextResponse.json({ ok: true, analyzed: analyses.length, remaining: newRemaining, done: newRemaining === 0 });
}

feat: analyze-batch endpoint, 20 per call, loops until done  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const list = signals.map((s: any) =>
      `Product: ${s.title}\nTagline: ${s.tagline || ""}\nTopics: ${(s.topics ?? []).join(", ")}`
    ).join("\n\n---\n\n");
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001", max_tokens: 2000,
      messages: [{ role: "user", content: `Analyze each Product Hunt product. For each answer 3 things in English (max 12 words):
1. "what": What it does and who it's for (concrete)
2. "different": What genuinely differentiates it (not "uses AI")
3. "missing": Most obvious gap or missing feature (specific)
Return ONLY a JSON array, no markdown:
[{"name":"...","what":"...","different":"...","missing":"..."}]
Products:
${list}` }],
    });
    const text = msg.content[0]?.type === "text" ? msg.content[0].text : "";
    const match = text.replace(/```json|\n```|```/g, "").trim().match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch(e) {
    console.log("[ANALYZE-BATCH] error:", e instanceof Error ? e.message : e);
    return [];
  }
}
