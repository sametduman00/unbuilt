import Link from "next/link";
import type { Metadata } from "next";
import { getSupabase } from "@/app/lib/supabase";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Startup Ideas — Unbuilt",
  description: "Browse 1,000+ startup ideas with opportunity scores, competitor counts and key insights. New AI-generated ideas added every 10 minutes.",
  openGraph: { title: "Startup Ideas — Unbuilt", description: "Browse 1,000+ startup ideas with opportunity scores and market gaps.", url: "https://unbuilt.me/startup-ideas" },
  alternates: { canonical: "https://unbuilt.me/startup-ideas" },
};

interface IdeaCard { slug: string; keyword: string; key_insight: string; opportunity_score: number; competitor_count: number; category: string; source: "seo" | "ai"; }

function catLabel(c: string) { return c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()); }
function scoreColor(s: number) { return s >= 70 ? "#22c55e" : s >= 40 ? "#f59e0b" : "#ef4444"; }

const CAT_ORDER = [
  "saas","ai_tools","developer_tools","productivity","marketing","automation",
  "content_creation","ecommerce","finance","freelancing","health","education",
  "community","design","analytics","hr_and_hiring","travel","real_estate",
  "food_and_restaurant","legal","pet","parenting","sustainability","tools",
  "vibecoding","niche_ideas","gaming","fitness","general",
];

export default async function StartupIdeasPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const sp = await searchParams;
  const activeCat = sp.category || null;
  const sb = getSupabase();

  // Fetch seo_pages (3 batches — Supabase max 1000/query)
  const seoSelect = "slug, keyword, category, opportunity_score, competitor_count, key_insight";
  const mkQ = (from: number, to: number) => {
    let q = sb.from("seo_pages").select(seoSelect).eq("status", "published").order("opportunity_score", { ascending: false }).range(from, to);
    if (activeCat) q = q.eq("category", activeCat);
    return q;
  };
  const [{ data: s1 }, { data: s2 }, { data: s3 }] = await Promise.all([mkQ(0, 999), mkQ(1000, 1999), mkQ(2000, 2999)]);
  const seoData = [...(s1 || []), ...(s2 || []), ...(s3 || [])];

  // Fetch AI ideas
  let aq = sb.from("startup_ideas").select("slug, title, category, opportunity_score, competitor_count, key_insight, one_liner").eq("status", "published").order("created_at", { ascending: false }).limit(500);
  if (activeCat) aq = aq.eq("category", activeCat);
  const { data: aiData } = await aq;

  // Merge
  const seoCards: IdeaCard[] = (seoData || []).map(r => ({ slug: r.slug, keyword: r.keyword, key_insight: r.key_insight || "", opportunity_score: r.opportunity_score ?? 50, competitor_count: r.competitor_count ?? 0, category: r.category, source: "seo" as const }));
  const aiCards: IdeaCard[] = (aiData || []).map(r => ({ slug: r.slug, keyword: r.title, key_insight: r.key_insight || r.one_liner || "", opportunity_score: r.opportunity_score ?? 50, competitor_count: r.competitor_count ?? 5, category: r.category, source: "ai" as const }));
  const allCards = [...aiCards, ...seoCards];

  // Category counts (paginated)
  const mkCatQ = (from: number, to: number) => sb.from("seo_pages").select("category").eq("status", "published").range(from, to);
  const [{ data: sc1 }, { data: sc2 }, { data: sc3 }, { data: aiCats }] = await Promise.all([mkCatQ(0, 999), mkCatQ(1000, 1999), mkCatQ(2000, 2999), sb.from("startup_ideas").select("category").eq("status", "published")]);
  const catCounts: Record<string, number> = {};
  [...(sc1 || []), ...(sc2 || []), ...(sc3 || []), ...(aiCats || [])].forEach(r => { catCounts[r.category] = (catCounts[r.category] || 0) + 1; });
  const categories = CAT_ORDER.filter(c => catCounts[c]);
  const total = Object.values(catCounts).reduce((a, b) => a + b, 0);

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "2.5rem 20px 5rem" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.035em", fontFamily: "'Syne', sans-serif", marginBottom: 8 }}>
        Startup Ideas
      </h1>
      <p style={{ fontSize: 16, color: "var(--clr-text-3)", marginBottom: 10, maxWidth: 560, lineHeight: 1.6 }}>
        {total.toLocaleString()} ideas scanned. Find the gap. Skip the graveyard.
      </p>
      <p style={{ fontSize: 13, color: "var(--clr-text-4)", marginBottom: 32, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
        New AI ideas added every ~10 min
      </p>

      {/* Category pills */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 32 }}>
        <Link href="/startup-ideas" style={{ fontSize: 13, padding: "5px 14px", borderRadius: 6, background: !activeCat ? "var(--clr-text)" : "var(--clr-surface)", color: !activeCat ? "#fff" : "var(--clr-text-3)", border: "1px solid var(--clr-border)", textDecoration: "none", fontWeight: 500 }}>
          All
        </Link>
        {categories.map(cat => (
          <Link key={cat} href={`/startup-ideas?category=${cat}`} style={{ fontSize: 13, padding: "5px 14px", borderRadius: 6, background: activeCat === cat ? "var(--clr-text)" : "var(--clr-surface)", color: activeCat === cat ? "#fff" : "var(--clr-text-3)", border: "1px solid var(--clr-border)", textDecoration: "none", fontWeight: 500 }}>
            {catLabel(cat)} ({catCounts[cat]})
          </Link>
        ))}
      </div>

      {/* Ideas grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
        {allCards.map(p => (
          <Link key={`${p.source}-${p.slug}`} href={p.source === "seo" ? `/ideas/${p.slug}` : `/startup-ideas`} style={{ display: "block", padding: "16px 18px", borderRadius: 10, background: "var(--clr-surface)", border: "1px solid var(--clr-border)", textDecoration: "none", transition: "border-color 0.2s, box-shadow 0.2s", position: "relative" }}>
            {p.source === "ai" && (
              <span style={{ position: "absolute", top: 10, right: 12, fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4, background: "#dcfce7", color: "#15803d", letterSpacing: "0.04em" }}>AI</span>
            )}
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--clr-text)", marginBottom: 6, lineHeight: 1.35, paddingRight: p.source === "ai" ? 36 : 0 }}>
              {p.keyword}
            </div>
            {p.key_insight && (
              <div style={{ fontSize: 13, color: "var(--clr-text-3)", lineHeight: 1.5, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
                {p.key_insight}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "var(--clr-text-4)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: scoreColor(p.opportunity_score) }} />
                {p.opportunity_score}/100
              </span>
              <span style={{ color: "var(--clr-text-5)" }}>·</span>
              <span>{p.competitor_count ?? "?"} competitors</span>
              <span style={{ color: "var(--clr-text-5)" }}>·</span>
              <span>{catLabel(p.category)}</span>
            </div>
          </Link>
        ))}
      </div>

      {allCards.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--clr-text-4)" }}>No ideas published yet.</div>
      )}

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
