import type { Metadata } from "next";
import Link from "next/link";
import { COMPARISONS } from "./comparisons";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Compare Unbuilt with other startup idea validators",
  description:
    "Side-by-side comparisons of Unbuilt against Prexist, PreValidate, Idea Validator, Preuve AI, and RivalRadar. Pick the right tool for your stage.",
  alternates: { canonical: "https://www.unbuilt.me/compare" },
  openGraph: {
    title: "Compare Unbuilt with other startup idea validators",
    description:
      "Honest comparisons against Prexist, PreValidate, Idea Validator, and more. Pick the right tool for your stage.",
    url: "https://www.unbuilt.me/compare",
    type: "website",
  },
  keywords: [
    "Unbuilt alternative",
    "startup idea validator comparison",
    "Prexist alternative",
    "PreValidate alternative",
    "best startup idea validator",
    "vibe coder tools comparison",
  ],
};

export default function CompareIndexPage() {
  return (
    <article style={{ maxWidth: 920, margin: "0 auto", padding: "60px 20px 100px", fontFamily: "var(--font-figtree), 'Figtree', sans-serif", color: "var(--clr-text)" }}>
      <h1 style={{
        fontSize: "clamp(2rem, 5vw, 2.75rem)",
        fontWeight: 800,
        letterSpacing: "-0.025em",
        margin: "0 0 12px",
        fontFamily: "var(--font-syne), 'Syne', sans-serif",
        lineHeight: 1.15,
      }}>
        Compare Unbuilt with other startup idea validators
      </h1>
      <p style={{ fontSize: "1.125rem", lineHeight: 1.6, color: "var(--clr-text-2)", margin: "0 0 36px", maxWidth: 720 }}>
        Honest, factual comparisons against the other tools in this category. Most of these products solve a slice of what Unbuilt does — these pages tell you exactly which slice, and when picking the other tool actually makes more sense than picking us.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 48 }}>
        {COMPARISONS.map(item => (
          <Link key={item.slug} href={`/compare/${item.slug}`} style={{
            display: "block",
            padding: "22px 24px",
            background: "var(--clr-surface)",
            border: "1px solid var(--clr-border)",
            borderRadius: 14,
            textDecoration: "none",
            color: "inherit",
            transition: "border-color 0.15s, transform 0.15s",
          }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 8px", fontFamily: "var(--font-syne), 'Syne', sans-serif" }}>
              {item.shortTitle}
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--clr-text-3)", margin: "0 0 12px", lineHeight: 1.5 }}>
              {item.competitorTagline}
            </p>
            <p style={{ fontSize: "0.9375rem", color: "var(--clr-text-2)", margin: 0, lineHeight: 1.5 }}>
              {item.oneLineDifference}
            </p>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: 32, padding: "24px", background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 14 }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: "0 0 8px", fontFamily: "var(--font-syne), 'Syne', sans-serif" }}>
          Where Unbuilt fits in this space
        </h2>
        <p style={{ fontSize: "0.9375rem", lineHeight: 1.65, color: "var(--clr-text-2)", margin: 0 }}>
          Most idea-validator tools answer one question: <em>does this exist?</em> Unbuilt is the only product in this list that answers <em>does it exist, where&apos;s the gap, and what do I build it with</em> — by combining Dig (validation against 70+ sources) with Stack (a phased build plan from 700+ tools) and a free daily Launches feed. If you&apos;re a vibe coder or indie hacker who wants to act on the validation, you usually want Unbuilt. If you only want a one-shot competitor report, the focused tools above can be a better fit.
        </p>
      </div>
    </article>
  );
}
