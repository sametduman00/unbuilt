import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";

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
  const phSignals = allSignals.filter((s: any) => s.source === "producthunt");
  const unanalyzed = phSignals.filter((s: any) => !s.claudeGap && s.url);
  const remaining = unanalyzed.length;

  console.log("[ANALYZE-BATCH] " + remaining + " remaining / " + phSignals.length + " total");

  if (remaining === 0) {
    return NextResponse.json({ ok: true, analyzed: 0, remaining: 0, done: true });
  }

  const batch = unanalyzed.slice(0, 8);
  const analyses = await analyzeBatch(batch);

  if (analyses.length === 0) {
    return NextResponse.json({ ok: false, error: "No results from Claude" });
  }

  const SEPARATOR = " ✦ Different: ";
  const MISSING_SEP = " ✦ Missing: ";

  const rows = analyses.map((a: any) => {
    const sig = batch.find((s: any) => s.title?.trim().toLowerCase() === a.name?.trim().toLowerCase());
    return { product_url: sig?.url ?? "", product_name: a.name, what: a.what, different: a.different, missing: a.missing };
  }).filter((r: any) => r.product_url);

  if (rows.length > 0) {
    await sb.from("ph_analyses").upsert(rows, { onConflict: "product_url" });
  }

  const gapMap = new Map<string, string>();
  for (const a of analyses) {
    const sig = batch.find((s: any) => s.title?.trim().toLowerCase() === a.name?.trim().toLowerCase());
    if (sig?.url) {
      gapMap.set(sig.url, a.what + SEPARATOR + a.different + MISSING_SEP + a.missing);
    }
  }

  const patched = allSignals.map((s: any) => {
    if (s.source !== "producthunt" || s.claudeGap || !s.url) return s;
    const gap = gapMap.get(s.url);
    return gap ? { ...s, claudeGap: gap } : s;
  });

  await sb.from("pulse_feed_cache").update({ signals: patched }).eq("id", cache.id);

  const newRemaining = remaining - analyses.length;
  console.log("[ANALYZE-BATCH] analyzed: " + analyses.length + ", remaining: " + newRemaining);

  return NextResponse.json({ ok: true, analyzed: analyses.length, remaining: newRemaining, done: newRemaining === 0 });
}

async function analyzeBatch(signals: any[]): Promise<any[]> {
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const list = signals
      .map((s: any) => "Product: " + s.title + "\nTagline: " + (s.tagline || "") + "\nTopics: " + (s.topics ?? []).join(", "))
      .join("\n\n---\n\n");

    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: `You are a sharp product analyst who writes for founders. Analyze each Product Hunt product with depth and honesty.

For each product write:
1. "what": 1-2 sentences — what it does and exactly who it's for. Be specific about the use case and target user, not generic.
2. "different": 1-2 sentences — what genuinely sets it apart from existing tools. Name the specific category or competitors it's up against and explain the real differentiation. Never say "uses AI" as a differentiator.
3. "missing": 1-2 sentences — which user segment can't use this yet, or what one concrete addition would make it significantly more powerful. Must be a real gap, not a vague complaint.

Rules:
- Write in plain English, no marketing fluff
- Be direct and specific — name real alternatives where relevant
- "missing" must always identify an absence, never spin it positively

Return ONLY a JSON array, no markdown:
[{"name":"...","what":"...","different":"...","missing":"..."}]

Products:
${list}`
      }],
    });

    const text = msg.content[0]?.type === "text" ? msg.content[0].text : "";
    const clean = text.replace(/```json|```/g, "").trim();
    const match = clean.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch (e) {
    console.log("[ANALYZE-BATCH] error: " + (e instanceof Error ? e.message : String(e)));
    return [];
  }
}
