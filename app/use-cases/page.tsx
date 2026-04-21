import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Use Cases — Unbuilt",
  description: "How vibe coders, indie hackers, and no-code founders use Unbuilt to find what to build, validate app ideas, and ship the right thing.",
};

const CASES = [
  {
    q: "I have an app idea. How do I know if it already exists?",
    who: "Vibe coders with a new idea",
    tool: "Dig",
    toolColor: "#7c6fff",
    answer: "Describe your idea in plain language. Dig scans 70+ live sources — App Store, Google Play, Reddit, Product Hunt, X, YouTube — and tells you exactly what exists, where competitors failed, and where the real gap is. In 5 minutes.",
    href: "/?tab=dig",
    cta: "Dig my idea",
  },
  {
    q: "I want to build something but I don't know what.",
    who: "Vibe coders looking for their next project",
    tool: "Launches",
    toolColor: "#ef4444",
    answer: "Launches is a live feed of what's launching today on Product Hunt and the App Store — with AI analysis of what each product is missing. Scroll it daily. The gaps are right there.",
    href: "/",
    cta: "Open Launches",
  },
  {
    q: "Is my SaaS idea worth building or should I pivot?",
    who: "Indie hackers before they write code",
    tool: "Dig",
    toolColor: "#7c6fff",
    answer: "Dig gives you a Market Score (0-100), a list of real competitors with their ratings and weaknesses, the actual pain points users complain about on Reddit and X, and a verdict. You decide — we just give you the data.",
    href: "/?tab=dig",
    cta: "Validate my idea",
  },
  {
    q: "What tools should I use to build my idea?",
    who: "No-code and low-code founders",
    tool: "Stack",
    toolColor: "#38bdf8",
    answer: "Tell Stack what you're building, your budget, and your technical level. It returns a phased build plan with exact tools (from 700+), pricing, and a step-by-step guide for each tool. No Googling. No tab paralysis.",
    href: "/?tab=stack",
    cta: "Get my Stack",
  },
  {
    q: "How do I find a gap in a crowded market?",
    who: "Founders researching competitive spaces",
    tool: "Dig",
    toolColor: "#7c6fff",
    answer: "The gap is almost never where the market is empty. It's where existing apps stopped caring about one specific user type. Dig finds those users by reading App Store reviews, Reddit complaints, and YouTube comments at scale.",
    href: "/?tab=dig",
    cta: "Find the gap",
  },
  {
    q: "I want to track what's being built in my market.",
    who: "Founders doing ongoing market research",
    tool: "Launches",
    toolColor: "#ef4444",
    answer: "Launches updates daily. Filter by category — AI, Productivity, SaaS, Games, and more. Search by keyword. Every new launch shows what it does, how hard it is to compete with, and what it's missing. Free, forever.",
    href: "/",
    cta: "Track my market",
  },
];

function ToolBadge({ name, color }: { name: string; color: string }) {
  return (
    <span style={{
      fontSize: "0.6875rem",
      fontWeight: 700,
      padding: "2px 8px",
      borderRadius: 5,
      background: color + "18",
      color,
      letterSpacing: "0.02em",
    }}>{name}</span>
  );
}

export default function UseCasesPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--clr-bg)", color: "var(--clr-text)", fontFamily: "inherit" }}>
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "3rem 1.5rem 5rem" }}>
        <div style={{ marginBottom: "3rem" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--clr-text-4)", marginBottom: 12 }}>
            Use cases
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 12px", lineHeight: 1.1 }}>
            Who uses Unbuilt.<br />
            <span style={{ color: "var(--clr-text-3)", fontWeight: 400, fontStyle: "italic" }}>And how.</span>
          </h1>
          <p style={{ fontSize: "1rem", color: "var(--clr-text-3)", lineHeight: 1.6, maxWidth: 520, margin: 0 }}>
            Vibe coders, indie hackers, no-code founders. Anyone who wants to build the right thing instead of finding out 6 weeks later they built the wrong one.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {CASES.map((c, i) => (
            <div key={i} style={{
              background: "var(--clr-surface)",
              border: "1px solid var(--clr-border)",
              borderRadius: 14,
              padding: "1.5rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--clr-text-4)", letterSpacing: "0.05em" }}>{c.who}</span>
                <span style={{ color: "var(--clr-text-5)", fontSize: "0.7rem" }}>·</span>
                <ToolBadge name={c.tool} color={c.toolColor} />
              </div>
              <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, margin: "0 0 10px", letterSpacing: "-0.02em", lineHeight: 1.35 }}>
                {c.q}
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--clr-text-3)", lineHeight: 1.65, margin: "0 0 18px" }}>
                {c.answer}
              </p>
              <Link href={c.href} style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 16px",
                borderRadius: 8,
                background: c.toolColor,
                color: "#fff",
                textDecoration: "none",
                fontSize: "0.8125rem",
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}>
                {c.cta} →
              </Link>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "3rem", padding: "2rem", borderRadius: 16, border: "1px solid var(--clr-border-2)", textAlign: "center" }}>
          <p style={{ fontSize: "0.9375rem", fontWeight: 700, margin: "0 0 6px" }}>
            Not sure where to start?
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", margin: "0 0 18px" }}>
            Launches is free. Open it, scroll today's launches, and you'll find something worth digging into.
          </p>
          <Link href="/" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "10px 22px",
            borderRadius: 9,
            background: "var(--clr-text)",
            color: "var(--clr-bg)",
            textDecoration: "none",
            fontSize: "0.875rem",
            fontWeight: 700,
            letterSpacing: "-0.01em",
          }}>
            Open Launches — free →
          </Link>
        </div>
      </main>
    </div>
  );
}
