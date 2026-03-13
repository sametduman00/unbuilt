"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth, UserButton, SignInButton } from "@clerk/nextjs";

type TabId = "trend-feed" | "gap-analysis" | "stack-advisor";

interface TabConfig {
  id: TabId;
  name: string;
  tagline: string;
  accentColor: string;
  accentRgb: string;
  icon: React.ReactNode;
  who: string;
  what: string;
  steps: { title: string; desc: string }[];
  inputs: string[];
  outputs: { emoji: string; label: string; preview: string }[];
}

function IconTrend({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M2 16.5l5-7 4 3.5 5.5-9L19 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 4h5v5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconGap({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="7.5" stroke={color} strokeWidth="1.5" strokeDasharray="3.5 2.5" />
      <circle cx="11" cy="11" r="2.5" fill={color} opacity="0.4" />
      <path d="M11 1.5V4M11 18v2.5M1.5 11H4M18 11h2.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconStack({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M3 7.5l8-4.5 8 4.5-8 4.5L3 7.5z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3 12l8 4.5L19 12M3 16.5l8 4.5 8-4.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const TABS: TabConfig[] = [
  {
    id: "trend-feed",
    name: "Trend Feed",
    tagline: "Real signals, not hype",
    accentColor: "#7c3aed",
    accentRgb: "124,58,237",
    icon: <IconTrend color="#7c3aed" />,
    who: "Founders looking for their next idea, researchers scanning markets, or anyone who wants to know what's actually moving — backed by real data from GitHub and Hacker News, not just AI guesses.",
    what: "Trend Feed pulls live data from GitHub (repos created in the last 7 days) and Hacker News (posts from the last 30 days), then layers Claude AI analysis on top. You get a Space Temperature score from 0-100 across 5 levels — from Freezing to On Fire — so you can see at a glance whether a space is worth entering right now.",
    steps: [
      { title: "Describe the space", desc: "Type a market, industry, or technology — 'B2B SaaS tools', 'creator economy', 'AI code editors'. As broad or narrow as you want." },
      { title: "Live data is pulled", desc: "GitHub is searched for repos created in the last 7 days. Hacker News is queried for posts and discussions from the last 30 days. Both run in parallel while Claude begins its analysis." },
      { title: "Claude analyzes the landscape", desc: "Claude Sonnet synthesizes the live data with its training knowledge to identify rising topics, dying trends, underserved niches, and contrarian opportunities." },
      { title: "Space Temperature score appears", desc: "A 0-100 score with 5 levels (Freezing, Cool, Warm, Hot, On Fire) summarizes market momentum. HN engagement data can boost the score up to +15 points based on average post points and comment volume." },
    ],
    inputs: [
      "A market, industry, or category name",
      "Can be broad ('social apps') or narrow ('AI tools for solo lawyers')",
      "No need for specific company names — Claude infers the landscape",
    ],
    outputs: [
      { emoji: "🌡️", label: "Space Temperature", preview: "**Score: 78/100** — Hot. Significant activity in the last 7 days on GitHub (42 new repos) and strong HN engagement (avg 85 points, 340+ comments across 12 posts). HN boost: +12 points." },
      { emoji: "📈", label: "Rising Topics", preview: "**Async-first B2B tools** gaining real traction as remote teams reject synchronous standup culture. **Vertical AI agents** replacing horizontal platforms in legal, medical, and financial niches..." },
      { emoji: "💀", label: "Dying Trends", preview: "**All-in-one platforms** with feature bloat losing ground to focused single-purpose tools. Founders who built on **Notion as their core DB** are quietly migrating — the API limits are a ceiling..." },
      { emoji: "💡", label: "Underexplored Niches", preview: "**Compliance tooling for SMBs** — the customer exists (every business needs it), the problem is acute (penalties are real), but every existing solution targets enterprise and costs $40k+/yr..." },
    ],
  },
  {
    id: "gap-analysis",
    name: "Gap Analysis",
    tagline: "Find the gaps before you build",
    accentColor: "#7c3aed",
    accentRgb: "124,58,237",
    icon: <IconGap color="#7c3aed" />,
    who: "Founders with an app idea who want to know if there's a real opening before spending months building. See exactly who you're up against — with real apps from both the App Store and Google Play — plus where existing solutions fall short.",
    what: "Gap Analysis combines Claude AI with live App Store (iTunes) and Google Play searches to map your competitive landscape. You get a Market Opportunity score 0-100, competitor cards with threat levels, pain points with severity badges, market gaps with opportunity scores, a full SWOT analysis, and an ideal target customer persona — all from one query.",
    steps: [
      { title: "Describe your idea", desc: "Explain your niche or app concept in plain language. 'Project management for freelancers', 'AI writing tool for marketers', 'booking software for tattoo studios'. No deck needed." },
      { title: "App stores are searched", desc: "iTunes Search API and Google Play are queried simultaneously for existing apps in your space. Results are merged and deduplicated into one competitor list with ratings, downloads, and pricing." },
      { title: "Claude analyzes the full picture", desc: "Claude Sonnet identifies direct competitors, indirect alternatives, and DIY substitutes — then maps pain points, market gaps, and strategic opportunities with structured scoring." },
      { title: "You get a complete market report", desc: "Six visual sections: competitor cards with threat dots, pain points with severity badges, market gaps ranked by opportunity score, SWOT 2x2 grid, your opportunity hero card, and ideal target customer persona." },
    ],
    inputs: [
      "Your niche, category, or product concept",
      "The more specific, the sharper the analysis — 'AI writing tool' vs. 'AI email reply tool for customer support teams'",
      "No need to list competitors yourself — Claude finds them, plus real apps from both stores",
    ],
    outputs: [
      { emoji: "🏆", label: "Competitors + Threat Level", preview: "**Notion** — Threat: ●●●○ High. All-in-one workspace, weak on freelancer billing. 4.8★ App Store, 10M+ downloads. **Trello** — Threat: ●●○○ Medium. Simple boards but no invoicing or client portal. 4.5★, 50M+ downloads." },
      { emoji: "😤", label: "Pain Points + Severity", preview: "🔴 **Critical**: No unified client communication thread — freelancers juggle email, Slack, and DMs. 🟠 **High**: Manual invoice chasing wastes 4-6 hrs/week. 🟡 **Medium**: Time tracking disconnected from billing in every major tool." },
      { emoji: "🕳️", label: "Market Gaps + Opportunity Score", preview: "**Gap: Unified freelancer workflow** — Opportunity: 87/100. No tool combines time tracking + automatic invoice generation + client messaging under $50/mo. **Gap: Solo-friendly pricing** — Opportunity: 72/100. Every competitor charges per-seat, punishing single operators." },
      { emoji: "🎯", label: "Target Customer Persona", preview: "**Solo Sarah** — Freelance designer, 28-35, earns $60-120k/yr. Uses 4+ tools daily (Figma, Notion, QuickBooks, Gmail). Will pay $29/mo for something that saves 5+ hrs/week. Discovers tools via Twitter and designer communities." },
    ],
  },
  {
    id: "stack-advisor",
    name: "Stack Advisor",
    tagline: "Build fast, cheap, and right",
    accentColor: "#7c3aed",
    accentRgb: "124,58,237",
    icon: <IconStack color="#7c3aed" />,
    who: "Anyone starting a new project who doesn't want to over-engineer or waste money on the wrong tools. Especially useful for non-technical founders who need a technical co-founder's opinion, or developers spinning up a new product.",
    what: "Stack Advisor recommends specific tools across three build phases — Phase 0 (Validate), Phase 1 (MVP), and Phase 2 (Growth) — using a curated database of 150+ developer tools with real March 2026 pricing. Every recommendation includes free tier details, monthly costs, build order, common mistakes to avoid, scalability ceilings, and when to upgrade.",
    steps: [
      { title: "Describe what you're building", desc: "Give Claude the concept — 'a marketplace for local freelancers with payments and messaging', 'a SaaS dashboard for restaurant managers'. The more specific, the more targeted the stack." },
      { title: "Set your budget tier", desc: "Choose from Bootstrapped (< $50/mo), Growing ($50-200/mo), Funded ($200-1k/mo), or Scale ($1k+/mo). This filters out tools that are overkill or out of reach." },
      { title: "Set your technical level", desc: "No-code (you use Notion, Webflow, Zapier), Low-code (you can edit HTML/CSS and follow tutorials), or Developer (you can code, use CLIs, and deploy). Claude adjusts its recommendations accordingly." },
      { title: "Get a phased build plan", desc: "Three phases of tool recommendations with real pricing from our 150+ tool database. Each phase includes tool cards with free tier info, cost breakdowns, build order timeline, mistakes to avoid, and when to upgrade to the next phase." },
    ],
    inputs: [
      "What you're building (be specific about features — auth, payments, real-time, etc.)",
      "Your monthly infrastructure budget",
      "Your technical skill level — be honest, it affects the whole recommendation",
    ],
    outputs: [
      { emoji: "🛠️", label: "Phase 0 — Validate", preview: "**Goal**: Prove demand before writing code. **Carrd** ($0/mo free tier) for landing page. **Tally** ($0) for waitlist form. **Plausible** ($0 self-hosted) for traffic analytics. Total: **$0/mo**. Move to Phase 1 when you hit 200+ signups." },
      { emoji: "🚀", label: "Phase 1 — MVP", preview: "**Frontend**: Next.js on Vercel — free tier covers you to ~100k visits/mo. **Auth**: Clerk (free to 10k MAU). **Database**: Supabase (free 500MB). **Payments**: Stripe (2.9% + 30¢). Total: **$0/mo** until you scale. Each tool card shows free tier limits." },
      { emoji: "📈", label: "Phase 2 — Growth", preview: "**Upgrade triggers**: Supabase hits 500MB, Vercel cold starts affect UX, need team seats. **Database**: Supabase Pro ($25/mo). **Monitoring**: Sentry ($26/mo). **Email**: Resend ($20/mo). **Analytics**: PostHog (free to 1M events). Total: **~$71/mo**." },
      { emoji: "⚠️", label: "Mistakes to Avoid", preview: "**Don't** pay for auth before 10k users — Clerk/Supabase Auth free tiers are generous. **Don't** self-host databases to save $25/mo — your time is worth more. **Don't** add monitoring before launch — you need users before you need observability." },
    ],
  },
];

function MockOutput({ outputs, accentColor, accentRgb }: {
  outputs: TabConfig["outputs"];
  accentColor: string;
  accentRgb: string;
}) {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {outputs.map((out, i) => (
        <div
          key={i}
          style={{
            borderRadius: 14,
            border: expanded === i ? `1px solid rgba(${accentRgb},0.3)` : "1px solid var(--clr-border)",
            background: expanded === i ? `rgba(${accentRgb},0.04)` : "var(--clr-surface)",
            overflow: "hidden",
            transition: "all 0.2s ease",
          }}
        >
          <button
            onClick={() => setExpanded(expanded === i ? null : i)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0.875rem 1rem", background: "none", border: "none", cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <span style={{ fontSize: "1rem" }}>{out.emoji}</span>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: expanded === i ? accentColor : "var(--clr-text-3)", letterSpacing: "-0.01em" }}>
                {out.label}
              </span>
            </div>
            <svg
              width="14" height="14" viewBox="0 0 14 14" fill="none"
              style={{ transform: expanded === i ? "rotate(180deg)" : "none", transition: "transform 0.2s", color: "var(--clr-text-6)", flexShrink: 0 }}
            >
              <path d="M2 4.5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {expanded === i && (
            <div style={{
              padding: "0 1rem 1rem",
              borderTop: `1px solid rgba(${accentRgb},0.1)`,
              paddingTop: "0.875rem",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                marginBottom: "0.75rem",
                paddingBottom: "0.625rem",
                borderBottom: "1px solid var(--clr-border-deep)",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: accentColor, animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: "0.65rem", color: "var(--clr-text-8)", letterSpacing: "0.06em" }}>
                  SAMPLE OUTPUT PREVIEW
                </span>
              </div>
              <div className="card-prose">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                  table: ({ children }: any) => (
                    <div className="table-wrap"><table>{children}</table></div>
                  ),
                  code: ({ className, children }: any) => (
                    className
                      ? <pre><code className={className}>{children}</code></pre>
                      : <code style={{ background: "rgba(124,58,237,0.15)", color: "#c4b5fd", padding: "0.1em 0.35em", borderRadius: 4, fontSize: "0.85em" }}>{children}</code>
                  ),
                }}>
                  {out.preview}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function HowItWorks() {
  const { isSignedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("trend-feed");
  const [light, setLight] = useState(false);
  const tab = TABS.find((t) => t.id === activeTab)!;

  useEffect(() => {
    if (localStorage.getItem("theme") === "light") {
      setLight(true);
      document.documentElement.classList.add("light");
    }
  }, []);

  const toggleTheme = () => {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("theme", next ? "light" : "dark");
  };

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        * { box-sizing: border-box; }
        ::placeholder { color: var(--clr-placeholder) !important; }
      `}</style>

      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {/* ── Header ── */}
        <header style={{
          borderBottom: "1px solid #1a1a1a",
          backdropFilter: "blur(12px) saturate(180%)",
          background: "rgba(0,0,0,0.8)",
          position: "sticky", top: 0, zIndex: 50,
        }}>
          <div style={{
            maxWidth: 1200, margin: "0 auto", padding: "0 2rem",
            height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: "#7c3aed",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="14" height="14" viewBox="0 0 19 19" fill="none">
                  <path d="M2.5 5.5h14M2.5 9.5h10M2.5 13.5h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <span style={{ fontWeight: 700, fontSize: "1rem", color: "#ffffff", letterSpacing: "-0.02em" }}>Unbuilt</span>
            </Link>

            <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#71717a", letterSpacing: "-0.01em" }}>
              How it works
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Link href="/" style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "0.375rem 0.875rem", borderRadius: 999,
                background: "transparent", border: "1px solid #333333",
                color: "#ffffff", fontSize: "0.8125rem", fontWeight: 600,
                textDecoration: "none", letterSpacing: "-0.01em",
              }}>
                ← Back to tools
              </Link>

              {/* Auth */}
              {!isSignedIn ? (
                <SignInButton mode="modal">
                  <button style={{
                    padding: "0.375rem 1rem", borderRadius: 999,
                    background: "transparent",
                    border: "1px solid #333333",
                    color: "#ffffff", fontSize: "0.8125rem", fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit", letterSpacing: "-0.01em",
                    transition: "border-color 0.15s ease",
                  }}>
                    Sign in
                  </button>
                </SignInButton>
              ) : (
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: { width: 32, height: 32 },
                    },
                  }}
                />
              )}
            </div>
          </div>
        </header>

        {/* ── Main ── */}
        <main style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "0 2.5rem", flex: 1 }}>

          {/* Page header */}
          <div style={{ textAlign: "center", padding: "4rem 0 3rem", maxWidth: 600, margin: "0 auto" }}>
            <h1 style={{
              fontSize: "clamp(1.875rem, 3.5vw, 2.75rem)", fontWeight: 800,
              letterSpacing: "-0.035em", lineHeight: 1.1, color: "var(--clr-text)",
              marginBottom: "1rem",
            }}>
              Three tools. One honest output.
            </h1>
            <p style={{ color: "var(--clr-text-5)", fontSize: "1rem", lineHeight: 1.7, textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
              Each tool uses Claude Sonnet with a purpose-built prompt and live data sources to give you structured, specific analysis — not generic AI rambling.
            </p>
          </div>

          {/* ── Tab bar ── */}
          <div style={{
            display: "flex", gap: "0.5rem",
            padding: "0.375rem",
            background: "var(--clr-surface)",
            border: "1px solid var(--clr-border-deep)",
            borderRadius: 16,
            marginBottom: "2.5rem",
          }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  padding: "0.625rem 1rem", borderRadius: 11,
                  background: activeTab === t.id ? `rgba(${t.accentRgb},0.1)` : "transparent",
                  border: activeTab === t.id ? `1px solid rgba(${t.accentRgb},0.3)` : "1px solid transparent",
                  color: activeTab === t.id ? t.accentColor : "var(--clr-text-6)",
                  fontSize: "0.8125rem", fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "all 0.18s ease",
                  letterSpacing: "-0.01em",
                }}
              >
                {t.icon}
                <span>{t.name}</span>
              </button>
            ))}
          </div>

          {/* ── Tab content ── */}
          <div key={activeTab} style={{ animation: "fadeIn 0.22s ease", paddingBottom: "5rem" }}>

            {/* Tool hero */}
            <div style={{
              display: "flex", alignItems: "flex-start", gap: "1.25rem",
              padding: "1.75rem", borderRadius: 12,
              background: `rgba(${tab.accentRgb},0.04)`,
              border: `1px solid rgba(${tab.accentRgb},0.18)`,
              marginBottom: "2.5rem",
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: `rgba(${tab.accentRgb},0.12)`,
                border: `1px solid rgba(${tab.accentRgb},0.25)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {tab.icon}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "0.375rem" }}>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 750, color: "var(--clr-text)", letterSpacing: "-0.025em", margin: 0 }}>
                    {tab.name}
                  </h2>
                  <span style={{ fontSize: "0.75rem", color: tab.accentColor, fontWeight: 600, opacity: 0.8 }}>
                    {tab.tagline}
                  </span>
                </div>
                <p style={{ color: "var(--clr-text-4)", fontSize: "0.9375rem", lineHeight: 1.7, margin: 0, maxWidth: 680 }}>
                  {tab.what}
                </p>
              </div>
            </div>

            {/* Two-column layout */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "start" }}>

              {/* Left: Steps + Who + Inputs */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

                {/* Steps */}
                <div style={{
                  background: "var(--clr-surface)", border: "1px solid var(--clr-border-deep)",
                  borderRadius: 12, padding: "1.5rem",
                }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--clr-text-7)", marginBottom: "1.25rem" }}>
                    Step by step
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {tab.steps.map((step, i) => (
                      <div key={i} style={{ display: "flex", gap: "0.875rem", paddingBottom: i < tab.steps.length - 1 ? "1.25rem" : 0 }}>
                        {/* Step number + connector */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 8,
                            background: `rgba(${tab.accentRgb},0.1)`,
                            border: `1px solid rgba(${tab.accentRgb},0.2)`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.625rem", fontWeight: 800, color: tab.accentColor,
                            letterSpacing: "0.04em",
                          }}>
                            {String(i + 1).padStart(2, "0")}
                          </div>
                          {i < tab.steps.length - 1 && (
                            <div style={{
                              width: 1, flex: 1, minHeight: 12,
                              background: `linear-gradient(to bottom, rgba(${tab.accentRgb},0.25), transparent)`,
                              marginTop: 4,
                            }} />
                          )}
                        </div>
                        <div style={{ paddingTop: 4 }}>
                          <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--clr-text-2)", marginBottom: "0.3rem", letterSpacing: "-0.01em" }}>
                            {step.title}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "var(--clr-text-5)", lineHeight: 1.65 }}>
                            {step.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Who it's for */}
                <div style={{
                  background: "var(--clr-surface)", border: "1px solid var(--clr-border-deep)",
                  borderRadius: 12, padding: "1.5rem",
                }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--clr-text-7)", marginBottom: "0.875rem" }}>
                    Who it&apos;s for
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "var(--clr-text-4)", lineHeight: 1.7, margin: 0 }}>
                    {tab.who}
                  </p>
                </div>

                {/* What you need to provide */}
                <div style={{
                  background: "var(--clr-surface)", border: "1px solid var(--clr-border-deep)",
                  borderRadius: 12, padding: "1.5rem",
                }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--clr-text-7)", marginBottom: "0.875rem" }}>
                    What you provide
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {tab.inputs.map((inp, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 2,
                          background: `rgba(${tab.accentRgb},0.1)`,
                          border: `1px solid rgba(${tab.accentRgb},0.2)`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path d="M1 4l2 2 4-4" stroke={tab.accentColor} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <span style={{ fontSize: "0.8125rem", color: "var(--clr-text-4)", lineHeight: 1.6 }}>{inp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Sample outputs */}
              <div style={{
                background: "var(--clr-surface)", border: "1px solid var(--clr-border-deep)",
                borderRadius: 12, padding: "1.5rem",
              }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: "1.25rem",
                }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--clr-text-7)" }}>
                    Sample output sections
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.65rem", color: "var(--clr-text-8)", fontWeight: 600, letterSpacing: "0.04em" }}>
                    <span>Click to expand</span>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <MockOutput outputs={tab.outputs} accentColor={tab.accentColor} accentRgb={tab.accentRgb} />

                {/* CTA */}
                <div style={{
                  marginTop: "1.5rem", paddingTop: "1.25rem",
                  borderTop: "1px solid var(--clr-border-deep)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--clr-text-8)" }}>
                    Output streams live — takes 15–30 seconds
                  </span>
                  <Link
                    href="/"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "0.5rem 1.125rem", borderRadius: 999,
                      background: "#7c3aed",
                      color: "#fff", fontSize: "0.8125rem", fontWeight: 600,
                      textDecoration: "none", letterSpacing: "-0.01em",
                      boxShadow: "none",
                    }}
                  >
                    Try {tab.name}
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
