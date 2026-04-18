#!/usr/bin/env node
/**
 * generate-content.js
 * 
 * Picks draft SEO pages from Supabase, generates content with Claude Haiku,
 * updates the row, and sets status to "published".
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=yyy ANTHROPIC_API_KEY=zzz \
 *     node scripts/generate-content.js [--limit 100] [--category saas] [--dry-run]
 *
 * Cost estimate: ~$0.002 per page with Haiku → 5,000 pages ≈ $10
 */

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !ANTHROPIC_KEY) {
  console.error("Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── CLI args ──
const args = process.argv.slice(2);
function getArg(name) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
}
const LIMIT = parseInt(getArg("limit") || "50");
const CATEGORY = getArg("category");
const DRY_RUN = args.includes("--dry-run");
const CONCURRENCY = parseInt(getArg("concurrency") || "5");

// ── Claude Haiku API ──
async function callHaiku(prompt, maxTokens = 1024) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Haiku API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || "";
}

// ── Prompt builder ──
function buildPrompt(page) {
  return `You are a market analyst for the vibecoding generation. Generate a concise market analysis for the keyword: "${page.keyword}"

Category: ${page.category}
Pattern: ${page.pattern}

Respond ONLY in this exact JSON format, no markdown, no backticks:
{
  "intro": "2-3 sentence hook that addresses the reader directly. Sharp, specific, no fluff. Use 'you' not 'we'. Mention a specific number or data point if possible.",
  "market_summary": "4-6 sentences analyzing this market. Cover: (1) how many apps/tools exist in this space roughly, (2) what the common pain points or failures are, (3) where the actual gap or opportunity is, (4) what a new entrant should focus on. Be specific and actionable. Write in paragraphs not bullets.",
  "opportunity_score": <number 0-100 based on: low competition = higher, clear gap = higher, growing demand = higher, niche specificity = higher>,
  "competitor_count": <rough estimate of existing apps/tools in this exact niche, integer>,
  "key_insight": "One sharp sentence — the single most important thing someone should know before building in this space."
}

Rules:
- Never use the word "builder" — say vibecoder, maker, shipper, or founder instead.
- Be direct and honest. If the market is crowded, say so.
- Numbers should be realistic estimates, not made up precision.
- Keep total response under 400 words.
- Output valid JSON only. No explanation outside the JSON.`;
}

// ── Process a single page ──
async function processPage(page) {
  const prompt = buildPrompt(page);
  const raw = await callHaiku(prompt, 800);

  // Parse JSON — strip potential markdown fences
  const clean = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch (e) {
    console.error(`  ✗ JSON parse failed for ${page.slug}: ${e.message}`);
    console.error(`  Raw: ${raw.slice(0, 200)}`);
    return false;
  }

  // Validate
  if (!parsed.intro || !parsed.market_summary || typeof parsed.opportunity_score !== "number") {
    console.error(`  ✗ Missing fields for ${page.slug}`);
    return false;
  }

  if (DRY_RUN) {
    console.log(`  [DRY] ${page.slug}: score=${parsed.opportunity_score}, competitors=${parsed.competitor_count}`);
    console.log(`    intro: ${parsed.intro.slice(0, 80)}...`);
    return true;
  }

  // Update Supabase
  const { error } = await sb
    .from("seo_pages")
    .update({
      intro: parsed.intro,
      market_summary: parsed.market_summary,
      opportunity_score: Math.max(0, Math.min(100, Math.round(parsed.opportunity_score))),
      competitor_count: typeof parsed.competitor_count === "number" ? parsed.competitor_count : null,
      key_insight: parsed.key_insight || null,
      status: "published",
      updated_at: new Date().toISOString(),
    })
    .eq("id", page.id);

  if (error) {
    console.error(`  ✗ Supabase update failed for ${page.slug}: ${error.message}`);
    return false;
  }

  return true;
}

// ── Concurrency limiter ──
async function processInBatches(pages, concurrency) {
  let success = 0;
  let fail = 0;

  for (let i = 0; i < pages.length; i += concurrency) {
    const batch = pages.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      batch.map(async (page) => {
        try {
          const ok = await processPage(page);
          if (ok) {
            success++;
            console.log(`  ✓ ${page.slug} (${success + fail}/${pages.length})`);
          } else {
            fail++;
          }
        } catch (e) {
          fail++;
          console.error(`  ✗ ${page.slug}: ${e.message}`);
        }
      })
    );

    // Rate limit: wait 1s between batches
    if (i + concurrency < pages.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return { success, fail };
}

// ── Main ──
async function main() {
  console.log(`Generating content for draft SEO pages...`);
  console.log(`  Limit: ${LIMIT}, Category: ${CATEGORY || "all"}, Dry run: ${DRY_RUN}`);

  // Fetch draft pages
  let query = sb
    .from("seo_pages")
    .select("id, slug, keyword, pattern, category")
    .eq("status", "draft")
    .order("created_at", { ascending: true })
    .limit(LIMIT);

  if (CATEGORY) {
    query = query.eq("category", CATEGORY);
  }

  const { data: pages, error } = await query;

  if (error) {
    console.error("Supabase fetch error:", error.message);
    process.exit(1);
  }

  if (!pages || pages.length === 0) {
    console.log("No draft pages found. Nothing to do.");
    return;
  }

  console.log(`Found ${pages.length} draft pages. Starting generation...`);

  const { success, fail } = await processInBatches(pages, CONCURRENCY);

  console.log(`\nDone.`);
  console.log(`  ✓ ${success} pages generated`);
  console.log(`  ✗ ${fail} failures`);
  console.log(`  Estimated cost: ~$${(success * 0.002).toFixed(2)}`);
}

main().catch(console.error);
