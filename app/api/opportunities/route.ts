import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getCategoryBySlug } from "@/app/lib/categories";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/* ── Data fetchers ───────────────────────────────────────────── */

async function fetchITunes(query: string) {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=software&limit=50`,
      { signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).map((r: any) => ({
      name: r.trackName ?? "",
      rating: r.averageUserRating ?? 0,
      reviewCount: r.userRatingCount ?? 0,
      releaseDate: r.releaseDate ?? "",
      price: r.formattedPrice ?? "Free",
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
  const prompt = `You are a market opportunity analyst for indie developers and small teams.

Analyze the "${subcategory}" subcategory within "${categoryLabel}" and generate 6-8 specific, data-driven opportunities.

## App Store Data (top 10 apps by reviews)
${JSON.stringify(itunesApps.slice(0, 10), null, 2)}

## New Releases (last 180 days)
${JSON.stringify(newReleases, null, 2)}

## Product Hunt Posts
${JSON.stringify(phPosts.slice(0, 10), null, 2)}

Each opportunity MUST be one of these 6 types. Follow the STRICT qualification rules below — if the data does not meet a type's criteria, do NOT use that type.

## STRICT TYPE QUALIFICATION RULES

MOMENTUM - ONLY use this when:
- A NEW app (released in last 180 days) has RAPIDLY growing reviews (500+ reviews minimum)
- AND no dominant player existed before it
- Evidence MUST include: release date + review count + days since release
- Do NOT use for established apps that are already dominant
- Momentum requires at least 500+ reviews to qualify as real traction. Do not cite apps with fewer than 500 reviews

MONOPOLY - ONLY use this when:
- ONE app has AT LEAST 5x more reviews than the SECOND place app (e.g. 500K vs 100K = 5x ✓, 270K vs 100K = 2.7x ✗)
- 2x, 3x, or 4x is NOT enough — the ratio MUST be 5x or higher
- If no app pair meets this 5x threshold, do NOT return a Monopoly opportunity
- Evidence MUST include: #1 app name + review count vs #2 app name + review count, and the calculated ratio

GAP - ONLY use this when:
- Search returns fewer than 5 apps total OR
- All apps have fewer than 10,000 reviews OR
- Average rating is below 4.0
- Evidence MUST include specific app names from the data AND their review counts
- Example good evidence: "Only 3 apps exist: AppX (1,200 reviews), AppY (800 reviews), AppZ (200 reviews) — all under 10K reviews"
- Do NOT write generic statements like "current apps focus on X but lack Y" without citing specific apps and numbers

COMPLAINT - ONLY use this when:
- Multiple apps exist with ratings between 3.0 and 4.2 (maximum 4.2)
- Any app rated 4.3 or above CANNOT be cited as a Complaint opportunity
- If all top apps are rated 4.3+, do NOT return a Complaint opportunity
- Evidence MUST include: specific app names and their exact ratings (all must be ≤ 4.2)

PRICE - ONLY use this when:
- All top apps are paid ($2.99+) with no free alternative OR
- All top apps are subscription-based with no one-time purchase
- Evidence MUST include: price data from the app list

BUNDLE - ONLY use this when:
- 3+ single-purpose apps exist that each do ONE narrow thing
- A combined app covering all of them does NOT exist
- Evidence MUST name 3 specific apps from the data AND explain exactly what each one does separately
- Format: "[App1] handles X, [App2] handles Y, [App3] handles Z — no single app combines all three."
- NEVER write "users need multiple apps" without naming the specific apps

Return ONLY valid JSON array (no markdown, no code fences):
[
  {
    "title": "<max 8 words, specific and actionable>",
    "type": "<exactly one of: Momentum | Monopoly | Gap | Complaint | Price | Bundle>",
    "difficulty": "<exactly one of: Easy | Medium | Hard>",
    "description": "<2-3 sentences explaining the opportunity>",
    "evidence": "<specific data point from the provided data — MUST follow the evidence rules above for the chosen type>",
    "typeReason": "<1-2 sentences: why this specific type was chosen over others, citing the qualification criteria met>",
    "targetAudience": "<1-2 sentences: who exactly would use this, be specific about demographics/behavior>",
    "difficultyReason": "<1 sentence: why this is Easy/Medium/Hard — reference technical scope, APIs needed, content requirements>",
    "searchQuery": "<2-4 words for trend analysis>"
  }
]

RULES:
- ONLY use a type if the data meets that type's qualification criteria above
- If the data doesn't qualify for a type, skip it — do NOT force-fit
- Each opportunity must cite specific data from the apps/releases/PH data provided
- No generic ideas like "better UX" or "AI-powered version"
- Each opportunity must be something a solo developer could start building this week
- Include at least 3 different opportunity types in your response
- "searchQuery" should be suitable for searching App Store trends

COMPLAINT HARD RULE: I will programmatically reject any Complaint opportunity where the cited rating is above 4.20. Do not cite apps with ratings above 4.20 for Complaint type. For Complaint type: evidence MUST include the specific app name, its exact rating (e.g. 3.2), AND its review count (e.g. 45,230 reviews). Evidence with no numbers will be rejected.

NON-OBVIOUS RULE: Each opportunity must provide a NON-OBVIOUS insight that a developer wouldn't think of in 5 minutes. AVOID these generic ideas:
- "Build a senior-friendly version"
- "Build an alternative with better UX"
- "Build for underserved niche"
- "All-in-one platform"
Instead cite specific data that reveals a hidden gap: a surprising rating pattern, an unexpected user segment from reviews, a sub-category growing while the main category declines, or a pricing anomaly.`;

  // Claude call with 25-second timeout
  let raw: any[] = [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    const response = await client.messages.create(
      { model: "claude-sonnet-4-20250514", max_tokens: 2500, messages: [{ role: "user", content: prompt }] },
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
      // Momentum: reject if no significant review count (>= 100) in evidence
      const nums = (opp.evidence || "").match(/[\d,]+/g);
      if (nums) {
        const parsed = nums
          .map((n: string) => parseInt(n.replace(/,/g, ""), 10))
          .filter((n: number) => !isNaN(n) && n > 0 && !(n >= 2000 && n <= 2099)); // exclude years
        const maxNum = parsed.length > 0 ? Math.max(...parsed) : 0;
        if (maxNum < 100) {
          console.log("FILTERED Momentum (low reviews):", opp.title, "max number:", maxNum);
          return false;
        }
      } else {
        console.log("FILTERED Momentum (no numbers in evidence):", opp.title);
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
  const prompt = `You are a market opportunity analyst. I need ${needed} MORE opportunities for "${subcategory}" in "${categoryLabel}".

## App Store Data (top 10 apps by reviews)
${JSON.stringify(itunesApps.slice(0, 10), null, 2)}

## New Releases (last 180 days)
${JSON.stringify(newReleases, null, 2)}

## Product Hunt Posts
${JSON.stringify(phPosts.slice(0, 10), null, 2)}

I already have these types covered: ${existingTypes || "none"}
Generate ${needed} NEW opportunities using DIFFERENT types from what I already have.

COMPLAINT HARD RULE: Do NOT cite apps with ratings above 4.20. All cited ratings must be ≤ 4.2.
GEOGRAPHY HARD RULE: MUST name a specific language or country in the evidence.

Return ONLY valid JSON array (no markdown, no code fences) with the same schema:
[{ "title", "type", "difficulty", "description", "evidence", "typeReason", "targetAudience", "difficultyReason", "searchQuery" }]`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
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
    const [itunesApps, phPosts] = await Promise.all([
      fetchITunes(subcategory),
      fetchProductHunt(subcategory),
    ]);

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

    return NextResponse.json({
      category: categorySlug,
      subcategory,
      opportunities,
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
