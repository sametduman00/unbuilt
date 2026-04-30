import Link from "next/link";
import type { Metadata } from "next";
import { getSupabase } from "@/app/lib/supabase";

export const metadata: Metadata = {
  title: "App Ideas & Market Gaps — Unbuilt",
  description: "Browse 5,000+ app ideas with market opportunity scores. Find gaps, compare tools, and discover what to build next. Powered by Unbuilt.",
  openGraph: {
    title: "App Ideas & Market Gaps — Unbuilt",
    description: "Browse 5,000+ app ideas with market opportunity scores. Find gaps, compare tools, and discover what to build next.",
    url: "https://www.unbuilt.me/ideas",
  },
  alternates: { canonical: "https://www.unbuilt.me/ideas" },
};

interface PageRow {
  slug: string;
  keyword: string;
  title: string;
  category: string;
  pattern: string;
  opportunity_score: number;
  competitor_count: number;
  key_insight: string;
}

function categoryLabel(cat: string): string {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function scoreColor(s: number): string {
  if (s >= 70) return "#22c55e";
  if (s >= 40) return "#f59e0b";
  return "#ef4444";
}

const CATEGORY_ORDER = [
  "saas", "ai_tools", "developer_tools", "productivity", "marketing",
  "automation", "content_creation", "ecommerce", "finance", "freelancing",
  "health", "education", "community", "design", "analytics",
  "hr_and_hiring", "travel", "real_estate", "food_and_restaurant",
  "legal", "pet", "parenting", "sustainability", "tools",
  "vibecoding", "niche_ideas", "general",
];

export default async function IdeasIndex({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const sp = await searchParams;
  const activeCategory = sp.category || null;

  const sb = getSupabase();

  // Get all categories with counts
  const { data: catData } = await sb
    .from("seo_pages")
    .select("category")
    .eq("status", "published");

  const catCounts: Record<string, number> = {};
  (catData || []).forEach((r: { category: string }) => {
    catCounts[r.category] = (catCounts[r.category] || 0) + 1;
  });

  const categories = CATEGORY_ORDER.filter((c) => catCounts[c]);

  // Fetch pages
  let query = sb
    .from("seo_pages")
    .select("slug, keyword, title, category, pattern, opportunity_score, competitor_count, key_insight")
    .eq("status", "published")
    .order("opportunity_score", { ascending: false })
    .limit(200);

  if (activeCategory) {
    query = query.eq("category", activeCategory);
  }

  const { data: pages } = await query;
  const rows = (pages || []) as PageRow[];

  return (
    <main style={{
      maxWidth: 960,
      margin: "0 auto",
      padding: "48px 20px 80px",
      fontFamily: "var(--font-figtree), 'Figtree', -apple-system, sans-serif",
    }}>
      <h1 style={{
        fontSize: 32,
        fontWeight: 800,
        letterSpacing: "-0.035em",
        fontFamily: "var(--font-syne), 'Syne', sans-serif",
        marginBottom: 8,
      }}>
        App Ideas & Market Gaps
      </h1>
      <p style={{
        fontSize: 16,
        color: "var(--clr-text-3)",
        marginBottom: 32,
        maxWidth: 560,
        lineHeight: 1.6,
      }}>
        {Object.values(catCounts).reduce((a, b) => a + b, 0).toLocaleString()} ideas scanned. Find the gap. Skip the graveyard.
      </p>

      {/* Category pills */}
      <div style={{
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
        marginBottom: 32,
      }}>
        <Link
          href="/ideas"
          style={{
            fontSize: 13,
            padding: "5px 14px",
            borderRadius: 6,
            background: !activeCategory ? "var(--clr-text)" : "var(--clr-surface)",
            color: !activeCategory ? "#fff" : "var(--clr-text-3)",
            border: "1px solid var(--clr-border)",
            textDecoration: "none",
            fontWeight: 500,
            transition: "all 0.15s",
          }}
        >
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat}
            href={`/ideas?category=${cat}`}
            style={{
              fontSize: 13,
              padding: "5px 14px",
              borderRadius: 6,
              background: activeCategory === cat ? "var(--clr-text)" : "var(--clr-surface)",
              color: activeCategory === cat ? "#fff" : "var(--clr-text-3)",
              border: "1px solid var(--clr-border)",
              textDecoration: "none",
              fontWeight: 500,
              transition: "all 0.15s",
            }}
          >
            {categoryLabel(cat)} ({catCounts[cat]})
          </Link>
        ))}
      </div>

      {/* Ideas grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 12,
      }}>
        {rows.map((p) => (
          <Link
            key={p.slug}
            href={`/ideas/${p.slug}`}
            style={{
              display: "block",
              padding: "16px 18px",
              borderRadius: 10,
              background: "var(--clr-surface)",
              border: "1px solid var(--clr-border)",
              textDecoration: "none",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
          >
            <div style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--clr-text)",
              marginBottom: 6,
              lineHeight: 1.35,
            }}>
              {p.keyword}
            </div>
            {p.key_insight && (
              <div style={{
                fontSize: 13,
                color: "var(--clr-text-3)",
                lineHeight: 1.5,
                marginBottom: 10,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>
                {p.key_insight}
              </div>
            )}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 12,
              color: "var(--clr-text-4)",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{
                  display: "inline-block",
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: scoreColor(p.opportunity_score),
                }} />
                {p.opportunity_score}/100
              </span>
              <span style={{ color: "var(--clr-text-5)" }}>·</span>
              <span>{p.competitor_count ?? "?"} competitors</span>
              <span style={{ color: "var(--clr-text-5)" }}>·</span>
              <span>{categoryLabel(p.category)}</span>
            </div>
          </Link>
        ))}
      </div>

      {rows.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          color: "var(--clr-text-4)",
        }}>
          No ideas published yet. Check back soon.
        </div>
      )}

      {/* Bottom CTA */}
      <div style={{
        marginTop: 48,
        padding: "32px 28px",
        borderRadius: 12,
        background: "linear-gradient(135deg, #7c6fff12 0%, #0891b212 100%)",
        border: "1px solid var(--clr-border-2)",
        textAlign: "center",
      }}>
        <h3 style={{
          fontSize: 20,
          fontWeight: 700,
          fontFamily: "var(--font-syne), 'Syne', sans-serif",
          marginBottom: 8,
        }}>
          Got your own idea?
        </h3>
        <p style={{ fontSize: 15, color: "var(--clr-text-3)", marginBottom: 20 }}>
          Dig analyzes it against 70+ live sources in 5 minutes.
        </p>
        <Link
          href="/?tab=dig"
          style={{
            display: "inline-flex",
            padding: "12px 28px",
            borderRadius: 8,
            background: "#7c6fff",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Try Dig free
        </Link>
      </div>
    </main>
  );
}
