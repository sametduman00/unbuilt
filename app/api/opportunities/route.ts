import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getCategoryBySlug } from "@/app/lib/categories";
import { getSupabase } from "@/app/lib/supabase";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/* ── Data fetchers ───────────────────────────────────────────── */

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

async function fetchITunes(query: string) {
  try {
    const searchTerm = SEARCH_MAP[query] || query + " app";
    console.log("SEARCH TERM:", searchTerm);
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&entity=software&limit=50`;
    console.log("iTunes search URL:", url);
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).map((r: any) => ({
      name: r.trackName ?? "",
      rating: r.averageUserRating ?? 0,
      reviewCount: r.userRatingCount ?? 0,
      releaseDate: r.releaseDate ?? "",
      price: r.formattedPrice ?? "Free",
      description: r.description ?? "",
    }));
  } catch {
    return [];
  }
}

function filterNewReleases(apps: any[]) {
  const now = Date.now();
  const cutoff = 180 * 24 * 60 * 60 * 1000;
  const recent = apps
    .filter((a) => a.releaseDate && now - new Date(a.releaseDate).getTime() <= cutoff);
  return recent
    .map((a) => {
      const daysAgo = Math.floor((now - new Date(a.releaseDate).getTime()) / (24 * 60 * 60 * 1000));
      const sortScore = (a.rating || 0) * Math.log10(Math.max(a.reviewCount || 1, 1));
      return { ...a, daysAgo, sortScore };
    })
    .sort((a, b) => b.sortScore - a.sortScore)
    .slice(0, 5)
    .map(({ sortScore: _, ...rest }) => rest);
}

async function fetchProductHunt(query: string) {
  const token = process.env.PRODUCTHUNT_API_KEY;
  if (!token) return [];
  try {
    const gqlQuery = `query { posts(order: VOTES, first: 20) { edges { node { name tagline votesCount commentsCount url topics { edges { node { name slug } } } } } } }`;
    const res = await fetch("https://api.producthunt.com/v2/api/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query: gqlQuery }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const edges = data?.data?.posts?.edges ?? [];
    const terms = query.toLowerCase().split(/\s+/).filter((t: string) => t.length > 2);
    const filtered = edges.filter((e: any) => {
      const node = e.node;
      if (!node) return false;
      const topicText = (node.topics?.edges ?? [])
        .map((t: any) => `${t.node?.name ?? ""} ${t.node?.slug ?? ""}`)
        .join(" ").toLowerCase();
      const nameTagline = `${node.name ?? ""} ${node.tagline ?? ""}`.toLowerCase();
      return terms.some((t: string) => topicText.includes(t) || nameTagline.includes(t));
    });
    if (filtered.length === 0) return [];
    return filtered.slice(0, 10).map((e: any) => ({
      name: e.node?.name ?? "",
      tagline: e.node?.tagline ?? "",
      votesCount: e.node?.votesCount ?? 0,
      commentsCount: e.node?.commentsCount ?? 0,
      url: e.node?.url ?? "",
    }));
  } catch {
    return [];
  }
}

/* ── Claude analysis ─────────────────────────────────────────── */

async function analyzeOpportunities(
  subcategory: string,
  categoryLabel: string,
  itunesApps: any[],
  newReleases: any[],
  phPosts: any[],
) {
  const prompt = `Market opportunity analyst for indie devs. Analyze "${subcategory}" in "${categoryLabel}". Generate 5-6 data-driven opportunities.

## Apps (top by reviews)
${JSON.stringify(itunesApps.slice(0, 5).map(a => ({ n: a.name, r: a.rating, rc: a.reviewCount, p: a.price })), null, 1)}

## New Releases (180 days)
${JSON.stringify(newReleases.map(a => ({ n: a.name, r: a.rating, rc: a.reviewCount, d: a.daysAgo })), null, 1)}

## Product Hunt
${JSON.stringify(phPosts.slice(0, 3).map(p => ({ n: p.name, t: p.tagline, v: p.votesCount })), null, 1)}

Types (use ONLY if data qualifies):
- MOMENTUM: New app (180 days) with 1,000+ reviews. For Momentum type: ONLY cite apps with reviewCount >= 1000. If no app has 1000+ reviews, do NOT generate a Momentum opportunity.
- MONOPOLY: #1 app has 5x+ reviews vs #2. Evidence: both counts + ratio.
- GAP: <5 apps OR all <10K reviews OR avg rating <4.0. Evidence: app names + review counts.
- COMPLAINT: Apps rated 3.0-4.2 ONLY. Never cite apps rated 4.3+. Evidence: app name + exact rating + review count.
- PRICE: All top apps paid/$2.99+ or subscription-only. Evidence: price data.
- BUNDLE: 3+ single-purpose apps. Evidence: "[App1] does X, [App2] does Y, [App3] does Z — no combined solution."

Return ONLY JSON array:
[{"title":"<8 words>","type":"Momentum|Monopoly|Gap|Complaint|Price|Bundle","difficulty":"Easy|Medium|Hard","description":"<2 sentences>","evidence":"<data from above>","typeReason":"<1 sentence>","targetAudience":"<1 sentence>","difficultyReason":"<1 sentence>","searchQuery":"<2-4 words>"}]

HARD RULES:
- Complaint ratings must be ≤ 4.20. Evidence must have numbers.
- Skip types that don't qualify. Min 3 different types.
- Cite specific app names and numbers. No generic ideas ("better UX", "senior-friendly", "all-in-one").
- Each opportunity must reveal a non-obvious insight from the data.
- NEVER mention AI model names (Claude, GPT, Gemini, LLaMA etc.) in any field. Focus only on App Store data.`;

  // Claude call with 25-second timeout
  let raw: any[] = [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    const response = await client.messages.create(
      { model: "claude-sonnet-4-20250514", max_tokens: 1500, messages: [{ role: "user", content: prompt }] },
      { signal: controller.signal as any },
    );
    clearTimeout(timeout);

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    raw = JSON.parse(cleaned);
  } catch (err) {
    console.log("Claude analysis timeout/error:", err instanceof Error ? err.message : err);
    return [];
  }

  // Clean raw data format leaking into evidence
  for (const opp of raw) {
    if (opp.evidence) {
      opp.evidence = opp.evidence
        .replace(/\[\s*\]/g, "none")
        .replace(/New Releases \(180 days\):\s*/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim();
    }
  }

  // Validate and filter — return only what passes
  const filtered = validateOpportunities(raw);
  console.log("VALIDATION:", {
    rawCount: raw.length,
    passedCount: filtered.length,
    removedCount: raw.length - filtered.length,
    passedTypes: filtered.map((o: any) => o.type),
  });

  return filtered;
}

/* ── Post-generation validation ──────────────────────────────── */


const VALID_TYPES = ["Momentum", "Monopoly", "Gap", "Complaint", "Price", "Bundle"];

function validateOpportunities(opportunities: any[]): any[] {
  const yearCutoff = 2022;
  const filtered = opportunities.filter((opp) => {
    // Type whitelist: reject unknown types
    if (!VALID_TYPES.includes(opp.type)) {
      console.log("FILTERED invalid type:", opp.type, opp.title);
      return false;
    }

    // Reject evidence citing negligible review counts
    const evidenceLow = (opp.evidence || "").toLowerCase();
    if (/\b[0-3]\s+reviews?\b/.test(evidenceLow)) {
      console.log("FILTERED (low review count in evidence):", opp.title);
      return false;
    }

    // Momentum: reject if evidence or typeReason references an old year
    if (opp.type === "Momentum") {
      const combined = `${opp.evidence || ""} ${opp.typeReason || ""}`;
      const years = combined.match(/\b(20\d{2})\b/g);
      if (years && years.some((y: string) => parseInt(y, 10) <= yearCutoff)) {
        console.log("FILTERED Momentum (year <=", yearCutoff, "):", opp.title, "years found:", years);
        return false;
      }
      // Momentum: reject if no review count >= 1000 in evidence or typeReason
      const evidenceAndReason = `${opp.evidence || ""} ${opp.typeReason || ""}`;
      const allNums = evidenceAndReason
        .match(/\b(\d{1,3}(?:,\d{3})*|\d+)\b/g)
        ?.map((n: string) => parseInt(n.replace(/,/g, ""), 10)) || [];
      // Exclude year-like numbers (2000-2099) and ratings (1-5 range with decimal context)
      const reviewNums = allNums.filter((n: number) => n >= 1000 && n < 2000000 && !(n >= 2000 && n <= 2099));
      console.log("MOMENTUM CHECK - all numbers found:", allNums, "review candidates (>=1000, not years):", reviewNums, "max:", reviewNums.length > 0 ? Math.max(...reviewNums) : 0);
      if (reviewNums.length === 0) {
        console.log("FILTERED Momentum (no review count >= 1000):", opp.title);
        return false;
      }
    }

    // Complaint: reject if evidence cites a rating above 4.2 OR has no numbers at all
    if (opp.type === "Complaint") {
      const evidence = opp.evidence || "";
      const ratings = evidence.match(/\d+\.\d+/g);
      const anyNumbers = evidence.match(/\d+/g);
      if (!anyNumbers || anyNumbers.length === 0) {
        console.log("FILTERED Complaint (no numbers in evidence):", opp.title);
        return false;
      }
      if (ratings && ratings.some((r: string) => parseFloat(r) > 4.2)) {
        console.log("FILTERED Complaint (rating > 4.2):", opp.title, "ratings found:", ratings);
        return false;
      }
    }

    // Monopoly: reject if review ratio between #1 and #2 is less than 5x
    if (opp.type === "Monopoly") {
      const nums = (opp.evidence || "").match(/[\d,]+/g);
      if (nums) {
        const parsed = nums.map((n: string) => parseInt(n.replace(/,/g, ""), 10)).filter((n: number) => !isNaN(n) && n > 0);
        parsed.sort((a: number, b: number) => b - a);
        if (parsed.length >= 2) {
          const ratio = parsed[0] / parsed[1];
          if (ratio < 5.0) {
            console.log("FILTERED Monopoly (ratio < 5x):", opp.title, `${parsed[0]} / ${parsed[1]} = ${ratio.toFixed(1)}x`);
            return false;
          }
        }
      }
    }

    // Price: reject if evidence uses speculative language
    if (opp.type === "Price") {
      const evidenceLower = (opp.evidence || "").toLowerCase();
      if (evidenceLower.includes("likely") || evidenceLower.includes("appears to") || evidenceLower.includes("probably")) {
        console.log("FILTERED Price (speculative evidence):", opp.title);
        return false;
      }
    }

    return true;
  });

  // Deduplication: remove near-duplicate titles, keep stronger evidence
  const deduped = deduplicateOpportunities(filtered);

  // Gap deduplication: remove Gap pairs with >60% overlapping app names
  const gapDeduped = deduplicateGapsByAppNames(deduped);

  // Max 2 per type: keep the 2 with strongest evidence for each type
  return enforceMaxPerType(gapDeduped, 2);
}

function evidenceStrength(opp: any): number {
  const ev = opp.evidence || "";
  // Count specific data points: numbers, app names (capitalized words), percentages
  const numbers = (ev.match(/[\d,]+/g) || []).length;
  const percentages = (ev.match(/\d+%/g) || []).length;
  return ev.length + numbers * 10 + percentages * 15;
}

function deduplicateOpportunities(opportunities: any[]): any[] {
  // Extract significant words from title (3+ chars, lowercased, skip common words)
  const stopWords = new Set(["the", "and", "for", "with", "app", "tool", "new", "based", "more", "into", "that", "from"]);
  const getKeywords = (title: string): string[] =>
    (title || "").toLowerCase().split(/\s+/)
      .filter((w: string) => w.length >= 3 && !stopWords.has(w));

  const result: any[] = [];
  for (const opp of opportunities) {
    // Never deduplicate Monopoly cards — they are unique insights
    if (opp.type === "Monopoly") {
      result.push(opp);
      continue;
    }
    const keywords = getKeywords(opp.title);
    const isDuplicate = result.some((existing) => {
      if (existing.type === "Monopoly") return false; // don't match against Monopoly
      const existingKeywords = getKeywords(existing.title);
      const shared = keywords.filter((kw: string) => existingKeywords.includes(kw));
      return shared.length >= 2;
    });

    if (isDuplicate) {
      const dupeIdx = result.findIndex((existing) => {
        if (existing.type === "Monopoly") return false;
        const existingKeywords = getKeywords(existing.title);
        const shared = keywords.filter((kw: string) => existingKeywords.includes(kw));
        return shared.length >= 2;
      });
      if (dupeIdx !== -1 && evidenceStrength(opp) > evidenceStrength(result[dupeIdx])) {
        console.log("DEDUP replaced:", result[dupeIdx].title, "→", opp.title);
        result[dupeIdx] = opp;
      } else {
        console.log("DEDUP removed:", opp.title);
      }
    } else {
      result.push(opp);
    }
  }
  return result;
}

function extractAppNames(evidence: string): string[] {
  // Match capitalized words/phrases that look like app names (2+ chars, starts with uppercase)
  const matches = evidence.match(/\b[A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)*/g) || [];
  // Filter out common non-app words
  const skip = new Set(["The", "This", "That", "With", "From", "Only", "App", "Apps", "Store", "Free", "All", "New", "No", "Evidence", "Score", "Rating"]);
  return matches.filter((m) => !skip.has(m)).map((m) => m.toLowerCase());
}

function deduplicateGapsByAppNames(opportunities: any[]): any[] {
  const gaps = opportunities.filter((o) => o.type === "Gap");
  const nonGaps = opportunities.filter((o) => o.type !== "Gap");
  if (gaps.length <= 1) return opportunities;

  const kept: any[] = [];
  for (const gap of gaps) {
    const names = extractAppNames(gap.evidence || "");
    const isDupe = kept.some((existing) => {
      const existingNames = extractAppNames(existing.evidence || "");
      if (existingNames.length === 0 || names.length === 0) return false;
      const smaller = Math.min(names.length, existingNames.length);
      const overlap = names.filter((n) => existingNames.includes(n)).length;
      return overlap / smaller > 0.8;
    });
    if (isDupe) {
      // Keep whichever cites more app names
      const dupeIdx = kept.findIndex((existing) => {
        const existingNames = extractAppNames(existing.evidence || "");
        const overlap = names.filter((n) => existingNames.includes(n)).length;
        return overlap / Math.min(names.length, existingNames.length) > 0.8;
      });
      if (dupeIdx !== -1 && names.length > extractAppNames(kept[dupeIdx].evidence || "").length) {
        console.log("GAP DEDUP replaced:", kept[dupeIdx].title, "→", gap.title);
        kept[dupeIdx] = gap;
      } else {
        console.log("GAP DEDUP removed:", gap.title);
      }
    } else {
      kept.push(gap);
    }
  }
  return [...nonGaps, ...kept];
}

function enforceMaxPerType(opportunities: any[], max: number): any[] {
  const typeCounts: Record<string, any[]> = {};
  for (const opp of opportunities) {
    (typeCounts[opp.type] ??= []).push(opp);
  }

  const result: any[] = [];
  for (const [type, opps] of Object.entries(typeCounts)) {
    if (opps.length <= max) {
      result.push(...opps);
    } else {
      // Sort by evidence strength (most specific numbers), keep top `max`
      opps.sort((a: any, b: any) => evidenceStrength(b) - evidenceStrength(a));
      const kept = opps.slice(0, max);
      const dropped = opps.slice(max);
      for (const d of dropped) {
        console.log(`MAX-PER-TYPE removed (3rd+ ${type}):`, d.title);
      }
      result.push(...kept);
    }
  }
  return result;
}

/* ── GET handler ──────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  const categorySlug = req.nextUrl.searchParams.get("category")?.trim();
  const subcategory = req.nextUrl.searchParams.get("subcategory")?.trim();

  if (!categorySlug || !subcategory) {
    return NextResponse.json(
      { error: "Both 'category' and 'subcategory' query parameters are required." },
      { status: 400 },
    );
  }

  const category = getCategoryBySlug(categorySlug);
  if (!category) {
    return NextResponse.json(
      { error: `Unknown category: ${categorySlug}` },
      { status: 400 },
    );
  }

  if (!category.subcategories.includes(subcategory)) {
    return NextResponse.json(
      { error: `Unknown subcategory: ${subcategory}`, valid: category.subcategories },
      { status: 400 },
    );
  }

  console.log("SUPABASE ENV:", {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "MISSING",
    key: process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "MISSING",
  });

  try {
    // Check Supabase cache first
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    try {
      const { data: cached, error: cacheError } = await getSupabase()
        .from("opportunity_cache")
        .select("opportunities, generated_at")
        .eq("category", categorySlug)
        .eq("subcategory", subcategory)
        .single();

      if (cacheError) {
        console.log("Supabase cache query error:", cacheError.message, cacheError.code);
      } else if (cached && cached.generated_at && cached.generated_at > twoHoursAgo) {
        console.log("CACHE HIT:", categorySlug, subcategory, cached.opportunities?.length, "opportunities");
        return NextResponse.json(
          { category: categorySlug, subcategory, opportunities: cached.opportunities },
          { headers: { "X-Cache": "HIT" } },
        );
      } else {
        console.log("CACHE STALE:", categorySlug, subcategory, "generated_at:", cached?.generated_at);
      }
    } catch (cacheErr) {
      console.log("Cache read error (falling back to live):", cacheErr instanceof Error ? cacheErr.message : cacheErr);
    }

    console.log("CACHE MISS:", categorySlug, subcategory, "— generating live");

    // Fetch data in parallel
    const [rawItunesApps, phPosts] = await Promise.all([
      fetchITunes(subcategory),
      fetchProductHunt(subcategory),
    ]);

    // Relevance filter: for multi-word subcategories require ALL keywords match
    const subcategoryWords = subcategory.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
    const relevantApps = rawItunesApps.filter((app: any) => {
      const appText = `${app.name} ${app.description || ""}`.toLowerCase();
      if (subcategoryWords.length >= 2) {
        return subcategoryWords.every((word: string) => appText.includes(word));
      }
      return subcategoryWords.some((word: string) => appText.includes(word));
    });
    const itunesApps = relevantApps.length >= 3 ? relevantApps : rawItunesApps;
    console.log("RELEVANCE FILTER:", { raw: rawItunesApps.length, relevant: relevantApps.length, using: itunesApps.length, keywords: subcategoryWords });

    const newReleases = filterNewReleases(itunesApps);

    // Stats
    const totalApps = itunesApps.length;
    const avgRating = totalApps > 0
      ? Math.round((itunesApps.reduce((sum: number, a: any) => sum + (a.rating || 0), 0) / totalApps) * 10) / 10
      : 0;

    // Claude analysis
    const opportunities = await analyzeOpportunities(
      subcategory,
      category.label,
      itunesApps,
      newReleases,
      phPosts,
    );

    // Truncate evidence at last complete sentence if over 300 chars
    const cleanedOpportunities = opportunities.map((opp: any) => ({
      ...opp,
      evidence: opp.evidence?.length > 300
        ? (opp.evidence.slice(0, 300).replace(/[^.]*$/, '').trim() || opp.evidence.slice(0, 300).trim())
        : opp.evidence,
    }));

    // Cache to Supabase
    try {
      await getSupabase().from("opportunity_cache").upsert({
        category: categorySlug,
        subcategory,
        opportunities: cleanedOpportunities,
        generated_at: new Date().toISOString(),
        app_count: totalApps,
      });
      console.log("CACHE SET:", categorySlug, subcategory);
    } catch (cacheErr) {
      console.log("Cache write error:", cacheErr instanceof Error ? cacheErr.message : cacheErr);
    }

    return NextResponse.json(
      { category: categorySlug, subcategory, opportunities: cleanedOpportunities, stats: { totalApps, avgRating, newReleases: newReleases.length, phPosts: phPosts.length } },
      { headers: { "X-Cache": "MISS" } },
    );
  } catch (err) {
    console.error("opportunities error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
