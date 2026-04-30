import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSupabase } from "@/app/lib/supabase";

interface Idea {
  id: string; slug: string; title: string; category: string;
  one_liner: string; problem: string; target_audience: string;
  market_size: string; competition_level: string; difficulty: string;
  why_now: string; gap_reason: string; key_insight: string;
  opportunity_score: number; competitor_count: number; created_at: string;
}

async function getIdea(slug: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("startup_ideas").select("*").eq("slug", slug).eq("status", "published").single();
  if (error || !data) return null;

  const { data: related } = await sb
    .from("startup_ideas")
    .select("slug, title, category, opportunity_score, competitor_count")
    .eq("status", "published").neq("slug", slug)
    .order("created_at", { ascending: false }).limit(6);

  return { idea: data as Idea, related: (related || []) as Pick<Idea, "slug" | "title" | "category" | "opportunity_score" | "competitor_count">[] };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getIdea(slug);
  if (!result) return { title: "Not Found — Unbuilt" };
  const { idea } = result;
  return {
    title: `${idea.title} — Startup Idea | Unbuilt`,
    description: idea.one_liner,
    openGraph: { title: idea.title, description: idea.one_liner, url: `https://www.unbuilt.me/startup-ideas/${idea.slug}` },
    alternates: { canonical: `https://www.unbuilt.me/startup-ideas/${idea.slug}` },
  };
}

function scoreColor(s: number) { return s >= 70 ? "#22c55e" : s >= 40 ? "#f59e0b" : "#ef4444"; }
function scoreLabel(s: number) { return s >= 70 ? "High" : s >= 40 ? "Mid" : "Low"; }
function scoreBars(s: number) { return s >= 70 ? 3 : s >= 40 ? 2 : 1; }
function catLabel(c: string) { return c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()); }
function diffColor(d: string) { return d?.toLowerCase().includes("easy") ? "#22c55e" : d?.toLowerCase().includes("hard") ? "#ef4444" : "#f59e0b"; }

export default async function IdeaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getIdea(slug);
  if (!result) notFound();

  const { idea, related } = result;
  const sc = scoreColor(idea.opportunity_score);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 20px 80px", fontFamily: "var(--font-figtree), 'Figtree', -apple-system, sans-serif" }}>

      {/* Breadcrumb */}
      <nav style={{ fontSize: 13, color: "var(--clr-text-4)", marginBottom: 24, display: "flex", gap: 6, alignItems: "center" }}>
        <Link href="/" style={{ color: "var(--clr-text-4)", textDecoration: "none" }}>Unbuilt</Link>
        <span>›</span>
        <Link href="/startup-ideas" style={{ color: "var(--clr-text-4)", textDecoration: "none" }}>Startup Ideas</Link>
        <span>›</span>
        <span style={{ color: "var(--clr-text-3)" }}>{idea.title}</span>
      </nav>

      {/* Badges */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 4, background: "#dcfce7", color: "#15803d", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          AI Generated
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", padding: "3px 10px", borderRadius: 4, background: "var(--clr-surface)", color: "var(--clr-text-3)", border: "1px solid var(--clr-border)" }}>
          {catLabel(idea.category)}
        </span>
      </div>

      {/* Title */}
      <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.2, margin: "0 0 16px", color: "var(--clr-text)", fontFamily: "var(--font-syne), 'Syne', sans-serif" }}>
        {idea.title}
      </h1>

      {/* One-liner */}
      <p style={{ fontSize: 17, lineHeight: 1.65, color: "var(--clr-text-2)", margin: "0 0 32px" }}>
        {idea.one_liner}
      </p>

      {/* Score bar — horizontal */}
      <div style={{ display: "flex", gap: 0, marginBottom: 12, borderRadius: 10, border: "1px solid var(--clr-border)", overflow: "hidden" }}>
        <div style={{ flex: 1, padding: "14px 18px", background: "var(--clr-surface)", borderRight: "1px solid var(--clr-border)" }}>
          <div style={{ fontSize: 11, color: "var(--clr-text-4)", marginBottom: 8, fontWeight: 500 }}>Opportunity</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, height: 28 }}>
            <div style={{ display: "flex", gap: 3, alignItems: "flex-end" }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ width: 7, height: 6 + i * 7, borderRadius: 2, background: i <= scoreBars(idea.opportunity_score) ? sc : "var(--clr-border)" }} />
              ))}
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: sc }}>{scoreLabel(idea.opportunity_score)}</span>
          </div>
        </div>
        <div style={{ flex: 1, padding: "14px 18px", background: "var(--clr-surface)", borderRight: "1px solid var(--clr-border)" }}>
          <div style={{ fontSize: 11, color: "var(--clr-text-4)", marginBottom: 8, fontWeight: 500 }}>Competitors</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, height: 28 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: "var(--clr-text)", lineHeight: 1 }}>{idea.competitor_count ?? "—"}</span>
            <span style={{ fontSize: 13, color: "var(--clr-text-3)", fontWeight: 500 }}>apps</span>
          </div>
        </div>
        <div style={{ flex: 1, padding: "14px 18px", background: "var(--clr-surface)", borderRight: "1px solid var(--clr-border)" }}>
          <div style={{ fontSize: 11, color: "var(--clr-text-4)", marginBottom: 8, fontWeight: 500 }}>Difficulty</div>
          <div style={{ height: 28, display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: diffColor(idea.difficulty) }}>{(idea.difficulty || "Medium").split(/[—–,]/)[0].trim()}</span>
          </div>
        </div>
        <div style={{ flex: 1, padding: "14px 18px", background: "var(--clr-surface)" }}>
          <div style={{ fontSize: 11, color: "var(--clr-text-4)", marginBottom: 8, fontWeight: 500 }}>Market</div>
          <div style={{ height: 28, display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "var(--clr-text)" }}>{(idea.market_size || "Medium").split(/[—–,]/)[0].trim()}</span>
          </div>
        </div>
      </div>

      {/* Get Stack CTA — tied to difficulty */}
      <Link href={`/?tab=stack&idea=${encodeURIComponent(idea.one_liner)}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderRadius: 10, background: "var(--clr-surface)", border: "1px solid var(--clr-border)", textDecoration: "none", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--clr-text)", marginBottom: 2 }}>How would you build this?</div>
          <div style={{ fontSize: 13, color: "var(--clr-text-3)" }}>Get the recommended tech stack for &quot;{idea.title}&quot;</div>
        </div>
        <span style={{ padding: "8px 18px", borderRadius: 8, background: "var(--clr-text)", color: "#fff", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>Get my Stack →</span>
      </Link>

      {/* Key insight */}
      {(idea.key_insight || idea.gap_reason) && (
        <div style={{ padding: "16px 20px", borderRadius: 8, borderLeft: `3px solid ${sc}`, background: "var(--clr-surface)", marginBottom: 32, fontSize: 15, lineHeight: 1.6, color: "var(--clr-text-2)" }}>
          <strong style={{ color: "var(--clr-text)" }}>Key insight:</strong>{" "}
          {idea.key_insight || idea.gap_reason}
        </div>
      )}

      {/* Problem */}
      {idea.problem && (
        <Section title="The Problem">
          {idea.problem}
        </Section>
      )}

      {/* Target Audience */}
      {idea.target_audience && (
        <Section title="Target Audience">
          {idea.target_audience}
        </Section>
      )}

      {/* Why Now */}
      {idea.why_now && (
        <Section title="Why Now?">
          {idea.why_now}
        </Section>
      )}

      {/* Gap */}
      {idea.gap_reason && (
        <Section title="What's Missing">
          {idea.gap_reason}
        </Section>
      )}

      {/* Dig CTA — bottom */}
      <div style={{ padding: "32px 28px", borderRadius: 12, background: "linear-gradient(135deg, #7c6fff12 0%, #0891b212 100%)", border: "1px solid var(--clr-border-2)", textAlign: "center", marginBottom: 48 }}>
        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, fontFamily: "var(--font-syne), 'Syne', sans-serif" }}>Dig deeper into this idea</h3>
        <p style={{ fontSize: 15, color: "var(--clr-text-3)", marginBottom: 20, maxWidth: 440, margin: "0 auto 20px" }}>
          Get a full competitive analysis of &quot;{idea.title}&quot; — 70+ live sources scanned in 5 minutes.
        </p>
        <Link href={`/?tab=dig&idea=${encodeURIComponent(idea.one_liner)}`} style={{ display: "inline-flex", padding: "14px 32px", borderRadius: 8, background: "#7c6fff", color: "#fff", fontSize: 16, fontWeight: 600, textDecoration: "none" }}>
          Dig my Idea →
        </Link>
      </div>

      {/* Related ideas */}
      {related.length > 0 && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, fontFamily: "var(--font-syne), 'Syne', sans-serif", color: "var(--clr-text)" }}>
            More Startup Ideas
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {related.map(r => (
              <Link key={r.slug} href={`/startup-ideas/${r.slug}`} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 10, background: "var(--clr-surface)", border: "1px solid var(--clr-border)", textDecoration: "none" }}>
                <div style={{ display: "flex", gap: 2, alignItems: "flex-end", flexShrink: 0, width: 28 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ width: 5, height: i * 6, borderRadius: 2, background: i <= scoreBars(r.opportunity_score ?? 50) ? scoreColor(r.opportunity_score ?? 50) : "var(--clr-border)" }} />
                  ))}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--clr-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
                </div>
                <span style={{ fontSize: 11, color: "var(--clr-text-4)", padding: "2px 8px", borderRadius: 6, background: "var(--clr-surface-2)" }}>{catLabel(r.category)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, fontFamily: "var(--font-syne), 'Syne', sans-serif", color: "var(--clr-text)" }}>{title}</h2>
      <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--clr-text-2)", whiteSpace: "pre-line", margin: 0 }}>{children}</p>
    </div>
  );
}
