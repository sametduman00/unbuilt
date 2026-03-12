"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type TabId = "trend-feed" | "gap-analysis" | "competitor-radar" | "stack-advisor";

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
function IconRadar({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="2" fill={color} />
      <circle cx="11" cy="11" r="5.5" stroke={color} strokeWidth="1.25" opacity="0.55" />
      <circle cx="11" cy="11" r="9" stroke={color} strokeWidth="1" opacity="0.25" />
      <path d="M11 2V5M20 11h-3M11 20v-3M2 11h3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
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
    tagline: "Real signals, no noise",
    accentColor: "#34d399",
    accentRgb: "52,211,153",
    icon: <IconTrend color="#34d399" />,
    who: "Founders looking for their next idea, researchers scanning markets, or anyone who wants to know what's actually moving before the hype cycle peaks.",
    what: "Trend Feed uses Claude Opus to analyze a market or industry space and surface what's genuinely rising, what's quietly dying, and where the contrarian opportunity sits — before it becomes obvious.",
    steps: [
      { title: "Describe the space", desc: "Type a market, industry, or category — 'B2B SaaS tools', 'creator economy', 'consumer health apps'. As broad or narrow as you want." },
      { title: "Claude analyses the landscape", desc: "Claude Opus reasons through the space using its training data on products, companies, behavioral shifts, and market dynamics up to its knowledge cutoff." },
      { title: "Signals surface in structured sections", desc: "Results stream in live. Each section focuses on a different signal type — rising trends, dying approaches, underserved niches, and one high-conviction opportunity." },
      { title: "Act on what's contrarian", desc: "The best outputs aren't the obvious ones. The Contrarian Take and Best Opportunity sections are where the real signal lives." },
    ],
    inputs: [
      "A market, industry, or category name",
      "Can be broad ('social apps') or narrow ('AI tools for solo lawyers')",
      "No need for specific company names — Claude infers the landscape",
    ],
    outputs: [
      { emoji: "📈", label: "What's Rising", preview: "**Async-first B2B tools** gaining real traction as remote teams reject synchronous standup culture. **Vertical AI agents** replacing horizontal platforms in legal, medical, and financial niches..." },
      { emoji: "💀", label: "What's Dying", preview: "**All-in-one platforms** with feature bloat losing ground to focused single-purpose tools. Founders who built on **Notion as their core DB** are quietly migrating — the API limits are a ceiling..." },
      { emoji: "🔥", label: "The Pattern to Bet On", preview: "The shift from **software-as-a-tool** to **software-as-a-colleague**. Products that take actions on your behalf (not just surface information) are winning at 3–5× the retention of passive dashboards..." },
      { emoji: "💡", label: "Underexplored Niches", preview: "**Compliance tooling for SMBs** — the customer exists (every business needs it), the problem is acute (penalties are real), but every existing solution targets enterprise and costs $40k+/yr..." },
    ],
  },
  {
    id: "gap-analysis",
    name: "Gap Analysis",
    tagline: "Find the gaps before you build",
    accentColor: "#a78bfa",
    accentRgb: "167,139,250",
    icon: <IconGap color="#a78bfa" />,
    who: "Founders with an idea who want to know if there's a real opening before spending months building. Also useful for pivoting an existing product into a better-differentiated position.",
    what: "Gap Analysis maps your competitive landscape, identifies the specific customer pain points that existing solutions fail to address, and pinpoints where a new entrant can realistically win. It's a second opinion from a relentlessly honest analyst.",
    steps: [
      { title: "Describe your idea", desc: "Explain your niche or app concept in plain language. 'Project management for freelancers', 'AI writing tool for marketers', 'booking software for tattoo studios'. No deck needed." },
      { title: "Claude identifies the real competitors", desc: "Not just the obvious ones. Claude surfaces direct competitors, indirect alternatives, and DIY substitutes that users might reach for instead of your product." },
      { title: "Pain points and gaps surface", desc: "Claude catalogs what frustrates users about existing solutions — from review sites, forum discussions, and product complaints baked into its training data." },
      { title: "You get a ranked opportunity assessment", desc: "Each gap is evaluated for size, urgency, and how hard it would be to actually win. The output tells you where the opening is and what you'd need to exploit it." },
    ],
    inputs: [
      "Your niche, category, or product concept",
      "The more specific, the sharper the analysis — 'AI writing tool' vs. 'AI email reply tool for customer support teams'",
      "No need to list competitors yourself — Claude finds them",
    ],
    outputs: [
      { emoji: "🏆", label: "Key Competitors", preview: "**Notion** (all-in-one, weak on freelancer-specific workflows), **Trello** (simple but no invoicing or client portal), **HoneyBook** (client-facing but bloated for solo operators)..." },
      { emoji: "😤", label: "Pain Points", preview: "Freelancers report spending **4–6 hours/week** on admin that should be automated. Biggest complaints: **no unified client communication thread**, **manual invoice chasing**, and **time tracking disconnected from billing**..." },
      { emoji: "🕳️", label: "Market Gaps", preview: "No tool combines **time tracking + automatic invoice generation + client messaging** in one place without enterprise pricing. The $20–$50/month tier is wide open for a focused solution..." },
      { emoji: "⚡", label: "Opportunity Score", preview: "**High confidence** opening in the solo/micro-agency segment. Existing tools either underserve (Trello) or overcharge (HoneyBook at $400+/yr). A focused product at $29/mo could realistically capture 10k users in 18 months..." },
    ],
  },
  {
    id: "competitor-radar",
    name: "Competitor Radar",
    tagline: "Know your rivals inside out",
    accentColor: "#38bdf8",
    accentRgb: "56,189,248",
    icon: <IconRadar color="#38bdf8" />,
    who: "Founders who are already building and want competitive intelligence before a launch, fundraise, or major pivot. Also useful for teams doing ongoing market monitoring.",
    what: "Competitor Radar goes deep on the specific players in your space — their strengths, exploitable weaknesses, recent strategic moves, and exactly how to position against them. It's the kind of analysis a VC associate would spend a week on.",
    steps: [
      { title: "Describe what you're building", desc: "Tell Claude your product concept and who you see as the main competition. 'Building a Notion alternative for agency teams, competing with Asana and Monday.com.'" },
      { title: "Claude maps the full landscape", desc: "Claude identifies direct and non-obvious competitors, then builds a structured analysis of each — what they're actually good at and where they're genuinely weak." },
      { title: "Exploitable weaknesses are called out", desc: "Not vague 'bad UX' criticism — specific, actionable strategic gaps. Things like: 'their enterprise focus leaves SMB customers underserved at the $50–$200/mo tier.'" },
      { title: "Recent moves and signals are surfaced", desc: "What have key players launched, acquired, or abandoned recently? What does it signal about where they're heading — and where they're not going?" },
    ],
    inputs: [
      "What you're building — the problem you solve and who for",
      "Your main competitors (or Claude will identify them)",
      "Optional: what you want to specifically understand (pricing, UX, positioning)",
    ],
    outputs: [
      { emoji: "💪", label: "What Competitors Do Well", preview: "| Competitor | Core Strength | Why It's Hard to Beat |\n|---|---|---|\n| **Monday.com** | Visual project views | $1B+ marketing spend + massive brand recognition |\n| **Asana** | Enterprise integrations | Deep IT procurement relationships + SOC2 compliance..." },
      { emoji: "🩸", label: "Exploitable Weaknesses", preview: "**Monday.com**: pricing jumps from $10 to $16/seat with no middle tier — agencies with 8–15 members are systematically overcharged. **Asana**: no built-in time tracking forces users to integrate Harvest/Toggl, creating churn risk..." },
      { emoji: "⚔️", label: "How to Win", preview: "**Angle 1**: Own the agency vertical. Neither Monday nor Asana has a client-portal feature — agencies are building workarounds in Notion. **Angle 2**: Single-seat pricing for freelancers that scales to teams without a pricing cliff..." },
      { emoji: "📋", label: "Weekly Watch List", preview: "Monitor **Monday.com's job board** for 'SMB' or 'self-serve' roles — signals a downmarket push. Watch **Asana's changelog** for time-tracking features. Check **G2 reviews monthly** for new complaint patterns..." },
    ],
  },
  {
    id: "stack-advisor",
    name: "Stack Advisor",
    tagline: "Build fast, cheap, and right",
    accentColor: "#fb923c",
    accentRgb: "251,146,60",
    icon: <IconStack color="#fb923c" />,
    who: "Anyone starting a new project who doesn't want to over-engineer or waste money on the wrong tools. Especially useful for non-technical founders who need a technical co-founder's opinion, or developers spinning up a new product.",
    what: "Stack Advisor gives you a specific, opinionated technology stack recommendation tailored to your actual budget and technical level. Real tool names, real monthly costs, real tradeoffs — not a generic 'use React and Node' non-answer.",
    steps: [
      { title: "Describe what you're building", desc: "Give Claude the concept — 'a marketplace for local freelancers with payments and messaging', 'a SaaS dashboard for restaurant managers'. The more specific, the more targeted the stack." },
      { title: "Set your budget tier", desc: "Choose from Bootstrapped (< $50/mo), Growing ($50–200/mo), Funded ($200–1k/mo), or Scale ($1k+/mo). This filters out tools that are overkill or out of reach." },
      { title: "Set your technical level", desc: "No-code (you use Notion, Webflow, Zapier), Low-code (you can edit HTML/CSS and follow tutorials), or Developer (you can code, use CLIs, and deploy). Claude adjusts its recommendations accordingly." },
      { title: "Get a specific build plan", desc: "You get exact tools with monthly costs, a step-by-step build order, and a clear view of where this stack will break down — and when to upgrade." },
    ],
    inputs: [
      "What you're building (be specific about features — auth, payments, real-time, etc.)",
      "Your monthly infrastructure budget",
      "Your technical skill level — be honest, it affects the whole recommendation",
    ],
    outputs: [
      { emoji: "🛠️", label: "Recommended Stack", preview: "**Frontend**: Next.js on Vercel — free tier covers you to ~$50k MRR. **Auth**: Clerk ($25/mo after 10k MAU) — avoids building auth yourself. **Database**: Supabase (free tier → $25/mo) — Postgres + real-time + storage in one..." },
      { emoji: "💰", label: "Full Cost Breakdown", preview: "| Tool | Purpose | Free Tier | Paid Cost |\n|---|---|---|---|\n| Vercel | Hosting | ✓ generous | $20/mo |\n| Supabase | Database | ✓ 500MB | $25/mo |\n| Clerk | Auth | ✓ 10k users | $25/mo |\n| **Total** | | | **~$70/mo** |" },
      { emoji: "🚀", label: "Build Order", preview: "**Week 1**: Set up Next.js + Clerk auth. Don't touch payments yet. **Week 2**: Build core feature (the thing you're actually selling). **Week 3**: Add Stripe. **Week 4**: Deploy and get 10 users. Skip analytics until you have real traffic..." },
      { emoji: "🔮", label: "Scalability Ceiling", preview: "This stack breaks at around **50k MAU** when Supabase connection pooling becomes an issue and Vercel serverless cold starts affect UX. At that point: migrate to dedicated Postgres (Railway or Render), add Redis for sessions..." },
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
                      : <code style={{ background: "rgba(124,92,252,0.15)", color: "#c4b5fd", padding: "0.1em 0.35em", borderRadius: 4, fontSize: "0.85em" }}>{children}</code>
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
          borderBottom: "1px solid var(--clr-border-deep)",
          backdropFilter: "blur(16px)",
          background: "var(--clr-header-bg)",
          position: "sticky", top: 0, zIndex: 50,
        }}>
          <div style={{
            maxWidth: 1400, margin: "0 auto", padding: "0 2.5rem",
            height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 11,
                  background: "linear-gradient(135deg, #7c5cfc, #4f8ef7)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="19" height="19" viewBox="0 0 19 19" fill="none">
                    <path d="M2.5 5.5h14M2.5 9.5h10M2.5 13.5h6" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </div>
                <span style={{ fontWeight: 750, fontSize: "1.125rem", color: "var(--clr-text)", letterSpacing: "-0.025em" }}>Unbuilt</span>
              </Link>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#7c5cfc", letterSpacing: "-0.01em" }}>
                How it works
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Link href="/" style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "0.375rem 0.875rem", borderRadius: 9,
                background: "rgba(255,255,255,0.04)", border: "1px solid var(--clr-border)",
                color: "var(--clr-text-3)", fontSize: "0.8125rem", fontWeight: 600,
                textDecoration: "none", letterSpacing: "-0.01em",
              }}>
                ← Back to tools
              </Link>
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: "rgba(255,255,255,0.04)", border: "1px solid var(--clr-border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "var(--clr-text-3)", flexShrink: 0,
                }}
              >
                {light ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M2.93 2.93l1.06 1.06M12.01 12.01l1.06 1.06M2.93 13.07l1.06-1.06M12.01 3.99l1.06-1.06" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13.5 10.5A6 6 0 015.5 2.5a6 6 0 000 11 6 6 0 008-3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
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
              Four tools. One honest output.
            </h1>
            <p style={{ color: "var(--clr-text-5)", fontSize: "1rem", lineHeight: 1.7, textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
              Each tool uses Claude Opus with a purpose-built prompt to give you structured, specific analysis — not generic AI rambling.
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
              padding: "1.75rem", borderRadius: 20,
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
                  borderRadius: 18, padding: "1.5rem",
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
                  borderRadius: 18, padding: "1.5rem",
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
                  borderRadius: 18, padding: "1.5rem",
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
                borderRadius: 18, padding: "1.5rem",
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
                      padding: "0.5rem 1.125rem", borderRadius: 10,
                      background: `linear-gradient(135deg, rgba(${tab.accentRgb},0.85), ${tab.accentColor})`,
                      color: "#fff", fontSize: "0.8125rem", fontWeight: 700,
                      textDecoration: "none", letterSpacing: "-0.01em",
                      boxShadow: `0 4px 16px rgba(${tab.accentRgb},0.3)`,
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
