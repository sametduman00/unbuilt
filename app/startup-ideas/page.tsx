import Link from "next/link";
import type { Metadata } from "next";
import { getSupabase } from "@/app/lib/supabase";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Startup Ideas — Unbuilt",
  description: "Browse 2,000+ startup ideas with opportunity scores and key insights. New AI-generated ideas added every 10 minutes.",
  openGraph: { title: "Startup Ideas — Unbuilt", description: "Browse 2,000+ startup ideas with opportunity scores and market gaps.", url: "https://unbuilt.me/startup-ideas" },
  alternates: { canonical: "https://unbuilt.me/startup-ideas" },
};

function catLabel(c: string) { return c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()); }
function scoreColor(s: number) { return s >= 70 ? "#22c55e" : s >= 40 ? "#f59e0b" : "#ef4444"; }
function scoreBars(s: number) { return s >= 70 ? 3 : s >= 40 ? 2 : 1; }
function scoreLabel(s: number) { return s >= 70 ? "High" : s >= 40 ? "Mid" : "Low"; }

const PER_PAGE = 60;

export default async function StartupIdeasPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1"));
  const sb = getSupabase();

  /* ── AI ideas (page 1 only) ── */
  let aiRows: any[] = [];
  if (page === 1) {
    const { data } = await sb.from("startup_ideas")
      .select("slug, title, category, opportunity_score, competitor_count, key_insight, one_liner")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(50);
    aiRows = data || [];
  }

  /* ── SEO pages (paginated) ── */
  const seoOffset = page === 1 ? 0 : (page - 1) * PER_PAGE;
  const seoLimit = page === 1 ? PER_PAGE - aiRows.length : PER_PAGE;

  const { data: seoRows } = await sb.from("seo_pages")
    .select("slug, keyword, category, opportunity_score, competitor_count, key_insight")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .range(seoOffset, seoOffset + seoLimit - 1);

  /* ── Totals ── */
  const { count: seoTotal } = await sb.from("seo_pages").select("id", { count: "exact", head: true }).eq("status", "published");
  const { count: aiTotal } = await sb.from("startup_ideas").select("id", { count: "exact", head: true }).eq("status", "published");
  const total = (seoTotal || 0) + (aiTotal || 0);
  const totalPages = Math.ceil((seoTotal || 0) / PER_PAGE);

  /* ── Build cards ── */
  const cards = [
    ...aiRows.map(r => ({ slug: r.slug, name: r.title, insight: r.key_insight || r.one_liner || "", score: r.opportunity_score ?? 50, competitors: r.competitor_count ?? 5, cat: r.category, ai: true })),
    ...(seoRows || []).map(r => ({ slug: r.slug, name: r.keyword, insight: r.key_insight || "", score: r.opportunity_score ?? 50, competitors: r.competitor_count ?? 0, cat: r.category, ai: false })),
  ];

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 20px 5rem" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.035em", fontFamily: "'Syne', sans-serif", marginBottom: 8 }}>
        Startup Ideas
      </h1>
      <p style={{ fontSize: 16, color: "var(--clr-text-3)", marginBottom: 10, lineHeight: 1.6 }}>
        {total.toLocaleString()} ideas scanned. Find the gap. Skip the graveyard.
      </p>
      <p style={{ fontSize: 13, color: "var(--clr-text-4)", marginBottom: 32, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
        New AI ideas added every ~10 min
      </p>

      {/* Ideas list — single column */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {cards.map((p, i) => (
          <Link key={`${i}-${p.slug}`} href={p.ai ? `/startup-ideas/${p.slug}` : `/ideas/${p.slug}`} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 10, background: "var(--clr-surface)", border: "1px solid var(--clr-border)", textDecoration: "none", transition: "border-color 0.15s" }}>
            {/* Score dot */}
            {/* Score bars */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0, width: 38 }}>
              <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 24 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ width: 6, height: i * 7, borderRadius: 2, background: i <= scoreBars(p.score) ? scoreColor(p.score) : "var(--clr-border)" }} />
                ))}
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, color: scoreColor(p.score), letterSpacing: "0.03em" }}>{scoreLabel(p.score)}</span>
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--clr-text)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.name}
              </div>
              {p.insight && (
                <div style={{ fontSize: 13, color: "var(--clr-text-3)", lineHeight: 1.4, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.insight}
                </div>
              )}
            </div>

            {/* Meta */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {p.ai && (
                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4, background: "#dcfce7", color: "#15803d" }}>AI</span>
              )}
              <span style={{ fontSize: 12, color: "var(--clr-text-4)", whiteSpace: "nowrap" }}>
                {p.competitors} comp.
              </span>
              <span style={{ fontSize: 11, color: "var(--clr-text-4)", padding: "2px 8px", borderRadius: 6, background: "var(--clr-surface-2)", whiteSpace: "nowrap" }}>
                {catLabel(p.cat)}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {cards.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--clr-text-4)" }}>No ideas found.</div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 40 }}>
          {hasPrev ? (
            <Link href={`/startup-ideas?page=${page - 1}`} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid var(--clr-border)", background: "var(--clr-surface)", color: "var(--clr-text-2)", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
              ← Previous
            </Link>
          ) : <span />}
          <span style={{ fontSize: 13, color: "var(--clr-text-4)" }}>
            Page {page} / {totalPages}
          </span>
          {hasNext ? (
            <Link href={`/startup-ideas?page=${page + 1}`} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid var(--clr-border)", background: "var(--clr-surface)", color: "var(--clr-text-2)", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
              Next →
            </Link>
          ) : <span />}
        </div>
      )}

      {/* Bottom CTA */}
      <div style={{ marginTop: 48, padding: "32px 28px", borderRadius: 12, background: "linear-gradient(135deg, #7c6fff12 0%, #0891b212 100%)", border: "1px solid var(--clr-border-2)", textAlign: "center" }}>
        <h3 style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Syne', sans-serif", marginBottom: 8 }}>Got your own idea?</h3>
        <p style={{ fontSize: 15, color: "var(--clr-text-3)", marginBottom: 20 }}>Dig analyzes it against 70+ live sources in 5 minutes.</p>
        <Link href="/?tool=gap-analysis" style={{ display: "inline-flex", padding: "12px 28px", borderRadius: 8, background: "#7c6fff", color: "#fff", fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
          Try Dig free
        </Link>
      </div>
    </main>
  );
}
