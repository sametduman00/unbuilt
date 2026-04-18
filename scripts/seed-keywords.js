#!/usr/bin/env node
/**
 * seed-keywords.js
 * 
 * Pushes generated keywords into Supabase seo_pages table.
 * Only inserts new slugs (skips existing).
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=yyy node scripts/seed-keywords.js
 *
 * Or with .env.local loaded:
 *   node -e "require('dotenv').config({path:'.env.local'})" scripts/seed-keywords.js
 */

const { createClient } = require("@supabase/supabase-js");
const keywords = require("../data/seo-keywords.json");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

function generateTitle(kw) {
  const k = kw.keyword;
  const p = kw.pattern;

  switch (p) {
    case "best_x_for_y":
      return `${capitalize(k)} — Market Analysis & Top Picks | Unbuilt`;
    case "alternative_to":
      return `${capitalize(k)} — Best Options in 2026 | Unbuilt`;
    case "is_there_app":
      return `${capitalize(k)}? What Exists & What's Missing | Unbuilt`;
    case "how_to_build":
      return `${capitalize(k)} — Market Gap & Tools | Unbuilt`;
    case "top_x":
      return `${capitalize(k)} — Ranked by Market Data | Unbuilt`;
    case "comparison":
      return `${capitalize(k)} — Honest Comparison | Unbuilt`;
    case "market_gap":
      return `${capitalize(k)} — Where the Opportunity Is | Unbuilt`;
    case "long_tail":
      return `${capitalize(k)} — Data-Driven Analysis | Unbuilt`;
    default:
      return `${capitalize(k)} | Unbuilt`;
  }
}

function generateMetaDesc(kw) {
  const k = kw.keyword;
  switch (kw.pattern) {
    case "best_x_for_y":
      return `Looking for ${k}? We scanned the market — here's what exists, what's missing, and where the real opportunity is.`;
    case "alternative_to":
      return `Exploring ${k}? See what the market looks like, what gaps remain, and which options actually fit your needs.`;
    case "is_there_app":
      return `${capitalize(k)} — find out what already exists, what users complain about, and where the gap is.`;
    case "how_to_build":
      return `Want to know ${k}? Here's the market landscape, competition level, and the fastest path to ship.`;
    case "top_x":
      return `${capitalize(k)} — ranked by real market data. See what's popular, what's missing, and where to compete.`;
    case "comparison":
      return `${capitalize(k)} — an honest look at both options with market data, not marketing copy.`;
    case "market_gap":
      return `${capitalize(k)} — discover untapped opportunities with real market data and competitor analysis.`;
    default:
      return `${capitalize(k)} — market analysis, competitor data, and opportunity score. Powered by Unbuilt.`;
  }
}

function generateH1(kw) {
  const k = kw.keyword;
  switch (kw.pattern) {
    case "best_x_for_y":
      return capitalize(k);
    case "alternative_to":
      return capitalize(k);
    case "is_there_app":
      return capitalize(k) + "?";
    case "how_to_build":
      return capitalize(k);
    case "top_x":
      return capitalize(k);
    case "comparison":
      return capitalize(k);
    case "market_gap":
      return capitalize(k);
    default:
      return capitalize(k);
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function main() {
  console.log(`Seeding ${keywords.length} keywords into Supabase...`);

  // Get existing slugs
  const { data: existing } = await sb
    .from("seo_pages")
    .select("slug");

  const existingSlugs = new Set((existing || []).map((r) => r.slug));
  console.log(`${existingSlugs.size} slugs already exist, skipping.`);

  const newRows = keywords
    .filter((kw) => !existingSlugs.has(kw.slug))
    .map((kw) => ({
      slug: kw.slug,
      keyword: kw.keyword,
      pattern: kw.pattern,
      category: kw.category,
      title: generateTitle(kw),
      meta_description: generateMetaDesc(kw),
      h1: generateH1(kw),
      intro: null,
      market_summary: null,
      opportunity_score: 0,
      competitor_count: null,
      key_insight: null,
      tags: kw.tags || [],
      status: "draft",   // will become "published" after content generation
    }));

  console.log(`Inserting ${newRows.length} new rows...`);

  // Batch insert in chunks of 500
  const CHUNK = 500;
  let inserted = 0;
  for (let i = 0; i < newRows.length; i += CHUNK) {
    const chunk = newRows.slice(i, i + CHUNK);
    const { error } = await sb.from("seo_pages").insert(chunk);
    if (error) {
      console.error(`Error at chunk ${i}:`, error.message);
    } else {
      inserted += chunk.length;
      console.log(`  Inserted ${inserted}/${newRows.length}`);
    }
  }

  console.log(`Done. ${inserted} rows inserted.`);
}

main().catch(console.error);
