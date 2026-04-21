import Link from "next/link";
import type { Metadata } from "next";
import { getSupabase } from "@/app/lib/supabase";
import ProBlurGate from "@/app/components/ProBlurGate";

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
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "2.5rem 20px 5rem" }}>
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

      {/* Table header */}
      <div style={{ display: "flex", alignItems: "center", padding: "0 20px 12px", gap: 16, borderBottom: "2px solid var(--clr-border)" }}>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "var(--clr-text-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Idea</div>
        <div style={{ width: 80, fontSize: 13, fontWeight: 700, color: "var(--clr-text-2)", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>Score</div>
        <div style={{ width: 100, fontSize: 13, fontWeight: 700, color: "var(--clr-text-2)", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>Competitors</div>
        <div style={{ width: 120, fontSize: 13, fontWeight: 700, color: "var(--clr-text-2)", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>Category</div>
      </div>

      {/* Ideas list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
        <ProBlurGate freeLimit={3}>
        {cards.map((p, i) => (
          <Link key={`${i}-${p.slug}`} href={p.ai ? `/startup-ideas/${p.slug}` : `/ideas/${p.slug}`} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", borderRadius: 12, background: "var(--clr-surface)", border: "1px solid var(--clr-border)", textDecoration: "none", transition: "border-color 0.15s, box-shadow 0.15s" }}>

            {/* Name + insight */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--clr-text)", lineHeight: 1.3 }}>
                  {p.name}
                </span>
              </div>
              {p.insight && (
                <div style={{ fontSize: 13, color: "var(--clr-text-3)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.insight}
                </div>
              )}
            </div>

            {/* Score — 3 bars */}
            <div style={{ width: 80, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 3, alignItems: "flex-end" }}>
                {[1, 2, 3].map(j => (
                  <div key={j} style={{ width: 8, height: 6 + j * 8, borderRadius: 2, background: j <= scoreBars(p.score) ? scoreColor(p.score) : "var(--clr-border)" }} />
                ))}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor(p.score) }}>{scoreLabel(p.score)}</span>
            </div>

            {/* Competitors */}
            <div style={{ width: 100, textAlign: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: "var(--clr-text)" }}>{p.competitors}</span>
            </div>

            {/* Category */}
            <div style={{ width: 120, textAlign: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 8, background: "var(--clr-surface-2)", color: "var(--clr-text-3)", whiteSpace: "nowrap" }}>
                {catLabel(p.cat)}
              </span>
            </div>
          </Link>
        ))}
        </ProBlurGate>
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
