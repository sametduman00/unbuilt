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

## App Store Data (top apps by reviews)
${JSON.stringify(itunesApps.slice(0, 15), null, 2)}

## New Releases (last 180 days)
${JSON.stringify(newReleases, null, 2)}

## Product Hunt Posts
${JSON.stringify(phPosts.slice(0, 10), null, 2)}

Each opportunity MUST be one of these 7 types. Follow the STRICT qualification rules below — if the data does not meet a type's criteria, do NOT use that type.

## STRICT TYPE QUALIFICATION RULES

MOMENTUM - ONLY use this when:
- A NEW app (released in last 180 days) has RAPIDLY growing reviews
- AND no dominant player existed before it
- Evidence MUST include: release date + review count + days since release
- Do NOT use for established apps that are already dominant

MONOPOLY - ONLY use this when:
- ONE app has AT LEAST 5x more reviews than the SECOND place app (e.g. 500K vs 100K = 5x ✓, 270K vs 100K = 2.7x ✗)
- 2x, 3x, or 4x is NOT enough — the ratio MUST be 5x or higher
- If no app pair meets this 5x threshold, do NOT return a Monopoly opportunity
- Evidence MUST include: #1 app name + review count vs #2 app name + review count, and the calculated ratio

GAP - ONLY use this when:
- Search returns fewer than 5 apps total OR
- All apps have fewer than 10,000 reviews OR
- Average rating is below 4.0
- Evidence MUST include: total app count or average review count

COMPLAINT - ONLY use this when:
- Multiple apps exist with ratings between 3.0 and 4.2 (maximum 4.2)
- Any app rated 4.3 or above CANNOT be cited as a Complaint opportunity
- If all top apps are rated 4.3+, do NOT return a Complaint opportunity
- Evidence MUST include: specific app names and their exact ratings (all must be ≤ 4.2)

PRICE - ONLY use this when:
- All top apps are paid ($2.99+) with no free alternative OR
- All top apps are subscription-based with no one-time purchase
- Evidence MUST include: price data from the app list

GEOGRAPHY - ONLY use this when:
- A proven solution exists in English/Western markets but is NOT available in other languages or regions (Spanish, Arabic, Hindi, Turkish, Portuguese, etc.)
- The opportunity is: localize or build a native alternative for an underserved language/region
- Do NOT use Geography for age demographics or user types — those are Gap or Complaint
- Evidence MUST include: names of English-only apps AND the specific underserved language/region

BUNDLE - ONLY use this when:
- 3+ single-purpose apps exist that each do ONE narrow thing
- A combined app covering all of them does NOT exist
- Evidence MUST include: names of the single-purpose apps and what each does

Return ONLY valid JSON array (no markdown, no code fences):
[
  {
    "title": "<max 8 words, specific and actionable>",
    "type": "<exactly one of: Momentum | Monopoly | Gap | Complaint | Price | Geography | Bundle>",
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

COMPLAINT HARD RULE: I will programmatically reject any Complaint opportunity where the cited rating is above 4.20. Do not cite apps with ratings above 4.20 for Complaint type.

GEOGRAPHY HARD RULE: Geography MUST name a specific language (Spanish, Arabic, Hindi, Turkish, French, Portuguese, German, Japanese, Korean, Chinese) or country (Brazil, India, Mexico, Turkey, Japan, etc.) in the evidence. "Senior users" or "older adults" are NOT geographic segments — use Gap type instead.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const raw: any[] = JSON.parse(cleaned);

  // Validate and filter
  let filtered = validateOpportunities(raw);

  // If too few remain, backfill with a second Claude call
  if (filtered.length < 4) {
    const removedCount = raw.length - filtered.length;
    const backfill = await backfillOpportunities(
      subcategory, categoryLabel, itunesApps, newReleases, phPosts,
      filtered, removedCount,
    );
    filtered = [...filtered, ...validateOpportunities(backfill)];
  }

  return filtered;
}

/* ── Post-generation validation ──────────────────────────────── */

const GEO_KEYWORDS = [
  "spanish", "arabic", "hindi", "turkish", "french", "portuguese", "german",
  "japanese", "korean", "chinese", "mandarin", "cantonese", "russian", "italian",
  "thai", "vietnamese", "indonesian", "malay", "swahili", "urdu", "persian", "farsi",
  "brazil", "india", "mexico", "turkey", "japan", "china", "korea", "indonesia",
  "egypt", "nigeria", "pakistan", "bangladesh", "philippines", "vietnam", "thailand",
  "colombia", "argentina", "peru", "chile", "saudi", "emirates", "latin america",
  "southeast asia", "middle east", "africa",
];

function validateOpportunities(opportunities: any[]): any[] {
  return opportunities.filter((opp) => {
    // Complaint: reject if evidence cites a rating above 4.2
    if (opp.type === "Complaint") {
      const ratings = (opp.evidence || "").match(/\d+\.\d+/g);
      if (ratings && ratings.some((r: string) => parseFloat(r) > 4.2)) {
        console.log("FILTERED Complaint (rating > 4.2):", opp.title, "ratings found:", ratings);
        return false;
      }
    }

    // Geography: reject if evidence doesn't mention a language or country
    if (opp.type === "Geography") {
      const evidenceLower = (opp.evidence || "").toLowerCase();
      const hasGeoRef = GEO_KEYWORDS.some((kw) => evidenceLower.includes(kw));
      if (!hasGeoRef) {
        console.log("FILTERED Geography (no language/country):", opp.title);
        return false;
      }
    }

    return true;
  });
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

## App Store Data (top apps by reviews)
${JSON.stringify(itunesApps.slice(0, 15), null, 2)}

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
