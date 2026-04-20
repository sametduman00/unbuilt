"use client";

import { useState } from "react";
import Link from "next/link";

type TabId = "launches" | "dig" | "stack";

const ACCENT = {
  launches: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)" },
  dig:   { color: "#7c6fff", bg: "rgba(124,111,255,0.1)", border: "rgba(124,111,255,0.2)" },
  stack: { color: "#38bdf8", bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.2)" },
}

function LaunchesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
}
function DigIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  );
}
function StackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>
  );
}

export default function HowItWorksPage() {
  const [tab, setTab] = useState<TabId>("launches");
  const a = ACCENT[tab];

  return (
    <div style={{ minHeight: "100vh", background: "var(--clr-bg)", color: "var(--clr-text)", fontFamily: "inherit" }}>


      <main style={{ maxWidth: 760, margin: "0 auto", padding: "3rem 1.5rem 5rem" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ display: "inline-block", fontSize: "0.7rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--clr-text-4)", marginBottom: 12 }}>How it works</div>
          <h1 style={{ fontSize: "2.25rem", fontWeight: 800, letterSpacing: "-0.035em", margin: "0 0 14px", lineHeight: 1.1 }}>Three tools.<br/><span style={{ color: "var(--clr-text-3)", fontWeight: 400, fontStyle: "italic" }}>One honest output.</span></h1>
          <p style={{ fontSize: "1rem", color: "var(--clr-text-3)", lineHeight: 1.6, maxWidth: 480, margin: "0 auto" }}>
            Each tool uses Claude AI with live data — not static databases, not hallucinated guesses.
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 6, marginBottom: "2.5rem", background: "var(--clr-surface)", padding: 5, borderRadius: 12, border: "1px solid var(--clr-border)" }}>
          {(["launches", "dig", "stack"] as TabId[]).map(t => {
            const ac = ACCENT[t];
            const active = tab === t;
            return (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                padding: "9px 0", borderRadius: 8, border: "none", cursor: "pointer",
                fontFamily: "inherit", fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "-0.01em",
                transition: "all 0.15s",
                background: active ? ac.bg : "transparent",
                color: active ? ac.color : "var(--clr-text-4)",
                boxShadow: active ? `inset 0 0 0 1px ${ac.border}` : "none",
              }}>
                <span style={{ color: active ? ac.color : "var(--clr-text-5)" }}>
                  {t === "launches" ? <LaunchesIcon /> : t === "dig" ? <DigIcon /> : <StackIcon />}
                </span>
                {t === "launches" ? "Launches" : t === "dig" ? "Dig" : "Stack"}
                {t === "launches" && <span style={{ fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 4, background: active ? ac.color : "var(--clr-text-5)", color: "#fff" }}>FREE</span>}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {tab === "launches" && <LaunchesTab />}
        {tab === "dig"   && <DigTab />}
        {tab === "stack" && <StackTab />}

        {/* CTA */}
        {tab === "launches" && (
          <div style={{ marginTop: "3rem", padding: "2rem", borderRadius: 16, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)", textAlign: "center" }}>
            <p style={{ fontSize: "0.9375rem", fontWeight: 700, margin: "0 0 6px" }}>Ready to explore the market?</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", margin: "0 0 18px" }}>Launches is completely free — no account needed.</p>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 22px", borderRadius: 9, background: "#ef4444", color: "#fff", textDecoration: "none", fontSize: "0.875rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
              Open Launches →
            </Link>
          </div>
        )}
        {tab === "dig" && (
          <div style={{ marginTop: "3rem", padding: "2rem", borderRadius: 16, border: "1px solid rgba(124,111,255,0.2)", background: "rgba(124,111,255,0.05)", textAlign: "center" }}>
            <p style={{ fontSize: "0.9375rem", fontWeight: 700, margin: "0 0 6px" }}>Don't build what already exists.</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", margin: "0 0 18px" }}>Dig uses 1 analysis. Find the gap before you spend months building.</p>
            <Link href="/?tool=gap-analysis" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 22px", borderRadius: 9, background: "#7c6fff", color: "#fff", textDecoration: "none", fontSize: "0.875rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
              Dig my idea →
            </Link>
          </div>
        )}
        {tab === "stack" && (
          <div style={{ marginTop: "3rem", padding: "2rem", borderRadius: 16, border: "1px solid rgba(56,189,248,0.2)", background: "rgba(56,189,248,0.05)", textAlign: "center" }}>
            <p style={{ fontSize: "0.9375rem", fontWeight: 700, margin: "0 0 6px" }}>Stop Googling "best tools for vibecoding".</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", margin: "0 0 18px" }}>Stack uses 1 analysis. Get a phased build plan in 90 seconds.</p>
            <Link href="/?tool=stack-advisor" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 22px", borderRadius: 9, background: "#38bdf8", color: "#fff", textDecoration: "none", fontSize: "0.875rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
              Get my Stack →
            </Link>
          </div>
        )}

      </main>
    </div>
  );
}

/* ── Shared components ── */

function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{ fontSize: "0.6875rem", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--clr-text-5)", marginBottom: 10 }}>
      {children}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 12, padding: "1.25rem", ...style }}>
      {children}
    </div>
  );
}

function Step({ n, title, desc, color }: { n: number; title: string; desc: string; color: string }) {
  return (
    <div style={{ display: "flex", gap: 14 }}>
      <div style={{ width: 26, height: 26, borderRadius: "50%", background: color + "18", border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
        <span style={{ fontSize: "0.6875rem", fontWeight: 800, color }}>{n}</span>
      </div>
      <div>
        <div style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", lineHeight: 1.55 }}>{desc}</div>
      </div>
    </div>
  );
}

function OutputRow({ emoji, label, desc }: { emoji: string; label: string; desc: string }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--clr-border)" }}>
      <span style={{ fontSize: "1rem", flexShrink: 0 }}>{emoji}</span>
      <div>
        <div style={{ fontSize: "0.8125rem", fontWeight: 700, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: "0.775rem", color: "var(--clr-text-3)", lineHeight: 1.5 }}>{desc}</div>
      </div>
    </div>
  );
}

/* ── LAUNCHES ── */
function LaunchesTab() {
  const c = "#ef4444";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>

      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: 10, flexShrink: 0 }}>
          <LaunchesIcon />
        </div>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.025em" }}>Launches <span style={{ fontSize: "0.7rem", fontWeight: 800, padding: "2px 7px", borderRadius: 5, background: "rgba(239,68,68,0.12)", color: "#ef4444", verticalAlign: "middle" }}>FREE</span></h2>
          <p style={{ fontSize: "0.875rem", color: "var(--clr-text-3)", margin: 0, lineHeight: 1.6 }}>
            A live feed of what's launching today — with AI analysis of what each product is missing. Your daily dose of market intelligence, zero cost.
          </p>
        </div>
      </div>

      <Card>
        <SectionLabel>How it works</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Step n={1} color={c} title="Open Launches" desc="No query needed. The feed is already live and populated with today's launches from Product Hunt and the App Store." />
          <Step n={2} color={c} title="Choose your feed" desc="Switch between Product Hunt (today's launches across all categories) and App Store (new iOS apps submitted today). Both update automatically." />
          <Step n={3} color={c} title="Filter and search" desc="Narrow by topic — AI, Productivity, SaaS, Games, and more. Search by keyword to find what's relevant to your market." />
          <Step n={4} color={c} title="Spot the gap" desc="Each card shows what the product does, how hard it is to build a competitor, who the main competitors are, and 3 recommended tools to build it with. Hit 'Dig my idea' for a full market analysis, or 'Get my Stack' for a tool plan." />
        </div>
      </Card>

      <Card>
        <SectionLabel>What each card shows</SectionLabel>
        <div>
          <OutputRow emoji="📌" label="WHAT" desc="What the product does — one clear sentence describing the core function." />
          <OutputRow emoji="🔧" label="DIFFICULTY" desc="How hard it is to build a competitor: Easy, Medium, or Hard — with a one-line explanation of what makes it complex." />
          <OutputRow emoji="⚔️" label="COMPETITORS" desc="The main apps already in this space. Who you'd be up against if you built something similar." />
          <OutputRow emoji="🛠️" label="BUILD WITH" desc="3 recommended tools to build this product, each with their specific role in the stack." />
          <div style={{ paddingTop: 10 }}>
            <OutputRow emoji="🔗" label="Bottom actions" desc="'Dig my idea' runs a full market analysis on this space. 'Get my Stack' generates a phased build plan. Both use 1 analysis." />
          </div>
        </div>
      </Card>

      <Card>
        <SectionLabel>Who it's for</SectionLabel>
        <p style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", lineHeight: 1.6, margin: 0 }}>
          Founders scanning for their next idea, indie hackers tracking what's being built, or anyone who wants to spot real market gaps in products as they launch — before the rest of the internet catches up.
        </p>
      </Card>

    </div>
  );
}

/* ── DIG ── */
function DigTab() {
  const c = "#7c6fff";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>

      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ background: "rgba(124,111,255,0.1)", border: "1px solid rgba(124,111,255,0.2)", borderRadius: 10, padding: 10, flexShrink: 0 }}>
          <DigIcon />
        </div>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.025em" }}>Dig <span style={{ fontSize: "0.7rem", fontWeight: 800, padding: "2px 7px", borderRadius: 5, background: "rgba(124,111,255,0.12)", color: "#7c6fff", verticalAlign: "middle" }}>1 analysis</span></h2>
          <p style={{ fontSize: "0.875rem", color: "var(--clr-text-3)", margin: 0, lineHeight: 1.6 }}>
            Describe your idea. We scan 70+ live sources — Reddit, X, YouTube, App Store, Google Play, Product Hunt, LinkedIn — and tell you exactly where the gap is.
          </p>
        </div>
      </div>

      <Card>
        <SectionLabel>How it works</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Step n={1} color={c} title="Describe your idea" desc="Type your niche or concept in plain language. 'AI habit tracker for Gen Z', 'marketplace for handmade jewelry', 'SaaS for tattoo studios'. The more specific, the sharper the output." />
          <Step n={2} color={c} title="70+ sources are scanned live" desc="Reddit posts, X threads, YouTube videos, App Store and Google Play search results, Product Hunt launches, LinkedIn posts — all pulled in real time, not from a cached database." />
          <Step n={3} color={c} title="Claude analyzes the full picture" desc="Claude Opus with extended thinking processes all the live data to identify competitors, pain points, market gaps, trends, and the target customer — with structured scoring throughout." />
          <Step n={4} color={c} title="You get a full market report" desc="10 sections covering every angle of your market. Download as PDF, or click into Stack to find the right tools to build it." />
        </div>
      </Card>

      <Card>
        <SectionLabel>What you get — 10 sections</SectionLabel>
        <div>
          <OutputRow emoji="📊" label="Market Score (0–100)" desc="A single score reflecting how crowded the market is and how real the opportunity is. With a plain-English summary of what the number means." />
          <OutputRow emoji="⚔️" label="Competitors + Threat Level" desc="Real apps from App Store and Google Play with ratings, review counts, and threat level 1–5. Strengths and weaknesses for each." />
          <OutputRow emoji="😤" label="Pain Points + Severity" desc="Real quotes from Reddit, X, and YouTube showing what users hate about existing solutions. Severity badges: Critical, High, Medium." />
          <OutputRow emoji="🎯" label="Market Gaps + Opportunity Score" desc="Specific unserved niches ranked by opportunity score 0–10. Status: untapped, emerging, or validated." />
          <OutputRow emoji="📐" label="SWOT Analysis" desc="Strengths, weaknesses, opportunities, and threats — all grounded in the live data, not generic AI filler." />
          <OutputRow emoji="📏" label="Market Sizing (TAM / SAM / SOM)" desc="Estimated total addressable market, serviceable market, and your realistic slice — with sources." />
          <OutputRow emoji="🗺️" label="Go-to-Market Strategy" desc="Primary and secondary channels with estimated CAC, launch phases, and acquisition tactics based on how similar products found their first users." />
          <OutputRow emoji="💰" label="Financial Deep Dive" desc="Monthly burn estimates, break-even projection, 12-month MRR scenarios (cautious / middle / optimistic), and pricing benchmarks from live comps." />
          <OutputRow emoji="✅" label="Validation Checklist" desc="The 5 riskiest assumptions in your idea, each with a specific test you can run before writing a line of code." />
          <OutputRow emoji="💬" label="Community Signals" desc="Real Reddit posts, X threads, and YouTube content that validate (or refute) demand — with upvote counts and sentiment labels." />
        </div>
      </Card>

      <Card>
        <SectionLabel>What you provide</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {["Your niche, category, or product concept — in plain language", "The more specific, the better: 'AI writing tool for customer support teams' beats 'AI writing tool'", "No competitor research needed — Claude finds the apps, the Reddit threads, and the gaps"].map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 10, fontSize: "0.8125rem", color: "var(--clr-text-3)" }}>
              <span style={{ color: c, fontWeight: 800, flexShrink: 0 }}>→</span>
              {t}
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
}

/* ── STACK ── */
function StackTab() {
  const c = "#38bdf8";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>

      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 10, padding: 10, flexShrink: 0 }}>
          <StackIcon />
        </div>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.025em" }}>Stack <span style={{ fontSize: "0.7rem", fontWeight: 800, padding: "2px 7px", borderRadius: 5, background: "rgba(56,189,248,0.12)", color: "#38bdf8", verticalAlign: "middle" }}>1 analysis</span></h2>
          <p style={{ fontSize: "0.875rem", color: "var(--clr-text-3)", margin: 0, lineHeight: 1.6 }}>
            Describe what you're building. Get a phased tool plan with exact pricing, build order, and step-by-step instructions for every tool — built for vibe coders who move fast.
          </p>
        </div>
      </div>

      <Card>
        <SectionLabel>How it works</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Step n={1} color={c} title="Describe what you're building" desc="Give Claude the concept — 'a marketplace for local freelancers with payments and messaging', 'a SaaS dashboard for restaurant managers'. The more specific, the more targeted the stack." />
          <Step n={2} color={c} title="Set your budget tier" desc="Bootstrapped (< $50/mo), Growing ($50–200/mo), Funded ($200–1k/mo), or Scale ($1k+/mo). This filters out tools that are overkill or out of reach for you right now." />
          <Step n={3} color={c} title="Set your technical level" desc="No-code, Low-code, or Developer. Claude adjusts every recommendation — a no-code founder gets Lovable and Bubble, a developer gets Next.js and Supabase." />
          <Step n={4} color={c} title="Get a phased build plan" desc="Four phases from Validate to Scale, each with tool cards, pricing, alternatives, and a Vibe Guide — copy-paste prompts and step-by-step instructions to set up every tool." />
        </div>
      </Card>

      <Card>
        <SectionLabel>What you get — 4 phases</SectionLabel>
        <div>
          <OutputRow emoji="🔬" label="Phase 0 — Validate" desc="Prove demand before writing code. Tools to test the idea with real people — landing pages, waitlists, manual experiments. Total cost: usually $0." />
          <OutputRow emoji="🚀" label="Phase 1 — MVP" desc="Build a working product fast. Frontend, backend, auth, database, payments — each with free tier details, exact monthly cost, and why it was chosen over alternatives." />
          <OutputRow emoji="📈" label="Phase 2 — Growth" desc="Tools to add when you have users: analytics, better email, search, background jobs. Triggered by specific usage thresholds, not arbitrary timelines." />
          <OutputRow emoji="⚡" label="Phase 3 — Scale" desc="Infrastructure upgrades for serious traction. Includes what breaks first, when to upgrade, and what to move to." />
        </div>
      </Card>

      <Card>
        <SectionLabel>How to actually do this — what makes Stack different</SectionLabel>
        <p style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", lineHeight: 1.6, margin: "0 0 12px" }}>
          Every tool recommendation includes a <strong style={{ color: "var(--clr-text)" }}>How to actually do this</strong> section — not just "use Supabase" but exactly what to click, what to type, and what to paste. Built for vibe coders who want to ship, not read documentation.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            "Exact setup steps: 'Go to Settings → API keys → copy your anon key'",
            "Ready-to-paste prompts for AI builders (Lovable, Bolt, Cursor)",
            "Tips on what to test first and what mistake to avoid",
            "Alternatives for each tool with a plain-language reason to switch",
          ].map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 10, fontSize: "0.8125rem", color: "var(--clr-text-3)" }}>
              <span style={{ color: c, fontWeight: 800, flexShrink: 0 }}>→</span>
              {t}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionLabel>Also included</SectionLabel>
        <div>
          <OutputRow emoji="📅" label="Build order timeline" desc="Day-by-day sequence: what to do on Day 1, Day 3, Day 5, Week 2. No paralysis, just a clear path." />
          <OutputRow emoji="💸" label="Cost breakdown per phase" desc="Total monthly cost at each phase with free tier limits clearly marked. Know exactly when you'll start paying." />
          <OutputRow emoji="⚠️" label="Mistakes to avoid" desc="The 3 most common mistakes founders make at this stage — based on what the tools are actually for." />
          <OutputRow emoji="🔼" label="Upgrade triggers" desc="Specific conditions that signal it's time to move up: 'when your database hits 400MB' or 'when you have 10+ active sellers'." />
        </div>
      </Card>

    </div>
  );
}
