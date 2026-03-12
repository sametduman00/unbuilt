"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ── Types ──────────────────────────────────────────────────────
type ToolId = "gap-analysis" | "competitor-radar" | "trend-feed" | "stack-advisor";
type Budget = "bootstrap" | "growing" | "funded" | "scale";
type TechLevel = "nocode" | "lowcode" | "developer";

interface DataSource {
  name: string;
  color: string;
  live: boolean; // true = real API, false = AI-synthesized
}

interface ToolConfig {
  id: ToolId;
  userLabel: string;
  name: string;
  tagline: string;
  description: string;
  accentColor: string;
  accentRgb: string;
  apiPath: string;
  placeholder: string;
  inputLabel: string;
  hasExtras?: boolean;
  sources: DataSource[];
}

interface Section {
  emoji: string;
  title: string;
  body: string;
  isLast: boolean;
}

// ── SVG Icons ──────────────────────────────────────────────────
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
function IconTrend({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M2 16.5l5-7 4 3.5 5.5-9L19 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 4h5v5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

const TOOL_ICONS: Record<ToolId, (c: string) => React.ReactNode> = {
  "gap-analysis": (c) => <IconGap color={c} />,
  "competitor-radar": (c) => <IconRadar color={c} />,
  "trend-feed": (c) => <IconTrend color={c} />,
  "stack-advisor": (c) => <IconStack color={c} />,
};

// ── Tool definitions ───────────────────────────────────────────
const TOOLS: ToolConfig[] = [
  {
    id: "trend-feed",
    userLabel: "I need inspiration",
    name: "Trend Feed",
    tagline: "Real signals, no noise",
    description: "What's actually rising in a market right now. Emerging niches, dying trends, and contrarian bets — powered by AI, not Twitter hype.",
    accentColor: "#34d399",
    accentRgb: "52,211,153",
    apiPath: "/api/trends",
    inputLabel: "What space or industry are you curious about?",
    placeholder: 'e.g. "B2B SaaS tools", "consumer health apps", or "creator economy"',
    sources: [
      { name: "Claude AI", color: "#7c5cfc", live: true },
      { name: "GitHub", color: "#34d399", live: true },
      { name: "Hacker News", color: "#ff6600", live: true },
    ],
  },
  {
    id: "gap-analysis",
    userLabel: "I have an idea",
    name: "Gap Analysis",
    tagline: "Find the gaps before you build",
    description: "Spot what competitors are missing. Get a brutally honest read on where you actually have a shot — before you spend months building the wrong thing.",
    accentColor: "#a78bfa",
    accentRgb: "167,139,250",
    apiPath: "/api/analyze",
    inputLabel: "Describe your niche or app idea",
    placeholder: 'e.g. "Project management for freelancers" or "AI writing tool for marketers"',
    sources: [
      { name: "Claude AI", color: "#7c5cfc", live: true },
      { name: "App Store", color: "#007AFF", live: true },
      { name: "Google Play", color: "#34a853", live: true },
    ],
  },
  {
    id: "competitor-radar",
    userLabel: "I'm already building",
    name: "Competitor Radar",
    tagline: "Know your rivals inside out",
    description: "Deep competitive intelligence on who you're really up against — their strategies, exploitable weaknesses, and exactly how to outmaneuver them.",
    accentColor: "#38bdf8",
    accentRgb: "56,189,248",
    apiPath: "/api/radar",
    inputLabel: "Describe what you're building and your main competition",
    placeholder: 'e.g. "I\'m building a Notion alternative for agency teams, competing with Asana and Monday.com"',
    sources: [
      { name: "Claude AI", color: "#7c5cfc", live: true },
    ],
  },
  {
    id: "stack-advisor",
    userLabel: "Help me choose my stack",
    name: "Stack Advisor",
    tagline: "Build fast, cheap, and right",
    description: "Tell us what you're building, your budget, and how technical you are. Get the exact tools, real monthly costs, and a step-by-step build order.",
    accentColor: "#fb923c",
    accentRgb: "251,146,60",
    apiPath: "/api/stack",
    inputLabel: "Describe what you want to build",
    placeholder: 'e.g. "A marketplace for local freelancers with payments and messaging"',
    hasExtras: true,
    sources: [
      { name: "Claude AI", color: "#7c5cfc", live: true },
    ],
  },
];

// ── Section metadata (for results cards) ──────────────────────
const SECTION_META: Record<string, { bg: string; color: string }> = {
  "🏆": { bg: "rgba(251,191,36,0.1)",   color: "#fbbf24" },
  "😤": { bg: "rgba(248,113,113,0.1)",  color: "#f87171" },
  "🕳️":{ bg: "rgba(167,139,250,0.12)", color: "#a78bfa" },
  "⚡": { bg: "rgba(52,211,153,0.1)",   color: "#34d399" },
  "🎯": { bg: "rgba(79,142,247,0.12)",  color: "#60a5fa" },
  "⚠️":{ bg: "rgba(251,146,60,0.1)",   color: "#fb923c" },
  "💪": { bg: "rgba(251,191,36,0.1)",   color: "#fbbf24" },
  "🩸": { bg: "rgba(248,113,113,0.1)",  color: "#f87171" },
  "📣": { bg: "rgba(56,189,248,0.1)",   color: "#38bdf8" },
  "🗺️":{ bg: "rgba(167,139,250,0.1)",  color: "#a78bfa" },
  "⚔️":{ bg: "rgba(52,211,153,0.1)",   color: "#34d399" },
  "📋": { bg: "rgba(79,142,247,0.1)",   color: "#60a5fa" },
  "📈": { bg: "rgba(52,211,153,0.1)",   color: "#34d399" },
  "💀": { bg: "rgba(248,113,113,0.1)",  color: "#f87171" },
  "🔥": { bg: "rgba(251,146,60,0.1)",   color: "#fb923c" },
  "💡": { bg: "rgba(251,191,36,0.1)",   color: "#fbbf24" },
  "🧲": { bg: "rgba(167,139,250,0.1)",  color: "#a78bfa" },
  "🧠": { bg: "rgba(56,189,248,0.1)",   color: "#38bdf8" },
  "🛠️":{ bg: "rgba(251,146,60,0.1)",   color: "#fb923c" },
  "💰": { bg: "rgba(52,211,153,0.1)",   color: "#34d399" },
  "🚀": { bg: "rgba(56,189,248,0.1)",   color: "#38bdf8" },
  "🔄": { bg: "rgba(167,139,250,0.1)",  color: "#a78bfa" },
  "🔮": { bg: "rgba(196,181,253,0.1)",  color: "#c4b5fd" },
  "🌡️":{ bg: "rgba(249,115,22,0.1)",   color: "#f97316" },
};

// ── Markdown component map ─────────────────────────────────────
const MD: Record<string, (props: any) => React.ReactElement> = {
  table: ({ children }) => (
    <div className="table-wrap"><table>{children}</table></div>
  ),
  strong: ({ children }) => <span>{children}</span>,
  hr: () => <></>,
  code: ({ className, children }) => {
    if (className) {
      return <pre><code className={className}>{children}</code></pre>;
    }
    return (
      <code style={{ background: "rgba(124,92,252,0.15)", color: "#c4b5fd", padding: "0.1em 0.35em", borderRadius: 4, fontSize: "0.85em" }}>
        {children}
      </code>
    );
  },
};
function parseSections(markdown: string, isStreaming: boolean): Section[] {
  return markdown
    .split(/\n(?=## )/)
    .flatMap((part, idx, arr) => {
      const trimmed = part.trim();
      if (!trimmed) return [];
      const nl = trimmed.indexOf("\n");
      const heading = nl === -1 ? trimmed : trimmed.slice(0, nl);
      const body = nl === -1 ? "" : trimmed.slice(nl + 1).trim();
      const raw = heading.replace(/^## /, "").trim();
      const m = raw.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)\s*/u);
      const isLast = idx === arr.length - 1 && isStreaming;
      if (!body.trim() && !isLast) return [];
      return [{
        emoji: m ? m[0].trim() : "📌",
        title: raw.replace(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)\s*/u, "").trim(),
        body,
        isLast,
      }];
    });
}

// ── Score parser ───────────────────────────────────────────────
function parseScore(body: string): { score: number; label: string; summary: string } | null {
  const clean = (s: string) => s.replace(/\*\*/g, "").replace(/\*/g, "").replace(/---+/g, "").replace(/\s+/g, " ").trim();
  const scoreMatch = body.match(/Score:\s*\**(\d+)\**/i);
  if (!scoreMatch) return null;
  const score = Math.max(1, Math.min(100, parseInt(scoreMatch[1])));
  const labelMatch = body.match(/Label:\s*\**(.+?)\**\s*$/im);
  const label = labelMatch ? clean(labelMatch[1]) : "";
  const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
  const summaryLines = lines
    .filter((l) => !l.match(/^[\*_]*\s*(Score:|Label:)/i) && !l.match(/^---+$/))
    .map(clean)
    .filter(Boolean);
  return { score, label, summary: summaryLines.join(" ").trim() };
}

// ── Section Result Card ────────────────────────────────────────
function SectionCard({ section, showCursor }: { section: Section; showCursor: boolean }) {
  const meta = SECTION_META[section.emoji] ?? { bg: "rgba(124,92,252,0.1)", color: "#a78bfa" };
  return (
    <div className="section-card">
      <div className="section-card-header">
        <div className="section-icon" style={{ background: meta.bg }}>{section.emoji}</div>
        <h2 className="section-title" style={{ color: meta.color }}>{section.title}</h2>
      </div>
      <div className="card-prose">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>
          {section.body}
        </ReactMarkdown>
        {showCursor && (
          <span style={{ display: "inline-block", width: 2, height: "1em", background: "#7c5cfc", verticalAlign: "middle", borderRadius: 1, animation: "blink 1s step-end infinite", marginLeft: 2 }} />
        )}
      </div>
    </div>
  );
}

// ── Gap Analysis Visual Components ────────────────────────────

function ThreatDots({ level }: { level: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 3 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{
          width: 8, height: 8, borderRadius: "50%",
          background: i <= level
            ? level >= 4 ? "#f87171" : level >= 3 ? "#fbbf24" : "#34d399"
            : "var(--clr-border)",
        }} />
      ))}
    </span>
  );
}

function GapAnalysisResult({ data }: { data: GapAnalysisData }) {
  const ms = Math.max(0, Math.min(100, data.marketScore));
  const msColor = ms >= 81 ? "#f97316" : ms >= 61 ? "#34d399" : ms >= 41 ? "#eab308" : ms >= 21 ? "#fb923c" : "#ef4444";
  const msBg = ms >= 81 ? "rgba(249,115,22,0.08)" : ms >= 61 ? "rgba(52,211,153,0.08)" : ms >= 41 ? "rgba(234,179,8,0.08)" : ms >= 21 ? "rgba(251,146,60,0.08)" : "rgba(239,68,68,0.08)";
  const msEmoji = ms >= 81 ? "🔥" : ms >= 61 ? "🟢" : ms >= 41 ? "🟡" : ms >= 21 ? "🟠" : "🔴";
  const msR = 36;
  const msCirc = 2 * Math.PI * msR;
  const msDash = msCirc * ms / 100;
  const msOffset = msCirc * 0.25;

  const msSteps = [
    { emoji: "🔴", label: "No Gap",          min: 0,  max: 20  },
    { emoji: "🟠", label: "Crowded",         min: 21, max: 40  },
    { emoji: "🟡", label: "Some Room",       min: 41, max: 60  },
    { emoji: "🟢", label: "Real Opportunity", min: 61, max: 80  },
    { emoji: "🔥", label: "Wide Open",       min: 81, max: 100 },
  ];
  const msActiveIdx = msSteps.findIndex(s => ms >= s.min && ms <= s.max);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── MARKET OPPORTUNITY SCORE ── */}
      <div style={{
        background: "var(--clr-surface)", border: `1px solid ${msColor}40`,
        borderRadius: 20, padding: "1.5rem 1.75rem",
        position: "relative", overflow: "hidden",
        boxShadow: `0 0 0 1px ${msColor}10, 0 8px 32px ${msColor}10`,
      }}>
        <div style={{
          position: "absolute", top: -60, right: -60, width: 240, height: 240,
          borderRadius: "50%", background: `${msColor}0a`, filter: "blur(60px)", pointerEvents: "none",
        }} />
        <div style={{ display: "flex", alignItems: "center", gap: "1.75rem", position: "relative" }}>
          <div style={{ position: "relative", flexShrink: 0, width: 92, height: 92 }}>
            <svg width="92" height="92" viewBox="0 0 92 92" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="46" cy="46" r={msR} fill="none" stroke="var(--clr-border)" strokeWidth="7" />
              <circle cx="46" cy="46" r={msR} fill="none" stroke={msColor} strokeWidth="7"
                strokeDasharray={`${msDash} ${msCirc - msDash}`} strokeDashoffset={-msOffset} strokeLinecap="round" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "1.625rem", fontWeight: 800, color: msColor, lineHeight: 1, letterSpacing: "-0.03em" }}>{ms}</span>
              <span style={{ fontSize: "0.6rem", color: "var(--clr-text-6)", fontWeight: 600, letterSpacing: "0.04em" }}>/100</span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--clr-text-5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Market Opportunity</span>
              {data.marketScoreLabel && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "0.175rem 0.6rem", borderRadius: 999,
                  background: msBg, color: msColor, fontSize: "0.75rem", fontWeight: 700,
                  border: `1px solid ${msColor}30`,
                }}>
                  {msEmoji} {data.marketScoreLabel}
                </span>
              )}
            </div>
            {data.marketScoreSummary && (
              <p style={{ fontSize: "0.9375rem", color: "var(--clr-text-2)", lineHeight: 1.65, margin: 0, fontWeight: 400 }}>
                {data.marketScoreSummary}
              </p>
            )}
          </div>
        </div>

        {/* 5-step scale */}
        <div style={{ marginTop: "1.25rem", display: "flex", gap: 6 }}>
          {msSteps.map((step, i) => {
            const isActive = i === msActiveIdx;
            return (
              <div key={step.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: "100%", height: 6, borderRadius: 999,
                  background: isActive ? msColor : "var(--clr-border)",
                  boxShadow: isActive ? `0 0 8px ${msColor}60` : "none",
                  transition: "background 0.3s",
                }} />
                <span style={{ fontSize: isActive ? "1rem" : "0.75rem", lineHeight: 1, transition: "font-size 0.2s", filter: isActive ? "none" : "grayscale(1) opacity(0.35)" }}>
                  {step.emoji}
                </span>
                <span style={{
                  fontSize: "0.58rem", fontWeight: isActive ? 700 : 400,
                  color: isActive ? msColor : "var(--clr-text-7)",
                  textAlign: "center", lineHeight: 1.2,
                }}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── KEY COMPETITORS ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.625rem" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(251,191,36,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem" }}>🏆</div>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#fbbf24", margin: 0 }}>Key Competitors</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.5rem" }}>
          {data.competitors.map((c) => (
            <div key={c.name} style={{
              background: "var(--clr-surface)", border: "1px solid var(--clr-border)",
              borderRadius: 12, padding: "0.75rem 0.875rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--clr-text)" }}>{c.name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                  <span style={{ fontSize: "0.5rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--clr-text-7)" }}>Threat</span>
                  <ThreatDots level={c.threatLevel} />
                </div>
              </div>
              {c.tagline && (
                <p style={{ fontSize: "0.68rem", color: "var(--clr-text-5)", margin: "0 0 6px", lineHeight: 1.35 }}>{c.tagline}</p>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ fontSize: "0.68rem", color: "#34d399", lineHeight: 1.4, paddingLeft: 6, borderLeft: "2px solid rgba(52,211,153,0.3)", flex: 1, minWidth: 0 }}>
                  {c.strengths[0] ?? "—"}
                </div>
                <div style={{ fontSize: "0.68rem", color: "#f87171", lineHeight: 1.4, paddingLeft: 6, borderLeft: "2px solid rgba(248,113,113,0.3)", flex: 1, minWidth: 0 }}>
                  {c.weaknesses[0] ?? "—"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PAIN POINTS ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.625rem" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(248,113,113,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem" }}>😤</div>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#f87171", margin: 0 }}>Pain Points</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          {data.painPoints.map((p, i) => {
            const sevColor = p.severity === "high" ? "#f87171" : p.severity === "medium" ? "#fbbf24" : "#9ca3af";
            const sevBg = p.severity === "high" ? "rgba(248,113,113,0.12)" : p.severity === "medium" ? "rgba(251,191,36,0.1)" : "rgba(156,163,175,0.08)";
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.5rem 0.75rem", borderRadius: 10,
                background: "var(--clr-surface)", border: "1px solid var(--clr-border)",
                borderLeft: `3px solid ${sevColor}`,
              }}>
                <p style={{ flex: 1, fontSize: "0.75rem", color: "var(--clr-text-2)", lineHeight: 1.5, margin: 0, fontStyle: "italic", minWidth: 0 }}>
                  &ldquo;{p.quote}&rdquo;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  {p.source && (
                    <span style={{ fontSize: "0.58rem", color: "var(--clr-text-7)" }}>{p.source}</span>
                  )}
                  <span style={{
                    fontSize: "0.56rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                    padding: "0.1rem 0.45rem", borderRadius: 999, background: sevBg, color: sevColor,
                    border: `1px solid ${sevColor}30`,
                    boxShadow: p.severity === "high" ? `0 0 6px ${sevColor}25` : "none",
                    display: "inline-flex", alignItems: "center", gap: 2,
                  }}>
                    {p.severity === "high" && <span style={{ fontSize: "0.58rem" }}>🔥</span>}
                    {p.severity}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MARKET GAPS ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.625rem" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(167,139,250,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem" }}>🕳️</div>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#a78bfa", margin: 0 }}>Market Gaps</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {data.marketGaps.map((g, i) => {
            const statusColor = g.status === "untapped" ? "#34d399" : g.status === "emerging" ? "#fbbf24" : "#f87171";
            const statusBg = g.status === "untapped" ? "rgba(52,211,153,0.1)" : g.status === "emerging" ? "rgba(251,191,36,0.1)" : "rgba(248,113,113,0.1)";
            const barColor = g.opportunityScore >= 7 ? "#34d399" : g.opportunityScore >= 4 ? "#60a5fa" : "#9ca3af";
            return (
              <div key={i} style={{
                background: "var(--clr-surface)", border: "1px solid var(--clr-border)",
                borderRadius: 12, padding: "0.75rem 1rem",
                boxShadow: g.opportunityScore >= 8 ? `0 0 0 1px ${barColor}20, 0 4px 16px ${barColor}08` : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--clr-text)" }}>{g.title}</span>
                  <span style={{
                    fontSize: "0.55rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                    padding: "0.1rem 0.45rem", borderRadius: 999, background: statusBg, color: statusColor,
                    border: `1px solid ${statusColor}30`, flexShrink: 0,
                  }}>
                    {g.status}
                  </span>
                </div>
                <p style={{ fontSize: "0.72rem", color: "var(--clr-text-4)", lineHeight: 1.5, margin: "0 0 8px" }}>
                  {g.description}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{ flex: 1, display: "flex", gap: 2 }}>
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <div key={n} style={{
                        flex: 1, height: 5, borderRadius: 999,
                        background: n <= g.opportunityScore ? barColor : "var(--clr-border)",
                        boxShadow: n <= g.opportunityScore ? `0 0 3px ${barColor}40` : "none",
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, color: barColor, minWidth: 16, textAlign: "right" }}>
                    {g.opportunityScore}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SWOT ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.625rem" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(96,165,250,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem" }}>⚔️</div>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#60a5fa", margin: 0 }}>SWOT</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          {([
            { key: "strengths" as const, label: "S", full: "Strengths", color: "#34d399", bg: "rgba(52,211,153,0.05)", border: "rgba(52,211,153,0.18)" },
            { key: "weaknesses" as const, label: "W", full: "Weaknesses", color: "#f87171", bg: "rgba(248,113,113,0.05)", border: "rgba(248,113,113,0.18)" },
            { key: "opportunities" as const, label: "O", full: "Opportunities", color: "#60a5fa", bg: "rgba(96,165,250,0.05)", border: "rgba(96,165,250,0.18)" },
            { key: "threats" as const, label: "T", full: "Threats", color: "#fb923c", bg: "rgba(251,146,60,0.05)", border: "rgba(251,146,60,0.18)" },
          ]).map(q => (
            <div key={q.key} style={{
              background: q.bg, border: `1px solid ${q.border}`,
              borderRadius: 10, padding: "0.625rem 0.75rem",
            }}>
              <div style={{ fontSize: "0.58rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: q.color, marginBottom: "0.375rem" }}>
                {q.full}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {(data.swot[q.key] ?? []).slice(0, 3).map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 5, fontSize: "0.68rem", color: "var(--clr-text-3)", lineHeight: 1.4 }}>
                    <span style={{ color: q.color, flexShrink: 0 }}>•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── YOUR OPPORTUNITY ── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(167,139,250,0.06), rgba(124,92,252,0.03))",
        border: "1px solid rgba(167,139,250,0.2)",
        borderRadius: 14, padding: "1rem 1.125rem",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -30, right: -30, width: 160, height: 160,
          borderRadius: "50%", background: "rgba(167,139,250,0.05)", filter: "blur(50px)", pointerEvents: "none",
        }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.625rem" }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(52,211,153,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem" }}>⚡</div>
            <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#34d399", margin: 0 }}>Your Opportunity</h2>
            {(() => {
              const u = data.opportunity.urgency;
              const uColor = u === "high" ? "#f87171" : u === "medium" ? "#fbbf24" : "#60a5fa";
              const uBg = u === "high" ? "rgba(248,113,113,0.1)" : u === "medium" ? "rgba(251,191,36,0.1)" : "rgba(96,165,250,0.1)";
              const uLabel = u === "high" ? "Act Now" : u === "medium" ? "6-12 Mo" : "Long Term";
              return (
                <span style={{
                  marginLeft: "auto", fontSize: "0.56rem", fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "0.05em", padding: "0.15rem 0.5rem", borderRadius: 999,
                  background: uBg, color: uColor, border: `1px solid ${uColor}30`,
                }}>
                  ⏱ {uLabel}
                </span>
              );
            })()}
          </div>

          <p style={{
            fontSize: "0.9375rem", fontWeight: 700, color: "var(--clr-text)",
            lineHeight: 1.45, margin: "0 0 0.75rem",
          }}>
            {data.opportunity.headline}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.5rem" }}>
            {data.opportunity.actionItems.slice(0, 3).map((item) => (
              <div key={item.step} style={{
                background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)",
                borderRadius: 10, padding: "0.625rem 0.75rem",
                display: "flex", gap: "0.5rem", alignItems: "flex-start",
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.65rem", fontWeight: 800, color: "#a78bfa",
                }}>
                  {item.step}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--clr-text)", lineHeight: 1.3 }}>{item.action}</div>
                  <div style={{
                    fontSize: "0.62rem", color: "var(--clr-text-5)", lineHeight: 1.4, marginTop: 2,
                  }}>{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── IDEAL TARGET CUSTOMER ── */}
      <div style={{
        background: "var(--clr-surface)", border: "1px solid var(--clr-border)",
        borderRadius: 12, padding: "0.875rem 1rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.75rem" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(79,142,247,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem" }}>🎯</div>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#60a5fa", margin: 0 }}>Target Customer</h2>
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
          {/* Avatar + identity */}
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: 72 }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M20 21a8 8 0 1 0-16 0"/>
              </svg>
            </div>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--clr-text)", marginTop: 4, lineHeight: 1.2 }}>
              {data.targetCustomer.persona}
            </div>
            <div style={{ fontSize: "0.58rem", color: "var(--clr-text-6)", marginTop: 1 }}>
              {data.targetCustomer.jobTitle}
            </div>
          </div>

          {/* Details — compact chips layout */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {/* Demographics + WTP */}
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ fontSize: "0.65rem", color: "var(--clr-text-3)", lineHeight: 1.4 }}>
                {data.targetCustomer.demographics}
              </div>
              <div style={{ fontSize: "0.65rem", color: "#34d399", fontWeight: 600, lineHeight: 1.4 }}>
                💰 {data.targetCustomer.willingnessToPay}
              </div>
            </div>

            {/* Pain points as compact list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: "0.52rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#f87171" }}>Pains</span>
              {data.targetCustomer.painPoints.slice(0, 3).map((p, i) => (
                <div key={i} style={{ fontSize: "0.65rem", color: "var(--clr-text-4)", lineHeight: 1.35 }}>• {p}</div>
              ))}
            </div>

            {/* Current tools as chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3, alignItems: "center" }}>
              <span style={{ fontSize: "0.52rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--clr-text-7)", marginRight: 2 }}>Uses</span>
              {data.targetCustomer.currentTools.map((t, i) => (
                <span key={i} style={{
                  fontSize: "0.58rem", padding: "0.05rem 0.4rem", borderRadius: 999,
                  background: "var(--clr-bg)", border: "1px solid var(--clr-border)",
                  color: "var(--clr-text-5)", fontWeight: 500,
                }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Gap Analysis Loading Skeleton ─────────────────────────────
function GapAnalysisSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Competitor grid skeleton */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "0.875rem" }}>
          <div className="shimmer" style={{ width: 32, height: 32, borderRadius: 8 }} />
          <div className="shimmer" style={{ height: 16, borderRadius: 6, width: 140 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {[1,2,3,4].map(n => (
            <div key={n} style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 14, padding: "1rem" }}>
              <div className="shimmer" style={{ height: 14, borderRadius: 6, width: "60%", marginBottom: 8 }} />
              <div className="shimmer" style={{ height: 10, borderRadius: 6, width: "80%", marginBottom: 12 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div className="shimmer" style={{ height: 40, borderRadius: 6 }} />
                <div className="shimmer" style={{ height: 40, borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Pain points skeleton */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "0.875rem" }}>
          <div className="shimmer" style={{ width: 32, height: 32, borderRadius: 8 }} />
          <div className="shimmer" style={{ height: 16, borderRadius: 6, width: 120 }} />
        </div>
        {[1,2,3].map(n => <div key={n} className="shimmer" style={{ height: 60, borderRadius: 12, marginBottom: 8 }} />)}
      </div>
      {/* Gaps skeleton */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "0.875rem" }}>
          <div className="shimmer" style={{ width: 32, height: 32, borderRadius: 8 }} />
          <div className="shimmer" style={{ height: 16, borderRadius: 6, width: 130 }} />
        </div>
        {[1,2,3].map(n => <div key={n} className="shimmer" style={{ height: 80, borderRadius: 14, marginBottom: 8 }} />)}
      </div>
      {/* SWOT skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
        {[1,2,3,4].map(n => <div key={n} className="shimmer" style={{ height: 100, borderRadius: 12 }} />)}
      </div>
    </div>
  );
}

// ── Loading Skeleton ───────────────────────────────────────────
function LoadingSkeleton({ tool }: { tool: ToolConfig }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {[{ w: "40%", lines: 3 }, { w: "55%", lines: 4 }, { w: "35%", lines: 2 }, { w: "48%", lines: 3 }].map((c, i) => (
        <div key={i} className="section-card">
          <div className="section-card-header">
            <div className="shimmer" style={{ width: 32, height: 32, borderRadius: 8 }} />
            <div className="shimmer" style={{ height: 16, borderRadius: 6, width: c.w }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Array.from({ length: c.lines }).map((_, j) => (
              <div key={j} className="shimmer" style={{ height: 12, borderRadius: 6, width: j === c.lines - 1 ? "55%" : `${78 + j * 7}%` }} />
            ))}
          </div>
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--clr-text-6)", fontSize: "0.8125rem", paddingTop: 8 }}>
        <div style={{ width: 16, height: 16, border: `2px solid ${tool.accentColor}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        Running {tool.name}…
      </div>
    </div>
  );
}

// ── Space Score Card ───────────────────────────────────────────
function SpaceScoreCard({ score, label, summary, hnBoost }: { score: number; label: string; summary: string; hnBoost?: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const color =
    pct >= 80 ? "#f97316" :
    pct >= 65 ? "#34d399" :
    pct >= 40 ? "#60a5fa" : "#9ca3af";
  const bgColor =
    pct >= 80 ? "rgba(249,115,22,0.08)" :
    pct >= 65 ? "rgba(52,211,153,0.08)" :
    pct >= 40 ? "rgba(96,165,250,0.08)" : "rgba(156,163,175,0.08)";
  const tempEmoji =
    pct >= 80 ? "🔥" :
    pct >= 65 ? "📈" :
    pct >= 40 ? "🌤️" : "❄️";

  // SVG arc math (36px radius, starts at top, clockwise)
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct / 100;
  const offset = circ * 0.25; // start from top

  return (
    <div style={{
      background: "var(--clr-surface)", border: `1px solid ${color}40`,
      borderRadius: 20, padding: "1.5rem 1.75rem", marginBottom: "1rem",
      position: "relative", overflow: "hidden",
      boxShadow: `0 0 0 1px ${color}10, 0 8px 32px ${color}10`,
    }}>
      {/* Background glow */}
      <div style={{
        position: "absolute", top: -60, right: -60, width: 240, height: 240,
        borderRadius: "50%", background: `${color}0a`, filter: "blur(60px)", pointerEvents: "none",
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: "1.75rem", position: "relative" }}>
        {/* Circular gauge */}
        <div style={{ position: "relative", flexShrink: 0, width: 92, height: 92 }}>
          <svg width="92" height="92" viewBox="0 0 92 92" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="46" cy="46" r={r} fill="none" stroke="var(--clr-border)" strokeWidth="7" />
            <circle
              cx="46" cy="46" r={r} fill="none" stroke={color} strokeWidth="7"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: "1.625rem", fontWeight: 800, color, lineHeight: 1, letterSpacing: "-0.03em" }}>{score}</span>
            <span style={{ fontSize: "0.6rem", color: "var(--clr-text-6)", fontWeight: 600, letterSpacing: "0.04em" }}>/100</span>
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.5rem" }}>
            <span style={{
              fontSize: "0.65rem", fontWeight: 700, color: "var(--clr-text-5)",
              textTransform: "uppercase", letterSpacing: "0.08em",
            }}>Space Temperature</span>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "0.175rem 0.6rem", borderRadius: 999,
              background: bgColor, color, fontSize: "0.75rem", fontWeight: 700,
              border: `1px solid ${color}30`,
            }}>
              {tempEmoji} {label}
            </span>
          </div>
          <p style={{
            fontSize: "0.9375rem", color: "var(--clr-text-2)", lineHeight: 1.65,
            margin: 0, fontWeight: 400,
          }}>
            {summary}
          </p>
        </div>
      </div>

      {/* 5-step visual scale */}
      {(() => {
        const steps = [
          { emoji: "🔴", label: "Dead Zone",   min: 0,  max: 19  },
          { emoji: "🟠", label: "Crowded",     min: 20, max: 39  },
          { emoji: "🟡", label: "Warming Up",  min: 40, max: 59  },
          { emoji: "🟢", label: "Growing",     min: 60, max: 79  },
          { emoji: "🔥", label: "Explosive",   min: 80, max: 100 },
        ];
        const activeIdx = steps.findIndex((s) => pct >= s.min && pct <= s.max);
        return (
          <div style={{ marginTop: "1.25rem", display: "flex", gap: 6 }}>
            {steps.map((step, i) => {
              const isActive = i === activeIdx;
              return (
                <div key={step.label} style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                }}>
                  <div style={{
                    width: "100%", height: 6, borderRadius: 999,
                    background: isActive ? color : "var(--clr-border)",
                    boxShadow: isActive ? `0 0 8px ${color}60` : "none",
                    transition: "background 0.3s",
                  }} />
                  <span style={{ fontSize: isActive ? "1rem" : "0.75rem", lineHeight: 1, transition: "font-size 0.2s", filter: isActive ? "none" : "grayscale(1) opacity(0.35)" }}>
                    {step.emoji}
                  </span>
                  <span style={{
                    fontSize: "0.58rem", fontWeight: isActive ? 700 : 400,
                    color: isActive ? color : "var(--clr-text-7)",
                    textAlign: "center", lineHeight: 1.2,
                  }}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* HN signal contribution */}
      {hnBoost && hnBoost > 0 ? (
        <div style={{ marginTop: "0.875rem", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.68rem", color: "var(--clr-text-7)" }}>Score includes</span>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "0.1rem 0.5rem", borderRadius: 999,
            background: "rgba(255,102,0,0.1)", border: "1px solid rgba(255,102,0,0.25)",
            fontSize: "0.68rem", fontWeight: 700, color: "#ff6600",
          }}>
            <svg width="10" height="10" viewBox="0 0 18 18" fill="currentColor"><path d="M9 1l2.2 6.8H18l-5.6 4.1 2.1 6.5L9 14.3l-5.5 4.1 2.1-6.5L0 7.8h6.8L9 1z"/></svg>
            HN activity
          </span>
        </div>
      ) : null}
    </div>
  );
}

// ── Data Source Badges ──────────────────────────────────────────
function DataSourceBadges({ sources, noMargin }: { sources: DataSource[]; noMargin?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.5rem",
      marginBottom: noMargin ? 0 : "1.25rem", flexWrap: "wrap",
    }}>
      <span style={{
        fontSize: "0.65rem", fontWeight: 600, color: "var(--clr-text-7)",
        letterSpacing: "0.07em", textTransform: "uppercase", marginRight: 2,
      }}>
        Sources
      </span>
      {sources.map((src) => (
        <span key={src.name} style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "0.2rem 0.6rem", borderRadius: 999,
          background: `${src.color}12`, border: `1px solid ${src.color}28`,
          fontSize: "0.7rem", fontWeight: 600, color: src.color,
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: "50%", background: src.color,
            animation: src.live ? "pulse 2.5s ease-in-out infinite" : "none",
            flexShrink: 0,
          }} />
          {src.name}
          {!src.live && (
            <span style={{ opacity: 0.55, fontSize: "0.6rem", fontWeight: 500 }}>AI</span>
          )}
        </span>
      ))}
    </div>
  );
}

// ── Tool Selector Card ─────────────────────────────────────────
function ToolSelectorCard({
  tool, isSelected, isOtherSelected, onClick,
}: {
  tool: ToolConfig; isSelected: boolean; isOtherSelected: boolean; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const dim = isOtherSelected && !isSelected;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        borderRadius: 18,
        padding: "1.125rem",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.22s ease",
        background: isSelected ? `rgba(${tool.accentRgb},0.06)` : "var(--clr-surface)",
        border: isSelected
          ? `2px solid ${tool.accentColor}`
          : hovered && !dim
          ? `2px solid rgba(${tool.accentRgb},0.35)`
          : `2px solid rgba(${tool.accentRgb},0.12)`,
        boxShadow: isSelected
          ? `0 0 0 4px rgba(${tool.accentRgb},0.08), 0 16px 48px rgba(${tool.accentRgb},0.12)`
          : hovered && !dim
          ? `0 8px 24px rgba(${tool.accentRgb},0.08)`
          : "none",
        opacity: dim ? 0.35 : 1,
        transform: isSelected ? "translateY(-3px)" : hovered && !dim ? "translateY(-1px)" : "none",
        userSelect: "none",
      }}
    >
      {/* Glow blob */}
      <div style={{
        position: "absolute", top: -20, right: -20, width: 120, height: 120,
        borderRadius: "50%", background: `rgba(${tool.accentRgb},${isSelected ? 0.12 : hovered ? 0.06 : 0.03})`,
        filter: "blur(40px)", pointerEvents: "none", transition: "opacity 0.3s",
      }} />

      {/* Selected checkmark */}
      {isSelected && (
        <div style={{
          position: "absolute", top: 10, right: 10,
          width: 20, height: 20, borderRadius: "50%",
          background: tool.accentColor,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M2 5.5l2.5 2.5 4.5-5" stroke="#000" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* User label */}
      <div style={{
        fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", color: tool.accentColor, opacity: 0.75,
        marginBottom: "0.75rem",
      }}>
        {tool.userLabel}
      </div>

      {/* Icon */}
      <div style={{
        width: 38, height: 38, borderRadius: 11,
        background: `rgba(${tool.accentRgb},0.1)`,
        border: `1px solid rgba(${tool.accentRgb},0.2)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: "0.75rem", flexShrink: 0,
        transition: "background 0.2s",
      }}>
        {TOOL_ICONS[tool.id](tool.accentColor)}
      </div>

      {/* Name */}
      <div style={{
        fontSize: "1rem", fontWeight: 750, letterSpacing: "-0.02em",
        color: "var(--clr-text)", marginBottom: "0.25rem",
      }}>
        {tool.name}
      </div>

      {/* Tagline */}
      <div style={{
        fontSize: "0.6875rem", fontWeight: 500,
        color: tool.accentColor, opacity: 0.7, marginBottom: "0.5rem",
        letterSpacing: "0.01em",
      }}>
        {tool.tagline}
      </div>

      {/* Description */}
      <p style={{
        fontSize: "0.78rem", color: "var(--clr-text-5)", lineHeight: 1.6,
        flex: 1, margin: 0,
      }}>
        {tool.description}
      </p>

      {/* Bottom arrow */}
      <div style={{
        marginTop: "0.75rem",
        display: "flex", alignItems: "center", gap: 5,
        fontSize: "0.75rem", fontWeight: 600,
        color: isSelected ? tool.accentColor : `rgba(${tool.accentRgb},0.4)`,
        transition: "color 0.2s",
      }}>
        {isSelected ? "Selected" : "Select tool"}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ transform: isSelected ? "translateX(2px)" : "none", transition: "transform 0.2s" }}>
          <path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

// ── Input Section ──────────────────────────────────────────────
function InputSection({
  tool, idea, setIdea, budget, setBudget, techLevel, setTechLevel,
  onSubmit, loading, textareaRef,
}: {
  tool: ToolConfig; idea: string; setIdea: (v: string) => void;
  budget: Budget; setBudget: (v: Budget) => void;
  techLevel: TechLevel; setTechLevel: (v: TechLevel) => void;
  onSubmit: () => void; loading: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const canSubmit = idea.trim().length >= 3 && !loading;

  const BUDGETS: { id: Budget; label: string; sub: string }[] = [
    { id: "bootstrap", label: "Bootstrapped", sub: "< $50/mo" },
    { id: "growing",   label: "Growing",      sub: "$50–200/mo" },
    { id: "funded",    label: "Funded",        sub: "$200–1k/mo" },
    { id: "scale",     label: "Scale",         sub: "$1k+/mo" },
  ];
  const TECH_LEVELS: { id: TechLevel; label: string; sub: string }[] = [
    { id: "nocode",    label: "No-code",    sub: "Notion, Webflow, Zapier" },
    { id: "lowcode",   label: "Low-code",   sub: "Can edit HTML/CSS, use APIs" },
    { id: "developer", label: "Developer",  sub: "Can code & deploy" },
  ];

  return (
    <div style={{ animation: "fadeSlideIn 0.28s ease", marginTop: "2rem", marginBottom: "3.5rem" }}>
      {/* Connection line from cards */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
          <div style={{ width: 1, height: 24, background: `linear-gradient(to bottom, transparent, rgba(${tool.accentRgb},0.4))` }} />
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: tool.accentColor }} />
        </div>
      </div>

      {/* Input card */}
      <div style={{
        maxWidth: 720, margin: "0 auto",
        background: "var(--clr-surface)",
        border: `1px solid rgba(${tool.accentRgb},0.25)`,
        borderRadius: 20,
        boxShadow: `0 0 0 1px rgba(${tool.accentRgb},0.06), 0 24px 64px rgba(0,0,0,0.4)`,
        overflow: "hidden",
      }}>
        {/* Card header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "1rem 1.5rem",
          borderBottom: `1px solid rgba(${tool.accentRgb},0.12)`,
          background: `rgba(${tool.accentRgb},0.04)`,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: `rgba(${tool.accentRgb},0.15)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {TOOL_ICONS[tool.id](tool.accentColor)}
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--clr-text)", letterSpacing: "-0.01em" }}>
              {tool.name}
            </div>
            <div style={{ fontSize: "0.7rem", color: tool.accentColor, opacity: 0.7, fontWeight: 500 }}>
              {tool.tagline}
            </div>
          </div>
        </div>

        <div style={{ padding: "1.375rem 1.5rem" }}>
          {/* Idea textarea */}
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--clr-text-4)", marginBottom: "0.5rem", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {tool.inputLabel}
          </label>
          <textarea
            ref={textareaRef}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit(); }}
            placeholder={tool.placeholder}
            rows={3}
            style={{
              width: "100%", background: "var(--clr-bg)",
              border: "1px solid var(--clr-border)", borderRadius: 12,
              padding: "0.75rem 1rem",
              color: "var(--clr-text)", fontSize: "0.9375rem", lineHeight: 1.65,
              outline: "none", resize: "none", fontFamily: "inherit",
              transition: "border-color 0.15s",
              boxSizing: "border-box",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = `rgba(${tool.accentRgb},0.45)`; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--clr-border)"; }}
          />

          {/* Stack Advisor extras */}
          {tool.hasExtras && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginTop: "1.125rem" }}>
              {/* Budget */}
              <div>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, color: "var(--clr-text-4)", marginBottom: "0.5rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Monthly budget
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { id: "bootstrap" as Budget, label: "Bootstrapped", sub: "< $50/mo" },
                    { id: "growing"   as Budget, label: "Growing",      sub: "$50–200/mo" },
                    { id: "funded"    as Budget, label: "Funded",        sub: "$200–1k/mo" },
                    { id: "scale"     as Budget, label: "Scale",         sub: "$1k+/mo" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setBudget(opt.id)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "0.5rem 0.75rem", borderRadius: 9,
                        background: budget === opt.id ? `rgba(${tool.accentRgb},0.1)` : "transparent",
                        border: budget === opt.id ? `1px solid rgba(${tool.accentRgb},0.4)` : "1px solid var(--clr-border)",
                        cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                        transition: "all 0.12s",
                      }}
                    >
                      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: budget === opt.id ? tool.accentColor : "var(--clr-text-3)" }}>{opt.label}</span>
                      <span style={{ fontSize: "0.7rem", color: budget === opt.id ? `rgba(${tool.accentRgb},0.7)` : "var(--clr-text-6)" }}>{opt.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tech level */}
              <div>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, color: "var(--clr-text-4)", marginBottom: "0.5rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Technical level
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { id: "nocode"    as TechLevel, label: "No-code",   sub: "Notion, Webflow, Zapier" },
                    { id: "lowcode"   as TechLevel, label: "Low-code",   sub: "HTML/CSS, APIs, tutorials" },
                    { id: "developer" as TechLevel, label: "Developer",  sub: "Code, CLIs, deployment" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setTechLevel(opt.id)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "0.5rem 0.75rem", borderRadius: 9,
                        background: techLevel === opt.id ? `rgba(${tool.accentRgb},0.1)` : "transparent",
                        border: techLevel === opt.id ? `1px solid rgba(${tool.accentRgb},0.4)` : "1px solid var(--clr-border)",
                        cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                        transition: "all 0.12s",
                      }}
                    >
                      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: techLevel === opt.id ? tool.accentColor : "var(--clr-text-3)" }}>{opt.label}</span>
                      <span style={{ fontSize: "0.7rem", color: techLevel === opt.id ? `rgba(${tool.accentRgb},0.7)` : "var(--clr-text-6)" }}>{opt.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Submit row */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginTop: "1.125rem", paddingTop: "1.125rem",
            borderTop: "1px solid var(--clr-border-deep)",
          }}>
            <span style={{ fontSize: "0.7rem", color: "var(--clr-text-8)" }}>⌘↵ to run</span>
            <button
              onClick={onSubmit}
              disabled={!canSubmit}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "0.5625rem 1.25rem", borderRadius: 11,
                background: canSubmit ? `linear-gradient(135deg, rgba(${tool.accentRgb},0.9), ${tool.accentColor})` : "var(--clr-surface-3)",
                color: canSubmit ? "#fff" : "var(--clr-text-8)",
                fontSize: "0.875rem", fontWeight: 700, border: "none",
                cursor: canSubmit ? "pointer" : "not-allowed",
                fontFamily: "inherit", letterSpacing: "-0.01em",
                boxShadow: canSubmit ? `0 4px 20px rgba(${tool.accentRgb},0.3)` : "none",
                transition: "all 0.15s",
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  Running…
                </>
              ) : (
                <>
                  Run {tool.name}
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M1 6.5h11M6.5 1l5.5 5.5-5.5 5.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── GitHub repo type ────────────────────────────────────────────
interface GithubRepo {
  id: number;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  created_at: string;
}

interface HNPost {
  objectID: string;
  title: string;
  points: number;
  num_comments: number;
  created_at: string;
  url: string | null;
}


interface GooglePlayApp {
  appId: string;
  title: string;
  score: number;
  ratings: number;
  price: string;
  description: string;
  genre: string;
  icon: string;
  url: string;
}
interface MergedApp {
  name: string;
  icon: string;
  rating: number;
  totalRatings: number;
  price: string;
  description: string;
  genres: string[];
  platforms: { ios?: { url: string }; android?: { url: string } };
}
function mergeStoreApps(ios: ITunesApp[], android: GooglePlayApp[]): MergedApp[] {
  const map = new Map<string, MergedApp>();
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const a of ios) {
    const key = normalize(a.trackName);
    map.set(key, {
      name: a.trackName,
      icon: a.artworkUrl60,
      rating: a.averageUserRating,
      totalRatings: a.userRatingCount,
      price: a.formattedPrice,
      description: a.description,
      genres: a.genres,
      platforms: { ios: { url: a.trackViewUrl } },
    });
  }
  for (const a of android) {
    const key = normalize(a.title);
    const existing = map.get(key);
    if (existing) {
      existing.totalRatings += a.ratings;
      existing.platforms.android = { url: a.url };
      if (!existing.icon && a.icon) existing.icon = a.icon;
    } else {
      map.set(key, {
        name: a.title,
        icon: a.icon,
        rating: a.score,
        totalRatings: a.ratings,
        price: a.price,
        description: a.description,
        genres: a.genre ? [a.genre] : [],
        platforms: { android: { url: a.url } },
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.totalRatings - a.totalRatings);
}
interface ITunesApp {
  trackId: number;
  trackName: string;
  averageUserRating: number;
  userRatingCount: number;
  formattedPrice: string;
  description: string;
  artworkUrl60: string;
  trackViewUrl: string;
  genres: string[];
}

// ── Gap Analysis structured types ─────────────────────────────
interface GapCompetitor {
  name: string;
  tagline: string;
  threatLevel: number;
  strengths: string[];
  weaknesses: string[];
}
interface GapPainPoint {
  quote: string;
  source?: string;
  severity: "high" | "medium" | "low";
}
interface GapMarketGap {
  title: string;
  description: string;
  opportunityScore: number;
  status: "untapped" | "emerging" | "contested";
}
interface GapSWOT {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}
interface GapOpportunity {
  headline: string;
  urgency: "high" | "medium" | "low";
  actionItems: { step: number; action: string; detail: string }[];
}
interface GapTargetCustomer {
  persona: string;
  jobTitle: string;
  demographics: string;
  painPoints: string[];
  currentTools: string[];
  willingnessToPay: string;
}
interface GapAnalysisData {
  appStoreQuery?: string;
  marketScore: number;
  marketScoreLabel: string;
  marketScoreSummary: string;
  competitors: GapCompetitor[];
  painPoints: GapPainPoint[];
  marketGaps: GapMarketGap[];
  swot: GapSWOT;
  opportunity: GapOpportunity;
  targetCustomer: GapTargetCustomer;
}

function parseGapAnalysisJSON(raw: string): GapAnalysisData | null {
  const match = raw.match(/```json\s*([\s\S]*?)```/);
  if (!match) return null;
  try {
    const data = JSON.parse(match[1]);
    if (!data.competitors || !data.painPoints || !data.marketGaps ||
        !data.swot || !data.opportunity || !data.targetCustomer) return null;
    // Default marketScore fields if missing
    data.marketScore = data.marketScore ?? 50;
    data.marketScoreLabel = data.marketScoreLabel ?? "";
    data.marketScoreSummary = data.marketScoreSummary ?? "";
    return data as GapAnalysisData;
  } catch {
    return null;
  }
}

// ── Stack Advisor structured types ────────────────────────────
interface StackPhaseCosts {
  tools: { name: string; purpose: string; freeTier: boolean; monthlyCost: string }[];
  total: string;
}
interface StackPhase {
  name: string;
  subtitle: string;
  tools: { name: string; purpose: string; price: string; free: boolean }[];
  costs?: StackPhaseCosts;
}
interface StackMistake { title: string; description: string; }
interface StackScalability { trigger: string; whatBreaks: string; upgradeTo: string; severity: "low" | "medium" | "high"; }
interface StackUpgrade { tool: string; trigger: string; migrateTo: string; }
interface StackAdvisorData {
  headline: string;
  phases: StackPhase[];
  costs?: { tools: { name: string; purpose: string; freeTier: boolean; monthlyCost: string }[]; total: string };
  buildOrder: { week: string; title: string; steps: string[] }[];
  mistakes: StackMistake[];
  scalability: StackScalability[];
  upgrades: StackUpgrade[];
}

function parseStackAdvisorJSON(raw: string): StackAdvisorData | null {
  const match = raw.match(/```json\s*([\s\S]*?)```/);
  if (!match) return null;
  try {
    const data = JSON.parse(match[1]);
    if (!data.phases || !data.buildOrder) return null;
    data.headline = data.headline ?? "";
    data.mistakes = data.mistakes ?? [];
    data.scalability = data.scalability ?? [];
    data.upgrades = data.upgrades ?? [];
    return data as StackAdvisorData;
  } catch {
    return null;
  }
}

// ── Stack Advisor Visual Result ──────────────────────────────
const PHASE_COLORS = ["#eab308", "#34d399", "#60a5fa", "#a78bfa", "#fb923c"];
const PHASE_BGS = ["rgba(234,179,8,0.08)", "rgba(52,211,153,0.08)", "rgba(96,165,250,0.08)", "rgba(167,139,250,0.08)", "rgba(251,146,60,0.08)"];

function StackAdvisorResult({ data }: { data: StackAdvisorData }) {
  const isPhaseZero = (name: string) => /phase\s*0/i.test(name) || /validate/i.test(name);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── HEADLINE ── */}
      {data.headline && (
        <div style={{
          background: "var(--clr-surface)", border: "1px solid rgba(251,146,60,0.25)",
          borderRadius: 16, padding: "1.25rem 1.5rem",
          borderTop: "3px solid #fb923c",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--clr-text-6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Recommendation
            </span>
            <span style={{
              fontSize: "0.55rem", fontWeight: 700, padding: "0.12rem 0.5rem",
              borderRadius: 999, background: "rgba(52,211,153,0.1)",
              color: "#34d399", border: "1px solid rgba(52,211,153,0.25)",
              letterSpacing: "0.03em",
            }}>
              Pricing verified March 2026
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 600, color: "var(--clr-text)", lineHeight: 1.5, letterSpacing: "-0.01em" }}>
            {data.headline}
          </p>
        </div>
      )}

      {/* ── PHASES (with embedded cost breakdown) ── */}
      {data.phases.map((phase, pi) => {
        const isP0 = isPhaseZero(phase.name);
        const color = PHASE_COLORS[pi] ?? PHASE_COLORS[PHASE_COLORS.length - 1];
        const bg = PHASE_BGS[pi] ?? PHASE_BGS[PHASE_BGS.length - 1];
        const phaseCosts = phase.costs;
        return (
          <div key={pi} style={{
            background: "var(--clr-surface)", border: `1px solid ${isP0 ? "rgba(234,179,8,0.3)" : "var(--clr-border)"}`,
            borderRadius: 16, overflow: "hidden",
          }}>
            <div style={{
              height: 3, background: `linear-gradient(90deg, ${color}, ${color}80)`,
            }} />
            <div style={{ padding: "1.25rem 1.5rem" }}>
              {/* Phase header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "0.2rem" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: bg, border: `1px solid ${color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.75rem", fontWeight: 800, color,
                }}>
                  {pi}
                </div>
                <span style={{ fontSize: "1rem", fontWeight: 750, color: "var(--clr-text)", letterSpacing: "-0.02em" }}>
                  {phase.name}
                </span>
                {isP0 && (
                  <span style={{
                    fontSize: "0.58rem", fontWeight: 800, padding: "0.15rem 0.6rem",
                    borderRadius: 999, letterSpacing: "0.05em",
                    background: "rgba(234,179,8,0.15)", color: "#eab308",
                    border: "1px solid rgba(234,179,8,0.35)",
                    animation: "pulse 2s ease-in-out infinite",
                  }}>
                    DO THIS FIRST
                  </span>
                )}
              </div>
              {phase.subtitle && (
                <p style={{ margin: "0 0 1rem 38px", fontSize: "0.78rem", color: "var(--clr-text-5)", lineHeight: 1.4 }}>
                  {phase.subtitle}
                </p>
              )}

              {/* Tool chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginLeft: 38 }}>
                {phase.tools.map((tool, ti) => (
                  <div key={ti} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "0.5rem 0.875rem", borderRadius: 10,
                    background: "var(--clr-bg)", border: "1px solid var(--clr-border)",
                  }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: color, flexShrink: 0,
                    }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--clr-text)" }}>
                          {tool.name}
                        </span>
                        <span style={{
                          fontSize: "0.58rem", fontWeight: 700, padding: "0.08rem 0.4rem",
                          borderRadius: 999,
                          background: tool.free ? "rgba(52,211,153,0.12)" : "rgba(251,146,60,0.12)",
                          color: tool.free ? "#34d399" : "#fb923c",
                          border: `1px solid ${tool.free ? "rgba(52,211,153,0.25)" : "rgba(251,146,60,0.25)"}`,
                        }}>
                          {tool.price}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "var(--clr-text-5)", marginTop: 2 }}>
                        {tool.purpose}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Per-phase cost breakdown ── */}
              {phaseCosts && phaseCosts.tools.length > 0 && (
                <div style={{ marginTop: "1rem", marginLeft: 38 }}>
                  <div style={{
                    padding: "0.75rem 1rem", borderRadius: 12,
                    background: `${color}08`, border: `1px solid ${color}20`,
                  }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {phaseCosts.tools.map((ct, ci) => (
                        <div key={ci} style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "0.3rem 0",
                        }}>
                          <div style={{
                            width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                            background: ct.freeTier ? "#34d399" : "#fb923c",
                          }} />
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--clr-text-3)" }}>
                            {ct.name}
                          </span>
                          <span style={{ fontSize: "0.65rem", color: "var(--clr-text-6)", flex: 1 }}>
                            {ct.purpose}
                          </span>
                          <span style={{
                            fontSize: "0.56rem", fontWeight: 700, padding: "0.05rem 0.35rem",
                            borderRadius: 999, flexShrink: 0,
                            background: ct.freeTier ? "rgba(52,211,153,0.12)" : "rgba(251,146,60,0.12)",
                            color: ct.freeTier ? "#34d399" : "#fb923c",
                          }}>
                            {ct.freeTier ? "FREE" : "PAID"}
                          </span>
                          <span style={{ fontSize: "0.8125rem", fontWeight: 800, color: "var(--clr-text)", minWidth: 45, textAlign: "right" }}>
                            {ct.monthlyCost}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Phase total pill */}
                    <div style={{
                      marginTop: "0.5rem", paddingTop: "0.5rem",
                      borderTop: `1px solid ${color}20`,
                      display: "flex", justifyContent: "flex-end",
                    }}>
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "0.3rem 0.875rem", borderRadius: 999,
                        background: `${color}15`, border: `1px solid ${color}30`,
                      }}>
                        <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--clr-text-4)" }}>
                          {phase.name.split(":")[0]} Total
                        </span>
                        <span style={{ fontSize: "1rem", fontWeight: 800, color, letterSpacing: "-0.02em" }}>
                          {phaseCosts.total}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* ── BUILD ORDER TIMELINE ── */}
      {data.buildOrder.length > 0 && (
        <div style={{
          background: "var(--clr-surface)", border: "1px solid var(--clr-border)",
          borderRadius: 16, padding: "1.25rem 1.5rem",
        }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--clr-text-5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
            Build Order
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
            {data.buildOrder.map((block, bi) => {
              const isLast = bi === data.buildOrder.length - 1;
              const color = PHASE_COLORS[bi] ?? PHASE_COLORS[0];
              return (
                <div key={bi} style={{ display: "flex", gap: "1rem", position: "relative", paddingBottom: isLast ? 0 : "1.5rem" }}>
                  {/* Timeline column */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32, flexShrink: 0 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: `${color}18`, border: `2px solid ${color}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.75rem", fontWeight: 800, color, zIndex: 1,
                    }}>
                      {bi + 1}
                    </div>
                    {!isLast && (
                      <div style={{ width: 2, flex: 1, background: "var(--clr-border)", marginTop: 4 }} />
                    )}
                  </div>
                  {/* Content */}
                  <div style={{
                    flex: 1, padding: "0.625rem 1rem", borderRadius: 12,
                    background: "var(--clr-bg)", border: "1px solid var(--clr-border)",
                    marginTop: 0,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {block.week}
                      </span>
                      <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--clr-text)" }}>
                        {block.title}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {block.steps.map((step, si) => (
                        <div key={si} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <span style={{
                            fontSize: "0.6rem", fontWeight: 700, color: "var(--clr-text-6)",
                            width: 16, height: 16, borderRadius: "50%",
                            background: "var(--clr-surface)", border: "1px solid var(--clr-border)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0, marginTop: 1,
                          }}>
                            {si + 1}
                          </span>
                          <span style={{ fontSize: "0.78rem", color: "var(--clr-text-3)", lineHeight: 1.5 }}>
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MISTAKES TO AVOID ── */}
      {data.mistakes.length > 0 && (
        <div style={{
          background: "var(--clr-surface)", border: "1px solid var(--clr-border)",
          borderRadius: 16, padding: "1.25rem 1.5rem",
        }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--clr-text-5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
            Mistakes to Avoid
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.mistakes.map((m, i) => {
              const mColor = i === 0 ? "#f87171" : i === 1 ? "#fb923c" : "#eab308";
              return (
                <div key={i} style={{
                  display: "flex", gap: 0, borderRadius: 12, overflow: "hidden",
                  background: "var(--clr-bg)", border: "1px solid var(--clr-border)",
                }}>
                  <div style={{ width: 4, background: mColor, flexShrink: 0 }} />
                  <div style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--clr-text)", marginBottom: 3 }}>
                      {m.title}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--clr-text-4)", lineHeight: 1.55 }}>
                      {m.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SCALABILITY CEILING ── */}
      {data.scalability.length > 0 && (
        <div style={{
          background: "var(--clr-surface)", border: "1px solid var(--clr-border)",
          borderRadius: 16, padding: "1.25rem 1.5rem",
        }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--clr-text-5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
            Scalability Ceiling
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.scalability.map((s, i) => {
              const sevColor = s.severity === "high" ? "#f87171" : s.severity === "medium" ? "#fb923c" : "#eab308";
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "0.625rem 1rem", borderRadius: 12,
                  background: "var(--clr-bg)", border: "1px solid var(--clr-border)",
                  flexWrap: "wrap",
                }}>
                  {/* Trigger */}
                  <span style={{
                    fontSize: "0.75rem", fontWeight: 800, color: sevColor,
                    padding: "0.15rem 0.6rem", borderRadius: 999,
                    background: `${sevColor}15`, border: `1px solid ${sevColor}30`,
                    flexShrink: 0,
                  }}>
                    {s.trigger}
                  </span>
                  {/* Arrow */}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M2 7h10m0 0L9 4m3 3L9 10" stroke="var(--clr-text-6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {/* What breaks */}
                  <span style={{ fontSize: "0.75rem", color: "var(--clr-text-3)", flex: 1, minWidth: 100 }}>
                    {s.whatBreaks}
                  </span>
                  {/* Arrow */}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M2 7h10m0 0L9 4m3 3L9 10" stroke="var(--clr-text-6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {/* Upgrade to */}
                  <span style={{
                    fontSize: "0.72rem", fontWeight: 700, color: "#34d399",
                    padding: "0.15rem 0.6rem", borderRadius: 999,
                    background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)",
                    flexShrink: 0,
                  }}>
                    {s.upgradeTo}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── WHEN TO UPGRADE ── */}
      {data.upgrades.length > 0 && (
        <div style={{
          background: "var(--clr-surface)", border: "1px solid var(--clr-border)",
          borderRadius: 16, padding: "1.25rem 1.5rem",
        }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--clr-text-5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
            When to Upgrade
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {data.upgrades.map((u, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "0.5rem 0.875rem", borderRadius: 10,
                background: "var(--clr-bg)",
              }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--clr-text)", minWidth: 80 }}>
                  {u.tool}
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--clr-text-5)", flex: 1 }}>
                  {u.trigger}
                </span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M2 7h10m0 0L9 4m3 3L9 10" stroke="var(--clr-text-6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{
                  fontSize: "0.72rem", fontWeight: 700, color: "#a78bfa",
                  padding: "0.1rem 0.5rem", borderRadius: 999,
                  background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)",
                  flexShrink: 0,
                }}>
                  {u.migrateTo}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────
export default function Home() {
  const [selectedTool, setSelectedTool] = useState<ToolId | null>(null);
  const [idea, setIdea] = useState("");
  const [budget, setBudget] = useState<Budget>("bootstrap");
  const [techLevel, setTechLevel] = useState<TechLevel>("nocode");
  const [loading, setLoading] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [error, setError] = useState("");
  const [hasResults, setHasResults] = useState(false);
  const [light, setLight] = useState(false);
  const [githubRepos, setGithubRepos] = useState<GithubRepo[]>([]);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubFetched, setGithubFetched] = useState(false);
  const [hnPosts, setHnPosts] = useState<HNPost[]>([]);
  const [hnLoading, setHnLoading] = useState(false);
  const [hnFetched, setHnFetched] = useState(false);
  const [itunesApps, setItunesApps] = useState<ITunesApp[]>([]);
  const [itunesTotal, setItunesTotal] = useState(0);
  const [itunesTotalRatings, setItunesTotalRatings] = useState(0);
  const [itunesLoading, setItunesLoading] = useState(false);
  const [itunesFetched, setItunesFetched] = useState(false);
  const [gplayApps, setGplayApps] = useState<GooglePlayApp[]>([]);
  const [gplayTotal, setGplayTotal] = useState(0);
  const [gplayLoading, setGplayLoading] = useState(false);
  const [gplayFetched, setGplayFetched] = useState(false);

  const [domainKeywords, setDomainKeywords] = useState<string[]>([]);
  const [resultCached, setResultCached] = useState<boolean | null>(null);

  const [scanStep, setScanStep] = useState(-1); // -1=hidden 0-3=active step 4=all done

  const inputSectionRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scanTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Number of scan steps for the current tool (used for timer logic)
  const scanStepCounts: Record<string, number> = { "trend-feed": 3, "gap-analysis": 3, "competitor-radar": 1, "stack-advisor": 1 };
  const maxScanStep = (scanStepCounts[selectedTool ?? "trend-feed"] ?? 3) - 1;

  // Advance scan to "done" once last step is active AND Claude has finished
  useEffect(() => {
    if (scanStep === 4) {
      const t = setTimeout(() => { setHasResults(true); setScanStep(-1); }, 750);
      return () => clearTimeout(t);
    }
    if (scanStep >= maxScanStep && !loading) {
      const t = setTimeout(() => setScanStep(4), 350);
      return () => clearTimeout(t);
    }
  }, [scanStep, loading, maxScanStep]);

  useEffect(() => {
    if (hasResults) {
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [hasResults]);

  useEffect(() => {
    if (localStorage.getItem("theme") === "light") {
      setLight(true);
      document.documentElement.classList.add("light");
    }
  }, []);

  const toggleTheme = () => {
    const next = !light;
    console.log("[theme toggle] switching to:", next ? "light" : "dark");
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    console.log("[theme toggle] html classes:", document.documentElement.className);
    localStorage.setItem("theme", next ? "light" : "dark");
  };

  const handleSelectTool = (toolId: ToolId) => {
    setSelectedTool(toolId);
    setTimeout(() => {
      inputSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      setTimeout(() => textareaRef.current?.focus(), 200);
    }, 60);
  };

  const fetchGithubRepos = async (query: string) => {
    setGithubLoading(true);
    setGithubFetched(false);
    setGithubRepos([]);
    console.log("[GitHub] fetching with query:", query);
    try {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const q = encodeURIComponent(`${query} created:>${since}`);
      const res = await fetch(
        `https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=8`,
        { headers: { Accept: "application/vnd.github.v3+json" } },
      );
      if (!res.ok) {
        console.log("[GitHub] error response:", res.status, res.statusText);
        return;
      }
      const data = await res.json();
      console.log("[GitHub] results:", data.items?.length ?? 0, "items; message:", data.message ?? "none");
      setGithubRepos(data.items ?? []);
    } catch (err) {
      console.log("[GitHub] fetch error:", err);
    } finally {
      setGithubLoading(false);
      setGithubFetched(true);
    }
  };

  const fetchHNPosts = async (query: string) => {
    setHnLoading(true);
    setHnPosts([]);
    setHnFetched(false);
    console.log("[HN] fetching with query:", query);
    try {
      // 30-day unix timestamp window
      const since = Math.floor(Date.now() / 1000) - 30 * 24 * 3600;
      const q = encodeURIComponent(query);
      const res = await fetch(
        `https://hn.algolia.com/api/v1/search?query=${q}&tags=story&numericFilters=created_at_i>${since}&hitsPerPage=10&attributesToRetrieve=objectID,title,points,num_comments,created_at,url&attributesToHighlight=none`,
      );
      if (!res.ok) {
        console.log("[HN] error response:", res.status, res.statusText);
        return;
      }
      const data = await res.json();
      console.log("[HN] raw hits:", data.hits?.length ?? 0, "total; after filter+sort:", data.hits?.filter((h: HNPost) => h.points > 0).length ?? 0);
      // Sort by points descending, take top 8
      const hits: HNPost[] = (data.hits ?? [])
        .filter((h: HNPost) => h.points > 0)
        .sort((a: HNPost, b: HNPost) => (b.points || 0) - (a.points || 0))
        .slice(0, 8);
      console.log("[HN] showing:", hits.map(h => `"${h.title}" (${h.points}pts)`));
      setHnPosts(hits);
    } catch (err) {
      console.log("[HN] fetch error:", err);
    } finally {
      setHnLoading(false);
      setHnFetched(true);
    }
  };


  const fetchITunesApps = async (query: string) => {
    setItunesLoading(true);
    setItunesFetched(false);
    setItunesApps([]);
    setItunesTotal(0);
    setItunesTotalRatings(0);
    console.log("[iTunes] fetching with query:", query);
    try {
      const q = encodeURIComponent(query);
      const res = await fetch(`https://itunes.apple.com/search?term=${q}&entity=software&limit=10`);
      if (!res.ok) {
        console.log("[iTunes] error response:", res.status, res.statusText);
        return;
      }
      const data = await res.json();
      const apps = (data.results ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((r: any) => ({
          trackId: r.trackId,
          trackName: r.trackName ?? "Unknown",
          averageUserRating: r.averageUserRating ?? 0,
          userRatingCount: r.userRatingCount ?? 0,
          formattedPrice: r.formattedPrice ?? "Free",
          description: r.description ?? "",
          artworkUrl60: r.artworkUrl60 ?? "",
          trackViewUrl: r.trackViewUrl ?? "",
          genres: r.genres ?? [],
        }))
        .sort((a: ITunesApp, b: ITunesApp) => b.userRatingCount - a.userRatingCount);
      const topApps = apps.slice(0, 10);
      const totalRatings = apps.reduce((sum: number, a: ITunesApp) => sum + a.userRatingCount, 0);
      console.log("[iTunes] results:", data.resultCount, "apps; top:", topApps.map((a: ITunesApp) => a.trackName));
      setItunesApps(topApps);
      setItunesTotal(data.resultCount ?? 0);
      setItunesTotalRatings(totalRatings);
    } catch (err) {
      console.log("[iTunes] fetch error:", err);
    } finally {
      setItunesLoading(false);
      setItunesFetched(true);
    }
  };

  const fetchGplayApps = async (query: string) => {
    setGplayLoading(true);
    setGplayFetched(false);
    setGplayApps([]);
    setGplayTotal(0);
    console.log("[GPlay] fetching with query:", query);
    try {
      const res = await fetch(`/api/gplay?q=${encodeURIComponent(query)}`);
      if (!res.ok) { console.log("[GPlay] error:", res.status); return; }
      const data = await res.json();
      setGplayApps(data.results ?? []);
      setGplayTotal(data.total ?? 0);
      console.log("[GPlay] results:", data.total, "apps:", (data.results ?? []).map((a: GooglePlayApp) => a.title));
    } catch (err) {
      console.log("[GPlay] fetch error:", err);
    } finally {
      setGplayLoading(false);
      setGplayFetched(true);
    }
  };

  // Fetch domain-specific search terms via Claude Haiku, then kick off dependent API fetches
  const fetchSearchMeta = async (idea: string, extraFetches?: (q: string) => void) => {
    setDomainKeywords([]);
    console.log("[meta] expanding idea:", idea);
    try {
      const res = await fetch("/api/trends/meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });
      if (res.ok) {
        const meta = await res.json();
        const fullQuery = meta.searchQuery || idea;
        // Limit to first 3 words — long queries reduce API result quality
        const q = fullQuery.split(/\s+/).slice(0, 3).join(" ");
        console.log("[meta] searchQuery from Haiku:", meta.searchQuery, "| truncated to:", q, "| keywords:", meta.keywords);
        setDomainKeywords(meta.keywords ?? []);
        extraFetches?.(q);
      } else {
        const q = idea.split(/\s+/).slice(0, 3).join(" ");
        console.log("[meta] meta route failed, falling back to truncated idea:", q);
        extraFetches?.(q);
      }
    } catch (err) {
      const q = idea.split(/\s+/).slice(0, 3).join(" ");
      console.log("[meta] fetch error:", err, "— falling back to truncated idea:", q);
      extraFetches?.(q);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTool || idea.trim().length < 3) return;
    const tool = TOOLS.find((t) => t.id === selectedTool)!;

    setLoading(true);
    setHasResults(false);
    setStreamedContent("");
    setError("");
    setResultCached(null);
    setGithubRepos([]);
    setGithubFetched(false);
    setHnPosts([]);

    setHnFetched(false);
    setItunesApps([]);
    setItunesTotal(0);
    setItunesTotalRatings(0);
    setItunesFetched(false);
    setGplayApps([]);
    setGplayTotal(0);
    setGplayFetched(false);
    setDomainKeywords([]);

    // Start scan sequence — number of timed steps depends on the tool
    scanTimersRef.current.forEach(clearTimeout);
    setScanStep(0);
    const steps = (scanStepCounts[selectedTool ?? "trend-feed"] ?? 3);
    scanTimersRef.current = Array.from({ length: steps - 1 }, (_, i) =>
      setTimeout(() => setScanStep((s) => (s < i + 1 ? i + 1 : s)), (i + 1) * 800)
    );

    // Expand domain terms via Claude Haiku, then chain API fetches with normalized query
    if (selectedTool === "trend-feed") {
      fetchSearchMeta(idea.trim(), (q) => {
        fetchHNPosts(q);
        fetchGithubRepos(q);
      });
    } else if (selectedTool === "gap-analysis") {
      // iTunes fetch deferred until Claude returns appStoreQuery
    }

    const body: Record<string, string> = { idea };
    if (selectedTool === "stack-advisor") {
      body.budget = budget;
      body.techLevel = techLevel;
    }

    try {
      const res = await fetch(tool.apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Something went wrong");
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.meta !== undefined) {
              setResultCached(parsed.meta.cached);
            } else if (parsed.text) {
              fullContent += parsed.text;
              setStreamedContent((p) => p + parsed.text);
            }
          } catch { /* skip */ }
        }
      }
      // For gap-analysis, use Claude's appStoreQuery for both store searches
      if (selectedTool === "gap-analysis" && fullContent) {
        const gapParsed = parseGapAnalysisJSON(fullContent);
        const storeQuery = gapParsed?.appStoreQuery || idea.trim();
        fetchITunesApps(storeQuery);
        fetchGplayApps(storeQuery);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const backToTools = () => {
    scanTimersRef.current.forEach(clearTimeout);
    setScanStep(-1);
    setHasResults(false);
    setStreamedContent("");
    setError("");
    setResultCached(null);
    setGithubRepos([]);
    setGithubFetched(false);
    setHnPosts([]);
    setHnFetched(false);
    setItunesApps([]);
    setItunesFetched(false);
    setGplayApps([]);
    setGplayFetched(false);
    setDomainKeywords([]);
  };

  const fullReset = () => {
    scanTimersRef.current.forEach(clearTimeout);
    setScanStep(-1);
    setHasResults(false);
    setSelectedTool(null);
    setIdea("");
    setStreamedContent("");
    setError("");
    setResultCached(null);
    setGithubRepos([]);
    setGithubFetched(false);
    setHnPosts([]);
    setHnFetched(false);
    setItunesApps([]);
    setItunesFetched(false);
    setGplayApps([]);
    setGplayFetched(false);
    setDomainKeywords([]);
  };

  const allSections = streamedContent ? parseSections(streamedContent, loading) : [];
  // Normalize variation selectors so "🌡️" (with FE0F) and "🌡" (without) both match
  const stripVS = (s: string) => s.replace(/\uFE0F/g, "");
  const scoreSection = allSections.find((s) => stripVS(s.emoji) === stripVS("🌡️"));
  const sections = allSections.filter((s) => stripVS(s.emoji) !== stripVS("🌡️"));
  const scoreData = scoreSection ? parseScore(scoreSection.body) : null;
  const currentTool = TOOLS.find((t) => t.id === selectedTool);

  // HN signal boost: weight the opportunity score based on HN engagement
  const hnBoost = (() => {
    if (selectedTool !== "trend-feed" || hnPosts.length === 0) return 0;
    const topPosts = hnPosts.slice(0, 5);
    const avgPoints = topPosts.reduce((sum, p) => sum + (p.points || 0), 0) / topPosts.length;
    const totalComments = topPosts.reduce((sum, p) => sum + (p.num_comments || 0), 0);
    let boost = 0;
    // Points signal
    if (avgPoints >= 400) boost += 10;
    else if (avgPoints >= 200) boost += 7;
    else if (avgPoints >= 100) boost += 5;
    else if (avgPoints >= 50) boost += 3;
    else boost += 1;
    // Volume signal (community discussion depth)
    if (totalComments >= 500) boost += 5;
    else if (totalComments >= 200) boost += 3;
    else if (totalComments >= 50) boost += 1;
    return Math.min(boost, 15); // cap at +15
  })();


  // Post-fetch relevance filter — keep only results matching the domain keywords
  const matchesKeywords = (text: string) =>
    domainKeywords.length === 0 ||
    domainKeywords.some((kw) => text.toLowerCase().includes(kw.toLowerCase()));

  const relevantHnPosts = hnPosts.filter((p) =>
    matchesKeywords(p.title ?? "") || matchesKeywords(p.url ?? "")
  );

  return (
    <>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:none; } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes scanCardIn { from { opacity:0; transform:translateY(20px) scale(0.98); } to { opacity:1; transform:none; } }
        @keyframes stepIn { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:none; } }
        @keyframes checkPop { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.2)} 100%{transform:scale(1);opacity:1} }
        ::placeholder { color: var(--clr-placeholder) !important; }
        * { box-sizing: border-box; }
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
              <button onClick={fullReset} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}>
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
              </button>
              <Link href="/how-it-works" style={{
                fontSize: "0.8125rem", fontWeight: 600, color: "var(--clr-text-5)",
                textDecoration: "none", letterSpacing: "-0.01em",
                transition: "color 0.15s",
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#a0a0c8"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--clr-text-5)"; }}
              >
                How it works
              </Link>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {hasResults && currentTool && (
                <>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "0.25rem 0.75rem 0.25rem 0.5rem",
                    borderRadius: 999, background: `rgba(${currentTool.accentRgb},0.08)`,
                    border: `1px solid rgba(${currentTool.accentRgb},0.2)`,
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: currentTool.accentColor, animation: loading ? "pulse 1.2s infinite" : "none" }} />
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: currentTool.accentColor }}>{currentTool.name}</span>
                  </div>
                  <button
                    onClick={backToTools}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "0.375rem 0.875rem", borderRadius: 9,
                      background: "rgba(255,255,255,0.04)", border: "1px solid var(--clr-border)",
                      color: "var(--clr-text-3)", fontSize: "0.8125rem", fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    ← New analysis
                  </button>
                </>
              )}
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                style={{
                  width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center",
                  justifyContent: "center", background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--clr-border)", cursor: "pointer", flexShrink: 0,
                }}
              >
                {light ? (
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <circle cx="7.5" cy="7.5" r="3" stroke="#7070a0" strokeWidth="1.5" />
                    <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3.1 3.1l1.06 1.06M10.84 10.84l1.06 1.06M3.1 11.9l1.06-1.06M10.84 4.16l1.06-1.06" stroke="#7070a0" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M12.5 9A6 6 0 0 1 5 1.5a6 6 0 1 0 7.5 7.5z" stroke="#7070a0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* ── Main ── */}
        <main style={{ maxWidth: 1400, margin: "0 auto", width: "100%", padding: "0 2.5rem", flex: 1, display: "flex", flexDirection: "column" }}>

          {/* ── Scanning overlay ── */}
          {scanStep >= 0 ? (() => {
            const SCAN_STEPS_MAP: Record<string, { label: string; icon: React.ReactNode }[]> = {
              "trend-feed": [
                { label: "Scanning GitHub",        icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg> },
                { label: "Scanning Hacker News",   icon: <svg width="15" height="15" viewBox="0 0 18 18" fill="currentColor"><path d="M9 1l2.2 6.8H18l-5.6 4.1 2.1 6.5L9 14.3l-5.5 4.1 2.1-6.5L0 7.8h6.8L9 1z"/></svg> },
                { label: "Analyzing with AI",      icon: <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M10 2l1.8 5.4H17l-4.2 3.1 1.6 5-4.4-3.2L5.6 15.5l1.6-5L3 7.4h5.2L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
              ],
              "gap-analysis": [
                { label: "Analyzing with AI",      icon: <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M10 2l1.8 5.4H17l-4.2 3.1 1.6 5-4.4-3.2L5.6 15.5l1.6-5L3 7.4h5.2L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
                { label: "Searching App Store",    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg> },
                { label: "Searching Google Play",  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.04c.29.12.62.18.97.18.49 0 .97-.14 1.42-.42l.02-.01 1.73-1.01L17.63 22c1.07 0 2.01-.56 2.56-1.43l-9.6-5.55-7.4 8.02zm-.63-1.73l7.22-7.83L2.35 8.7c-.22.44-.35.94-.35 1.48V19.82c0 .6.18 1.15.55 1.49zm17.8-3.38c.59-.36 1.03-.94 1.2-1.63l.01-.04.04-.18c.06-.3.1-.63.1-.97v-.52l-.01-.03c-.05-.63-.32-1.18-.72-1.59L17.7 11.3l-2.87 3.12 5.52 3.51zm-.3-10.2L7.36 1.37 4.57 2.99 14.83 11.3l5.22-3.57z"/></svg> },
              ],
              "competitor-radar": [
                { label: "Analyzing with AI",      icon: <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M10 2l1.8 5.4H17l-4.2 3.1 1.6 5-4.4-3.2L5.6 15.5l1.6-5L3 7.4h5.2L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
              ],
              "stack-advisor": [
                { label: "Analyzing with AI",      icon: <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M10 2l1.8 5.4H17l-4.2 3.1 1.6 5-4.4-3.2L5.6 15.5l1.6-5L3 7.4h5.2L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
              ],
            };
            const SCAN_STEPS = SCAN_STEPS_MAP[selectedTool ?? "trend-feed"] ?? SCAN_STEPS_MAP["trend-feed"];
            return (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 0" }}>
                <div style={{
                  background: "var(--clr-surface)", border: "1px solid var(--clr-border)",
                  borderRadius: 24, padding: "2.5rem 3rem", width: "100%", maxWidth: 420,
                  animation: "scanCardIn 0.35s cubic-bezier(0.16,1,0.3,1)",
                  boxShadow: currentTool ? `0 0 0 1px rgba(${currentTool.accentRgb},0.08), 0 24px 64px rgba(0,0,0,0.25)` : "0 24px 64px rgba(0,0,0,0.25)",
                }}>
                  {/* Header */}
                  <div style={{ marginBottom: "2rem", textAlign: "center" }}>
                    {currentTool && (
                      <div style={{
                        width: 48, height: 48, borderRadius: 14, margin: "0 auto 1rem",
                        background: `rgba(${currentTool.accentRgb},0.1)`,
                        border: `1px solid rgba(${currentTool.accentRgb},0.25)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {TOOL_ICONS[currentTool.id](currentTool.accentColor)}
                      </div>
                    )}
                    <h2 style={{ fontSize: "1.125rem", fontWeight: 750, color: "var(--clr-text)", letterSpacing: "-0.025em", margin: "0 0 0.375rem" }}>
                      Gathering intelligence…
                    </h2>
                    <p style={{ fontSize: "0.8rem", color: "var(--clr-text-5)", margin: 0, lineHeight: 1.5, maxWidth: 280, marginInline: "auto", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {idea}
                    </p>
                  </div>

                  {/* Steps */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                    {SCAN_STEPS.map((step, i) => {
                      const isDone   = i < scanStep || scanStep === 4;
                      const isActive = i === scanStep && scanStep < 4;
                      const isPend   = !isDone && !isActive;
                      return (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: "0.875rem",
                          padding: "0.625rem 0.75rem", borderRadius: 12,
                          background: isActive ? `rgba(${currentTool?.accentRgb ?? "124,92,252"},0.05)` : "transparent",
                          transition: "background 0.3s",
                          animation: i <= scanStep ? `stepIn 0.3s ease ${i === scanStep ? 0 : 0}ms both` : "none",
                        }}>
                          {/* Icon slot */}
                          <div style={{ width: 26, height: 26, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {isDone ? (
                              <div style={{
                                width: 22, height: 22, borderRadius: "50%",
                                background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.35)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                animation: "checkPop 0.35s cubic-bezier(0.16,1,0.3,1)",
                              }}>
                                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                                  <path d="M2 5.5l2.5 2.5 4.5-5" stroke="#34d399" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </div>
                            ) : isActive ? (
                              <div style={{ width: 22, height: 22, borderRadius: "50%", border: `1.5px solid rgba(${currentTool?.accentRgb ?? "124,92,252"},0.3)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: currentTool?.accentColor ?? "#7c5cfc", animation: "pulse 1s ease-in-out infinite" }} />
                              </div>
                            ) : (
                              <div style={{ width: 22, height: 22, borderRadius: "50%", border: "1.5px solid var(--clr-border)" }} />
                            )}
                          </div>

                          {/* Source icon */}
                          <span style={{ color: isDone ? "#34d399" : isActive ? (currentTool?.accentColor ?? "#7c5cfc") : "var(--clr-text-7)", transition: "color 0.3s", flexShrink: 0 }}>
                            {step.icon}
                          </span>

                          {/* Label */}
                          <span style={{
                            fontSize: "0.9375rem", fontWeight: isActive ? 600 : 500,
                            color: isDone ? "var(--clr-text-2)" : isActive ? "var(--clr-text)" : "var(--clr-text-7)",
                            transition: "color 0.3s", flex: 1,
                          }}>
                            {step.label}
                            {isActive && <span style={{ animation: "blink 1.1s step-end infinite" }}>…</span>}
                          </span>

                          {/* Done tag */}
                          {isDone && (
                            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#34d399", letterSpacing: "0.04em", animation: "checkPop 0.35s ease" }}>
                              done
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })() : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {/* ── Hero ── */}
              {!hasResults && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", maxWidth: 680, margin: "0 auto", width: "100%", padding: "1rem 0" }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "0.25rem 0.75rem", borderRadius: 999, marginBottom: "1rem",
                  background: "rgba(124,92,252,0.07)", border: "1px solid rgba(124,92,252,0.18)",
                  fontSize: "0.625rem", color: "#9d7dfc", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#7c5cfc", display: "inline-block", animation: "pulse 2.5s infinite" }} />
                  Market Intelligence, Unfiltered
                </div>
                <h1 style={{
                  fontSize: "clamp(2.25rem, 3.3vw, 3rem)", fontWeight: 800,
                  letterSpacing: "-0.035em", lineHeight: 1.1,
                  color: "var(--clr-text)", marginBottom: "0.75rem",
                }}>
                  <span style={{ color: "var(--clr-text-5)" }}>Claude says your idea is great.</span>
                  <br />
                  <span className="gradient-text">We&apos;ll tell you the truth.</span>
                </h1>
                <p style={{ color: "var(--clr-text-5)", fontSize: "0.9375rem", lineHeight: 1.6, maxWidth: 480, margin: "0 auto" }}>
                  Pick your situation. Get a real analysis — competitors, market gaps, trends, or tech stack — powered by Claude Opus.
                </p>
              </div>
              )}

              {/* ── Tool selector grid ── */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "1rem",
                paddingBottom: "2rem",
              }}>
                {TOOLS.filter((t) => t.id !== "competitor-radar").map((tool) => (
                  <ToolSelectorCard
                    key={tool.id}
                    tool={tool}
                    isSelected={selectedTool === tool.id}
                    isOtherSelected={selectedTool !== null && selectedTool !== tool.id}
                    onClick={() => handleSelectTool(tool.id)}
                  />
                ))}
              </div>

              {/* ── Input section (appears on tool selection) ── */}
              {selectedTool && currentTool && (
                <div ref={inputSectionRef}>
                  <InputSection
                    tool={currentTool}
                    idea={idea}
                    setIdea={setIdea}
                    budget={budget}
                    setBudget={setBudget}
                    techLevel={techLevel}
                    setTechLevel={setTechLevel}
                    onSubmit={handleSubmit}
                    loading={loading}
                    textareaRef={textareaRef}
                  />
                </div>
              )}
              {/* ── Results — inline below input ── */}
              {hasResults && (
              <div ref={resultsRef} style={{ paddingTop: "1.5rem", paddingBottom: "5rem", animation: "fadeSlideIn 0.3s ease" }}>

              {/* ── Compact query bar ── */}
              {currentTool && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "0.75rem 1rem 0.75rem 0.875rem",
                  background: "var(--clr-surface)", border: "1px solid var(--clr-border)",
                  borderRadius: 16, marginBottom: "1.25rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}>
                  {/* Tool icon */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: `rgba(${currentTool.accentRgb},0.1)`,
                    border: `1px solid rgba(${currentTool.accentRgb},0.2)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {TOOL_ICONS[currentTool.id](currentTool.accentColor)}
                  </div>

                  {/* Query */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, color: currentTool.accentColor, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 1 }}>
                      {currentTool.name}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "var(--clr-text-2)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {idea}
                      {selectedTool === "stack-advisor" && (
                        <span style={{ color: "var(--clr-text-6)", fontWeight: 400 }}>
                          {" · "}{budget}{" · "}{techLevel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={backToTools}
                      style={{
                        padding: "0.375rem 0.875rem", borderRadius: 9,
                        background: `rgba(${currentTool.accentRgb},0.08)`,
                        border: `1px solid rgba(${currentTool.accentRgb},0.2)`,
                        color: currentTool.accentColor, fontSize: "0.775rem", fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit", letterSpacing: "-0.01em",
                      }}
                    >
                      New analysis
                    </button>
                    <button
                      onClick={fullReset}
                      style={{
                        padding: "0.375rem 0.875rem", borderRadius: 9,
                        background: "transparent", border: "1px solid var(--clr-border)",
                        color: "var(--clr-text-4)", fontSize: "0.775rem", fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      Switch tool
                    </button>
                  </div>
                </div>
              )}

              {/* ── Data source badges + cache badge ── */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
                {currentTool && <DataSourceBadges sources={currentTool.sources} noMargin />}
                {resultCached !== null && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "0.2rem 0.65rem", borderRadius: 999,
                    background: resultCached ? "rgba(96,165,250,0.08)" : "rgba(52,211,153,0.08)",
                    border: `1px solid ${resultCached ? "rgba(96,165,250,0.25)" : "rgba(52,211,153,0.25)"}`,
                    fontSize: "0.68rem", fontWeight: 600,
                    color: resultCached ? "#60a5fa" : "#34d399",
                    flexShrink: 0,
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: resultCached ? "#60a5fa" : "#34d399",
                      animation: resultCached ? "none" : "pulse 2s ease-in-out infinite",
                    }} />
                    {resultCached ? "Cached result" : "Live result"}
                  </span>
                )}
              </div>

              {/* ── Space Temperature score card (Trend Feed only) — always shown ── */}
              {selectedTool === "trend-feed" && (
                scoreData ? (
                  <SpaceScoreCard
                    score={Math.min(100, scoreData.score + hnBoost)}
                    label={scoreData.label}
                    summary={scoreData.summary}
                    hnBoost={hnBoost}
                  />
                ) : (
                  <div style={{
                    background: "var(--clr-surface)", border: "1px solid var(--clr-border)",
                    borderRadius: 20, padding: "1.5rem 1.75rem", marginBottom: "1rem",
                    display: "flex", alignItems: "center", gap: "1.75rem",
                  }}>
                    <div className="shimmer" style={{ width: 92, height: 92, borderRadius: "50%", flexShrink: 0 }} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div className="shimmer" style={{ height: 14, borderRadius: 6, width: "40%" }} />
                      <div className="shimmer" style={{ height: 12, borderRadius: 6, width: "85%" }} />
                      <div className="shimmer" style={{ height: 12, borderRadius: 6, width: "65%" }} />
                    </div>
                  </div>
                )
              )}

              {/* Loading skeleton — only while nothing has streamed yet */}
              {loading && (selectedTool === "gap-analysis" || selectedTool === "stack-advisor") && <GapAnalysisSkeleton />}
              {loading && selectedTool !== "gap-analysis" && selectedTool !== "stack-advisor" && sections.length === 0 && currentTool && <LoadingSkeleton tool={currentTool} />}

              {/* Error */}
              {error && (
                <div style={{
                  padding: "1rem 1.25rem", borderRadius: 12,
                  background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
                  color: "#f87171", fontSize: "0.875rem",
                }}>
                  {error}
                </div>
              )}

              {/* Gap Analysis: structured visual report */}
              {selectedTool === "gap-analysis" && !loading && streamedContent ? (
                (() => {
                  const gapData = parseGapAnalysisJSON(streamedContent);
                  if (gapData) return <GapAnalysisResult data={gapData} />;
                  return sections.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {sections.map((s, i) => (
                        <SectionCard key={i} section={s} showCursor={false} />
                      ))}
                    </div>
                  ) : (
                    <div className="section-card" style={{ textAlign: "center", color: "var(--clr-text-6)", fontSize: "0.875rem", padding: "1.5rem" }}>
                      No analysis data found for this niche
                    </div>
                  );
                })()
              ) : selectedTool === "stack-advisor" && !loading && streamedContent ? (
                (() => {
                  const stackData = parseStackAdvisorJSON(streamedContent);
                  if (stackData) return <StackAdvisorResult data={stackData} />;
                  return sections.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {sections.map((s, i) => (
                        <SectionCard key={i} section={s} showCursor={false} />
                      ))}
                    </div>
                  ) : (
                    <div className="section-card" style={{ textAlign: "center", color: "var(--clr-text-6)", fontSize: "0.875rem", padding: "1.5rem" }}>
                      No stack recommendation found
                    </div>
                  );
                })()
              ) : selectedTool !== "gap-analysis" && selectedTool !== "stack-advisor" ? (
                /* All other tools: markdown section cards */
                sections.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {sections.map((s, i) => (
                      <SectionCard key={i} section={s} showCursor={s.isLast && loading} />
                    ))}
                  </div>
                ) : !loading && streamedContent ? (
                  <div className="section-card" style={{ textAlign: "center", color: "var(--clr-text-6)", fontSize: "0.875rem", padding: "1.5rem" }}>
                    No analysis sections found for this niche
                  </div>
                ) : null
              ) : null}

              {/* ── App Stores (Gap Analysis only) — unified merged list ── */}
              {selectedTool === "gap-analysis" && (() => {
                const storesLoading = (itunesLoading || !itunesFetched) && (gplayLoading || !gplayFetched);
                const anyLoading = (itunesLoading || !itunesFetched) || (gplayLoading || !gplayFetched);
                const merged = mergeStoreApps(itunesApps, gplayApps);
                const totalFound = itunesTotal + gplayTotal;
                const totalRatings = merged.reduce((s, a) => s + a.totalRatings, 0);
                return (
                <div className="section-card" style={{ marginTop: "1rem" }}>
                  <div className="section-card-header">
                    <div className="section-icon" style={{ background: "rgba(124,92,252,0.1)", border: "1px solid rgba(124,92,252,0.2)" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="#7c5cfc">
                        <path d="M17 1H7c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 18H7V5h10v14zm-5 3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                      </svg>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span className="section-title">Existing Apps</span>
                      <span style={{ fontSize: "0.62rem", color: "var(--clr-text-7)", fontWeight: 500 }}>
                        Showing top results · ranked by ratings
                      </span>
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                      <span style={{
                        fontSize: "0.58rem", fontWeight: 700, padding: "0.1rem 0.45rem",
                        borderRadius: 999, background: "rgba(0,122,255,0.08)", color: "#007AFF",
                        border: "1px solid rgba(0,122,255,0.2)",
                      }}>App Store</span>
                      <span style={{
                        fontSize: "0.58rem", fontWeight: 700, padding: "0.1rem 0.45rem",
                        borderRadius: 999, background: "rgba(52,168,83,0.08)", color: "#34a853",
                        border: "1px solid rgba(52,168,83,0.2)",
                      }}>Google Play</span>
                    </div>
                  </div>

                  {storesLoading ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {[1, 2, 3].map((n) => (
                        <div key={n} className="shimmer" style={{ height: 72, borderRadius: 10 }} />
                      ))}
                    </div>
                  ) : merged.length === 0 && !anyLoading ? (
                    <div style={{ padding: "0.75rem 0", fontSize: "0.825rem", color: "var(--clr-text-6)", textAlign: "center" }}>
                      No existing apps found in this niche — open opportunity
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {/* Headline stats */}
                      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.25rem" }}>
                        <div style={{
                          flex: 1, padding: "0.625rem 0.875rem", borderRadius: 10,
                          background: "rgba(124,92,252,0.06)", border: "1px solid rgba(124,92,252,0.15)",
                          textAlign: "center",
                        }}>
                          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#7c5cfc", lineHeight: 1 }}>{totalFound}</div>
                          <div style={{ fontSize: "0.62rem", color: "var(--clr-text-6)", fontWeight: 600, marginTop: 3 }}>apps found</div>
                        </div>
                        <div style={{
                          flex: 1, padding: "0.625rem 0.875rem", borderRadius: 10,
                          background: "rgba(124,92,252,0.06)", border: "1px solid rgba(124,92,252,0.15)",
                          textAlign: "center",
                        }}>
                          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#7c5cfc", lineHeight: 1 }}>{totalRatings.toLocaleString()}</div>
                          <div style={{ fontSize: "0.62rem", color: "var(--clr-text-6)", fontWeight: 600, marginTop: 3 }}>total ratings</div>
                        </div>
                        <div style={{
                          flex: 1, padding: "0.625rem 0.875rem", borderRadius: 10,
                          background: "rgba(124,92,252,0.06)", border: "1px solid rgba(124,92,252,0.15)",
                          textAlign: "center",
                        }}>
                          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#7c5cfc", lineHeight: 1 }}>{merged.length}</div>
                          <div style={{ fontSize: "0.62rem", color: "var(--clr-text-6)", fontWeight: 600, marginTop: 3 }}>unique apps</div>
                        </div>
                      </div>

                      {anyLoading && (
                        <div className="shimmer" style={{ height: 72, borderRadius: 10 }} />
                      )}

                      {/* Merged app cards */}
                      {merged.map((app) => (
                        <div
                          key={app.name}
                          style={{
                            display: "flex", alignItems: "flex-start", gap: "0.875rem",
                            padding: "0.75rem 0.875rem", borderRadius: 10,
                            background: "var(--clr-bg)", border: "1px solid var(--clr-border)",
                          }}
                        >
                          {app.icon && (
                            <img src={app.icon} alt="" width={44} height={44} style={{ borderRadius: 10, flexShrink: 0 }} />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "0.2rem", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--clr-text)", lineHeight: 1.3 }}>
                                {app.name}
                              </span>
                              <span style={{
                                fontSize: "0.6rem", fontWeight: 700, padding: "0.1rem 0.4rem",
                                borderRadius: 999, background: "rgba(124,92,252,0.08)", color: "#7c5cfc", flexShrink: 0,
                              }}>
                                {app.price}
                              </span>
                              {/* Platform badges */}
                              {app.platforms.ios && (
                                <a href={app.platforms.ios.url} target="_blank" rel="noopener noreferrer"
                                  style={{
                                    fontSize: "0.55rem", fontWeight: 700, padding: "0.08rem 0.4rem",
                                    borderRadius: 999, background: "rgba(0,122,255,0.08)", color: "#007AFF",
                                    border: "1px solid rgba(0,122,255,0.2)", textDecoration: "none", flexShrink: 0,
                                  }}>
                                  App Store
                                </a>
                              )}
                              {app.platforms.android && (
                                <a href={app.platforms.android.url} target="_blank" rel="noopener noreferrer"
                                  style={{
                                    fontSize: "0.55rem", fontWeight: 700, padding: "0.08rem 0.4rem",
                                    borderRadius: 999, background: "rgba(52,168,83,0.08)", color: "#34a853",
                                    border: "1px solid rgba(52,168,83,0.2)", textDecoration: "none", flexShrink: 0,
                                  }}>
                                  Google Play
                                </a>
                              )}
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.25rem" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg key={star} width="11" height="11" viewBox="0 0 18 18" fill={star <= Math.round(app.rating) ? "#FFB800" : "var(--clr-border)"}>
                                    <path d="M9 1l2.2 6.8H18l-5.6 4.1 2.1 6.5L9 14.3l-5.5 4.1 2.1-6.5L0 7.8h6.8L9 1z"/>
                                  </svg>
                                ))}
                                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--clr-text-4)", marginLeft: 2 }}>
                                  {app.rating > 0 ? app.rating.toFixed(1) : "—"}
                                </span>
                              </div>
                              <span style={{ fontSize: "0.68rem", color: "var(--clr-text-6)" }}>
                                {app.totalRatings.toLocaleString()} ratings
                              </span>
                            </div>

                            <p style={{
                              fontSize: "0.75rem", color: "var(--clr-text-5)", lineHeight: 1.5,
                              margin: 0, overflow: "hidden", display: "-webkit-box",
                              WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                            }}>
                              {app.description}
                            </p>

                            {app.genres.length > 0 && (
                              <div style={{ display: "flex", gap: 4, marginTop: "0.35rem", flexWrap: "wrap" }}>
                                {app.genres.slice(0, 3).map((g) => (
                                  <span key={g} style={{
                                    fontSize: "0.58rem", padding: "0.05rem 0.4rem", borderRadius: 999,
                                    background: "var(--clr-bg)", border: "1px solid var(--clr-border)",
                                    color: "var(--clr-text-6)", fontWeight: 500,
                                  }}>
                                    {g}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                );
              })()}

              {/* ── Hacker News Buzz (Trend Feed only) — always shown ── */}
              {selectedTool === "trend-feed" && (
                <div className="section-card" style={{ marginTop: "1rem" }}>
                  <div className="section-card-header">
                    <div className="section-icon" style={{ background: "rgba(255,102,0,0.1)", border: "1px solid rgba(255,102,0,0.2)" }}>
                      <svg width="15" height="15" viewBox="0 0 18 18" fill="#ff6600"><path d="M9 1l2.2 6.8H18l-5.6 4.1 2.1 6.5L9 14.3l-5.5 4.1 2.1-6.5L0 7.8h6.8L9 1z"/></svg>
                    </div>
                    <span className="section-title">Hacker News Buzz</span>
                    <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "var(--clr-text-7)", fontWeight: 500 }}>
                      last 30 days · by score
                    </span>
                  </div>

                  {(hnLoading || !hnFetched) ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {[1, 2, 3].map((n) => (
                        <div key={n} className="shimmer" style={{ height: 60, borderRadius: 10 }} />
                      ))}
                    </div>
                  ) : relevantHnPosts.length === 0 ? (
                    <div style={{ padding: "0.75rem 0", fontSize: "0.825rem", color: "var(--clr-text-6)", textAlign: "center" }}>
                      No relevant Hacker News discussions found for this niche
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                      {relevantHnPosts.map((post) => {
                        const daysAgo = Math.floor((Date.now() - new Date(post.created_at).getTime()) / 86400000);
                        const hnUrl = `https://news.ycombinator.com/item?id=${post.objectID}`;
                        const heat =
                          post.points >= 400 ? { label: "🔥 High Activity", color: "#f97316", bg: "rgba(249,115,22,0.1)" } :
                          post.points >= 150 ? { label: "📈 Growing", color: "#34d399", bg: "rgba(52,211,153,0.1)" } :
                          { label: "⚡ Emerging", color: "#60a5fa", bg: "rgba(96,165,250,0.1)" };

                        return (
                          <div key={post.objectID} style={{
                            display: "flex", alignItems: "flex-start", gap: "0.875rem",
                            padding: "0.75rem 0.875rem", borderRadius: 10,
                            background: "var(--clr-bg)", border: "1px solid var(--clr-border)",
                            transition: "border-color 0.15s",
                          }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,102,0,0.35)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--clr-border)"; }}
                          >
                            {/* Score column */}
                            <div style={{
                              flexShrink: 0, width: 44, display: "flex", flexDirection: "column",
                              alignItems: "center", gap: 2, paddingTop: 2,
                            }}>
                              <svg width="12" height="12" viewBox="0 0 18 18" fill="#ff6600"><path d="M9 1l2.2 6.8H18l-5.6 4.1 2.1 6.5L9 14.3l-5.5 4.1 2.1-6.5L0 7.8h6.8L9 1z"/></svg>
                              <span style={{ fontSize: "1rem", fontWeight: 800, color: "#ff6600", lineHeight: 1 }}>
                                {post.points.toLocaleString()}
                              </span>
                              <span style={{ fontSize: "0.6rem", color: "var(--clr-text-7)", fontWeight: 500 }}>pts</span>
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: "0.3rem", flexWrap: "wrap" }}>
                                <span style={{
                                  display: "inline-flex", alignItems: "center",
                                  padding: "0.1rem 0.45rem", borderRadius: 999,
                                  background: heat.bg, color: heat.color,
                                  fontSize: "0.62rem", fontWeight: 700, flexShrink: 0,
                                }}>
                                  {heat.label}
                                </span>
                              </div>
                              <a
                                href={post.url ?? hnUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: "0.875rem", fontWeight: 600, color: "var(--clr-text)",
                                  textDecoration: "none", lineHeight: 1.45, display: "block",
                                }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#ff6600"; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--clr-text)"; }}
                              >
                                {post.title}
                              </a>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: "0.35rem" }}>
                                <a
                                  href={hnUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: "flex", alignItems: "center", gap: 4,
                                    fontSize: "0.7rem", color: "var(--clr-text-6)", textDecoration: "none", fontWeight: 500,
                                  }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#ff6600"; }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--clr-text-6)"; }}
                                >
                                  <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
                                    <path d="M10 2c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 13H9v-5h2v5zm0-7H9V6h2v2z" fill="currentColor"/>
                                  </svg>
                                  {post.num_comments} comments
                                </a>
                                <span style={{ fontSize: "0.7rem", color: "var(--clr-text-7)" }}>
                                  {daysAgo === 0 ? "today" : `${daysAgo}d ago`}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}


              {/* ── GitHub trending repos (Trend Feed only) — always shown ── */}
              {selectedTool === "trend-feed" && (
                <div className="section-card" style={{ marginTop: "1rem" }}>
                  <div className="section-card-header">
                    <div className="section-icon" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path fillRule="evenodd" clipRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" fill="#34d399" />
                      </svg>
                    </div>
                    <span className="section-title">🐙 What developers are building right now</span>
                    <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "var(--clr-text-7)", fontWeight: 500 }}>
                      GitHub · last 7 days · by stars
                    </span>
                  </div>

                  {(githubLoading || !githubFetched) ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
                      {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="shimmer" style={{ height: 90, borderRadius: 10 }} />
                      ))}
                    </div>
                  ) : githubRepos.length === 0 ? (
                    <div style={{ padding: "0.75rem 0", fontSize: "0.825rem", color: "var(--clr-text-6)", textAlign: "center" }}>
                      No relevant GitHub repositories found for this niche
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.625rem" }}>
                      {githubRepos.map((repo) => {
                        const daysAgo = Math.floor((Date.now() - new Date(repo.created_at).getTime()) / 86400000);
                        return (
                          <a
                            key={repo.id}
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "flex", flexDirection: "column", gap: "0.5rem",
                              padding: "0.875rem 1rem", borderRadius: 12,
                              background: "var(--clr-bg)", border: "1px solid var(--clr-border)",
                              textDecoration: "none", transition: "border-color 0.15s, transform 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = "rgba(52,211,153,0.45)";
                              e.currentTarget.style.transform = "translateY(-1px)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "var(--clr-border)";
                              e.currentTarget.style.transform = "none";
                            }}
                          >
                            {/* Repo name row */}
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#34d399", letterSpacing: "-0.01em", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {repo.full_name}
                              </span>
                              {repo.language && (
                                <span style={{
                                  fontSize: "0.6rem", fontWeight: 700, padding: "0.1rem 0.45rem",
                                  borderRadius: 999, background: "rgba(52,211,153,0.12)",
                                  color: "#34d399", letterSpacing: "0.03em", flexShrink: 0,
                                }}>
                                  {repo.language}
                                </span>
                              )}
                            </div>

                            {/* Description */}
                            {repo.description && (
                              <p style={{
                                fontSize: "0.78rem", color: "var(--clr-text-4)", lineHeight: 1.5,
                                margin: 0, flex: 1,
                                overflow: "hidden", display: "-webkit-box",
                                WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                              }}>
                                {repo.description}
                              </p>
                            )}

                            {/* Meta row */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.775rem", fontWeight: 700, color: "var(--clr-text-3)" }}>
                                <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
                                  <path d="M6.5 1l1.545 3.13 3.455.502-2.5 2.436.59 3.44L6.5 8.885l-3.09 1.623.59-3.44L1.5 4.632l3.455-.502L6.5 1z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
                                </svg>
                                {repo.stargazers_count.toLocaleString()}
                              </div>
                              <span style={{ fontSize: "0.68rem", color: "var(--clr-text-7)", fontWeight: 500 }}>
                                {daysAgo === 0 ? "today" : `${daysAgo}d ago`}
                              </span>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Footer ── */}
              {!loading && streamedContent && (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--clr-border-deep)",
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "0.75rem", color: "var(--clr-text-7)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", display: "inline-block" }} />
                    Analysis complete
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={backToTools}
                      style={{
                        padding: "0.5rem 1rem", borderRadius: 10,
                        background: "transparent", border: "1px solid var(--clr-border)",
                        color: "var(--clr-text-4)", fontSize: "0.8125rem", fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      Try another idea
                    </button>
                    <button
                      onClick={fullReset}
                      style={{
                        padding: "0.5rem 1rem", borderRadius: 10,
                        background: "var(--clr-surface-2)", border: "1px solid var(--clr-border-2)",
                        color: "var(--clr-text-3)", fontSize: "0.8125rem", fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      Switch tool
                    </button>
                  </div>
                </div>
              )}
              </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
