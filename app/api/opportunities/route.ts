import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getCategoryBySlug } from "@/app/lib/categories";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/* ── Data fetchers ───────────────────────────────────────────── */

async function fetchITunes(query: string) {
  try {
    const searchTerm = query + " app";
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
- MOMENTUM: New app (180 days) with 500+ reviews, no prior dominant player. Evidence: release date + review count.
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
    // Return fallback opportunities from raw data
    console.log("FALLBACK: generating opportunities from raw iTunes data");
    return generateFallbackOpportunities(subcategory, itunesApps, newReleases);
  }

  // Validate and filter
  let filtered = validateOpportunities(raw);
  console.log("VALIDATION:", {
    rawCount: raw.length,
    passedCount: filtered.length,
    removedCount: raw.length - filtered.length,
    passedTypes: filtered.map((o: any) => o.type),
  });

  // Guarantee minimum 3: backfill with relaxed rules, retry if needed
  console.log("POST-VALIDATION:", filtered.length, "opportunities passed");
  let attempt = 0;
  while (filtered.length < 3 && attempt < 2) {
    attempt++;
    const needed = Math.max(3 - filtered.length, 3);
    console.log(`BACKFILL attempt ${attempt}: ${filtered.length} passed, requesting ${needed} more`);
    try {
      const backfill = await backfillOpportunities(
        subcategory, categoryLabel, itunesApps, newReleases, phPosts,
        filtered, needed,
      );
      // Progressively relax: attempt 1 = year cutoff 2020, attempt 2 = no year check
      const validBackfill = validateOpportunities(backfill, { momentumYearCutoff: attempt === 1 ? 2020 : 2015 });
      console.log(`BACKFILL attempt ${attempt} result:`, { requested: needed, received: backfill.length, passedValidation: validBackfill.length });
      filtered = [...filtered, ...validBackfill];
    } catch (err) {
      console.log(`BACKFILL attempt ${attempt} failed:`, err instanceof Error ? err.message : err);
      break;
    }
  }

  // Last resort: generate from raw data if still under 3
  if (filtered.length < 3) {
    console.log("LAST RESORT: generating from raw data, have", filtered.length);
    const fallback = generateFallbackOpportunities(subcategory, itunesApps, newReleases);
    // Only add enough to reach 3
    filtered = [...filtered, ...fallback.slice(0, 3 - filtered.length)];
  }

  console.log("FINAL COUNT:", filtered.length, "opportunities returned");
  return filtered;
}

/* ── Fallback: generate opportunities from raw data without Claude ── */


function generateFallbackOpportunities(subcategory: string, apps: any[], newReleases: any[]): any[] {
  const results: any[] = [];
  const sorted = [...apps].sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));

  console.log("FALLBACK called:", {
    subcategory,
    itunesAppsCount: apps.length,
    newReleasesCount: newReleases.length,
    topApps: sorted.slice(0, 3).map(a => ({ name: a.name, rating: a.rating, reviews: a.reviewCount })),
  });

  // Gap opportunity if few apps
  if (apps.length < 10 && sorted.length > 0) {
    const topApp = sorted[0];
    results.push({
      title: `Build a better ${subcategory} app`,
      type: "Gap",
      difficulty: "Medium",
      description: `Only ${apps.length} apps found in App Store for "${subcategory}". This suggests an underserved market with room for a focused solution.`,
      evidence: `Only ${apps.length} apps exist (top: ${topApp.name} with ${(topApp.reviewCount ?? 0).toLocaleString()} reviews) — limited competition indicates an underserved market.`,
      typeReason: "Fewer than 10 apps indicates a gap in the market.",
      targetAudience: `Users searching for ${subcategory} solutions on mobile.`,
      difficultyReason: "Medium — requires domain knowledge but limited competition.",
      searchQuery: subcategory,
    });
  }

  // Complaint if low ratings exist
  const lowRated = sorted.filter(a => a.rating > 0 && a.rating < 4.3);
  if (lowRated.length >= 1) {
    const lowApp = lowRated[0];
    results.push({
      title: `Better alternative to ${lowApp.name}`,
      type: "Complaint",
      difficulty: "Medium",
      description: `${lowApp.name} has a mediocre rating despite significant usage, suggesting user dissatisfaction. A well-designed alternative could capture frustrated users.`,
      evidence: `${lowApp.name} has only ${lowApp.rating.toFixed(1)} rating with ${(lowApp.reviewCount ?? 0).toLocaleString()} reviews — users are dissatisfied and looking for alternatives.`,
      typeReason: `${lowApp.name} is rated below 4.3, indicating common user complaints.`,
      targetAudience: `Users frustrated with ${lowApp.name} who want a better ${subcategory} experience.`,
      difficultyReason: "Medium — must address known pain points evident in low ratings.",
      searchQuery: subcategory,
    });
  }

  // Momentum if new releases exist
  if (newReleases.length > 0) {
    const nr = newReleases[0];
    results.push({
      title: `Compete with rising ${nr.name}`,
      type: "Momentum",
      difficulty: "Hard",
      description: `${nr.name} launched recently and is gaining traction, validating market demand for new ${subcategory} solutions.`,
      evidence: `${nr.name} launched ${nr.daysAgo} days ago and already has ${(nr.reviewCount ?? 0).toLocaleString()} reviews with a ${nr.rating} rating — proving active demand in this space.`,
      typeReason: `${nr.name} is a recent release gaining rapid traction, indicating momentum.`,
      targetAudience: `Users exploring new ${subcategory} apps alongside ${nr.name}.`,
      difficultyReason: "Hard — competing with active new entrants in a growing space.",
      searchQuery: subcategory,
    });
  }

  // GUARANTEED: Gap opportunity for larger markets
  if (sorted.length > 0) {
    const topApp = sorted[0];
    results.push({
      title: `Niche ${subcategory} for underserved users`,
      type: "Gap",
      difficulty: "Medium",
      description: `While ${apps.length} apps exist, most target the same broad audience. A focused app for a specific user segment could differentiate.`,
      evidence: `${apps.length} apps exist (top: ${topApp.name} with ${(topApp.reviewCount ?? 0).toLocaleString()} reviews) but all target the same broad audience — specific niches remain underserved.`,
      typeReason: "Existing apps serve a broad audience without specializing in underserved niches.",
      targetAudience: `A specific underserved segment within the ${subcategory} space.`,
      difficultyReason: "Medium — requires identifying and deeply understanding a niche audience.",
      searchQuery: subcategory,
    });
  }

  // GUARANTEED: Premium/power user Gap opportunity
  if (sorted.length > 0) {
    const topApp = sorted[0];
    results.push({
      title: `Premium ${subcategory} for Power Users`,
      type: "Gap",
      difficulty: "Hard",
      description: `Existing ${subcategory} apps target casual users. There is no professional-grade app with advanced features for power users and experts.`,
      evidence: `${topApp.name} leads with ${(topApp.reviewCount ?? 0).toLocaleString()} reviews but targets casual users — no app serves advanced/power users with professional-grade features in this space.`,
      typeReason: "Top apps cater to general users, leaving power users and professionals without a dedicated solution.",
      targetAudience: `Professional and power users who need advanced ${subcategory} features beyond what ${topApp.name} offers.`,
      difficultyReason: "Hard — requires deep domain expertise and advanced feature development.",
      searchQuery: `${subcategory} professional`,
    });
  }

  console.log("FALLBACK generated:", results.length, "opportunities, types:", results.map(r => r.type));
  return results;
}

/* ── Post-generation validation ──────────────────────────────── */


const VALID_TYPES = ["Momentum", "Monopoly", "Gap", "Complaint", "Price", "Bundle"];

interface ValidationOptions {
  momentumYearCutoff?: number; // default 2022: reject years <= this value
}

function validateOpportunities(opportunities: any[], opts: ValidationOptions = {}): any[] {
  const yearCutoff = opts.momentumYearCutoff ?? 2022;
  const filtered = opportunities.filter((opp) => {
    // Type whitelist: reject unknown types
    if (!VALID_TYPES.includes(opp.type)) {
      console.log("FILTERED invalid type:", opp.type, opp.title);
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
      // Momentum: reject if no review count >= 500 in evidence or typeReason
      const evidenceAndReason = `${opp.evidence || ""} ${opp.typeReason || ""}`;
      const reviewNums = evidenceAndReason
        .match(/\b(\d{1,3}(?:,\d{3})*|\d+)\b/g)
        ?.map((n: string) => parseInt(n.replace(/,/g, ""), 10))
        ?.filter((n: number) => n >= 500 && n < 2000000) || [];
      console.log("MOMENTUM review check:", opp.title, "nums >= 500:", reviewNums);
      if (reviewNums.length === 0) {
        console.log("FILTERED Momentum (no review count >= 500):", opp.title);
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

  // Max 2 per type: keep the 2 with strongest evidence for each type
  return enforceMaxPerType(deduped, 2);
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
    const keywords = getKeywords(opp.title);
    const isDuplicate = result.some((existing) => {
      const existingKeywords = getKeywords(existing.title);
      // Check if they share 2+ significant keywords
      const shared = keywords.filter((kw: string) => existingKeywords.includes(kw));
      return shared.length >= 2;
    });

    if (isDuplicate) {
      // Find the existing duplicate and keep whichever has stronger evidence
      const dupeIdx = result.findIndex((existing) => {
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

/* ── Backfill if too many filtered out ───────────────────────── */

async function backfillOpportunities(
  subcategory: string,
  categoryLabel: string,
  itunesApps: any[],
  newReleases: any[],
  phPosts: any[],
  existing: any[],
  needed: number,
) {
  const existingTypes = existing.map((o) => o.type).join(", ");
  const prompt = `Need ${needed} MORE opportunities for "${subcategory}" in "${categoryLabel}". Types already covered: ${existingTypes || "none"}. Use DIFFERENT types.

## Apps
${JSON.stringify(itunesApps.slice(0, 5).map(a => ({ n: a.name, r: a.rating, rc: a.reviewCount, p: a.price })), null, 1)}

## New Releases
${JSON.stringify(newReleases.map(a => ({ n: a.name, r: a.rating, rc: a.reviewCount, d: a.daysAgo })), null, 1)}

## PH
${JSON.stringify(phPosts.slice(0, 3).map(p => ({ n: p.name, t: p.tagline, v: p.votesCount })), null, 1)}

Types: Momentum(500+ reviews, new app) | Monopoly(5x ratio) | Gap(<5 apps or <10K reviews) | Complaint(rating 3.0-4.2 ONLY) | Price(all paid) | Bundle(3+ apps named)
Complaint ratings must be ≤ 4.20. Cite specific app names and numbers.
NEVER mention AI model names (Claude, GPT, Gemini, LLaMA etc.) in any field. Focus only on App Store data.

Return ONLY JSON array:
[{"title","type","difficulty","description","evidence","typeReason","targetAudience","difficultyReason","searchQuery"}]`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    console.error("Backfill parse error:", cleaned.slice(0, 200));
    return [];
  }
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

  try {
    // Fetch data in parallel
    const [rawItunesApps, phPosts] = await Promise.all([
      fetchITunes(subcategory),
      fetchProductHunt(subcategory),
    ]);

    // Relevance filter: keep only apps matching subcategory keywords
    const subcategoryWords = subcategory.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
    const relevantApps = rawItunesApps.filter((app: any) => {
      const appText = `${app.name} ${app.description || ""}`.toLowerCase();
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

    // Truncate evidence at last complete sentence if over 200 chars
    const cleanedOpportunities = opportunities.map((opp: any) => ({
      ...opp,
      evidence: opp.evidence?.length > 200
        ? (opp.evidence.slice(0, 200).replace(/[^.]*$/, '').trim() || opp.evidence.slice(0, 200).trim())
        : opp.evidence,
    }));

    return NextResponse.json({
      category: categorySlug,
      subcategory,
      opportunities: cleanedOpportunities,
      stats: {
        totalApps,
        avgRating,
        newReleases: newReleases.length,
        phPosts: phPosts.length,
      },
    });
  } catch (err) {
    console.error("opportunities error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
