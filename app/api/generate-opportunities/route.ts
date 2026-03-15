import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { CATEGORIES } from "@/app/lib/categories";
import { getSupabase } from "@/app/lib/supabase";

/* ── Validation (shared with on-demand route) ─────────────────── */

const VALID_TYPES = ["Momentum", "Monopoly", "Gap", "Complaint", "Price", "Bundle"];

function validateOpportunities(opportunities: any[]): any[] {
  const yearCutoff = 2022;
  const filtered = opportunities.filter((opp) => {
    if (!VALID_TYPES.includes(opp.type)) return false;

    const evidenceLow = (opp.evidence || "").toLowerCase();
    if (/\b[0-3]\s+reviews?\b/.test(evidenceLow)) return false;

    if (opp.type === "Momentum") {
      const combined = `${opp.evidence || ""} ${opp.typeReason || ""}`;
      const years = combined.match(/\b(20\d{2})\b/g);
      if (years && years.some((y: string) => parseInt(y, 10) <= yearCutoff)) return false;

      const allNums = combined
        .match(/\b(\d{1,3}(?:,\d{3})*|\d+)\b/g)
        ?.map((n: string) => parseInt(n.replace(/,/g, ""), 10)) || [];
      const reviewNums = allNums.filter((n: number) => n >= 1000 && n < 2000000 && !(n >= 2000 && n <= 2099));
      if (reviewNums.length === 0) return false;
    }

    if (opp.type === "Complaint") {
      const evidence = opp.evidence || "";
      const ratings = evidence.match(/\d+\.\d+/g);
      const anyNumbers = evidence.match(/\d+/g);
      if (!anyNumbers || anyNumbers.length === 0) return false;
      if (ratings && ratings.some((r: string) => parseFloat(r) > 4.2)) return false;
    }

    if (opp.type === "Monopoly") {
      const nums = (opp.evidence || "").match(/[\d,]+/g);
      if (nums) {
        const parsed = nums.map((n: string) => parseInt(n.replace(/,/g, ""), 10)).filter((n: number) => !isNaN(n) && n > 0);
        parsed.sort((a: number, b: number) => b - a);
        if (parsed.length >= 2 && parsed[0] / parsed[1] < 5.0) return false;
      }
    }

    if (opp.type === "Price") {
      const el = (opp.evidence || "").toLowerCase();
      if (el.includes("likely") || el.includes("appears to") || el.includes("probably")) return false;
    }

    return true;
  });

  // Dedup by title keywords
  const stopWords = new Set(["the", "and", "for", "with", "app", "tool", "new", "based", "more", "into", "that", "from"]);
  const getKw = (t: string) => (t || "").toLowerCase().split(/\s+/).filter((w: string) => w.length >= 3 && !stopWords.has(w));

  const deduped: any[] = [];
  for (const opp of filtered) {
    if (opp.type === "Monopoly") { deduped.push(opp); continue; }
    const kw = getKw(opp.title);
    const dupeIdx = deduped.findIndex((e) => {
      if (e.type === "Monopoly") return false;
      const shared = kw.filter((k: string) => getKw(e.title).includes(k));
      return shared.length >= 2;
    });
    if (dupeIdx === -1) { deduped.push(opp); continue; }
    const evStr = (o: any) => (o.evidence || "").length + ((o.evidence || "").match(/[\d,]+/g) || []).length * 10;
    if (evStr(opp) > evStr(deduped[dupeIdx])) deduped[dupeIdx] = opp;
  }

  // Max 2 per type
  const byType: Record<string, any[]> = {};
  for (const o of deduped) (byType[o.type] ??= []).push(o);
  const result: any[] = [];
  for (const opps of Object.values(byType)) {
    if (opps.length <= 2) { result.push(...opps); continue; }
    const evStr = (o: any) => (o.evidence || "").length + ((o.evidence || "").match(/[\d,]+/g) || []).length * 10;
    opps.sort((a: any, b: any) => evStr(b) - evStr(a));
    result.push(...opps.slice(0, 2));
  }
  return result;
}

/* ── iTunes fetcher ────────────────────────────────────────────── */

const SEARCH_MAP: Record<string, string> = {
  "Streaming & Video": "video streaming watch app",
  "Recipe & Cooking": "recipe cooking food app",
  "Community Building": "community app social",
  "Note Taking": "notes productivity app",
  "Meditation & Mindfulness": "meditation mindfulness app",
  "Action Games": "action games mobile",
  "Casual Games": "casual games mobile",
  "Puzzle Games": "puzzle games mobile",
  "Strategy Games": "strategy games mobile",
  "Secondhand & Resale": "thrift resale buy sell app",
};

async function fetchITunesBulk(subcategory: string, categoryLabel: string): Promise<any[]> {
  const term1 = SEARCH_MAP[subcategory] || subcategory + " app";
  const term2 = subcategory + " " + categoryLabel;

  const [res1, res2] = await Promise.all([
    fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term1)}&entity=software&limit=50`, { signal: AbortSignal.timeout(10000) }).then(r => r.ok ? r.json() : { results: [] }).catch(() => ({ results: [] })),
    fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term2)}&entity=software&limit=50`, { signal: AbortSignal.timeout(10000) }).then(r => r.ok ? r.json() : { results: [] }).catch(() => ({ results: [] })),
  ]);

  // Deduplicate by trackId
  const seen = new Set<number>();
  const all: any[] = [];
  for (const r of [...(res1.results ?? []), ...(res2.results ?? [])]) {
    if (r.trackId && seen.has(r.trackId)) continue;
    if (r.trackId) seen.add(r.trackId);
    all.push({
      name: r.trackName ?? "",
      rating: r.averageUserRating ?? 0,
      reviewCount: r.userRatingCount ?? 0,
      releaseDate: r.releaseDate ?? "",
      price: r.formattedPrice ?? "Free",
      description: r.description ?? "",
    });
  }
  return all.slice(0, 100);
}

/* ── Analyze with Haiku ────────────────────────────────────────── */

async function analyzeWithHaiku(
  client: Anthropic,
  subcategory: string,
  categoryLabel: string,
  apps: any[],
): Promise<any[]> {
  const now = Date.now();
  const sixMonths = 180 * 24 * 60 * 60 * 1000;

  // Sort by reviews desc, take top 20 for prompt
  const sorted = [...apps].sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
  const top = sorted.slice(0, 20);

  // Format as compact pipe-separated
  const appLines = top.map((a) => {
    const days = a.releaseDate ? Math.floor((now - new Date(a.releaseDate).getTime()) / (24 * 60 * 60 * 1000)) : 999;
    return `${a.name}|${(a.rating || 0).toFixed(2)}|${a.reviewCount || 0}|${a.price || "Free"}|${days}d`;
  }).join("\n");

  // New releases
  const newReleases = apps.filter((a) => a.releaseDate && now - new Date(a.releaseDate).getTime() <= sixMonths);
  const newLines = newReleases.slice(0, 5).map((a) => {
    const days = Math.floor((now - new Date(a.releaseDate).getTime()) / (24 * 60 * 60 * 1000));
    return `${a.name}|${(a.rating || 0).toFixed(2)}|${a.reviewCount || 0}|${days}d`;
  }).join("\n");

  const prompt = `Analyze "${subcategory}" in "${categoryLabel}" category. Generate 6-10 data-driven market opportunities for indie app developers.

## Top Apps (Name|Rating|Reviews|Price|Age)
${appLines || "No apps found"}

## New Releases (last 180 days)
${newLines || "None"}

Types (use ONLY if data qualifies):
- MOMENTUM: New app (180 days) with 1,000+ reviews. ONLY cite apps with reviewCount >= 1000. If no app has 1000+ reviews, do NOT generate Momentum.
- MONOPOLY: #1 app has 5x+ reviews vs #2. Evidence: both counts + ratio.
- GAP: <5 apps OR all <10K reviews OR avg rating <4.0. Evidence: app names + review counts.
- COMPLAINT: Apps rated 3.0-4.2 ONLY. Never cite apps rated 4.3+. Evidence: app name + exact rating + review count.
- PRICE: All top apps paid/$2.99+ or subscription-only. Evidence: price data.
- BUNDLE: 3+ single-purpose apps. Evidence: "[App1] does X, [App2] does Y, [App3] does Z — no combined solution."

Return ONLY JSON array:
[{"title":"<8 words>","type":"Momentum|Monopoly|Gap|Complaint|Price|Bundle","difficulty":"Easy|Medium|Hard","description":"<2 sentences>","evidence":"<specific data>","typeReason":"<1 sentence>","targetAudience":"<1 sentence>","difficultyReason":"<1 sentence>","searchQuery":"<2-4 words>"}]

HARD RULES:
- Complaint ratings must be ≤ 4.20. Evidence must have numbers.
- Cite specific app names and numbers. No generic ideas.
- Each opportunity must reveal a non-obvious insight from the data.
- NEVER mention AI model names (Claude, GPT, Gemini, LLaMA etc.).`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await client.messages.create(
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        system: "You are an expert app market analyst. Analyze App Store data and find 6-10 genuine market opportunities. Be specific, cite app names and review counts. Never mention AI model names.",
        messages: [{ role: "user", content: prompt }],
      },
      { signal: controller.signal as any },
    );
    clearTimeout(timeout);

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    let raw = JSON.parse(cleaned);

    // Clean raw data leaking into evidence
    for (const opp of raw) {
      if (opp.evidence) {
        opp.evidence = opp.evidence
          .replace(/\[\s*\]/g, "none")
          .replace(/New Releases \(180 days\):\s*/gi, "")
          .replace(/\s{2,}/g, " ")
          .trim();
      }
    }

    // Truncate evidence
    raw = raw.map((opp: any) => ({
      ...opp,
      evidence: opp.evidence?.length > 300
        ? (opp.evidence.slice(0, 300).replace(/[^.]*$/, "").trim() || opp.evidence.slice(0, 300).trim())
        : opp.evidence,
    }));

    return validateOpportunities(raw);
  } catch (err) {
    clearTimeout(timeout);
    console.error(`Haiku error for ${subcategory}:`, err instanceof Error ? err.message : err);
    return [];
  }
}

/* ── POST handler (cron / manual trigger) ──────────────────────── */

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Auth: check cron secret
  const cronSecret = process.env.CRON_SECRET;
  const headerSecret = req.headers.get("x-cron-secret");
  const authHeader = req.headers.get("authorization");
  const isVercelCron = authHeader === `Bearer ${cronSecret}`;
  const isManual = headerSecret === cronSecret;

  if (!cronSecret || (!isVercelCron && !isManual)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  let total = 0;
  let successful = 0;
  let failed = 0;
  let totalOpportunities = 0;
  const details: { category: string; subcategory: string; count: number }[] = [];

  for (const category of CATEGORIES) {
    for (const subcategory of category.subcategories) {
      total++;

      try {
        console.log(`[GENERATE] ${category.label} > ${subcategory}...`);

        // Fetch iTunes data (2 parallel calls, deduped)
        const apps = await fetchITunesBulk(subcategory, category.label);

        // Relevance filter
        const words = subcategory.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
        const relevant = apps.filter((app: any) => {
          const t = `${app.name} ${app.description || ""}`.toLowerCase();
          return words.length >= 2
            ? words.every((w: string) => t.includes(w))
            : words.some((w: string) => t.includes(w));
        });
        const finalApps = relevant.length >= 3 ? relevant : apps;

        // Analyze
        const opportunities = await analyzeWithHaiku(client, subcategory, category.label, finalApps);

        // Upsert to Supabase
        await getSupabase().from("opportunity_cache").upsert({
          category: category.slug,
          subcategory,
          opportunities,
          generated_at: new Date().toISOString(),
          app_count: finalApps.length,
        });

        successful++;
        totalOpportunities += opportunities.length;
        details.push({ category: category.slug, subcategory, count: opportunities.length });
        console.log(`[GENERATE] ${category.slug}/${subcategory}: ${opportunities.length} opps`);

        // Small delay to avoid iTunes rate limiting
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        failed++;
        details.push({ category: category.slug, subcategory, count: 0 });
        console.error(`[GENERATE] ✗ ${subcategory}:`, err instanceof Error ? err.message : err);
      }
    }
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log(`[GENERATE] Done in ${elapsed}s: ${successful}/${total} successful, ${totalOpportunities} opportunities`);

  return NextResponse.json({
    total,
    successful,
    failed,
    totalOpportunities,
    elapsedSeconds: elapsed,
    details,
  });
}
