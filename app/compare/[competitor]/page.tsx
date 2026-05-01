import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COMPARISONS } from "../comparisons";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return COMPARISONS.map(c => ({ competitor: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ competitor: string }> }): Promise<Metadata> {
  const { competitor } = await params;
  const item = COMPARISONS.find(c => c.slug === competitor);
  if (!item) return { title: "Comparison not found — Unbuilt" };
  const title = `${item.shortTitle} — Which startup idea validator should you use?`;
  // Snippet-safe (≤160 chars). The factual one-line difference makes a strong SERP teaser.
  const description = item.oneLineDifference.length <= 160
    ? item.oneLineDifference
    : item.oneLineDifference.slice(0, 157) + "...";
  const url = `https://www.unbuilt.me/compare/${item.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article" },
    twitter:   { title, description, card: "summary_large_image" },
    keywords: [
      `${item.competitor} alternative`,
      `${item.competitor} vs Unbuilt`,
      `Unbuilt vs ${item.competitor}`,
      "startup idea validator",
      "vibe coder tools",
      "indie hacker tools",
    ],
  };
}

/**
 * Per-competitor comparison page. The page is intentionally dense in
 * server-rendered prose because:
 *   1. Visitors searching "Unbuilt vs X" or "X alternative" land here
 *      and want to make a decision in 30 seconds.
 *   2. AI assistants doing live web fetches (ChatGPT, Claude,
 *      Perplexity) cite the page that owns the exact comparison query.
 *      We want to be that page.
 *   3. Fair acknowledgement of competitor strengths makes the page
 *      look authoritative rather than promotional, which is what AI
 *      systems prefer to cite.
 */
export default async function ComparePage({ params }: { params: Promise<{ competitor: string }> }) {
  const { competitor } = await params;
  const item = COMPARISONS.find(c => c.slug === competitor);
  if (!item) notFound();

  // Inline FAQ schema for this specific comparison so each page is
  // independently eligible for rich-result snippets in search.
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `What's the difference between Unbuilt and ${item.competitor}?`,
        "acceptedAnswer": { "@type": "Answer", "text": item.summary },
      },
      {
        "@type": "Question",
        "name": `When should I pick Unbuilt over ${item.competitor}?`,
        "acceptedAnswer": { "@type": "Answer", "text": item.whenToPickUnbuilt },
      },
      {
        "@type": "Question",
        "name": `When should I pick ${item.competitor} over Unbuilt?`,
        "acceptedAnswer": { "@type": "Answer", "text": item.whenToPickThem },
      },
    ],
  };

  // Breadcrumb schema for richer SERP appearance.
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home",     "item": "https://www.unbuilt.me" },
      { "@type": "ListItem", "position": 2, "name": "Compare",  "item": "https://www.unbuilt.me/compare" },
      { "@type": "ListItem", "position": 3, "name": item.shortTitle, "item": `https://www.unbuilt.me/compare/${item.slug}` },
    ],
  };

  return (
    <article style={{ maxWidth: 920, margin: "0 auto", padding: "60px 20px 100px", fontFamily: "var(--font-figtree), 'Figtree', sans-serif", color: "var(--clr-text)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Breadcrumb-style nav */}
      <nav style={{ fontSize: 13, color: "var(--clr-text-3)", marginBottom: 16 }}>
        <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Home</Link>
        <span style={{ margin: "0 6px" }}>›</span>
        <Link href="/compare" style={{ color: "inherit", textDecoration: "none" }}>Compare</Link>
        <span style={{ margin: "0 6px" }}>›</span>
        <span>{item.shortTitle}</span>
      </nav>

      <h1 style={{
        fontSize: "clamp(2rem, 5vw, 2.75rem)",
        fontWeight: 800,
        letterSpacing: "-0.025em",
        margin: "0 0 12px",
        fontFamily: "var(--font-syne), 'Syne', sans-serif",
        lineHeight: 1.15,
      }}>
        {item.shortTitle}
      </h1>
      <p style={{ fontSize: "1.125rem", lineHeight: 1.6, color: "var(--clr-text-2)", margin: "0 0 36px", maxWidth: 720 }}>
        {item.oneLineDifference}
      </p>

      {/* Side-by-side card */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 48 }}>
        <section style={{ background: "var(--clr-surface)", border: "2px solid var(--clr-primary)", borderRadius: 14, padding: "24px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--clr-primary)", marginBottom: 6 }}>Unbuilt</div>
          <h2 style={{ fontSize: "1.375rem", fontWeight: 700, margin: "0 0 4px", fontFamily: "var(--font-syne), 'Syne', sans-serif" }}>The decision layer between idea and build</h2>
          <p style={{ fontSize: "0.9375rem", color: "var(--clr-text-3)", margin: "0 0 16px" }}>Validate, pick the right stack, ship the right thing.</p>
          <ul style={{ paddingLeft: 18, margin: 0, fontSize: "0.9375rem", lineHeight: 1.65, color: "var(--clr-text-2)" }}>
            {item.unbuiltStrengths.map((s, i) => <li key={i} style={{ marginBottom: 8 }}>{s}</li>)}
          </ul>
        </section>

        <section style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 14, padding: "24px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--clr-text-3)", marginBottom: 6 }}>{item.competitor}</div>
          <h2 style={{ fontSize: "1.375rem", fontWeight: 700, margin: "0 0 4px", fontFamily: "var(--font-syne), 'Syne', sans-serif" }}>{item.competitorTagline}</h2>
          <p style={{ fontSize: "0.9375rem", color: "var(--clr-text-3)", margin: "0 0 16px" }}>Strengths to be aware of:</p>
          <ul style={{ paddingLeft: 18, margin: 0, fontSize: "0.9375rem", lineHeight: 1.65, color: "var(--clr-text-2)" }}>
            {item.competitorStrengths.map((s, i) => <li key={i} style={{ marginBottom: 8 }}>{s}</li>)}
          </ul>
        </section>
      </div>

      {/* When to pick which */}
      <h2 style={{ fontSize: "clamp(1.5rem, 3.5vw, 1.875rem)", fontWeight: 800, letterSpacing: "-0.02em", margin: "48px 0 16px", fontFamily: "var(--font-syne), 'Syne', sans-serif" }}>
        When to pick which
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 48 }}>
        <div style={{ padding: "20px 22px", background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 12 }}>
          <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, margin: "0 0 8px", fontFamily: "var(--font-syne), 'Syne', sans-serif" }}>Pick Unbuilt if…</h3>
          <p style={{ fontSize: "0.9375rem", lineHeight: 1.6, color: "var(--clr-text-2)", margin: 0 }}>{item.whenToPickUnbuilt}</p>
        </div>
        <div style={{ padding: "20px 22px", background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 12 }}>
          <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, margin: "0 0 8px", fontFamily: "var(--font-syne), 'Syne', sans-serif" }}>Pick {item.competitor} if…</h3>
          <p style={{ fontSize: "0.9375rem", lineHeight: 1.6, color: "var(--clr-text-2)", margin: 0 }}>{item.whenToPickThem}</p>
        </div>
      </div>

      {/* Summary */}
      <h2 style={{ fontSize: "clamp(1.5rem, 3.5vw, 1.875rem)", fontWeight: 800, letterSpacing: "-0.02em", margin: "48px 0 16px", fontFamily: "var(--font-syne), 'Syne', sans-serif" }}>
        Summary
      </h2>
      <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "var(--clr-text-2)", margin: "0 0 40px" }}>
        {item.summary}
      </p>

      {/* CTA */}
      <div style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 16, padding: "28px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(1.25rem, 3vw, 1.625rem)", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 8px", fontFamily: "var(--font-syne), 'Syne', sans-serif" }}>
          Try Unbuilt for free
        </h2>
        <p style={{ fontSize: "0.9375rem", lineHeight: 1.6, color: "var(--clr-text-2)", margin: "0 auto 16px", maxWidth: 460 }}>
          One free Dig analysis and one free Stack recommendation per day, with no credit card.
        </p>
        <Link href="/" style={{
          display: "inline-block",
          padding: "11px 24px",
          borderRadius: 10,
          background: "var(--clr-text)",
          color: "#fff",
          textDecoration: "none",
          fontSize: "0.9375rem",
          fontWeight: 600,
          fontFamily: "inherit",
        }}>
          Start with Dig →
        </Link>
      </div>

      {/* Other comparisons (internal linking helps every page in this set) */}
      <div style={{ marginTop: 56, paddingTop: 32, borderTop: "1px solid var(--clr-border)" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--clr-text-3)", margin: "0 0 12px" }}>Other comparisons</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {COMPARISONS.filter(c => c.slug !== item.slug).map(c => (
            <Link key={c.slug} href={`/compare/${c.slug}`} style={{
              padding: "6px 14px",
              fontSize: 13,
              borderRadius: 999,
              background: "var(--clr-surface)",
              border: "1px solid var(--clr-border)",
              color: "var(--clr-text-2)",
              textDecoration: "none",
            }}>
              {c.shortTitle}
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}
