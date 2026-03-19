"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth, UserButton, SignInButton } from "@clerk/nextjs";

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
    accentColor: "var(--clr-accent)",
    accentRgb: "var(--clr-accent-rgb)",
    apiPath: "/api/trend-feed",
    inputLabel: "What space or industry are you curious about?",
    placeholder: 'e.g. "B2B SaaS tools", "consumer health apps", or "creator economy"',
    sources: [
      { name: "Claude AI", color: "var(--clr-text-2)", live: true },
      { name: "App Store", color: "var(--clr-text-3)", live: true },
      { name: "Google Play", color: "var(--clr-text-3)", live: true },
      { name: "Product Hunt", color: "var(--clr-text-3)", live: true },
    ],
  },
  {
    id: "gap-analysis",
    userLabel: "I have an idea",
    name: "Gap Analysis",
    tagline: "Find the gaps before you build",
    description: "Spot what competitors are missing. Get a brutally honest read on where you actually have a shot — before you spend months building the wrong thing.",
    accentColor: "var(--clr-accent)",
    accentRgb: "var(--clr-accent-rgb)",
    apiPath: "/api/analyze",
    inputLabel: "Describe your niche or app idea",
    placeholder: 'e.g. "Project management for freelancers" or "AI writing tool for marketers"',
    sources: [
      { name: "Claude AI", color: "var(--clr-text-2)", live: true },
      { name: "App Store", color: "var(--clr-text-3)", live: true },
      { name: "Google Play", color: "var(--clr-text-3)", live: true },
      { name: "YouTube", color: "var(--clr-text-3)", live: true },
    ],
  },
  {
    id: "competitor-radar",
    userLabel: "I'm already building",
    name: "Competitor Radar",
    tagline: "Know your rivals inside out",
    description: "Deep competitive intelligence on who you're really up against — their strategies, exploitable weaknesses, and exactly how to outmaneuver them.",
    accentColor: "var(--clr-accent)",
    accentRgb: "var(--clr-accent-rgb)",
    apiPath: "/api/radar",
    inputLabel: "Describe what you're building and your main competition",
    placeholder: 'e.g. "I\'m building a Notion alternative for agency teams, competing with Asana and Monday.com"',
    sources: [
      { name: "Claude AI", color: "var(--clr-text-2)", live: true },
    ],
  },
  {
    id: "stack-advisor",
    userLabel: "Help me choose my stack",
    name: "Stack Advisor",
    tagline: "Build fast, cheap, and right",
    description: "Tell us what you're building, your budget, and how technical you are. Get the exact tools, real monthly costs, and a step-by-step build order.",
    accentColor: "var(--clr-accent)",
    accentRgb: "var(--clr-accent-rgb)",
    apiPath: "/api/stack",
    inputLabel: "Describe what you want to build",
    placeholder: 'e.g. "A marketplace for local freelancers with payments and messaging"',
    hasExtras: true,
    sources: [
      { name: "Claude AI", color: "var(--clr-text-2)", live: true },
      { name: "YouTube", color: "var(--clr-text-3)", live: true },
    ],
  },
];

// ── Section metadata (for results cards) ──────────────────────
const SECTION_META: Record<string, { bg: string; color: string }> = {
  "🏆": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "😤": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "🕳️":{ bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "⚡": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "🎯": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "⚠️":{ bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "💪": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "🩸": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "📣": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "🗺️":{ bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "⚔️":{ bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "📋": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "📈": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "💀": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "🔥": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "💡": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "🧲": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "🧠": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "🛠️":{ bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "💰": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "🚀": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "🔄": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "🔮": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "🌡️":{ bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
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
      <code style={{ background: "rgba(var(--clr-text-rgb),0.12)", color: "var(--clr-text-3)", padding: "0.1em 0.35em", borderRadius: 4, fontSize: "0.85em" }}>
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
  const meta = SECTION_META[section.emoji] ?? { bg: "rgba(var(--clr-text-rgb),0.1)", color: "var(--clr-text-2)" };
  if (!section.body.trim() && !showCursor) return null;
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
          <span style={{ display: "inline-block", width: 2, height: "1em", background: "var(--clr-accent)", verticalAlign: "middle", borderRadius: 1, animation: "blink 1s step-end infinite", marginLeft: 2 }} />
        )}
      </div>
    </div>
  );
}

// ── Trend Feed Visual Components ─────────────────────────────

function parseBullets(body: string): { title: string; desc: string; badge?: string }[] {
  const lines = body.split("\n").filter((l) => l.trim());
  const bullets: { title: string; desc: string; badge?: string }[] = [];
  for (const line of lines) {
    const clean = line.replace(/^[-*•]\s*/, "").trim();
    if (!clean) continue;
    // Extract badge like **🔥 High Activity** or **📈 Growing**
    const badgeMatch = clean.match(/^\*\*([^*]+)\*\*\s*[-—–:]\s*/);
    const rest = badgeMatch ? clean.slice(badgeMatch[0].length) : clean;
    // Split on **: bold title followed by colon/dash
    const titleMatch = rest.match(/^\*\*([^*]+)\*\*\s*[-—–:]?\s*([\s\S]*)/);
    if (titleMatch) {
      bullets.push({
        title: titleMatch[1].trim(),
        desc: titleMatch[2].trim().replace(/\*\*/g, ""),
        badge: badgeMatch ? badgeMatch[1].trim() : undefined,
      });
    } else {
      // Fallback: whole line as description
      bullets.push({ title: "", desc: clean.replace(/\*\*/g, ""), badge: badgeMatch ? badgeMatch[1].trim() : undefined });
    }
  }
  // Drop items with no meaningful text
  return bullets.filter((b) => b.title || b.desc);
}

function parseNicheBullets(body: string): { title: string; desc: string; score: number }[] {
  const lines = body.split("\n").filter((l) => l.trim());
  const niches: { title: string; desc: string; score: number }[] = [];
  for (const line of lines) {
    const clean = line.replace(/^[-*•]\s*/, "").trim();
    if (!clean) continue;
    const titleMatch = clean.match(/^\*\*([^*]+)\*\*\s*[-—–:]?\s*([\s\S]*)/);
    const title = titleMatch ? titleMatch[1].trim() : "";
    const rest = titleMatch ? titleMatch[2].trim() : clean;
    // Estimate opportunity score from language cues
    const low = /saturated|small|niche|limited/i.test(rest);
    const high = /massive|huge|wide open|untapped|nobody|no one|underserved|acute|real/i.test(rest);
    const score = high ? Math.floor(Math.random() * 2) + 8 : low ? Math.floor(Math.random() * 3) + 3 : Math.floor(Math.random() * 3) + 6;
    niches.push({ title, desc: rest.replace(/\*\*/g, ""), score });
  }
  // Drop items with no meaningful text
  return niches.filter((n) => n.title || n.desc);
}

function TrendRisingSection({ section, isStreaming }: { section: Section; isStreaming: boolean }) {
  const bullets = parseBullets(section.body);
  if (bullets.length === 0 && !isStreaming) return null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
        <span style={{ fontSize: "1.25rem" }}>📈</span>
        <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--clr-text)", margin: 0, letterSpacing: "-0.02em" }}>
          {section.title}
        </h3>
      </div>
      {bullets.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
          {bullets.map((b, i) => {
            return (
              <div key={i} style={{
                background: "var(--clr-surface)",
                border: "1px solid var(--clr-border-2)",
                borderRadius: 12, padding: "1.25rem",
                transition: "border-color 0.15s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--clr-border-3)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--clr-border-2)"; }}
              >
                {b.badge && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "0.2rem 0.6rem", borderRadius: 999,
                    background: "rgba(var(--clr-text-rgb),0.1)", color: "var(--clr-text-2)",
                    fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.04em",
                    marginBottom: "0.625rem",
                  }}>
                    {b.badge}
                  </span>
                )}
                {b.title && (
                  <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--clr-text)", marginBottom: "0.375rem", lineHeight: 1.3, letterSpacing: "-0.01em" }}>
                    {b.title}
                  </div>
                )}
                <div style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", lineHeight: 1.65 }}>
                  {b.desc}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="shimmer" style={{ height: 120, borderRadius: 12 }} />
      )}
    </div>
  );
}

function TrendDyingSection({ section, isStreaming }: { section: Section; isStreaming: boolean }) {
  const bullets = parseBullets(section.body);
  if (bullets.length === 0 && !isStreaming) return null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
        <span style={{ fontSize: "1.25rem" }}>💀</span>
        <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--clr-text)", margin: 0, letterSpacing: "-0.02em" }}>
          {section.title}
        </h3>
      </div>
      {bullets.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
          {bullets.map((b, i) => (
            <div key={i} style={{
              background: "var(--clr-surface)",
              border: "1px solid var(--clr-border-2)",
              borderRadius: 12, padding: "1.25rem",
              transition: "border-color 0.15s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--clr-border-3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--clr-border-2)"; }}
            >
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "0.2rem 0.6rem", borderRadius: 999,
                background: "rgba(var(--clr-text-rgb),0.1)", color: "var(--clr-text-2)",
                fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.04em",
                marginBottom: "0.625rem",
              }}>
                DECLINING
              </span>
              {b.title && (
                <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--clr-text)", marginBottom: "0.375rem", lineHeight: 1.3 }}>
                  {b.title}
                </div>
              )}
              <div style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", lineHeight: 1.65 }}>
                {b.desc}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="shimmer" style={{ height: 120, borderRadius: 12 }} />
      )}
    </div>
  );
}

function TrendNichesSection({ section, isStreaming }: { section: Section; isStreaming: boolean }) {
  const niches = parseNicheBullets(section.body);
  if (niches.length === 0 && !isStreaming) return null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
        <span style={{ fontSize: "1.25rem" }}>💡</span>
        <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--clr-text)", margin: 0, letterSpacing: "-0.02em" }}>
          {section.title}
        </h3>
      </div>
      {niches.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
          {niches.map((n, i) => (
            <div key={i} style={{
              background: "var(--clr-surface)",
              border: "1px solid var(--clr-border-2)",
              borderRadius: 12, padding: "1.25rem",
              transition: "border-color 0.15s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--clr-border-3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--clr-border-2)"; }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem" }}>
                {n.title && (
                  <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--clr-text)", lineHeight: 1.3, flex: 1 }}>
                    {n.title}
                  </div>
                )}
                <div style={{
                  flexShrink: 0, display: "flex", alignItems: "center", gap: 4,
                  padding: "0.25rem 0.625rem", borderRadius: 999,
                  background: "rgba(var(--clr-text-rgb),0.12)",
                }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--clr-text-2)" }}>
                    {n.score}/10
                  </span>
                </div>
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", lineHeight: 1.65 }}>
                {n.desc}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="shimmer" style={{ height: 120, borderRadius: 12 }} />
      )}
    </div>
  );
}

function TrendPatternHero({ section, isStreaming }: { section: Section; isStreaming: boolean }) {
  // Remove leading markdown bold formatting for a clean display
  const body = section.body.replace(/\*\*/g, "").trim();
  if (!body && !isStreaming) return null;
  const firstLine = body.split("\n")[0] || "";
  const rest = body.split("\n").slice(1).join("\n").trim();

  return (
    <div style={{
      background: "var(--clr-surface)",
      border: "1px solid var(--clr-border-2)",
      borderRadius: 12, padding: "2rem 2.25rem", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
          <span style={{ fontSize: "1.5rem" }}>🔥</span>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--clr-text)", margin: 0, letterSpacing: "-0.02em" }}>
            {section.title}
          </h3>
        </div>
        {firstLine && (
          <div style={{
            fontSize: "1.375rem", fontWeight: 800, color: "var(--clr-text)",
            lineHeight: 1.35, marginBottom: rest ? "1rem" : 0,
            letterSpacing: "-0.025em",
          }}>
            {firstLine}
          </div>
        )}
        {rest && (
          <div style={{ fontSize: "0.9375rem", color: "var(--clr-text-2)", lineHeight: 1.75 }}>
            {rest}
          </div>
        )}
        {isStreaming && (
          <span style={{ display: "inline-block", width: 2, height: "1em", background: "var(--clr-accent)", verticalAlign: "middle", borderRadius: 1, animation: "blink 1s step-end infinite", marginLeft: 2 }} />
        )}
      </div>
    </div>
  );
}

function TrendGenericSection({ section, isStreaming, emoji }: {
  section: Section; isStreaming: boolean; emoji: string;
}) {
  const bullets = parseBullets(section.body);
  if (bullets.length === 0 && !section.body.trim() && !isStreaming) return null;

  return (
    <div style={{
      background: "var(--clr-surface)",
      border: "1px solid var(--clr-border-2)",
      borderRadius: 12, padding: "1.75rem 2rem",
    }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
          <span style={{ fontSize: "1.25rem" }}>{emoji}</span>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--clr-text)", margin: 0, letterSpacing: "-0.02em" }}>
            {section.title}
          </h3>
        </div>
        {bullets.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {bullets.map((b, i) => (
              <div key={i} style={{
                padding: "0.875rem 1rem", borderRadius: 12,
                background: "var(--clr-surface)", border: "1px solid var(--clr-border)",
              }}>
                {b.title && (
                  <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--clr-text)", marginBottom: "0.25rem" }}>
                    {b.title}
                  </div>
                )}
                <div style={{ fontSize: "0.8125rem", color: "var(--clr-text-2)", lineHeight: 1.65 }}>
                  {b.desc}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-prose" style={{ color: "var(--clr-text-2)" }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>
              {section.body}
            </ReactMarkdown>
          </div>
        )}
        {isStreaming && (
          <span style={{ display: "inline-block", width: 2, height: "1em", background: "var(--clr-accent)", verticalAlign: "middle", borderRadius: 1, animation: "blink 1s step-end infinite", marginLeft: 2 }} />
        )}
      </div>
    </div>
  );
}

function ThreatDots({ level }: { level: number }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: "50%",
          background: i <= level ? "var(--clr-text)" : "var(--clr-border)",
        }} />
      ))}
    </div>
  );
}

function GapAnalysisResult({ data }: { data: GapAnalysisData }) {
  // Filter out empty items
  data = {
    ...data,
    competitors: data.competitors.filter(c => c.name?.trim()),
    painPoints: data.painPoints.filter(p => p.quote?.trim()),
    marketGaps: data.marketGaps.filter(g => g.title?.trim() || g.description?.trim()),
  };
  const ms = Math.max(0, Math.min(100, data.marketScore));
  const msColor = "var(--clr-text)";
  const msBg = "rgba(var(--clr-text-rgb),0.04)";
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
        borderRadius: 12, padding: "1.5rem 1.75rem",
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
      {data.competitors.length > 0 && <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.625rem" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(var(--clr-text-rgb),0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem" }}>🏆</div>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--clr-text)", margin: 0 }}>Key Competitors</h2>
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
                <div style={{ fontSize: "0.68rem", color: "var(--clr-text-2)", lineHeight: 1.4, paddingLeft: 6, borderLeft: "2px solid rgba(var(--clr-text-rgb),0.3)", flex: 1, minWidth: 0 }}>
                  {c.strengths[0] ?? "—"}
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--clr-text-3)", lineHeight: 1.4, paddingLeft: 6, borderLeft: "2px solid rgba(var(--clr-text-rgb),0.3)", flex: 1, minWidth: 0 }}>
                  {c.weaknesses[0] ?? "—"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>}

      {/* ── PAIN POINTS ── */}
      {data.painPoints.length > 0 && <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.625rem" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(var(--clr-text-rgb),0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem" }}>😤</div>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--clr-text)", margin: 0 }}>Pain Points</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          {data.painPoints.map((p, i) => {
            const sevColor = p.severity === "high" ? "var(--clr-text)" : p.severity === "medium" ? "var(--clr-text-2)" : "var(--clr-text-3)";
            const sevBg = p.severity === "high" ? "rgba(var(--clr-text-rgb),0.12)" : p.severity === "medium" ? "rgba(var(--clr-text-rgb),0.08)" : "rgba(var(--clr-text-rgb),0.08)";
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
      </div>}

      {/* ── MARKET GAPS ── */}
      {data.marketGaps.length > 0 && <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.625rem" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(var(--clr-text-rgb),0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem" }}>🕳️</div>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--clr-text-2)", margin: 0 }}>Market Gaps</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {data.marketGaps.map((g, i) => {
            const statusColor = g.status === "untapped" ? "var(--clr-text)" : g.status === "emerging" ? "var(--clr-text-2)" : "var(--clr-text-3)";
            const statusBg = g.status === "untapped" ? "rgba(var(--clr-text-rgb),0.1)" : g.status === "emerging" ? "rgba(var(--clr-text-rgb),0.08)" : "rgba(var(--clr-text-rgb),0.08)";
            const barColor = g.opportunityScore >= 7 ? "var(--clr-text)" : g.opportunityScore >= 4 ? "var(--clr-text-2)" : "var(--clr-text-5)";
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
      </div>}

      {/* ── SWOT ── */}
      {(data.swot.strengths.length > 0 || data.swot.weaknesses.length > 0 || data.swot.opportunities.length > 0 || data.swot.threats.length > 0) && <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.625rem" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(var(--clr-text-rgb),0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem" }}>⚔️</div>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--clr-text)", margin: 0 }}>SWOT</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          {([
            { key: "strengths" as const, label: "S", full: "Strengths", color: "var(--clr-text-2)", bg: "rgba(var(--clr-text-rgb),0.04)", border: "rgba(var(--clr-text-rgb),0.15)" },
            { key: "weaknesses" as const, label: "W", full: "Weaknesses", color: "var(--clr-text-2)", bg: "rgba(var(--clr-text-rgb),0.04)", border: "rgba(var(--clr-text-rgb),0.15)" },
            { key: "opportunities" as const, label: "O", full: "Opportunities", color: "var(--clr-text-2)", bg: "rgba(var(--clr-text-rgb),0.04)", border: "rgba(var(--clr-text-rgb),0.15)" },
            { key: "threats" as const, label: "T", full: "Threats", color: "var(--clr-text-2)", bg: "rgba(var(--clr-text-rgb),0.04)", border: "rgba(var(--clr-text-rgb),0.15)" },
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
      </div>}

      {/* ── YOUR OPPORTUNITY ── */}
      {data.opportunity.headline && <div style={{
        background: "linear-gradient(135deg, rgba(var(--clr-text-rgb),0.06), rgba(var(--clr-text-rgb),0.03))",
        border: "1px solid rgba(var(--clr-text-rgb),0.2)",
        borderRadius: 12, padding: "1rem 1.125rem",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -30, right: -30, width: 160, height: 160,
          borderRadius: "50%", background: "rgba(var(--clr-text-rgb),0.05)", filter: "blur(50px)", pointerEvents: "none",
        }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.625rem" }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(var(--clr-text-rgb),0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem" }}>⚡</div>
            <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--clr-text)", margin: 0 }}>Your Opportunity</h2>
            {(() => {
              const u = data.opportunity.urgency;
              const uColor = u === "high" ? "var(--clr-text)" : u === "medium" ? "var(--clr-text-2)" : "var(--clr-text-3)";
              const uBg = u === "high" ? "rgba(var(--clr-text-rgb),0.1)" : u === "medium" ? "rgba(var(--clr-text-rgb),0.08)" : "rgba(var(--clr-text-rgb),0.08)";
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
                background: "rgba(var(--clr-text-rgb),0.06)", border: "1px solid rgba(var(--clr-text-rgb),0.15)",
                borderRadius: 10, padding: "0.625rem 0.75rem",
                display: "flex", gap: "0.5rem", alignItems: "flex-start",
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(var(--clr-text-rgb),0.15)", border: "1px solid rgba(var(--clr-text-rgb),0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.65rem", fontWeight: 800, color: "var(--clr-text-2)",
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
      </div>}

      {/* ── IDEAL TARGET CUSTOMER ── */}
      {data.targetCustomer.persona && <div style={{
        background: "var(--clr-surface)", border: "1px solid var(--clr-border)",
        borderRadius: 12, padding: "0.875rem 1rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.75rem" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(var(--clr-text-rgb),0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem" }}>🎯</div>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--clr-text)", margin: 0 }}>Target Customer</h2>
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
          {/* Avatar + identity */}
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: 72 }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "rgba(var(--clr-text-rgb),0.12)", border: "1px solid rgba(var(--clr-text-rgb),0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--clr-text-2)" strokeWidth="1.5" strokeLinecap="round">
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
              <div style={{ fontSize: "0.65rem", color: "var(--clr-text-2)", fontWeight: 600, lineHeight: 1.4 }}>
                💰 {data.targetCustomer.willingnessToPay}
              </div>
            </div>

            {/* Pain points as compact list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: "0.52rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--clr-text-3)" }}>Pains</span>
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
      </div>}
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
            <div key={n} style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 12, padding: "1rem" }}>
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
        {[1,2,3].map(n => <div key={n} className="shimmer" style={{ height: 80, borderRadius: 12, marginBottom: 8 }} />)}
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
function deriveScoreLabel(pct: number): { emoji: string; label: string } {
  if (pct >= 81) return { emoji: "🔥", label: "Explosive" };
  if (pct >= 61) return { emoji: "🟢", label: "Growing" };
  if (pct >= 41) return { emoji: "🟡", label: "Warming Up" };
  if (pct >= 21) return { emoji: "🟠", label: "Crowded" };
  return { emoji: "🔴", label: "Dead Zone" };
}

function SpaceScoreCard({ score, summary, label }: { score: number; summary: string; label?: string }) {
  const pct = Math.max(0, Math.min(100, score));
  const labelEmojiMap: Record<string, string> = {
    "Dead Zone": "🔴", "Uncharted": "🌑", "Fading": "🌫️", "Crowded": "🟠",
    "Warming Up": "🟡", "Growing": "🟢", "Explosive": "🔥",
  };
  const tier = label && labelEmojiMap[label]
    ? { emoji: labelEmojiMap[label], label }
    : deriveScoreLabel(pct);
  const color = "var(--clr-text)";
  const bgColor = "rgba(var(--clr-text-rgb),0.04)";

  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct / 100;
  const offset = circ * 0.25;

  return (
    <div style={{
      background: "var(--clr-surface)", border: `1px solid ${color}40`,
      borderRadius: 12, padding: "1.5rem 1.75rem",
      position: "relative", overflow: "hidden",
      boxShadow: `0 0 0 1px ${color}10, 0 8px 32px ${color}10`,
    }}>
      <div style={{
        position: "absolute", top: -60, right: -60, width: 240, height: 240,
        borderRadius: "50%", background: `${color}0a`, filter: "blur(60px)", pointerEvents: "none",
      }} />
      <div style={{ display: "flex", alignItems: "center", gap: "1.75rem", position: "relative" }}>
        <div style={{ position: "relative", flexShrink: 0, width: 92, height: 92 }}>
          <svg width="92" height="92" viewBox="0 0 92 92" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="46" cy="46" r={r} fill="none" stroke="var(--clr-border)" strokeWidth="7" />
            <circle cx="46" cy="46" r={r} fill="none" stroke={color} strokeWidth="7"
              strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} strokeLinecap="round" />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "1.625rem", fontWeight: 800, color, lineHeight: 1, letterSpacing: "-0.03em" }}>{score}</span>
            <span style={{ fontSize: "0.6rem", color: "var(--clr-text-6)", fontWeight: 600, letterSpacing: "0.04em" }}>/100</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--clr-text-5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Space Temperature
            </span>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "0.175rem 0.6rem", borderRadius: 999,
              background: bgColor, color, fontSize: "0.75rem", fontWeight: 700,
              border: `1px solid ${color}30`,
            }}>
              {tier.emoji} {tier.label}
            </span>
          </div>
          <p style={{ fontSize: "0.9375rem", color: "var(--clr-text-2)", lineHeight: 1.65, margin: 0, fontWeight: 400 }}>
            {summary}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Trend Feed Result ─────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TrendFeedResult({ data }: { data: any }) {
  const a = data?.analysis ?? {};

  const renderBold = (text: string) => {
    if (!text || typeof text !== "string") return text;
    return text.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={j} style={{ color: "var(--clr-text)" }}>{p.slice(2, -2)}</strong>
        : <span key={j}>{p}</span>
    );
  };

  const difficultyColor = (d: string) =>
    d === "Easy" ? "#4ade80" : d === "Hard" ? "#f87171" : "#facc15";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Score Card */}
      <SpaceScoreCard score={a.score ?? 0} summary={a.summary ?? ""} label={a.label} />

      {/* Verdict */}
      {a.verdict && (
        <div style={{
          padding: "1rem 1.25rem", borderRadius: 12,
          background: "var(--clr-surface)", border: "1px solid var(--clr-border-2)",
          fontSize: "1rem", fontWeight: 700, color: "var(--clr-text)",
          textAlign: "center", letterSpacing: "-0.02em",
        }}>
          {a.verdict}
        </div>
      )}

      {/* Rising Sub-categories */}
      {(a.risingSubcategories ?? []).length > 0 && (
        <div style={{
          padding: "1.25rem 1.5rem", borderRadius: 12,
          background: "var(--clr-surface)", border: "1px solid var(--clr-border-2)",
        }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 750, color: "var(--clr-text)", margin: "0 0 0.75rem", letterSpacing: "-0.02em" }}>
            Rising Sub-categories
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "0.5rem" }}>
            {(a.risingSubcategories ?? []).map((sub: any, i: number) => {
              const dirColor = sub.direction === "rising" ? "#4ade80" : sub.direction === "falling" ? "#f87171" : "var(--clr-text-5)";
              const dirIcon = sub.direction === "rising" ? "↑" : sub.direction === "falling" ? "↓" : "→";
              return (
                <div key={i} style={{
                  padding: "0.875rem 1rem", borderRadius: 10,
                  border: "1px solid var(--clr-border-2)",
                  display: "flex", flexDirection: "column", gap: "0.375rem",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--clr-text)" }}>
                      {sub.name}
                    </span>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 3,
                      padding: "0.125rem 0.4rem", borderRadius: 999,
                      background: `${dirColor}18`, border: `1px solid ${dirColor}40`,
                      fontSize: "0.65rem", fontWeight: 700, color: dirColor,
                    }}>
                      {dirIcon} {sub.trendScore ?? 0}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--clr-text-4)", lineHeight: 1.5 }}>
                    {sub.why}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* App Store & Play Wins */}
      {(a.appStoreWins ?? []).length > 0 && (
        <div style={{
          padding: "1.25rem 1.5rem", borderRadius: 12,
          background: "var(--clr-surface)", border: "1px solid var(--clr-border-2)",
        }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 750, color: "var(--clr-text)", margin: "0 0 0.75rem", letterSpacing: "-0.02em" }}>
            App Store Winners
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {(a.appStoreWins ?? []).map((app: any, i: number) => (
              <div key={i} style={{
                padding: "0.875rem 1rem", borderRadius: 10,
                border: "1px solid var(--clr-border-2)",
                display: "flex", alignItems: "center", gap: "0.75rem",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--clr-text)" }}>{app.name}</span>
                    <span style={{
                      fontSize: "0.6rem", fontWeight: 600, padding: "0.1rem 0.4rem",
                      borderRadius: 999, background: "rgba(var(--clr-text-rgb),0.08)",
                      color: "var(--clr-text-4)", textTransform: "uppercase",
                    }}>
                      {app.platform === "googleplay" ? "Google Play" : "App Store"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--clr-text-4)", marginTop: 4 }}>{app.why}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--clr-text)" }}>
                    {"★".repeat(Math.round(app.rating ?? 0))} {(app.rating ?? 0).toFixed(1)}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "var(--clr-text-5)" }}>
                    {(app.reviews ?? 0).toLocaleString()} reviews
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Hunt Wins */}
      {(a.productHuntWins ?? []).length > 0 && (
        <div style={{
          padding: "1.25rem 1.5rem", borderRadius: 12,
          background: "var(--clr-surface)", border: "1px solid var(--clr-border-2)",
        }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 750, color: "var(--clr-text)", margin: "0 0 0.75rem", letterSpacing: "-0.02em" }}>
            Product Hunt Wins
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {(a.productHuntWins ?? []).map((ph: any, i: number) => (
              <div key={i} style={{
                padding: "0.875rem 1rem", borderRadius: 10,
                border: "1px solid var(--clr-border-2)",
                display: "flex", alignItems: "center", gap: "0.75rem",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                  background: "rgba(var(--clr-text-rgb),0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.8rem", fontWeight: 800, color: "var(--clr-text-3)",
                }}>
                  ▲ {ph.votes}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--clr-text)" }}>{ph.name}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--clr-text-5)", marginTop: 2 }}>{ph.tagline}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--clr-text-4)", marginTop: 4 }}>{ph.why}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gap Opportunities */}
      {(a.gapOpportunities ?? []).length > 0 && (
        <div style={{
          padding: "1.25rem 1.5rem", borderRadius: 12,
          background: "var(--clr-surface)", border: "1px solid var(--clr-border-2)",
        }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 750, color: "var(--clr-text)", margin: "0 0 0.75rem", letterSpacing: "-0.02em" }}>
            Gap Opportunities
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {(a.gapOpportunities ?? []).map((gap: any, i: number) => (
              <div key={i} style={{
                padding: "0.875rem 1rem", borderRadius: 10,
                border: "1px solid var(--clr-border-2)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--clr-text)", flex: 1 }}>
                    {renderBold(gap.gap)}
                  </span>
                  <span style={{
                    fontSize: "0.6rem", fontWeight: 700, padding: "0.15rem 0.5rem",
                    borderRadius: 999, color: difficultyColor(gap.difficulty),
                    background: `${difficultyColor(gap.difficulty)}18`,
                    border: `1px solid ${difficultyColor(gap.difficulty)}40`,
                  }}>
                    {gap.difficulty}
                  </span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--clr-text-4)", lineHeight: 1.5 }}>
                  {gap.evidence}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best Opportunity */}
      {a.bestOpportunity && (
        <div style={{
          padding: "1.5rem", borderRadius: 12,
          background: "rgba(var(--clr-text-rgb),0.03)",
          border: "2px solid rgba(var(--clr-text-rgb),0.15)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: -40, right: -40, width: 160, height: 160,
            borderRadius: "50%", background: "rgba(var(--clr-text-rgb),0.03)",
            filter: "blur(40px)", pointerEvents: "none",
          }} />
          <div style={{ position: "relative" }}>
            <div style={{
              fontSize: "0.6rem", fontWeight: 700, color: "var(--clr-text-5)",
              textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem",
            }}>
              Best Opportunity
            </div>
            <h3 style={{
              fontSize: "1.125rem", fontWeight: 800, color: "var(--clr-text)",
              margin: "0 0 1rem", letterSpacing: "-0.025em", lineHeight: 1.3,
            }}>
              {a.bestOpportunity.title}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {[
                { label: "Who", value: a.bestOpportunity.who },
                { label: "What", value: a.bestOpportunity.what },
                { label: "Why Now", value: a.bestOpportunity.why },
                { label: "Distribution", value: a.bestOpportunity.distribution },
              ].map((item, i) => (
                <div key={i} style={{ padding: "0.625rem 0.75rem", borderRadius: 8, background: "var(--clr-surface)", border: "1px solid var(--clr-border-2)" }}>
                  <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--clr-text-5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--clr-text-2)", lineHeight: 1.5 }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
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
        borderRadius: 12,
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.18s ease",
        background: isSelected ? "rgba(var(--clr-text-rgb),0.03)" : "var(--clr-surface)",
        border: isSelected
          ? "1px solid var(--clr-text-6)"
          : hovered && !dim
          ? "1px solid var(--clr-text-6)"
          : "1px solid var(--clr-border-2)",
        boxShadow: isSelected
          ? "0 0 0 3px rgba(var(--clr-text-rgb),0.04)"
          : "none",
        opacity: dim ? 0.35 : 1,
        transform: isSelected ? "translateY(-2px)" : hovered && !dim ? "translateY(-1px)" : "none",
        userSelect: "none",
      }}
    >
      {/* Selected checkmark */}
      {isSelected && (
        <div style={{
          position: "absolute", top: 12, right: 12,
          width: 20, height: 20, borderRadius: 6,
          background: "var(--clr-text)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M2 5.5l2.5 2.5 4.5-5" stroke="var(--clr-bg)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* User label */}
      <div style={{
        fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.06em",
        textTransform: "uppercase", color: tool.accentColor,
        marginBottom: "0.5rem",
      }}>
        {tool.userLabel}
      </div>

      {/* Icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: `rgba(${tool.accentRgb},0.08)`,
        border: `1px solid rgba(${tool.accentRgb},0.15)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: "0.5rem", flexShrink: 0,
      }}>
        {TOOL_ICONS[tool.id](tool.accentColor)}
      </div>

      {/* Name */}
      <div style={{
        fontSize: "1rem", fontWeight: 700, letterSpacing: "-0.02em",
        color: "var(--clr-text)", marginBottom: "0.25rem",
      }}>
        {tool.name}
      </div>

      {/* Tagline */}
      <div style={{
        fontSize: "0.75rem", fontWeight: 500,
        color: "var(--clr-text-3)", marginBottom: "0.5rem",
      }}>
        {tool.tagline}
      </div>

      {/* Description */}
      <p style={{
        fontSize: "0.8125rem", color: "var(--clr-text-4)", lineHeight: 1.6,
        flex: 1, margin: 0,
      }}>
        {tool.description}
      </p>

      {/* Bottom arrow */}
      <div style={{
        marginTop: "0.875rem",
        display: "flex", alignItems: "center", gap: 5,
        fontSize: "0.8125rem", fontWeight: 600,
        color: isSelected ? tool.accentColor : "var(--clr-text-4)",
        transition: "color 0.2s",
      }}>
        {isSelected ? "Selected" : "Open →"}
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
        border: `1px solid var(--clr-border)`,
        borderRadius: 12,
        boxShadow: `0 1px 2px rgba(0,0,0,0.1)`,
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
                        background: budget === opt.id ? "rgba(var(--clr-text-rgb),0.08)" : "transparent",
                        border: budget === opt.id ? "1px solid rgba(var(--clr-text-rgb),0.3)" : "1px solid var(--clr-border)",
                        cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                        transition: "all 0.12s",
                      }}
                    >
                      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: budget === opt.id ? "var(--clr-text)" : "var(--clr-text-3)" }}>{opt.label}</span>
                      <span style={{ fontSize: "0.7rem", color: budget === opt.id ? "var(--clr-text-3)" : "var(--clr-text-6)" }}>{opt.sub}</span>
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
                        background: techLevel === opt.id ? "rgba(var(--clr-text-rgb),0.08)" : "transparent",
                        border: techLevel === opt.id ? "1px solid rgba(var(--clr-text-rgb),0.3)" : "1px solid var(--clr-border)",
                        cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                        transition: "all 0.12s",
                      }}
                    >
                      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: techLevel === opt.id ? "var(--clr-text)" : "var(--clr-text-3)" }}>{opt.label}</span>
                      <span style={{ fontSize: "0.7rem", color: techLevel === opt.id ? "var(--clr-text-3)" : "var(--clr-text-6)" }}>{opt.sub}</span>
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
                padding: "0.5625rem 1.25rem", borderRadius: 8,
                background: canSubmit ? "var(--clr-btn-bg)" : "var(--clr-surface-3)",
                color: canSubmit ? "var(--clr-btn-text)" : "var(--clr-text-8)",
                fontSize: "0.875rem", fontWeight: 600, border: "none",
                cursor: canSubmit ? "pointer" : "not-allowed",
                fontFamily: "inherit", letterSpacing: "-0.01em",
                boxShadow: "none",
                transition: "all 0.15s",
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: 14, height: 14, border: "2px solid rgba(var(--clr-text-rgb),0.3)", borderTopColor: "var(--clr-text)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
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

interface YouTubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
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
  tools: { name: string; purpose: string; price: string; free: boolean; alternatives?: { name: string; reason: string }[] }[];
  costs?: StackPhaseCosts;
}
interface StackMistake { title: string; description: string; }
interface StackScalability { trigger: string; whatBreaks: string; upgradeTo: string; severity: "low" | "medium" | "high"; }
interface StackUpgrade { tool: string; trigger: string; migrateTo: string; }
interface StackAdvisorData {
  headline: string;
  timeToMvp?: string;
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
const PHASE_COLORS = ["var(--clr-text)", "var(--clr-text-2)", "var(--clr-text-3)", "var(--clr-text-5)", "var(--clr-text-6)"];
const PHASE_BGS = ["rgba(var(--clr-text-rgb),0.04)", "rgba(var(--clr-text-rgb),0.04)", "rgba(var(--clr-text-rgb),0.04)", "rgba(var(--clr-text-rgb),0.04)", "rgba(var(--clr-text-rgb),0.04)"];

function StackAdvisorResult({ data, ytVideos }: { data: StackAdvisorData; ytVideos?: YouTubeVideo[] }) {
  // Build a lookup: tool name (lowercased) → best matching YouTube video
  const ytToolMap = new Map<string, YouTubeVideo>();
  if (ytVideos && ytVideos.length > 0) {
    for (const v of ytVideos) {
      const titleLower = v.title.toLowerCase();
      // Check all tool names from all phases
      for (const phase of data.phases) {
        for (const tool of phase.tools) {
          const toolLower = tool.name.toLowerCase();
          if (titleLower.includes(toolLower) && !ytToolMap.has(toolLower)) {
            ytToolMap.set(toolLower, v);
          }
        }
      }
    }
  }
  // Filter out empty phases/items
  data = {
    ...data,
    phases: data.phases.filter(p => p.name?.trim() && p.tools.length > 0),
    mistakes: data.mistakes.filter(m => m.title?.trim() || m.description?.trim()),
    scalability: data.scalability.filter(s => s.trigger?.trim()),
    upgrades: data.upgrades.filter(u => u.tool?.trim()),
    buildOrder: data.buildOrder.filter(b => b.title?.trim() && b.steps.length > 0),
  };
  if (!data.headline && data.phases.length === 0) return null;
  const isPhaseZero = (name: string) => /phase\s*0/i.test(name) || /validate/i.test(name);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── HEADLINE ── */}
      {data.headline && (
        <div style={{
          background: "var(--clr-surface)", border: "1px solid rgba(var(--clr-text-rgb),0.25)",
          borderRadius: 12, padding: "1.25rem 1.5rem",
          borderTop: "3px solid var(--clr-accent)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--clr-text-6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Recommendation
            </span>
            <span style={{
              fontSize: "0.55rem", fontWeight: 700, padding: "0.12rem 0.5rem",
              borderRadius: 999, background: "rgba(var(--clr-text-rgb),0.1)",
              color: "var(--clr-text-2)", border: "1px solid rgba(var(--clr-text-rgb),0.25)",
              letterSpacing: "0.03em",
            }}>
              Pricing verified March 2026
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 600, color: "var(--clr-text)", lineHeight: 1.5, letterSpacing: "-0.01em" }}>
            {data.headline}
          </p>
          {data.timeToMvp && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: "0.5rem" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "3px 10px", borderRadius: 6,
                background: "rgba(var(--clr-text-rgb),0.06)",
                border: "1px solid var(--clr-border-2)",
                fontSize: "0.75rem", fontWeight: 600, color: "var(--clr-text-3)",
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                MVP: {data.timeToMvp}
              </span>
            </div>
          )}
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
            borderRadius: 12, overflow: "hidden",
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
                    background: "rgba(var(--clr-text-rgb),0.15)", color: "var(--clr-text-2)",
                    border: "1px solid rgba(var(--clr-text-rgb),0.35)",
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
                          background: tool.free ? "rgba(var(--clr-text-rgb),0.1)" : "rgba(var(--clr-text-rgb),0.08)",
                          color: tool.free ? "var(--clr-text-2)" : "var(--clr-text-3)",
                          border: `1px solid ${tool.free ? "rgba(var(--clr-text-rgb),0.25)" : "rgba(var(--clr-text-rgb),0.2)"}`,
                        }}>
                          {tool.price}
                        </span>
                        {(() => {
                          const ytMatch = ytToolMap.get(tool.name.toLowerCase());
                          if (!ytMatch) return null;
                          const fmtV = ytMatch.viewCount >= 1_000_000 ? `${(ytMatch.viewCount / 1_000_000).toFixed(1)}M` : ytMatch.viewCount >= 1_000 ? `${(ytMatch.viewCount / 1_000).toFixed(0)}K` : String(ytMatch.viewCount);
                          return (
                            <a
                              href={`https://youtube.com/watch?v=${ytMatch.videoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: "0.55rem", fontWeight: 700, padding: "0.08rem 0.4rem",
                                borderRadius: 999, textDecoration: "none",
                                background: "rgba(255,0,0,0.08)", color: "var(--clr-text-3)",
                                border: "1px solid rgba(255,0,0,0.2)",
                              }}
                            >
                              📺 {fmtV} tutorial views
                            </a>
                          );
                        })()}
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "var(--clr-text-5)", marginTop: 2 }}>
                        {tool.purpose}
                      </div>
                      {tool.alternatives && tool.alternatives.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 5 }}>
                          {tool.alternatives.map((alt: { name: string; reason: string }, i: number) => (
                            <span key={i} style={{
                              fontSize: "0.6rem", padding: "2px 7px", borderRadius: 4,
                              border: "1px dashed var(--clr-border-2)",
                              color: "var(--clr-text-5)",
                            }}>
                              alt: {alt.name}
                            </span>
                          ))}
                        </div>
                      )}
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
                            background: ct.freeTier ? "var(--clr-text-2)" : "var(--clr-text-3)",
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
                            background: ct.freeTier ? "rgba(var(--clr-text-rgb),0.1)" : "rgba(var(--clr-text-rgb),0.08)",
                            color: ct.freeTier ? "var(--clr-text-2)" : "var(--clr-text-3)",
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
          borderRadius: 12, padding: "1.25rem 1.5rem",
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
          borderRadius: 12, padding: "1.25rem 1.5rem",
        }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--clr-text-5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
            Mistakes to Avoid
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.mistakes.map((m, i) => {
              const mColor = i === 0 ? "var(--clr-text)" : i === 1 ? "var(--clr-text-2)" : "var(--clr-text-3)";
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
          borderRadius: 12, padding: "1.25rem 1.5rem",
        }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--clr-text-5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
            Scalability Ceiling
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.scalability.map((s, i) => {
              const sevColor = s.severity === "high" ? "var(--clr-text)" : s.severity === "medium" ? "var(--clr-text-2)" : "var(--clr-text-3)";
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
                    fontSize: "0.72rem", fontWeight: 700, color: "var(--clr-text-2)",
                    padding: "0.15rem 0.6rem", borderRadius: 999,
                    background: "rgba(var(--clr-text-rgb),0.1)", border: "1px solid rgba(var(--clr-text-rgb),0.25)",
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
          borderRadius: 12, padding: "1.25rem 1.5rem",
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
                  fontSize: "0.72rem", fontWeight: 700, color: "var(--clr-text-2)",
                  padding: "0.1rem 0.5rem", borderRadius: 999,
                  background: "rgba(var(--clr-text-rgb),0.12)", border: "1px solid rgba(var(--clr-text-rgb),0.25)",
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
  const { isSignedIn } = useAuth();
  const [selectedTool, setSelectedTool] = useState<ToolId | null>(null);
  const [idea, setIdea] = useState("");
  const [budget, setBudget] = useState<Budget>("bootstrap");
  const [techLevel, setTechLevel] = useState<TechLevel>("nocode");
  const [loading, setLoading] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [error, setError] = useState("");
  const [hasResults, setHasResults] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [trendFeedData, setTrendFeedData] = useState<any>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
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
  const [ytVideos, setYtVideos] = useState<YouTubeVideo[]>([]);
  const [ytLoading, setYtLoading] = useState(false);
  const [ytFetched, setYtFetched] = useState(false);

  const [domainKeywords, setDomainKeywords] = useState<string[]>([]);
  const [resultCached, setResultCached] = useState<boolean | null>(null);

  const [scanStep, setScanStep] = useState(-1); // -1=hidden 0-3=active step 4=all done
  const [stackCheckItems, setStackCheckItems] = useState<{ name: string; done: boolean }[]>([]);

  const inputSectionRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scanTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stackCheckTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const pendingAutoSubmit = useRef(false);

  const STACK_CHECK_TOOLS = [
    "Vercel", "Supabase", "Stripe", "Clerk", "Resend", "Anthropic API",
    "OpenAI", "Cloudflare", "PlanetScale", "Railway", "Fly.io",
    "Lemon Squeezy", "PostHog", "Sentry", "Neon", "Upstash",
  ];

  // Number of scan steps for the current tool (used for timer logic)
  const scanStepCounts: Record<string, number> = { "trend-feed": 5, "gap-analysis": 4, "competitor-radar": 1, "stack-advisor": 1 };
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

  // Handle stack-advisor checklist completion when API response arrives
  useEffect(() => {
    if (selectedTool === "stack-advisor" && !loading && stackCheckItems.length > 0 && scanStep >= 0) {
      if (stackCheckTimerRef.current) { clearInterval(stackCheckTimerRef.current); stackCheckTimerRef.current = null; }
      // Mark all items as done
      setStackCheckItems(prev => prev.map(item => ({ ...item, done: true })));
      const t = setTimeout(() => { setHasResults(true); setScanStep(-1); setStackCheckItems([]); }, 750);
      return () => clearTimeout(t);
    }
  }, [loading, selectedTool, stackCheckItems.length, scanStep]);

  useEffect(() => {
    if (hasResults) {
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [hasResults]);

  // Initialize theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("theme") as "dark" | "light" | null;
    const t = saved || "dark";
    setTheme(t);
    document.documentElement.classList.toggle("light", t === "light");
  }, []);

  // Auto-trigger analysis from URL params (e.g., from /opportunities page)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tool = params.get("tool") as ToolId | null;
    const q = params.get("q");
    if (tool && q && TOOLS.some(t => t.id === tool)) {
      setSelectedTool(tool);
      setIdea(q);
      pendingAutoSubmit.current = true;
      // Clean URL without reload
      window.history.replaceState({}, "", "/");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("light", next === "light");
  };

  const handleSelectTool = (toolId: ToolId) => {
    // Reset all result state when switching tools
    scanTimersRef.current.forEach(clearTimeout);
    if (stackCheckTimerRef.current) { clearInterval(stackCheckTimerRef.current); stackCheckTimerRef.current = null; }
    setStackCheckItems([]);
    setScanStep(-1);
    setHasResults(false);
    setStreamedContent("");
    setError("");
    setLoading(false);
    setResultCached(null);
    setGithubRepos([]);
    setGithubLoading(false);
    setGithubFetched(false);
    setHnPosts([]);
    setHnLoading(false);
    setHnFetched(false);
    setItunesApps([]);
    setItunesTotal(0);
    setItunesTotalRatings(0);
    setItunesLoading(false);
    setItunesFetched(false);
    setGplayApps([]);
    setGplayTotal(0);
    setGplayLoading(false);
    setGplayFetched(false);
    setYtVideos([]);
    setYtLoading(false);
    setYtFetched(false);
    setDomainKeywords([]);


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

  const fetchYouTubeVideos = async (query: string, days = 90) => {
    setYtLoading(true);
    setYtFetched(false);
    setYtVideos([]);
    console.log("[YouTube] fetching with query:", query);
    try {
      const params = new URLSearchParams({ q: query, maxResults: "8", days: String(days) });
      const res = await fetch(`/api/youtube?${params}`);
      if (!res.ok) {
        console.log("[YouTube] error response:", res.status, res.statusText);
        return;
      }
      const data = await res.json();
      console.log("[YouTube] results:", data.results?.length ?? 0, "videos");
      setYtVideos(data.results ?? []);
    } catch (err) {
      console.log("[YouTube] fetch error:", err);
    } finally {
      setYtLoading(false);
      setYtFetched(true);
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
    setYtVideos([]);
    setYtLoading(false);
    setYtFetched(false);
    setDomainKeywords([]);


    // Clear any existing scan timers
    scanTimersRef.current.forEach(clearTimeout);
    setTrendFeedData(null);

    // Start scan animation
    setScanStep(0);

    // Trend feed: single GET fetch, no SSE streaming
    if (selectedTool === "trend-feed") {
      const steps = scanStepCounts["trend-feed"] ?? 5;
      scanTimersRef.current = Array.from({ length: steps - 1 }, (_, i) =>
        setTimeout(() => setScanStep((s) => (s < i + 1 ? i + 1 : s)), (i + 1) * 800)
      );
      try {
        const res = await fetch(`/api/trend-feed?q=${encodeURIComponent(idea.trim())}`);
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "Something went wrong");
        }
        const result = await res.json();
        setTrendFeedData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── Other tools: existing flow ──
    if (selectedTool === "stack-advisor") {
      if (stackCheckTimerRef.current) clearInterval(stackCheckTimerRef.current);
      setStackCheckItems([{ name: STACK_CHECK_TOOLS[0], done: false }]);
      let idx = 0;
      stackCheckTimerRef.current = setInterval(() => {
        idx++;
        if (idx >= STACK_CHECK_TOOLS.length) {
          if (stackCheckTimerRef.current) clearInterval(stackCheckTimerRef.current);
          return;
        }
        setStackCheckItems(prev => {
          const updated = prev.map((item, i) => i === prev.length - 1 ? { ...item, done: true } : item);
          return [...updated, { name: STACK_CHECK_TOOLS[idx], done: false }];
        });
      }, 500);
    } else {
      const steps = (scanStepCounts[selectedTool ?? "trend-feed"] ?? 3);
      scanTimersRef.current = Array.from({ length: steps - 1 }, (_, i) =>
        setTimeout(() => setScanStep((s) => (s < i + 1 ? i + 1 : s)), (i + 1) * 800)
      );
    }

    if (selectedTool === "gap-analysis") {
      fetchSearchMeta(idea.trim(), (q) => {
        fetchITunesApps(q);
        fetchGplayApps(q);
        fetchYouTubeVideos(q + " review OR problem", 180);
      });
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
      if (selectedTool === "stack-advisor" && fullContent) {
        const stackData = parseStackAdvisorJSON(fullContent);
        if (stackData) {
          const toolNames = new Set<string>();
          for (const phase of stackData.phases) {
            for (const t of phase.tools) {
              if (t.name) toolNames.add(t.name);
            }
          }
          const topTools = Array.from(toolNames).slice(0, 6);
          if (topTools.length > 0) {
            fetchYouTubeVideos(topTools.join(" OR ") + " tutorial", 180);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when selectedTool and idea are set from URL params
  useEffect(() => {
    if (pendingAutoSubmit.current && selectedTool && idea.trim().length >= 3) {
      pendingAutoSubmit.current = false;
      handleSubmit();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTool, idea]);

  const backToTools = () => {
    scanTimersRef.current.forEach(clearTimeout);
    if (stackCheckTimerRef.current) { clearInterval(stackCheckTimerRef.current); stackCheckTimerRef.current = null; }
    setStackCheckItems([]);
    setScanStep(-1);
    setHasResults(false);
    setStreamedContent("");
    setError("");
    setResultCached(null);
    setTrendFeedData(null);
    setGithubRepos([]);
    setGithubFetched(false);
    setHnPosts([]);
    setHnFetched(false);
    setItunesApps([]);
    setItunesFetched(false);
    setGplayApps([]);
    setGplayFetched(false);
    setYtVideos([]);
    setYtLoading(false);
    setYtFetched(false);
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
    setYtVideos([]);
    setYtLoading(false);
    setYtFetched(false);
    setDomainKeywords([]);

  };

  const allSections = streamedContent ? parseSections(streamedContent, loading) : [];
  // Normalize variation selectors so "🌡️" (with FE0F) and "🌡" (without) both match
  const stripVS = (s: string) => s.replace(/\uFE0F/g, "");
  const scoreSection = allSections.find((s) => stripVS(s.emoji) === stripVS("🌡️"));
  const sections = allSections.filter((s) => stripVS(s.emoji) !== stripVS("🌡️"));
  const scoreData = scoreSection ? parseScore(scoreSection.body) : null;
  const currentTool = TOOLS.find((t) => t.id === selectedTool);



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

        
        {/* ── Main ── */}
        <main style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "42px 2rem 0", flex: 1, display: "flex", flexDirection: "column" }}>

          {/* ── Scanning overlay ── */}
          {scanStep >= 0 ? (() => {
            const SCAN_STEPS_MAP: Record<string, { label: string; icon: React.ReactNode }[]> = {
              "gap-analysis": [
                { label: "Searching App Store",    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg> },
                { label: "Searching Google Play",  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.04c.29.12.62.18.97.18.49 0 .97-.14 1.42-.42l.02-.01 1.73-1.01L17.63 22c1.07 0 2.01-.56 2.56-1.43l-9.6-5.55-7.4 8.02zm-.63-1.73l7.22-7.83L2.35 8.7c-.22.44-.35.94-.35 1.48V19.82c0 .6.18 1.15.55 1.49zm17.8-3.38c.59-.36 1.03-.94 1.2-1.63l.01-.04.04-.18c.06-.3.1-.63.1-.97v-.52l-.01-.03c-.05-.63-.32-1.18-.72-1.59L17.7 11.3l-2.87 3.12 5.52 3.51zm-.3-10.2L7.36 1.37 4.57 2.99 14.83 11.3l5.22-3.57z"/></svg> },
                { label: "Searching YouTube",      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 00.5 6.19 31.6 31.6 0 000 12a31.6 31.6 0 00.5 5.81 3.02 3.02 0 002.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 002.12-2.14A31.6 31.6 0 0024 12a31.6 31.6 0 00-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg> },
                { label: "Analyzing with AI",      icon: <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M10 2l1.8 5.4H17l-4.2 3.1 1.6 5-4.4-3.2L5.6 15.5l1.6-5L3 7.4h5.2L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
              ],
              "trend-feed": [
                { label: "Generating sub-categories", icon: <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M10 2l1.8 5.4H17l-4.2 3.1 1.6 5-4.4-3.2L5.6 15.5l1.6-5L3 7.4h5.2L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
                { label: "Searching App Store",      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg> },
                { label: "Finding new releases",     icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
                { label: "Searching Product Hunt",   icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M13.604 8.4h-3.405V12h3.405a1.8 1.8 0 100-3.6zM12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm1.604 14.4h-3.405V18H8.4V6h5.204a4.2 4.2 0 110 8.4z"/></svg> },
                { label: "Analyzing with AI",        icon: <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M10 2l1.8 5.4H17l-4.2 3.1 1.6 5-4.4-3.2L5.6 15.5l1.6-5L3 7.4h5.2L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
              ],
              "competitor-radar": [
                { label: "Analyzing with AI",      icon: <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M10 2l1.8 5.4H17l-4.2 3.1 1.6 5-4.4-3.2L5.6 15.5l1.6-5L3 7.4h5.2L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
              ],
              "stack-advisor": [
                { label: "Analyzing with AI",      icon: <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M10 2l1.8 5.4H17l-4.2 3.1 1.6 5-4.4-3.2L5.6 15.5l1.6-5L3 7.4h5.2L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
              ],
            };
            const SCAN_STEPS = SCAN_STEPS_MAP[selectedTool ?? "gap-analysis"] ?? SCAN_STEPS_MAP["gap-analysis"];
            return (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 0" }}>
                <div style={{
                  background: "var(--clr-surface)", border: "1px solid var(--clr-border)",
                  borderRadius: 12, padding: "2.5rem 3rem", width: "100%", maxWidth: 420,
                  animation: "scanCardIn 0.35s cubic-bezier(0.16,1,0.3,1)",
                  boxShadow: currentTool ? `0 0 0 1px rgba(${currentTool.accentRgb},0.08), 0 24px 64px rgba(0,0,0,0.25)` : "0 24px 64px rgba(0,0,0,0.25)",
                }}>
                  {/* Header */}
                  <div style={{ marginBottom: "2rem", textAlign: "center" }}>
                    {currentTool && (
                      <div style={{
                        width: 48, height: 48, borderRadius: 12, margin: "0 auto 1rem",
                        background: `rgba(${currentTool.accentRgb},0.1)`,
                        border: `1px solid rgba(${currentTool.accentRgb},0.25)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {TOOL_ICONS[currentTool.id](currentTool.accentColor)}
                      </div>
                    )}
                    <h2 style={{ fontSize: "1.125rem", fontWeight: 750, color: "var(--clr-text)", letterSpacing: "-0.025em", margin: "0 0 0.375rem" }}>
                      {selectedTool === "stack-advisor" ? "Evaluating tools…" : "Gathering intelligence…"}
                    </h2>
                    <p style={{ fontSize: "0.8rem", color: "var(--clr-text-5)", margin: 0, lineHeight: 1.5, maxWidth: 280, marginInline: "auto", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "normal" }}>
                      {idea}
                    </p>
                  </div>

                  {/* Steps */}
                  {selectedTool === "stack-advisor" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem", maxHeight: 320, overflowY: "auto" }}>
                      {stackCheckItems.map((item, i) => {
                        const isLast = i === stackCheckItems.length - 1;
                        const isDone = item.done;
                        return (
                          <div key={item.name} style={{
                            display: "flex", alignItems: "center", gap: "0.875rem",
                            padding: "0.5rem 0.75rem", borderRadius: 12,
                            background: !isDone ? `rgba(${currentTool?.accentRgb ?? "var(--clr-accent-rgb)"},0.05)` : "transparent",
                            transition: "background 0.3s",
                            animation: "stepIn 0.3s ease both",
                          }}>
                            <div style={{ width: 22, height: 22, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {isDone ? (
                                <div style={{
                                  width: 22, height: 22, borderRadius: "50%",
                                  background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.35)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  animation: "checkPop 0.35s cubic-bezier(0.16,1,0.3,1)",
                                }}>
                                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                                    <path d="M2 5.5l2.5 2.5 4.5-5" stroke="var(--clr-text-2)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </div>
                              ) : (
                                <div style={{ width: 18, height: 18, border: "2px solid var(--clr-text-5)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                              )}
                            </div>
                            <span style={{
                              fontSize: "0.875rem", fontWeight: isDone ? 500 : 600,
                              color: isDone ? "var(--clr-text-3)" : "var(--clr-text)",
                              transition: "color 0.3s", flex: 1,
                            }}>
                              Checking {item.name}
                              {!isDone && <span style={{ animation: "blink 1.1s step-end infinite" }}>…</span>}
                            </span>
                            {isDone && (
                              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, animation: "checkPop 0.35s ease" }}>
                                <path d="M2 6.5l3 3 5.5-6" stroke="rgb(34,197,94)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                    {SCAN_STEPS.map((step, i) => {
                      const isDone   = i < scanStep || scanStep === 4;
                      const isActive = i === scanStep && scanStep < 4;
                      const isPend   = !isDone && !isActive;
                      return (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: "0.875rem",
                          padding: "0.625rem 0.75rem", borderRadius: 12,
                          background: isActive ? `rgba(${currentTool?.accentRgb ?? "var(--clr-accent-rgb)"},0.05)` : "transparent",
                          transition: "background 0.3s",
                          animation: i <= scanStep ? `stepIn 0.3s ease ${i === scanStep ? 0 : 0}ms both` : "none",
                        }}>
                          {/* Icon slot */}
                          <div style={{ width: 26, height: 26, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {isDone ? (
                              <div style={{
                                width: 22, height: 22, borderRadius: "50%",
                                background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.35)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                animation: "checkPop 0.35s cubic-bezier(0.16,1,0.3,1)",
                              }}>
                                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                                  <path d="M2 5.5l2.5 2.5 4.5-5" stroke="var(--clr-text-2)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </div>
                            ) : isActive ? (
                              <div style={{ width: 22, height: 22, borderRadius: "50%", border: `1.5px solid rgba(${currentTool?.accentRgb ?? "var(--clr-accent-rgb)"},0.3)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: currentTool?.accentColor ?? "var(--clr-accent)", animation: "pulse 1s ease-in-out infinite" }} />
                              </div>
                            ) : (
                              <div style={{ width: 22, height: 22, borderRadius: "50%", border: "1.5px solid var(--clr-border)" }} />
                            )}
                          </div>

                          {/* Source icon */}
                          <span style={{ color: isDone ? "var(--clr-text-2)" : isActive ? (currentTool?.accentColor ?? "var(--clr-accent)") : "var(--clr-text-7)", transition: "color 0.3s", flexShrink: 0 }}>
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
                            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--clr-text-2)", letterSpacing: "0.04em", animation: "checkPop 0.35s ease" }}>
                              done
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>
              </div>
            );
          })() : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {/* ── Hero ── */}
              {!hasResults && (
              <div style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", textAlign: "center", maxWidth: 720, margin: "0 auto",
                width: "100%", padding: "1.5rem 0 2rem", position: "relative",
              }}>
                <h1 style={{
                  fontSize: "4.2rem", fontWeight: 700,
                  letterSpacing: "-0.035em", lineHeight: "4.725rem",
                  color: "var(--clr-text)", marginBottom: "1.5rem",
                  whiteSpace: "normal",
                }}>
                  <span style={{ color: "var(--clr-text-3)" }}>Claude says your idea is great.</span>
                  <span style={{ color: "var(--clr-text)" }}>We&apos;ll tell you the truth.</span>
                </h1>
                <p style={{
                  color: "var(--clr-text-3)", fontSize: "1.2rem", lineHeight: 1.6,
                  maxWidth: 680, margin: "0 auto 1rem",
                }}>
                  Your AI chat was trained on last year's data. Unbuilt searches the live web<br />
              — so you build on facts, not memories.
                </p>
              </div>
              )}

              {/* ── Tool selector grid ── */}
              <div data-tool-grid style={{
                display: "grid",
                marginTop: "2rem",
            gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1rem",
                paddingBottom: "2rem",
                maxWidth: "59.4rem",
                margin: "0 auto",
              }}>
                {/* Pulse card — links to /pulse instead of triggering tool flow */}
                <Link href="/pulse" style={{ textDecoration: "none", color: "inherit" }}>
                  <div
                    style={{
                      position: "relative",
                      borderRadius: 12,
                      padding: "1rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: 0,
                      overflow: "hidden",
                      cursor: "pointer",
                      transition: "all 0.18s ease",
                      background: "var(--clr-surface)",
                      border: "1px solid var(--clr-border-2)",
                      opacity: selectedTool ? 0.35 : 1,
                      userSelect: "none",
                      height: "100%",
                    }}
                    onMouseEnter={(e) => { if (!selectedTool) { e.currentTarget.style.border = "1px solid var(--clr-text-6)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.border = "1px solid var(--clr-border-2)"; e.currentTarget.style.transform = "none"; }}
                  >
                    <div style={{ fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--clr-accent)", marginBottom: "0.5rem" }}>
                      WHAT&apos;S RISING
                    </div>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(var(--clr-accent-rgb),0.08)", border: "1px solid rgba(var(--clr-accent-rgb),0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.5rem", flexShrink: 0 }}>
                      {TOOL_ICONS["trend-feed"]("var(--clr-accent)")}
                    </div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--clr-text)", marginBottom: "0.25rem" }}>Pulse</div>
                    <div style={{ fontSize: "0.825rem", fontWeight: 500, color: "var(--clr-text-3)", marginBottom: "0.5rem" }}>Live market signals</div>
                    <p style={{ fontSize: "0.894rem", color: "var(--clr-text-4)", lineHeight: 1.6, flex: 1, margin: 0 }}>
                      See what apps are exploding right now. Real-time signals from App Store, Google Play, Product Hunt and GitHub — before Twitter even notices.
                    </p>
                    <div style={{ marginTop: "0.875rem", display: "flex", alignItems: "center", gap: 5, fontSize: "0.894rem", fontWeight: 600, color: "var(--clr-accent)" }}>
                      Explore Pulse
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L9.5 4.5M13 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </div>
                </Link>
                {TOOLS.filter((t) => t.id !== "competitor-radar" && t.id !== "trend-feed").map((tool) => (
                  <ToolSelectorCard
                    key={tool.id}
                    tool={tool}
                    isSelected={selectedTool === tool.id}
                    isOtherSelected={selectedTool !== null && selectedTool !== tool.id}
                    onClick={() => handleSelectTool(tool.id)}
                  />
                ))}
              </div>

              {/* ── Input section ── */}
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
                  borderRadius: 12, marginBottom: "1.25rem",
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
                    <div style={{ fontSize: "0.875rem", color: "var(--clr-text-2)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "normal" }}>
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
                    background: "rgba(var(--clr-text-rgb),0.08)",
                    border: "1px solid rgba(var(--clr-text-rgb),0.25)",
                    fontSize: "0.68rem", fontWeight: 600,
                    color: "var(--clr-text-2)",
                    flexShrink: 0,
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: "var(--clr-text-2)",
                      animation: resultCached ? "none" : "pulse 2s ease-in-out infinite",
                    }} />
                    {resultCached ? "Cached result" : "Live result"}
                  </span>
                )}
              </div>

              {/* Loading skeleton — only while nothing has streamed yet */}
              {loading && (selectedTool === "gap-analysis" || selectedTool === "stack-advisor") && <GapAnalysisSkeleton />}
              {loading && selectedTool !== "gap-analysis" && selectedTool !== "stack-advisor" && selectedTool !== "trend-feed" && sections.length === 0 && currentTool && <LoadingSkeleton tool={currentTool} />}

              {/* Error */}
              {error && (
                <div style={{
                  padding: "1.25rem 1.5rem", borderRadius: 12,
                  background: "rgba(var(--clr-text-rgb),0.04)", border: "1px solid var(--clr-border-2)",
                  color: "var(--clr-text-2)", fontSize: "0.875rem",
                  display: "flex", flexDirection: "column", gap: "0.875rem",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1, color: "var(--clr-text-3)" }}>
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: "0.25rem", color: "var(--clr-text)" }}>
                        {error.includes("Overloaded") || error.includes("overloaded")
                          ? "Claude is busy right now"
                          : error.includes("timeout") || error.includes("Timeout")
                          ? "Request timed out"
                          : "Something went wrong"}
                      </div>
                      <div style={{ color: "var(--clr-text-3)", lineHeight: 1.5 }}>
                        {error.includes("Overloaded") || error.includes("overloaded")
                          ? "The AI is under heavy load. Wait a few seconds and try again — it usually clears quickly."
                          : error.includes("timeout") || error.includes("Timeout")
                          ? "The analysis took too long. Try a shorter or more specific description."
                          : error}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => { setError(""); handleSubmit(); }}
                    style={{
                      alignSelf: "flex-start",
                      padding: "0.5rem 1rem",
                      background: "var(--clr-text)", color: "var(--clr-bg)",
                      border: "none", borderRadius: 8,
                      fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 6,
                      fontFamily: "inherit",
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M1 4v6h6M23 20v-6h-6" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Try again
                  </button>
                </div>
              )}

              {/* Trend Feed: structured result */}
              {selectedTool === "trend-feed" && !loading && trendFeedData && (
                <TrendFeedResult data={trendFeedData} />
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
                  if (stackData) return <StackAdvisorResult data={stackData} ytVideos={ytVideos} />;
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
              ) : selectedTool !== "gap-analysis" && selectedTool !== "stack-advisor" && selectedTool !== "trend-feed" ? (
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
                    <div className="section-icon" style={{ background: "rgba(var(--clr-text-rgb),0.1)", border: "1px solid rgba(var(--clr-text-rgb),0.2)" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--clr-accent)">
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
                        borderRadius: 999, background: "rgba(var(--clr-text-rgb),0.08)", color: "var(--clr-text-2)",
                        border: "1px solid rgba(var(--clr-text-rgb),0.2)",
                      }}>App Store</span>
                      <span style={{
                        fontSize: "0.58rem", fontWeight: 700, padding: "0.1rem 0.45rem",
                        borderRadius: 999, background: "rgba(var(--clr-text-rgb),0.08)", color: "var(--clr-text-2)",
                        border: "1px solid rgba(var(--clr-text-rgb),0.2)",
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
                          background: "rgba(var(--clr-text-rgb),0.06)", border: "1px solid rgba(var(--clr-text-rgb),0.15)",
                          textAlign: "center",
                        }}>
                          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--clr-text-2)", lineHeight: 1 }}>{totalFound}</div>
                          <div style={{ fontSize: "0.62rem", color: "var(--clr-text-6)", fontWeight: 600, marginTop: 3 }}>apps found</div>
                        </div>
                        <div style={{
                          flex: 1, padding: "0.625rem 0.875rem", borderRadius: 10,
                          background: "rgba(var(--clr-text-rgb),0.06)", border: "1px solid rgba(var(--clr-text-rgb),0.15)",
                          textAlign: "center",
                        }}>
                          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--clr-text-2)", lineHeight: 1 }}>{totalRatings.toLocaleString()}</div>
                          <div style={{ fontSize: "0.62rem", color: "var(--clr-text-6)", fontWeight: 600, marginTop: 3 }}>total ratings</div>
                        </div>
                        <div style={{
                          flex: 1, padding: "0.625rem 0.875rem", borderRadius: 10,
                          background: "rgba(var(--clr-text-rgb),0.06)", border: "1px solid rgba(var(--clr-text-rgb),0.15)",
                          textAlign: "center",
                        }}>
                          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--clr-text-2)", lineHeight: 1 }}>{merged.length}</div>
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
                                borderRadius: 999, background: "rgba(var(--clr-text-rgb),0.08)", color: "var(--clr-text-2)", flexShrink: 0,
                              }}>
                                {app.price}
                              </span>
                              {/* Platform badges */}
                              {app.platforms.ios && (
                                <a href={app.platforms.ios.url} target="_blank" rel="noopener noreferrer"
                                  style={{
                                    fontSize: "0.55rem", fontWeight: 700, padding: "0.08rem 0.4rem",
                                    borderRadius: 999, background: "rgba(var(--clr-text-rgb),0.08)", color: "var(--clr-text-2)",
                                    border: "1px solid rgba(var(--clr-text-rgb),0.2)", textDecoration: "none", flexShrink: 0,
                                  }}>
                                  App Store
                                </a>
                              )}
                              {app.platforms.android && (
                                <a href={app.platforms.android.url} target="_blank" rel="noopener noreferrer"
                                  style={{
                                    fontSize: "0.55rem", fontWeight: 700, padding: "0.08rem 0.4rem",
                                    borderRadius: 999, background: "rgba(var(--clr-text-rgb),0.08)", color: "var(--clr-text-2)",
                                    border: "1px solid rgba(var(--clr-text-rgb),0.2)", textDecoration: "none", flexShrink: 0,
                                  }}>
                                  Google Play
                                </a>
                              )}
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.25rem" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg key={star} width="11" height="11" viewBox="0 0 18 18" fill={star <= Math.round(app.rating) ? "var(--clr-text)" : "var(--clr-text-8)"}>
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


              {/* ── YouTube (Gap Analysis only) ── */}
              {selectedTool === "gap-analysis" && (
                <div style={{
                  marginTop: "1.5rem", borderRadius: 12, overflow: "hidden",
                  background: "var(--clr-surface)",
                  border: "1px solid var(--clr-border-2)",
                  padding: "1.5rem",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
                    <span style={{ fontSize: "1.25rem" }}>📺</span>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--clr-text)", margin: 0, letterSpacing: "-0.02em" }}>
                      What YouTube Says
                    </h3>
                    <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "var(--clr-text-7)", fontWeight: 500 }}>
                      last 6 months · reviews
                    </span>
                  </div>

                  {(ytLoading || !ytFetched) ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.625rem" }}>
                      {[1, 2, 3].map((n) => (
                        <div key={n} className="shimmer" style={{ height: 80, borderRadius: 10 }} />
                      ))}
                    </div>
                  ) : (ytVideos.length === 0) ? (
                    <div style={{ padding: "0.75rem 0", fontSize: "0.825rem", color: "var(--clr-text-6)", textAlign: "center" }}>
                      No relevant YouTube videos found for this niche
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.625rem" }}>
                      {ytVideos.map((video: any) => {
                        const daysAgo = Math.floor((Date.now() - new Date(video.publishedAt).getTime()) / 86400000);
                        const vc = video.viewCount ?? 0;
                        const fmtViews = vc >= 1_000_000 ? `${(vc / 1_000_000).toFixed(1)}M` : vc >= 1_000 ? `${(vc / 1_000).toFixed(0)}K` : String(vc);
                        const lc = video.likeCount ?? 0;
                        return (
                          <a
                            key={video.videoId}
                            href={`https://youtube.com/watch?v=${video.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "flex", gap: "0.75rem",
                              padding: "0.875rem 1rem", borderRadius: 12,
                              background: "var(--clr-surface)",
                              border: "1px solid var(--clr-border-2)",
                              textDecoration: "none", transition: "transform 0.15s, border-color 0.15s, box-shadow 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "translateY(-2px)";
                              e.currentTarget.style.borderColor = "rgba(var(--clr-text-rgb),0.4)";
                              e.currentTarget.style.boxShadow = "0 8px 24px rgba(var(--clr-text-rgb),0.08)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "none";
                              e.currentTarget.style.borderColor = "var(--clr-border-2)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            {/* Thumbnail from YouTube videoId */}
                            <div style={{
                              width: 120, minWidth: 120, height: 68, borderRadius: 8, overflow: "hidden",
                              background: "var(--clr-bg)", flexShrink: 0, position: "relative",
                            }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={`https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              <div style={{
                                position: "absolute", bottom: 4, right: 4,
                                background: "rgba(0,0,0,0.8)", borderRadius: 4,
                                padding: "1px 5px", fontSize: "0.6rem", color: "#fff", fontWeight: 700,
                              }}>
                                ▶ {fmtViews}
                              </div>
                            </div>
                            {/* Info */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--clr-text)", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {video.title}
                              </div>
                              <div style={{ fontSize: "0.7rem", color: "var(--clr-text-5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "normal" }}>
                                {video.channel ?? video.channelTitle}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "auto" }}>
                                <span style={{
                                  display: "inline-flex", alignItems: "center", gap: 4,
                                  padding: "0.15rem 0.45rem", borderRadius: 999,
                                  background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.25)",
                                  fontSize: "0.62rem", fontWeight: 800, color: "var(--clr-text-2)",
                                }}>
                                  {fmtViews} views
                                </span>
                                {lc > 0 && (
                                  <span style={{ fontSize: "0.62rem", color: "var(--clr-text-6)", fontWeight: 500 }}>
                                    {lc >= 1000 ? `${(lc / 1000).toFixed(0)}K` : lc} likes
                                  </span>
                                )}
                                <span style={{ fontSize: "0.62rem", color: "var(--clr-text-7)", marginLeft: "auto" }}>
                                  {daysAgo === 0 ? "today" : `${daysAgo}d ago`}
                                </span>
                              </div>
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
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-text-2)", display: "inline-block" }} />
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

        {/* ── Site Footer ── */}
        <footer style={{
          padding: "2rem 0",
          borderTop: "1px solid var(--clr-border-deep)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "0.25rem 0.5rem",
          fontSize: "0.75rem",
          color: "var(--clr-text-7)",
        }}>
          <a href="/legal/privacy-policy" style={{ color: "var(--clr-text-7)", textDecoration: "none" }}>Privacy Policy</a>
          <span style={{ opacity: 0.4 }}>|</span>
          <a href="/legal/terms-of-service" style={{ color: "var(--clr-text-7)", textDecoration: "none" }}>Terms of Service</a>
          <span style={{ opacity: 0.4 }}>|</span>
          <a href="/legal/cookie-policy" style={{ color: "var(--clr-text-7)", textDecoration: "none" }}>Cookie Policy</a>
          <span style={{ opacity: 0.4 }}>|</span>
          <a href="/legal/acceptable-use" style={{ color: "var(--clr-text-7)", textDecoration: "none" }}>Acceptable Use</a>
          <span style={{ opacity: 0.4 }}>|</span>
          <a href="/legal/ai-transparency" style={{ color: "var(--clr-text-7)", textDecoration: "none" }}>AI Transparency</a>
          <span style={{ opacity: 0.4 }}>|</span>
          <a href="/legal/do-not-sell" style={{ color: "var(--clr-text-7)", textDecoration: "none" }}>Do Not Sell</a>
          <span style={{ opacity: 0.4 }}>|</span>
          <a href="/legal/disclaimer" style={{ color: "var(--clr-text-7)", textDecoration: "none" }}>Disclaimer</a>
        </footer>
      </div>
    </>
  );
}
