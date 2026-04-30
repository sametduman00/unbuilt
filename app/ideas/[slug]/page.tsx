import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSupabase } from "@/app/lib/supabase";

// ── Types ──
interface SeoPage {
  id: string;
  slug: string;
  keyword: string;
  pattern: string;
  category: string;
  title: string;
  meta_description: string;
  h1: string;
  intro: string;
  market_summary: string;
  opportunity_score: number;
  competitor_count: number;
  key_insight: string;
  tags: string[];
  updated_at: string;
}

interface RelatedPage {
  slug: string;
  keyword: string;
  title: string;
  opportunity_score: number;
  category: string;
}

// ── Data fetching ──
async function getPage(slug: string): Promise<{ page: SeoPage; related: RelatedPage[] } | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("seo_pages")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !data) return null;

  const { data: related } = await sb
    .from("seo_pages")
    .select("slug, keyword, title, opportunity_score, category")
    .eq("status", "published")
    .eq("category", data.category)
    .neq("slug", slug)
    .order("opportunity_score", { ascending: false })
    .limit(8);

  return { page: data as SeoPage, related: (related || []) as RelatedPage[] };
}

// ── Dynamic Metadata ──
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPage(slug);
  if (!result) return { title: "Not Found — Unbuilt" };

  const { page } = result;
  return {
    title: page.title,
    description: page.meta_description,
    openGraph: {
      title: page.title,
      description: page.meta_description,
      url: `https://www.unbuilt.me/ideas/${page.slug}`,
      siteName: "Unbuilt",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.meta_description,
      site: "@Unbuilt_me",
    },
    alternates: {
      canonical: `https://www.unbuilt.me/ideas/${page.slug}`,
    },
  };
}

// ── Helpers ──
function scoreColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

function scoreLabel(score: number): string {
  if (score >= 70) return "High Opportunity";
  if (score >= 40) return "Moderate";
  return "Crowded";
}

function categoryLabel(cat: string): string {
  return cat
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function patternLabel(pattern: string): string {
  const map: Record<string, string> = {
    best_x_for_y: "Best Tools",
    alternative_to: "Alternatives",
    is_there_app: "App Discovery",
    how_to_build: "Build Guide",
    top_x: "Top Tools",
    comparison: "Comparison",
    market_gap: "Market Gap",
    long_tail: "Idea",
  };
  return map[pattern] || "Idea";
}

// ── Page Component ──
export default async function IdeaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getPage(slug);
  if (!result) notFound();

  const { page, related } = result;
  const sc = scoreColor(page.opportunity_score);

  // JSON-LD structured data — Article + FAQ for AI search citation
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: page.h1,
      description: page.meta_description,
      url: `https://www.unbuilt.me/ideas/${page.slug}`,
      publisher: {
        "@type": "Organization",
        name: "Unbuilt",
        url: "https://www.unbuilt.me",
      },
      dateModified: page.updated_at,
      keywords: page.tags?.join(", ") || page.keyword,
      about: {
        "@type": "Thing",
        name: page.keyword,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `What is the market opportunity for ${page.keyword}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `The market opportunity score for ${page.keyword} is ${page.opportunity_score}/100 with approximately ${page.competitor_count || 'unknown'} existing competitors. ${page.key_insight || ''}`
          }
        },
        {
          "@type": "Question",
          name: `How many competitors exist for ${page.keyword}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `There are approximately ${page.competitor_count || 'several'} competitors in the ${page.keyword} space. ${page.market_summary?.split('.').slice(0, 2).join('.') || ''}.`
          }
        },
        {
          "@type": "Question",
          name: `Is ${page.keyword} worth building?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `With an opportunity score of ${page.opportunity_score}/100, ${page.opportunity_score >= 70 ? 'this is a high-opportunity space with clear gaps' : page.opportunity_score >= 40 ? 'this is a moderately competitive space with some opportunities' : 'this is a crowded space — differentiation is critical'}. For a full analysis, use Dig at unbuilt.me to scan 70+ live sources.`
          }
        }
      ]
    }
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "48px 20px 80px",
        fontFamily: "'Figtree', -apple-system, sans-serif",
      }}>
        {/* Breadcrumb */}
        <nav style={{
          fontSize: 13,
          color: "var(--clr-text-4)",
          marginBottom: 24,
          display: "flex",
          gap: 6,
          alignItems: "center",
          flexWrap: "wrap",
        }}>
          <Link href="/" style={{ color: "var(--clr-text-4)", textDecoration: "none" }}>Unbuilt</Link>
          <span>›</span>
          <Link href="/ideas" style={{ color: "var(--clr-text-4)", textDecoration: "none" }}>Ideas</Link>
          <span>›</span>
          <Link
            href={`/ideas?category=${page.category}`}
            style={{ color: "var(--clr-text-4)", textDecoration: "none" }}
          >
            {categoryLabel(page.category)}
          </Link>
          <span>›</span>
          <span style={{ color: "var(--clr-text-3)" }}>{page.keyword}</span>
        </nav>

        {/* Badge row */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            padding: "3px 10px",
            borderRadius: 4,
            background: "var(--clr-surface)",
            color: "var(--clr-text-3)",
            border: "1px solid var(--clr-border)",
          }}>
            {patternLabel(page.pattern)}
          </span>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            padding: "3px 10px",
            borderRadius: 4,
            background: "var(--clr-surface)",
            color: "var(--clr-text-3)",
            border: "1px solid var(--clr-border)",
          }}>
            {categoryLabel(page.category)}
          </span>
        </div>

        {/* H1 */}
        <h1 style={{
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: "-0.035em",
          lineHeight: 1.2,
          margin: "0 0 16px",
          color: "var(--clr-text)",
          fontFamily: "'Syne', sans-serif",
        }}>
          {page.h1}
        </h1>

        {/* Intro */}
        {page.intro && (
          <p style={{
            fontSize: 17,
            lineHeight: 1.65,
            color: "var(--clr-text-2)",
            margin: "0 0 32px",
          }}>
            {page.intro}
          </p>
        )}

        {/* Score card */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 32,
        }}>
          {/* Opportunity Score */}
          <div style={{
            padding: "20px 24px",
            borderRadius: 10,
            background: "var(--clr-surface)",
            border: "1px solid var(--clr-border)",
          }}>
            <div style={{ fontSize: 12, color: "var(--clr-text-4)", marginBottom: 8, fontWeight: 500 }}>
              Opportunity Score
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: sc, fontFamily: "'Syne', sans-serif" }}>
                {page.opportunity_score}
              </span>
              <span style={{ fontSize: 14, color: sc, fontWeight: 600 }}>
                / 100
              </span>
            </div>
            <div style={{ fontSize: 13, color: "var(--clr-text-3)", marginTop: 4 }}>
              {scoreLabel(page.opportunity_score)}
            </div>
          </div>

          {/* Competitors */}
          <div style={{
            padding: "20px 24px",
            borderRadius: 10,
            background: "var(--clr-surface)",
            border: "1px solid var(--clr-border)",
          }}>
            <div style={{ fontSize: 12, color: "var(--clr-text-4)", marginBottom: 8, fontWeight: 500 }}>
              Estimated Competitors
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{
                fontSize: 36, fontWeight: 800, color: "var(--clr-text)",
                fontFamily: "'Syne', sans-serif",
              }}>
                {page.competitor_count ?? "—"}
              </span>
              <span style={{ fontSize: 14, color: "var(--clr-text-3)", fontWeight: 500 }}>
                apps
              </span>
            </div>
            <div style={{ fontSize: 13, color: "var(--clr-text-3)", marginTop: 4 }}>
              {page.competitor_count && page.competitor_count > 50
                ? "Crowded space"
                : page.competitor_count && page.competitor_count > 15
                  ? "Competitive"
                  : "Low competition"}
            </div>
          </div>
        </div>

        {/* Key insight */}
        {page.key_insight && (
          <div style={{
            padding: "16px 20px",
            borderRadius: 8,
            borderLeft: `3px solid ${sc}`,
            background: "var(--clr-surface)",
            marginBottom: 32,
            fontSize: 15,
            lineHeight: 1.6,
            color: "var(--clr-text-2)",
          }}>
            <strong style={{ color: "var(--clr-text)" }}>Key insight:</strong>{" "}
            {page.key_insight}
          </div>
        )}

        {/* Market summary */}
        {page.market_summary && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 16,
              fontFamily: "'Syne', sans-serif",
              color: "var(--clr-text)",
            }}>
              Market Overview
            </h2>
            <div style={{
              fontSize: 15,
              lineHeight: 1.75,
              color: "var(--clr-text-2)",
              whiteSpace: "pre-line",
            }}>
              {page.market_summary}
            </div>
          </div>
        )}

        {/* CTA — Dig deeper */}
        <div style={{
          padding: "32px 28px",
          borderRadius: 12,
          background: "linear-gradient(135deg, #7c6fff12 0%, #0891b212 100%)",
          border: "1px solid var(--clr-border-2)",
          textAlign: "center",
          marginBottom: 48,
        }}>
          <h3 style={{
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 8,
            fontFamily: "'Syne', sans-serif",
          }}>
            Want the full report?
          </h3>
          <p style={{
            fontSize: 15,
            color: "var(--clr-text-3)",
            marginBottom: 20,
            maxWidth: 440,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.6,
          }}>
            This is a preview. Dig analyzes your exact idea against 70+ live sources — competitors, pain points, gaps, and a market score. In 5 minutes.
          </p>
          <Link
            href={`/?tool=gap-analysis&idea=${encodeURIComponent(page.keyword)}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 28px",
              borderRadius: 8,
              background: "#7c6fff",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              textDecoration: "none",
              transition: "background 0.2s",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="7.5" stroke="#fff" strokeWidth="1.5" strokeDasharray="3.5 2.5" />
              <circle cx="11" cy="11" r="2.5" fill="#fff" opacity="0.4" />
              <path d="M11 1.5V4M11 18v2.5M1.5 11H4M18 11h2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Dig deeper
          </Link>
        </div>

        {/* Tags */}
        {page.tags && page.tags.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {page.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 12,
                    padding: "3px 10px",
                    borderRadius: 4,
                    background: "var(--clr-surface)",
                    color: "var(--clr-text-4)",
                    border: "1px solid var(--clr-border)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Related ideas — internal linking */}
        {related.length > 0 && (
          <div>
            <h2 style={{
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 16,
              fontFamily: "'Syne', sans-serif",
              color: "var(--clr-text)",
            }}>
              Related ideas
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 10,
            }}>
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/ideas/${r.slug}`}
                  style={{
                    display: "block",
                    padding: "14px 16px",
                    borderRadius: 8,
                    background: "var(--clr-surface)",
                    border: "1px solid var(--clr-border)",
                    textDecoration: "none",
                    transition: "border-color 0.2s",
                  }}
                >
                  <div style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--clr-text)",
                    marginBottom: 4,
                    lineHeight: 1.35,
                  }}>
                    {r.keyword}
                  </div>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12,
                    color: "var(--clr-text-4)",
                  }}>
                    <span style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: scoreColor(r.opportunity_score),
                    }} />
                    {r.opportunity_score}/100
                    <span style={{ color: "var(--clr-text-5)" }}>·</span>
                    {categoryLabel(r.category)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div style={{
          marginTop: 48,
          paddingTop: 32,
          borderTop: "1px solid var(--clr-border)",
          textAlign: "center",
        }}>
          <p style={{ fontSize: 14, color: "var(--clr-text-4)", marginBottom: 8 }}>
            Powered by{" "}
            <Link href="/" style={{ color: "var(--clr-accent)", fontWeight: 600 }}>
              Unbuilt
            </Link>
            {" "}— the home base for the vibecoding generation.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", fontSize: 13 }}>
            <Link href="/" style={{ color: "var(--clr-text-4)" }}>Launches</Link>
            <Link href="/?tab=dig" style={{ color: "var(--clr-text-4)" }}>Dig</Link>
            <Link href="/?tab=stack" style={{ color: "var(--clr-text-4)" }}>Stack</Link>
            <Link href="/ideas" style={{ color: "var(--clr-text-4)" }}>All Ideas</Link>
          </div>
        </div>
      </main>
    </>
  );
}
