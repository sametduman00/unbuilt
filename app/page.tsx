"use client";

import { useState, useRef, useEffect, useCallback, useMemo, Suspense } from "react";
import Script from "next/script";
import { generatePdf } from "@/app/lib/generatePdf";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth, useUser, useClerk, UserButton, SignInButton } from "@clerk/nextjs";

// ââ Types ââââââââââââââââââââââââââââââââââââââââââââââââââââââ
type ToolId = "gap-analysis" | "competitor-radar" | "trend-feed" | "stack-advisor";
type Budget = "bootstrap" | "growing" | "funded" | "scale";
type TechLevel = "nocode" | "lowcode" | "developer";
type Platform = "web" | "mobile" | "both";

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

// ââ SVG Icons ââââââââââââââââââââââââââââââââââââââââââââââââââ
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

// ââ Tool definitions âââââââââââââââââââââââââââââââââââââââââââ
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
    name: "Dig",
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
    name: "Stack",
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
    ],
  },
];

// ââ Section metadata (for results cards) ââââââââââââââââââââââ
const SECTION_META: Record<string, { bg: string; color: string }> = {
  "ð": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "ð¤": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "ð³ï¸":{ bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "â¡": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "ð¯": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "â ï¸":{ bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "ðª": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "ð©¸": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "ð£": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "ðºï¸":{ bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "âï¸":{ bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "ð": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "ð": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "ð": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "ð¥": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "ð¡": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "ð§²": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "ð§ ": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "ð ï¸":{ bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "ð°": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "ð": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "ð": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "ð®": { bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
  "ð¡ï¸":{ bg: "rgba(var(--clr-text-rgb),0.04)", color: "var(--clr-text)" },
};

// ââ Markdown component map âââââââââââââââââââââââââââââââââââââ
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
        emoji: m ? m[0].trim() : "ð",
        title: raw.replace(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)\s*/u, "").trim(),
        body,
        isLast,
      }];
    });
}

// ââ Score parser âââââââââââââââââââââââââââââââââââââââââââââââ
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

// ââ Section Result Card ââââââââââââââââââââââââââââââââââââââââ
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

// ââ Trend Feed Visual Components âââââââââââââââââââââââââââââ

function parseBullets(body: string): { title: string; desc: string; badge?: string }[] {
  const lines = body.split("\n").filter((l) => l.trim());
  const bullets: { title: string; desc: string; badge?: string }[] = [];
  for (const line of lines) {
    const clean = line.replace(/^[-*•]\s*/, "").trim();
    if (!clean) continue;
    // Extract badge like **ð¥ High Activity** or **ð Growing**
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
        <span style={{ fontSize: "1.25rem" }}>ð</span>
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
        <span style={{ fontSize: "1.25rem" }}>ð</span>
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
        <span style={{ fontSize: "1.25rem" }}>ð¡</span>
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
          <span style={{ fontSize: "1.5rem" }}>ð¥</span>
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

function GapAnalysisResult({ data, itunesApps, gplayApps }: { data: GapAnalysisData; itunesApps?: ITunesApp[]; gplayApps?: GooglePlayApp[] }) {
  data = {
    ...data,
    competitors: data.competitors?.filter((c: GapCompetitor) => c?.name) ?? [],
    painPoints: data.painPoints?.filter((p: GapPainPoint) => p?.quote) ?? [],
    marketGaps: data.marketGaps?.filter((g: GapMarketGap) => g?.title) ?? [],
  };
  const [activeTab, setActiveTab] = useState("overview");
  const tabs = [
    { id: "overview", label: "Overview", score: data.marketScore },
    { id: "market", label: "Market Data" },
    { id: "community", label: "Community Signals" },
    { id: "competitors", label: "Competitors" },
    { id: "gaps", label: "Market Gaps" },
    { id: "gtm", label: "Go-to-Market" },
    { id: "financials", label: "Financials" },
    { id: "validate", label: "Validate" },
    { id: "action", label: "Action Plan" },
    { id: "synthesis", label: "Synthesis" },
  ];
  const sc = data.marketScore ?? 0;
  const scoreColor = sc >= 70 ? "#10b981" : sc >= 50 ? "#f59e0b" : "#ef4444";

  const Pill = ({ text, color }: { text: string; color: string }) => {
    const map: Record<string, [string,string]> = {
      green:["#dcfce7","#16a34a"], red:["#fee2e2","#dc2626"], orange:["#fff7ed","#ea580c"],
      blue:["#eff6ff","#2563eb"], purple:["#f3e8ff","#9333ea"], gray:["#f3f4f6","#374151"],
      teal:["#f0fdfa","#0d9488"], pink:["#fdf2f8","#db2777"], dark:["#111827","#f9fafb"],
    };
    const [bg, fg] = map[color] ?? map.gray;
    return <span style={{ display:"inline-flex", alignItems:"center", padding:"2px 7px", borderRadius:6, fontSize:10, fontWeight:700, letterSpacing:"0.04em", textTransform:"uppercase" as const, background:bg, color:fg, whiteSpace:"nowrap" as const, flexShrink:0 }}>{text}</span>;
  };

  const SourceBadge = ({ source }: { source: string }) => {
    const s = (source ?? "").toLowerCase();
    if (s.includes("youtube")) return <Pill text="YouTube" color="red" />;
    if (s.includes("reddit")) {
      const sub = source.match(/r\/([\w]+)/i)?.[1];
      return <Pill text={sub ? "r/"+sub : "Reddit"} color="orange" />;
    }
    if (s.includes("instagram")) return <Pill text="Instagram" color="pink" />;
    if (s.includes("twitter") || s.includes("x.com")) return <Pill text="X / Twitter" color="dark" />;
    if (s.includes("product hunt")) return <Pill text="Product Hunt" color="orange" />;
    if (s.includes("indie hacker")) return <Pill text="Indie Hackers" color="teal" />;
    if (s.includes("g2")) return <Pill text="G2" color="teal" />;
    if (s.includes("app store") || s.includes("itunes")) return <Pill text="App Store" color="blue" />;
    if (s.includes("play store") || s.includes("google play")) return <Pill text="Google Play" color="green" />;
    if (s.includes("linkedin")) return <Pill text="LinkedIn" color="blue" />;
    const short = source.length > 20 ? source.substring(0,18)+"…" : source;
    return <Pill text={short} color="gray" />;
  };

  const ScoreCircle = ({ size = 90 }: { size?: number }) => {
    const r = size * 0.4;
    const circ = 2 * Math.PI * r;
    return (
      <div style={{ position:"relative" as const, width:size, height:size, flexShrink:0 }}>
        <svg viewBox={`0 0 ${size} ${size}`} style={{ transform:"rotate(-90deg)", width:size, height:size }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={size*0.075} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={scoreColor} strokeWidth={size*0.075}
            strokeDasharray={`${circ*sc/100} ${circ}`} strokeLinecap="round" />
        </svg>
        <div style={{ position:"absolute" as const, inset:0, display:"flex", flexDirection:"column" as const, alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontSize:size*0.24, fontWeight:800, color:"#111827", lineHeight:1 }}>{sc}</span>
          <span style={{ fontSize:size*0.12, color:"#9ca3af" }}>/100</span>
        </div>
      </div>
    );
  };

  const Card = ({ title, sub, right, children }: { title: string; sub?: string; right?: React.ReactNode; children: React.ReactNode }) => (
    <div style={{ background:"white", border:"1px solid #e5e7eb", borderRadius:12, padding:20, marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.08em", color:"#374151" }}>{title}</div>
          {sub && <div style={{ fontSize:12, color:"#9ca3af", marginTop:2 }}>{sub}</div>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );

  // Parse market size value: extract leading number for big display + rest as subtitle
  const parseMarketVal = (val: string) => {
    const m = val.match(/^(\$[\d.,]+[BMKTbmkt]?(?:[\d.,]+[BMKTbmkt]?)?)(.*)$/);
    if (m && m[2].trim().length > 0) return { num: m[1], sub: m[2].trim().replace(/^[-–—(]\s*/, '') };
    return { num: val.length > 12 ? val.substring(0,12) : val, sub: val.length > 12 ? val.substring(12) : "" };
  };

  const allApps = [...((itunesApps??[]) as any[]).map((a:any)=>({...a,_src:"App Store"})), ...((gplayApps??[]) as any[]).map((a:any)=>({...a,_src:"Google Play"}))];

  const renderTab = () => {
    switch (activeTab) {
      case "overview": return (
        <div>
          <Card title="TL;DR - Executive Summary" sub={"Market score: "+sc+"/100"} right={<Pill text={data.marketScoreLabel??"Opportunity"} color={sc>=70?"green":sc>=50?"orange":"red"} />}>
            <div style={{ display:"flex", gap:20, marginBottom:20 }}>
              <div style={{ display:"flex", flexDirection:"column" as const, alignItems:"center", gap:8, flexShrink:0 }}>
                <ScoreCircle size={90} />

              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:14, lineHeight:1.7, color:"#374151", margin:"0 0 12px 0" }}>{data.marketScoreSummary}</p>
                {data.oneLiner && (
                  <div style={{ background:"#f5f3ff", border:"1px solid #ddd6fe", borderRadius:8, padding:"10px 14px", marginBottom:0 }}>
                    <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, color:"#7c3aed", marginBottom:3, letterSpacing:"0.07em" }}>Your One-Liner</div>
                    <div style={{ fontSize:13, fontStyle:"italic" as const, color:"#1e1b4b" }}>"{data.oneLiner}"</div>
                  </div>
                )}
                {/* Key numbers row */}
                <div style={{ display:"flex", gap:12, marginTop:12, flexWrap:"wrap" as const }}>
                  {data.marketSize?.tam && <div style={{ fontSize:12, color:"#374151" }}>📈 <strong>TAM:</strong> {parseMarketVal(data.marketSize.tam).num}</div>}
                  {data.competitors?.[0] && <div style={{ fontSize:12, color:"#374151" }}>⚔ <strong>Top threat:</strong> {data.competitors[0].name}</div>}
                  {data.marketGaps?.[0] && <div style={{ fontSize:12, color:"#374151" }}>🎯 <strong>Best gap:</strong> {data.marketGaps[0].title}</div>}
                </div>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
              <div style={{ background:"#f0fdfb", border:"1px solid #ccfbf1", borderRadius:10, padding:14 }}>
                <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, color:"#0d9488", marginBottom:6, letterSpacing:"0.07em" }}>Biggest Opportunity</div>
                <div style={{ fontSize:13, fontWeight:600, color:"#111827", marginBottom:4 }}>{data.marketGaps?.[0]?.title??"-"}</div>
                <div style={{ fontSize:12, color:"#6b7280", lineHeight:1.5 }}>{data.marketGaps?.[0]?.description??""}</div>
              </div>
              <div style={{ background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:10, padding:14 }}>
                <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, color:"#ea580c", marginBottom:6, letterSpacing:"0.07em" }}>Biggest Risk</div>
                <div style={{ fontSize:13, fontWeight:600, color:"#111827", marginBottom:4 }}>{data.swot?.threats?.[0]??"-"}</div>
                <div style={{ fontSize:12, color:"#6b7280", lineHeight:1.5 }}>{data.swot?.threats?.[1]??""}</div>
              </div>
              <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:10, padding:14 }}>
                <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, color:"#2563eb", marginBottom:6, letterSpacing:"0.07em" }}>First Move</div>
                <div style={{ fontSize:13, fontWeight:600, color:"#111827", marginBottom:4 }}>{data.opportunity?.actionItems?.[0]?.action??"-"}</div>
                <div style={{ fontSize:12, color:"#6b7280", lineHeight:1.5 }}>{data.opportunity?.actionItems?.[0]?.detail??""}</div>
              </div>
            </div>
          </Card>
          {data.synthesis && (
            <Card title="Synthesis" sub="Your idea at a glance">
              <p style={{ fontSize:14, lineHeight:1.7, color:"#374151", margin:0 }}>{data.synthesis.oneParagraph}</p>
            </Card>
          )}
        </div>
      );
      case "market": return (
        <div>
          {data.marketSize && (
            <Card title="Market Sizing" sub="TAM to SAM to SOM funnel" right={<Pill text="Multi-source" color="blue" />}>
              <div style={{ display:"flex", alignItems:"stretch", gap:10, marginBottom:16 }}>
                {[{ val:data.marketSize.tam, label:"TAM", sub:"Everyone who could buy" }, null, { val:data.marketSize.sam, label:"SAM", sub:"People you can reach" }, null, { val:data.marketSize.som, label:"SOM", sub:"Realistic customers" }].map((item,i) =>
                  item===null ? <div key={i} style={{ display:"flex", alignItems:"center", color:"#9ca3af", fontSize:18, flexShrink:0 }}>→</div> : (() => {
                    const { num, sub: valSub } = parseMarketVal(item.val);
                    return (
                      <div key={i} style={{ flex:1, background:"#fafafa", borderRadius:10, padding:"16px 10px", border:"1px solid #f3f4f6", display:"flex", flexDirection:"column" as const, alignItems:"center", textAlign:"center" as const, minHeight:110 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:"#0d9488", marginBottom:8, letterSpacing:"0.06em", textTransform:"uppercase" as const }}>{item.label} est.</div>
                        <div style={{ fontSize:26, fontWeight:800, color:"#111827", lineHeight:1, marginBottom:6 }}>{num}</div>
                        {valSub && <div style={{ fontSize:11, color:"#9ca3af", lineHeight:1.4, marginBottom:6 }}>{valSub}</div>}
                        <div style={{ fontSize:11, color:"#6b7280", marginTop:"auto" }}>{item.sub}</div>
                      </div>
                    );
                  })()
                )}
              </div>
              {data.marketSize.growthRate && (
                <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, padding:"10px 14px", display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ color:"#16a34a", fontWeight:700, fontSize:16 }}>↗</span>
                  <span style={{ fontSize:13, fontWeight:600, color:"#15803d" }}>{data.marketSize.growthRate} annual growth</span>
                  <Pill text="Growing" color="green" />
                </div>
              )}
            </Card>
          )}
          {data.marketSegments && data.marketSegments.length > 0 && (
            <Card title="Market Segments" sub="Addressable sub-markets ranked by fit">
              {data.marketSegments.map((seg,i) => (
                <div key={i} style={{ borderLeft:"4px solid "+(seg.fit==="primary"?"#0ea5e9":seg.fit==="secondary"?"#10b981":"#f59e0b"), paddingLeft:14, marginBottom:16 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5, flexWrap:"wrap" as const }}>
                    <span style={{ fontSize:14, fontWeight:700, color:"#111827" }}>{seg.name}</span>
                    <Pill text={seg.fit.toUpperCase()} color={seg.fit==="primary"?"blue":seg.fit==="secondary"?"green":"orange"} />
                    {seg.size && <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>{seg.size}</span>}
                    {seg.growth && <span style={{ fontSize:12, color:"#10b981", fontWeight:600 }}>↑ {seg.growth}</span>}
                  </div>
                  <p style={{ fontSize:13, color:"#6b7280", margin:0 }}>{seg.description}</p>
                </div>
              ))}
            </Card>
          )}
        </div>
      );
      case "community": return (
        <div>
          <Card title="Community Signals" sub="What real users are saying">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
              {[{ label:"Pain Level", val:data.painPoints?.some(p=>p.severity==="high")?"HIGH":"MEDIUM", note:"Frustration signals" }, { label:"Signals Found", val:(data.painPoints?.length??0)+(data.communitySignals?.length??0)+"+", note:"Validated pain points" }, { label:"Sources", val:"3+", note:"Platform coverage" }].map(m => (
                <div key={m.label} style={{ background:"#fafafa", border:"1px solid #e5e7eb", borderRadius:10, padding:14 }}>
                  <div style={{ fontSize:11, fontWeight:600, textTransform:"uppercase" as const, letterSpacing:"0.07em", color:"#6b7280", marginBottom:6 }}>{m.label}</div>
                  <div style={{ fontSize:22, fontWeight:700, color:"#111827" }}>{m.val}</div>
                  <div style={{ fontSize:12, color:"#9ca3af", marginTop:4 }}>"{m.note}"</div>
                </div>
              ))}
            </div>
          </Card>
          {data.painPoints && data.painPoints.length > 0 && (
            <Card title="Pain Points" sub="Real quotes from your target market">
              {data.painPoints.map((pp,i) => (
                <div key={i} style={{ borderLeft:"3px solid #e5e7eb", paddingLeft:14, marginBottom:14 }}>
                  <div style={{ display:"flex", gap:6, marginBottom:6, flexWrap:"wrap" as const, alignItems:"center" }}>
                    {pp.source && <SourceBadge source={pp.source} />}
                    <Pill text={pp.severity.toUpperCase()} color={pp.severity==="high"?"red":pp.severity==="medium"?"orange":"green"} />
                  </div>
                  <p style={{ fontSize:13, fontStyle:"italic" as const, color:"#374151", margin:0, lineHeight:1.6 }}>"{pp.quote}"</p>
                </div>
              ))}
            </Card>
          )}
          {data.communitySignals && data.communitySignals.length > 0 && (
            <Card title="Signal Feed" sub="Community discussions">
              {data.communitySignals.map((sig,i) => (
                <div key={i} style={{ background:"#fafafa", border:"1px solid #e5e7eb", borderRadius:8, padding:12, marginBottom:8 }}>
                  <div style={{ display:"flex", gap:5, marginBottom:6, flexWrap:"wrap" as const, alignItems:"center" }}>
                    <SourceBadge source={sig.subredditOrHandle||sig.source} />
                    <Pill text={sig.sentiment.toUpperCase()} color={sig.sentiment==="pain"?"red":sig.sentiment==="need"?"orange":"green"} />
                  </div>
                  <p style={{ fontSize:13, color:"#374151", margin:0 }}>"{sig.quote}"</p>
                </div>
              ))}
            </Card>
          )}
          {data.redditPosts && data.redditPosts.length > 0 && (
            <Card title="Reddit Posts" sub={"Live posts from Reddit — " + data.redditPosts.length + " found"} right={<Pill text="Reddit" color="orange" />}>
              {data.redditPosts.map((post, i) => (
                <div key={i} style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:14, marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8, gap:10 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5, flexWrap:"wrap" as const }}>
                        <Pill text={post.subreddit} color="orange" />
                        <Pill text={post.sentiment.toUpperCase()} color={post.sentiment==="pain"?"red":post.sentiment==="need"?"orange":"green"} />
                        {post.upvotes != null && <span style={{ fontSize:11, color:"#9ca3af" }}>↑ {post.upvotes.toLocaleString()}</span>}
                      </div>
                      <div style={{ fontSize:13, fontWeight:600, color:"#111827", marginBottom:5 }}>{post.title}</div>
                      <p style={{ fontSize:12, color:"#6b7280", margin:0, lineHeight:1.5 }}>{post.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          )}
          {data.xPosts && data.xPosts.length > 0 && (
            <Card title="X / Twitter Posts" sub={"Live posts from X — " + data.xPosts.length + " found"} right={<Pill text="X / Twitter" color="dark" />}>
              {data.xPosts.map((post, i) => (
                <div key={i} style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:12, marginBottom:8 }}>
                  <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:"50%", background:"#111827", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4, flexWrap:"wrap" as const }}>
                        <span style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{post.handle}</span>
                        <Pill text={post.sentiment.toUpperCase()} color={post.sentiment==="pain"?"red":post.sentiment==="need"?"orange":"green"} />
                        {post.likes != null && <span style={{ fontSize:11, color:"#9ca3af" }}>♥ {post.likes.toLocaleString()}</span>}
                      </div>
                      <p style={{ fontSize:13, color:"#374151", margin:0, lineHeight:1.5 }}>{post.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      );
      case "competitors": return (
        <div>
          <Card title="Competitive Landscape" sub={(data.competitors?.length??0)+" competitors analyzed"} right={<Pill text={(data.competitors?.length??0)+" Active"} color="green" />}>
            {data.competitors?.map((c,i) => {
              const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(c.name)}`;
              return (
                <div key={i} style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:14, marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div>
                      <a href={searchUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize:14, fontWeight:700, color:"#2563eb", textDecoration:"none", display:"inline-flex", alignItems:"center", gap:5 }}>
                        {c.name}
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M3.5 1H11M11 1V8.5M11 1L4 8M1 4.5V11H7.5" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </a>
                      <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>{c.tagline}</div>
                    </div>
                    <Pill text={c.threatLevel>=8?"HIGH":c.threatLevel>=5?"MEDIUM":"LOW"} color={c.threatLevel>=8?"red":c.threatLevel>=5?"orange":"green"} />
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    <div>
                      <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, color:"#10b981", marginBottom:5, letterSpacing:"0.06em" }}>Strengths</div>
                      {c.strengths?.map((s,j) => <div key={j} style={{ fontSize:12, color:"#374151", marginBottom:3 }}>• {s}</div>)}
                    </div>
                    <div>
                      <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, color:"#ef4444", marginBottom:5, letterSpacing:"0.06em" }}>Weaknesses</div>
                      {c.weaknesses?.map((w,j) => <div key={j} style={{ fontSize:12, color:"#374151", marginBottom:3 }}>• {w}</div>)}
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
          {allApps.length > 0 && (
            <Card title="Existing Apps" sub="Top results from App Store and Google Play" right={
              <div style={{ display:"flex", gap:6 }}>
                {(itunesApps?.length??0) > 0 && <Pill text={"App Store "+itunesApps!.length} color="blue" />}
                {(gplayApps?.length??0) > 0 && <Pill text={"Play "+gplayApps!.length} color="green" />}
              </div>
            }>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:14 }}>
                {[{ label:"Apps Found", val:allApps.length }, { label:"Total Ratings", val:allApps.reduce((s:number,a:any)=>s+(a.userRatingCount??a.ratings??0),0).toLocaleString() }, { label:"Sources", val:[(itunesApps?.length??0)>0?"App Store":null,(gplayApps?.length??0)>0?"Google Play":null].filter(Boolean).join(" + ") }].map(m => (
                  <div key={String(m.label)} style={{ background:"#fafafa", border:"1px solid #e5e7eb", borderRadius:8, padding:"10px", textAlign:"center" as const }}>
                    <div style={{ fontSize:20, fontWeight:800, color:"#111827" }}>{m.val}</div>
                    <div style={{ fontSize:11, color:"#9ca3af", marginTop:3 }}>{m.label}</div>
                  </div>
                ))}
              </div>
              {allApps.slice(0,10).map((app:any,i:number) => (
                <div key={i} style={{ display:"flex", gap:10, padding:"10px 0", borderBottom:i<9?"1px solid #f3f4f6":"none", alignItems:"flex-start" }}>
                  {app.artworkUrl60 && <img src={app.artworkUrl60} alt="" style={{ width:36, height:36, borderRadius:7, flexShrink:0, objectFit:"cover" as const }} />}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" as const, marginBottom:2 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{app.trackName??app.name??app.title??"Unknown"}</span>
                      <Pill text={app._src} color={app._src==="App Store"?"blue":"green"} />
                      {(app.averageUserRating||app.rating) && <span style={{ fontSize:11, color:"#f59e0b", fontWeight:600 }}>★ {(app.averageUserRating||app.rating)?.toFixed(1)}</span>}
                    </div>
                    <p style={{ fontSize:11, color:"#6b7280", margin:0, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as const }}>{app.description??""}</p>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      );
      case "gaps": return (
        <div>
          <Card title="Market Gaps" sub="Where competitors fall short">
            {data.marketGaps?.map((gap,i) => (
              <div key={i} style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:14, marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"#111827", flex:1, marginRight:10 }}>{gap.title}</div>
                  <Pill text={gap.status.toUpperCase()} color={gap.status==="untapped"?"blue":gap.status==="emerging"?"orange":"red"} />
                </div>
                <p style={{ fontSize:13, color:"#6b7280", margin:"0 0 10px 0" }}>{gap.description}</p>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ flex:1, height:4, background:"#e5e7eb", borderRadius:2 }}>
                    <div style={{ width:(gap.opportunityScore*10)+"%", height:"100%", background:"#0ea5e9", borderRadius:2 }} />
                  </div>
                  <span style={{ fontSize:13, fontWeight:700, color:"#374151", minWidth:16 }}>{gap.opportunityScore}</span>
                </div>
              </div>
            ))}
          </Card>
          {data.swot && (
            <Card title="SWOT Analysis" sub="Strategic position overview">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {([{ key:"strengths" as const, label:"Strengths", bg:"#dcfce7", border:"#bbf7d0", tc:"#15803d" }, { key:"weaknesses" as const, label:"Weaknesses", bg:"#fff7ed", border:"#fed7aa", tc:"#ea580c" }, { key:"opportunities" as const, label:"Opportunities", bg:"#eff6ff", border:"#bfdbfe", tc:"#2563eb" }, { key:"threats" as const, label:"Threats", bg:"#fef2f2", border:"#fecaca", tc:"#dc2626" }]).map(({ key, label, bg, border, tc }) => (
                  <div key={key} style={{ background:bg, border:"1px solid "+border, borderRadius:8, padding:12 }}>
                    <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, color:tc, marginBottom:8, letterSpacing:"0.07em" }}>{label}</div>
                    {(data.swot?.[key] as string[])?.map((item,i) => <div key={i} style={{ fontSize:12, color:"#374151", marginBottom:4 }}>• {item}</div>)}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      );
      case "gtm": return (
        <div>
          {data.targetCustomerDeep && (
            <Card title="Target Customer" sub="Who to sell to first">
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:14 }}>
                {[{ label:"Who They Are", value:data.targetCustomerDeep.whoTheyAre }, { label:"How They Think", value:data.targetCustomerDeep.howTheyThink }, { label:"Available Money", value:data.targetCustomerDeep.availableMoney }, { label:"How They Buy", value:data.targetCustomerDeep.howTheyBuy }].map(({ label, value }) => (
                  <div key={label} style={{ background:"#fafafa", border:"1px solid #e5e7eb", borderRadius:8, padding:10 }}>
                    <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, color:"#0d9488", marginBottom:5, letterSpacing:"0.07em" }}>{label}</div>
                    <p style={{ fontSize:12, color:"#374151", margin:0, lineHeight:1.5 }}>{value}</p>
                  </div>
                ))}
              </div>
              {(data.targetCustomerDeep.triggerEvents?.length??0) > 0 && (
                <div style={{ background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:8, padding:12, marginBottom:10 }}>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, color:"#ea580c", marginBottom:7, letterSpacing:"0.07em" }}>Trigger Events</div>
                  {data.targetCustomerDeep.triggerEvents?.map((t,i) => <div key={i} style={{ fontSize:13, color:"#374151", marginBottom:4 }}>• {t}</div>)}
                </div>
              )}
              {(data.targetCustomerDeep.whereToFindThem?.length??0) > 0 && (
                <div>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, color:"#374151", marginBottom:7, letterSpacing:"0.07em" }}>Where to Find Them</div>
                  <div style={{ display:"flex", flexWrap:"wrap" as const, gap:6 }}>
                    {data.targetCustomerDeep.whereToFindThem?.map((w,i) => <span key={i} style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:6, padding:"4px 10px", fontSize:12, color:"#2563eb" }}>{w}</span>)}
                  </div>
                </div>
              )}
            </Card>
          )}
          {data.goToMarket && (
            <Card title="Go-to-Market Channels" sub="Distribution strategy + estimated CAC">
              {data.goToMarket.channels?.map((ch,i) => {
                // Extract just the numeric CAC from potentially long strings
                const cacNum = ch.estimatedCAC.match(/\$[\d,.]+-?[\d,.]*[KMB]?/)?.[0] ?? ch.estimatedCAC.substring(0,12);
                return (
                  <div key={i} style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:"12px 14px", marginBottom:8, display:"grid", gridTemplateColumns:"1fr auto", gap:12, alignItems:"start" }}>
                    <div style={{ minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" as const }}>
                        <span style={{ fontSize:13, fontWeight:700, color:"#111827" }}>{ch.name}</span>
                        <Pill text={ch.type.toUpperCase()} color={ch.type==="primary"?"blue":ch.type==="secondary"?"green":"orange"} />
                      </div>
                      <p style={{ fontSize:12, color:"#6b7280", margin:0, lineHeight:1.5, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as const }}>{ch.description}</p>
                    </div>
                    <div style={{ textAlign:"right" as const, flexShrink:0, minWidth:60 }}>
                      <div style={{ fontSize:9, color:"#9ca3af", textTransform:"uppercase" as const, letterSpacing:"0.06em", marginBottom:2 }}>Est. CAC</div>
                      <div style={{ fontSize:16, fontWeight:700, color:"#111827" }}>{cacNum}</div>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
          {data.industryTrends && (
            <Card title="Industry Trends" sub="Forces shaping your market">
              {([{ key:"now" as const, label:"Current (Now)", color:"#0ea5e9" }, { key:"emerging" as const, label:"Emerging (1-3yr)", color:"#f59e0b" }, { key:"structural" as const, label:"Structural (3-5yr)", color:"#8b5cf6" }]).map(({ key, label, color }) =>
                (data.industryTrends?.[key]?.length??0) > 0 ? (
                  <div key={key} style={{ marginBottom:14 }}>
                    <div style={{ display:"inline-block", fontSize:10, fontWeight:700, textTransform:"uppercase" as const, color, background:color+"22", border:"1px solid "+color+"44", borderRadius:4, padding:"3px 8px", marginBottom:7, letterSpacing:"0.07em" }}>{label}</div>
                    {data.industryTrends?.[key]?.map((t,i) => (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"9px 0", borderBottom:"1px solid #f3f4f6", gap:10 }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{t.trend}</div>
                          <div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>{t.evidence}</div>
                        </div>
                        <Pill text={t.impact.toUpperCase()} color={t.impact==="high"?"red":t.impact==="medium"?"orange":"green"} />
                      </div>
                    ))}
                  </div>
                ) : null
              )}
            </Card>
          )}
        </div>
      );
      case "financials": return (
        <div>
          {data.financialDeep && (
            <Card title="Financial Snapshot" sub="Key metrics for your first year">
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:20 }}>
                <div style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:14 }}>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, color:"#ef4444", marginBottom:6 }}>Monthly Burn</div>
                  <div style={{ fontSize:22, fontWeight:800, color:"#111827", marginBottom:6 }}>{data.financialDeep.monthlyBurn.total}</div>
                  <div style={{ fontSize:11, color:"#6b7280" }}>Infra {data.financialDeep.monthlyBurn.infrastructure} · Tools {data.financialDeep.monthlyBurn.tools} · Mkt {data.financialDeep.monthlyBurn.marketing}</div>
                </div>
                <div style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:14 }}>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, color:"#10b981", marginBottom:6 }}>Break-Even</div>
                  <div style={{ fontSize:22, fontWeight:800, color:"#111827", marginBottom:6 }}>Month {data.financialDeep.breakEvenMonth}</div>
                  <div style={{ fontSize:12, color:"#6b7280" }}>When revenue covers costs</div>
                </div>
                <div style={{ background:"#f0fdfe", border:"1px solid #a5f3fc", borderRadius:10, padding:14 }}>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, color:"#0891b2", marginBottom:6 }}>12-Month Potential</div>
                  <div style={{ fontSize:22, fontWeight:800, color:"#111827", marginBottom:4 }}>{data.financialDeep.twelveMonthMRR}</div>
                  <div style={{ fontSize:12, color:"#6b7280" }}>MRR (Middle estimate)</div>
                </div>
              </div>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase" as const, color:"#374151", marginBottom:10, letterSpacing:"0.07em" }}>Revenue Projections — Year 1</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                {([{ key:"cautious" as const, label:"Cautious", color:"#6b7280", highlight:false }, { key:"middle" as const, label:"Middle", color:"#0ea5e9", highlight:true }, { key:"optimistic" as const, label:"Optimistic", color:"#10b981", highlight:false }]).map(({ key, label, color, highlight }) => {
                  const s = data.financialDeep?.revenueScenarios?.[key];
                  if (!s) return null;
                  return (
                    <div key={key} style={{ border:"2px solid "+(highlight?color:"#e5e7eb"), borderRadius:10, padding:14, position:"relative" as const }}>
                      {highlight && <div style={{ position:"absolute" as const, top:-10, left:"50%", transform:"translateX(-50%)", background:color, color:"white", padding:"2px 10px", borderRadius:999, fontSize:11, fontWeight:600, whiteSpace:"nowrap" as const }}>Most Likely</div>}
                      <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, color, marginBottom:7 }}>{label}</div>
                      <div style={{ fontSize:20, fontWeight:800, color:"#111827" }}>{s.mrr}</div>
                      <div style={{ fontSize:11, color:"#9ca3af", marginTop:3 }}>{s.probability} likely</div>
                      <div style={{ fontSize:11, color:"#6b7280", marginTop:6 }}>{s.assumption}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
          {data.fundabilityRadar && (
            <Card title="Fundability Radar" sub="Investor lens">
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                {Object.entries(data.fundabilityRadar).map(([key, dim]) => {
                  const d = dim as { score: number; note: string };
                  const c = d.score>=7?"#10b981":d.score>=5?"#f59e0b":"#ef4444";
                  return (
                    <div key={key} style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:12 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:"#374151", textTransform:"capitalize" as const }}>{key}</div>
                        <div style={{ fontSize:14, fontWeight:700, color:c }}>{d.score}/10</div>
                      </div>
                      <div style={{ height:4, background:"#e5e7eb", borderRadius:2, marginBottom:7 }}>
                        <div style={{ width:(d.score*10)+"%", height:"100%", background:c, borderRadius:2 }} />
                      </div>
                      <p style={{ fontSize:11, color:"#9ca3af", margin:0, lineHeight:1.4 }}>{d.note}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      );
      case "validate": return (
        <div>
          {(data.validationChecklist?.length??0) > 0 && (
            <Card title="Validate Before Building" sub={(data.validationChecklist?.length??0)+" assumptions to test"}>
              {data.validationChecklist?.map((item,i) => (
                <div key={i} style={{ borderLeft:"4px solid "+(item.risk==="high"?"#ef4444":item.risk==="medium"?"#f59e0b":"#10b981"), paddingLeft:14, marginBottom:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:5 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"#111827", flex:1, marginRight:10 }}>{i+1}. {item.assumption}</div>
                    <Pill text={item.risk.toUpperCase()+" RISK"} color={item.risk==="high"?"red":item.risk==="medium"?"orange":"green"} />
                  </div>
                  <p style={{ fontSize:12, color:"#6b7280", margin:0 }}>Test: {item.howToTest}</p>
                </div>
              ))}
            </Card>
          )}
          {data.customerInterviewGuide && (
            <Card title="Customer Interview Guide" sub={"Non-leading questions — Target: "+data.customerInterviewGuide.targetInterviews+" interviews"}>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, color:"#374151", marginBottom:9, letterSpacing:"0.07em" }}>Questions to Ask</div>
                {data.customerInterviewGuide.questions.map((q,i) => (
                  <div key={i} style={{ display:"flex", gap:10, marginBottom:7 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:"#0ea5e9", minWidth:18, flexShrink:0 }}>{i+1}.</span>
                    <span style={{ fontSize:13, color:"#374151" }}>{q}</span>
                  </div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, color:"#2563eb", marginBottom:7 }}>Where to Find</div>
                  {data.customerInterviewGuide.whereToFindThem.map((w,i) => <div key={i} style={{ fontSize:12, color:"#374151", marginBottom:3 }}>• {w}</div>)}
                </div>
                <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, color:"#16a34a", marginBottom:7 }}>Green Signals</div>
                  {data.customerInterviewGuide.greenSignals.map((s,i) => <div key={i} style={{ fontSize:12, color:"#374151", marginBottom:3 }}>• {s}</div>)}
                </div>
                <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, color:"#dc2626", marginBottom:7 }}>Red Signals</div>
                  {data.customerInterviewGuide.redSignals.map((s,i) => <div key={i} style={{ fontSize:12, color:"#374151", marginBottom:3 }}>• {s}</div>)}
                </div>
              </div>
            </Card>
          )}
        </div>
      );
      case "action": return (
        <div>
          <Card title="Your Opportunity" sub="The gap you can own" right={<button style={{ background:"#111827", color:"white", padding:"4px 12px", borderRadius:6, border:"none", fontSize:12, cursor:"pointer", fontWeight:600 }}>Act Now</button>}>
            <div style={{ fontSize:15, fontWeight:700, color:"#111827", marginBottom:16, lineHeight:1.5 }}>{data.opportunity?.headline}</div>
            {(() => {
              const items = data.opportunity?.actionItems ?? [];
              const cols = items.length <= 3 ? items.length : items.length === 4 ? 2 : 3;
              return (
                <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols}, 1fr)`, gap:10 }}>
                  {items.map((item,i) => (
                    <div key={i} style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:12 }}>
                      <div style={{ width:24, height:24, background:"#111827", color:"white", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, marginBottom:8 }}>{item.step}</div>
                      <div style={{ fontSize:13, fontWeight:600, color:"#111827", marginBottom:5 }}>{item.action}</div>
                      <p style={{ fontSize:12, color:"#6b7280", margin:0, lineHeight:1.5 }}>{item.detail}</p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </Card>
          {(data.goToMarket?.launchPhases?.length??0) > 0 && (
            <Card title="Launch Roadmap" sub="Phased go-to-market plan">
              {data.goToMarket?.launchPhases?.map((phase,i) => (
                <div key={i} style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:14, marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:28, height:28, background:"#111827", color:"white", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, flexShrink:0 }}>{phase.phase}</div>
                      <span style={{ fontSize:14, fontWeight:700, color:"#111827" }}>{phase.name}</span>
                    </div>
                    <span style={{ fontSize:12, color:"#9ca3af" }}>{phase.duration}</span>
                  </div>
                  {phase.steps.map((step,j) => (
                    <div key={j} style={{ display:"flex", gap:8, marginBottom:6 }}>
                      <span style={{ color:"#10b981", fontSize:14, flexShrink:0 }}>✓</span>
                      <span style={{ fontSize:13, color:"#374151" }}>{step}</span>
                    </div>
                  ))}
                </div>
              ))}
            </Card>
          )}
        </div>
      );
      case "synthesis": return (
        <div>
          <Card title="Synthesis" sub="Your idea, the full picture">
            <div style={{ display:"flex", gap:20, marginBottom:18 }}>
              <ScoreCircle size={80} />
              <p style={{ fontSize:14, lineHeight:1.7, color:"#374151", margin:0, flex:1 }}>{data.synthesis?.oneParagraph}</p>
            </div>
            {data.oneLiner && (
              <div style={{ background:"#f5f3ff", border:"1px solid #ddd6fe", borderRadius:10, padding:14, display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, color:"#7c3aed", marginBottom:4, letterSpacing:"0.07em" }}>Your One-Liner</div>
                  <div style={{ fontSize:13, fontStyle:"italic" as const, color:"#1e1b4b" }}>"{data.oneLiner}"</div>
                </div>
                <button onClick={() => navigator.clipboard?.writeText(data.oneLiner??"")} style={{ padding:"5px 12px", borderRadius:6, border:"1px solid #ddd6fe", background:"white", cursor:"pointer", fontSize:12, flexShrink:0, marginLeft:12 }}>Copy</button>
              </div>
            )}
          </Card>
          {data.synthesis && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:14 }}>
                <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase" as const, color:"#374151", marginBottom:10, letterSpacing:"0.07em" }}>Working For You</div>
                {data.synthesis.workingForYou.map((item,i) => (
                  <div key={i} style={{ display:"flex", gap:8, marginBottom:7 }}>
                    <span style={{ color:"#10b981", fontSize:14, flexShrink:0 }}>●</span>
                    <span style={{ fontSize:13, color:"#374151" }}>{item}</span>
                  </div>
                ))}
              </div>
              <div style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:14 }}>
                <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase" as const, color:"#374151", marginBottom:10, letterSpacing:"0.07em" }}>Watch Out</div>
                {data.synthesis.watchOutFor.map((item,i) => (
                  <div key={i} style={{ display:"flex", gap:8, marginBottom:7 }}>
                    <span style={{ color:"#f59e0b", fontSize:14, flexShrink:0 }}>●</span>
                    <span style={{ fontSize:13, color:"#374151" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
      default: return null;
    }
  };

  return (
    <div style={{ background:"white", border:"1px solid #e5e7eb", borderRadius:16, overflow:"hidden", display:"flex", height:"calc(100vh - 76px)", marginTop:8 }}>
      <div style={{ width:220, borderRight:"1px solid #e5e7eb", padding:"14px 8px", flexShrink:0, background:"#fafafa", display:"flex", flexDirection:"column" as const, gap:2, overflowY:"auto" as const }}>
        <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.09em", color:"#9ca3af", marginBottom:8, paddingLeft:8, display:"flex", alignItems:"center", justifyContent:"space-between", paddingRight:8 }}>
          <span>Analysis</span>
          <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 7px", borderRadius:999, background:"#dcfce7", border:"1px solid #86efac", fontSize:9, fontWeight:700, color:"#16a34a" }}>
              <span style={{ width:5, height:5, borderRadius:"50%", background:"#10b981", animation:"pulse 1.5s ease-in-out infinite", flexShrink:0, display:"inline-block" }} />
              Live
            </span>
        </div>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); document.getElementById('gap-tab-content')?.scrollTo({top:0}); }} style={{ display:"flex", alignItems:"center", width:"100%", padding:"8px 10px", borderRadius:8, background:isActive?"white":"transparent", border:"1px solid "+(isActive?"#e5e7eb":"transparent"), cursor:"pointer", textAlign:"left" as const, boxShadow:isActive?"0 1px 2px rgba(0,0,0,0.05)":"none", gap:8 }}>
              <span style={{ fontSize:12, color:tab.id==="overview"?"#6366f1":"#10b981", flexShrink:0 }}>{tab.id==="overview"?"●":"✓"}</span>
              <span style={{ fontSize:13, fontWeight:isActive?600:400, color:isActive?"#111827":"#374151", flex:1 }}>{tab.label}</span>
              {tab.score !== undefined && <span style={{ background:"#6366f1", color:"white", padding:"1px 6px", borderRadius:4, fontSize:11, fontWeight:700, flexShrink:0 }}>{tab.score}</span>}
              <span style={{ fontSize:12, color:"#9ca3af", flexShrink:0 }}>{isActive?"↓":"›"}</span>
            </button>
          );
        })}
      </div>
      <div id="gap-tab-content" style={{ flex:1, padding:22, overflowY:"auto" as const, background:"white" }}>
        {renderTab()}
      </div>
    </div>
  );
}

function DigSampleReport() {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ["Overview","Market Data","Community Signals","Competitors","Market Gaps","Go-to-Market","Financials","Validate","Action Plan","Synthesis"];

  const tabContent: Record<number, React.ReactNode> = {
    0: (
      <div style={{ display:"flex", flexDirection:"column" as const, gap:12 }}>
        <div style={{ background:"white", border:"1px solid #e5e7eb", borderRadius:12, padding:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:12 }}>
            <div style={{ width:68, height:68, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:800, flexShrink:0 }}>74</div>
            <div>
              <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".07em", color:"#7c3aed", marginBottom:3 }}>Market Score · Real Opportunity</div>
              <div style={{ fontSize:14, fontWeight:700, color:"#111", marginBottom:4 }}>Strong gap in the social accountability layer</div>
              <div style={{ fontSize:12, color:"#6b7280", lineHeight:1.5 }}>Apps track habits. None make you prove it to someone who actually cares. Gen Z wants to be watched — not just streaked.</div>
            </div>
          </div>
          <div style={{ background:"#f5f3ff", border:"1px solid #ddd6fe", borderRadius:8, padding:"9px 12px" }}>
            <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".07em", color:"#7c3aed", marginBottom:2 }}>Your One-Liner</div>
            <div style={{ fontSize:12, fontStyle:"italic" as const, color:"#1e1b4b" }}>"The habit app that makes you prove it — to your friends."</div>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          <div style={{ background:"#f0fdfb", border:"1px solid #ccfbf1", borderRadius:9, padding:"10px 12px" }}><div style={{ fontSize:8, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".07em", color:"#0d9488", marginBottom:4 }}>Biggest Opportunity</div><div style={{ fontSize:11.5, fontWeight:700, color:"#111", marginBottom:3 }}>BeReal-style habit proof</div><div style={{ fontSize:10.5, color:"#6b7280", lineHeight:1.45 }}>No app forces you to show friends you did the thing. Streaks break silently with zero social cost.</div></div>
          <div style={{ background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:9, padding:"10px 12px" }}><div style={{ fontSize:8, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".07em", color:"#ea580c", marginBottom:4 }}>Biggest Risk</div><div style={{ fontSize:11.5, fontWeight:700, color:"#111", marginBottom:3 }}>Habitica has brand loyalty</div><div style={{ fontSize:10.5, color:"#6b7280", lineHeight:1.45 }}>Strong gamification, weak Gen Z retention after week 2. Social layer is just leaderboards nobody checks.</div></div>
          <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:9, padding:"10px 12px" }}><div style={{ fontSize:8, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".07em", color:"#2563eb", marginBottom:4 }}>First Move</div><div style={{ fontSize:11.5, fontWeight:700, color:"#111", marginBottom:3 }}>Post in r/getdisciplined</div><div style={{ fontSize:10.5, color:"#6b7280", lineHeight:1.45 }}>2.3K upvotes: "I need someone to check on me." Your early adopters are writing your marketing copy.</div></div>
        </div>
      </div>
    ),
    1: (
      <div style={{ display:"flex", flexDirection:"column" as const, gap:10 }}>
        <div style={{ display:"flex", gap:10 }}>
          {[{lbl:"TAM",val:"$4.2B",sub:"Global wellness apps",c:"#7c3aed",bg:"#f5f3ff",br:"#ddd6fe"},{lbl:"SAM",val:"$800M",sub:"Gen Z segment",c:"#16a34a",bg:"#f0fdf4",br:"#bbf7d0"},{lbl:"SOM",val:"$24M",sub:"Realistic 3yr capture",c:"#2563eb",bg:"#eff6ff",br:"#bfdbfe"}].map((m,i)=>(
            <div key={m.lbl} style={{ display:"flex", alignItems:"center", gap:10, flex:1 }}>
              {i>0 && <div style={{ display:"flex", alignItems:"center", color:"#9ca3af", fontSize:18 }}>→</div>}
              <div style={{ flex:1, background:m.bg, border:`1px solid ${m.br}`, borderRadius:10, padding:14, textAlign:"center" as const }}>
                <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".07em", color:m.c, marginBottom:6 }}>{m.lbl} est.</div>
                <div style={{ fontSize:28, fontWeight:800, color:"#111", lineHeight:1 }}>{m.val}</div>
                <div style={{ fontSize:11, color:"#9ca3af", marginTop:4 }}>{m.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, padding:"10px 14px", display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ color:"#16a34a", fontWeight:700, fontSize:16 }}>↗</span>
          <span style={{ fontSize:13, fontWeight:600, color:"#15803d" }}>18% annual growth</span>
          <span style={{ fontSize:10, padding:"2px 7px", borderRadius:4, background:"#dcfce7", color:"#16a34a", fontWeight:700 }}>Growing</span>
        </div>
      </div>
    ),
    2: (
      <div style={{ display:"flex", flexDirection:"column" as const, gap:10 }}>
        {[{sub:"r/getdisciplined",c:"#ea580c",badge:"HIGH PAIN",bc:"#fef2f2",votes:"↑ 2,341",q:'"I need someone to actually check on me, not an app that sends push notifications I swipe away."'},{sub:"r/habittracking",c:"#7c3aed",badge:"NEED",bc:"#fff7ed",votes:"↑ 891",q:'"The only habit that stuck was when my friend texted every morning asking if I did it."'},{sub:"@user on X",c:"#0ea5e9",badge:"PAIN",bc:"#fef2f2",votes:"♥ 1.2K",q:'"Why is there no BeReal but for habits. Someone build this please."'}].map((s,i)=>(
          <div key={i} style={{ borderLeft:`3px solid ${s.c}`, paddingLeft:14 }}>
            <div style={{ display:"flex", gap:6, marginBottom:5, alignItems:"center" }}>
              <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:4, background:s.bc, color:s.c }}>{s.sub}</span>
              <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:4, background:"#fef2f2", color:"#dc2626" }}>{s.badge}</span>
              <span style={{ fontSize:10, color:"#9ca3af" }}>{s.votes}</span>
            </div>
            <p style={{ fontSize:12, fontStyle:"italic" as const, color:"#374151" }}>{s.q}</p>
          </div>
        ))}
      </div>
    ),
    3: (
      <div style={{ display:"flex", flexDirection:"column" as const, gap:8 }}>
        {[{name:"Habitica",tag:"RPG habit tracker",threat:"MEDIUM 6/10",tc:"#ea580c",str:["Strong gamification","Large community"],wk:["Complex UI, Gen Z drops week 2","No real social proof layer"]},{name:"Streaks",tag:"Minimalist iOS tracker",threat:"LOW 3/10",tc:"#16a34a",str:["Beautiful design","Apple Watch support"],wk:["Completely solo","No social layer at all"]}].map((c,i)=>(
          <div key={i} style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:13 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <div><div style={{ fontSize:13, fontWeight:700, color:"#2563eb" }}>{c.name}</div><div style={{ fontSize:11, color:"#6b7280" }}>{c.tag}</div></div>
              <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:4, background:c.tc==="#16a34a"?"#f0fdf4":"#fff7ed", color:c.tc }}>{c.threat}</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <div><div style={{ fontSize:9, fontWeight:700, color:"#10b981", textTransform:"uppercase" as const, marginBottom:4 }}>Strengths</div>{c.str.map(s=><div key={s} style={{ fontSize:11, color:"#374151" }}>• {s}</div>)}</div>
              <div><div style={{ fontSize:9, fontWeight:700, color:"#ef4444", textTransform:"uppercase" as const, marginBottom:4 }}>Weaknesses</div>{c.wk.map(w=><div key={w} style={{ fontSize:11, color:"#374151" }}>• {w}</div>)}</div>
            </div>
          </div>
        ))}
      </div>
    ),
    4: (
      <div style={{ display:"flex", flexDirection:"column" as const, gap:8 }}>
        {[{title:"Social accountability layer",status:"UNTAPPED",sc:"#2563eb",desc:"No app currently makes habit completion a social event. The proof-of-work concept applied to personal growth.",score:9},{title:"AI nudge timing",status:"EMERGING",sc:"#ea580c",desc:"Personalized nudges based on calendar, energy patterns, and past slip-up times. Nobody has done this well for Gen Z.",score:7}].map((g,i)=>(
          <div key={i} style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:13 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:7 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#111" }}>{g.title}</div>
              <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:4, background:"#eff6ff", color:g.sc }}>{g.status}</span>
            </div>
            <p style={{ fontSize:12, color:"#6b7280", marginBottom:8 }}>{g.desc}</p>
            <div style={{ height:4, background:"#e5e7eb", borderRadius:2 }}><div style={{ width:`${g.score*10}%`, height:"100%", background:"#0ea5e9", borderRadius:2 }} /></div>
          </div>
        ))}
      </div>
    ),
    5: (
      <div style={{ display:"flex", flexDirection:"column" as const, gap:10 }}>
        <div style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:13 }}>
          <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".07em", color:"#0d9488", marginBottom:10 }}>Target Customer</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
            {[{lbl:"WHO",v:"Gen Z 18-24, college or first job"},{lbl:"PAIN",v:"Starts strong, drops week 2, no accountability"},{lbl:"BUDGET",v:"$3-8/mo. Pays for Spotify. Won't pay for boring."},{lbl:"WHERE",v:"TikTok, Discord, r/selfimprovement"}].map(c=>(
              <div key={c.lbl} style={{ background:"#fafafa", border:"1px solid #e5e7eb", borderRadius:7, padding:8 }}><div style={{ fontSize:9, fontWeight:700, color:"#0d9488", marginBottom:3 }}>{c.lbl}</div><div style={{ fontSize:11, color:"#374151" }}>{c.v}</div></div>
            ))}
          </div>
        </div>
        <div style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:13 }}>
          <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".07em", color:"#9ca3af", marginBottom:8 }}>GTM Channels</div>
          {[{name:"Reddit organic",type:"PRIMARY",cac:"$0"},{name:"TikTok accountability content",type:"SECONDARY",cac:"$4"}].map(c=>(
            <div key={c.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:"1px solid #f3f4f6" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}><span style={{ fontSize:12, fontWeight:700, color:"#111" }}>{c.name}</span><span style={{ fontSize:9, padding:"2px 6px", borderRadius:4, background:c.type==="PRIMARY"?"#eff6ff":"#f0fdf4", color:c.type==="PRIMARY"?"#2563eb":"#16a34a", fontWeight:700 }}>{c.type}</span></div>
              <div style={{ fontSize:11, fontWeight:700, color:"#111" }}>Est. CAC: {c.cac}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    6: (
      <div style={{ display:"flex", flexDirection:"column" as const, gap:10 }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
          <div style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:13 }}><div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase" as const, color:"#ef4444", marginBottom:5 }}>Monthly Burn</div><div style={{ fontSize:22, fontWeight:800, color:"#111" }}>$45</div><div style={{ fontSize:10, color:"#6b7280", marginTop:3 }}>Infra $15 · Tools $20 · Ads $10</div></div>
          <div style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:13 }}><div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase" as const, color:"#10b981", marginBottom:5 }}>Break-Even</div><div style={{ fontSize:22, fontWeight:800, color:"#111" }}>Month 4</div><div style={{ fontSize:10, color:"#6b7280", marginTop:3 }}>At 150 paying users ($5/mo)</div></div>
          <div style={{ background:"#f0fdfe", border:"1px solid #a5f3fc", borderRadius:10, padding:13 }}><div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase" as const, color:"#0891b2", marginBottom:5 }}>12-Month MRR</div><div style={{ fontSize:22, fontWeight:800, color:"#111" }}>$8,400</div><div style={{ fontSize:10, color:"#6b7280", marginTop:3 }}>Middle estimate</div></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
          <div style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:12 }}><div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase" as const, color:"#6b7280", marginBottom:5 }}>Cautious</div><div style={{ fontSize:18, fontWeight:800, color:"#6b7280" }}>$2,400</div><div style={{ fontSize:10, color:"#9ca3af" }}>30% likely</div></div>
          <div style={{ border:"2px solid #0ea5e9", borderRadius:10, padding:12, position:"relative" as const }}><div style={{ position:"absolute" as const, top:-9, left:"50%", transform:"translateX(-50%)", background:"#0ea5e9", color:"white", padding:"1px 8px", borderRadius:999, fontSize:10, fontWeight:600, whiteSpace:"nowrap" as const }}>Most Likely</div><div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase" as const, color:"#0ea5e9", marginBottom:5 }}>Middle</div><div style={{ fontSize:18, fontWeight:800, color:"#111" }}>$8,400</div><div style={{ fontSize:10, color:"#9ca3af" }}>55% likely</div></div>
          <div style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:12 }}><div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase" as const, color:"#10b981", marginBottom:5 }}>Optimistic</div><div style={{ fontSize:18, fontWeight:800, color:"#10b981" }}>$24K</div><div style={{ fontSize:10, color:"#9ca3af" }}>15% likely</div></div>
        </div>
      </div>
    ),
    7: (
      <div style={{ display:"flex", flexDirection:"column" as const, gap:10 }}>
        {[{q:"Will Gen Z pay for accountability?",risk:"HIGH RISK",rc:"#dc2626",rb:"#fef2f2",rl:"4px solid #ef4444",how:"Run a $3/mo waitlist on Stripe. 100 signups in 2 weeks = validated."},{q:"Do friends want to be accountability partners?",risk:"MEDIUM",rc:"#d97706",rb:"#fff7ed",rl:"4px solid #f59e0b",how:"WhatsApp group, 10 strangers. You play the AI for 2 weeks. Track dropout rate."},{q:"Is the viral loop real?",risk:"LOW RISK",rc:"#16a34a",rb:"#f0fdf4",rl:"4px solid #10b981",how:"Track referral rate in manual test. 3+ organic invites = loop works."}].map((v,i)=>(
          <div key={i} style={{ borderLeft:v.rl, paddingLeft:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><div style={{ fontSize:12, fontWeight:600, color:"#111" }}>{v.q}</div><span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:4, background:v.rb, color:v.rc, flexShrink:0, marginLeft:8 }}>{v.risk}</span></div>
            <p style={{ fontSize:11, color:"#6b7280" }}>Test: {v.how}</p>
          </div>
        ))}
      </div>
    ),
    8: (
      <div style={{ display:"flex", flexDirection:"column" as const, gap:10 }}>
        <div style={{ fontSize:14, fontWeight:700, color:"#111", marginBottom:4 }}>Prove it before you build it — 3 moves</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          {[{n:1,title:"Post the problem",body:'r/getdisciplined: "Anyone want a human accountability partner for 2 weeks?" Goal: 50 replies in 48 hours.'},{n:2,title:"Run it manually",body:"WhatsApp group. 10 strangers. You be the AI. Daily check-ins for 2 weeks."},{n:3,title:"Charge before building",body:"$3/mo waitlist on Stripe. 100 paying = build. Less = pivot angle, not idea."}].map(a=>(
            <div key={a.n} style={{ border:"1px solid #e5e7eb", borderRadius:9, padding:11 }}>
              <div style={{ width:22, height:22, background:"#111", color:"#fff", borderRadius:5, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, marginBottom:7 }}>{a.n}</div>
              <div style={{ fontSize:12, fontWeight:700, color:"#111", marginBottom:3 }}>{a.title}</div>
              <div style={{ fontSize:10, color:"#6b7280" }}>{a.body}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    9: (
      <div style={{ display:"flex", flexDirection:"column" as const, gap:10 }}>
        <div style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:14 }}>
          <div style={{ display:"flex", gap:14, marginBottom:12 }}>
            <div style={{ width:60, height:60, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, flexShrink:0 }}>74</div>
            <p style={{ fontSize:13, lineHeight:1.65, color:"#374151" }}>This is a genuine gap. BeReal-style accountability for habits doesn't exist. Gen Z is explicitly asking for it on Reddit right now. The market is growing, competition is weak on the social layer, and the validation cost is nearly zero.</p>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:12 }}><div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".07em", color:"#374151", marginBottom:8 }}>Working For You</div>{["Gen Z actively complaining about this gap","Low build cost with Lovable + Supabase","Viral loop is the product itself"].map(x=><div key={x} style={{ fontSize:12, color:"#374151", marginBottom:5 }}>● {x}</div>)}</div>
          <div style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:12 }}><div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".07em", color:"#374151", marginBottom:8 }}>Watch Out</div>{["Social fatigue is real — watch churn","Need critical mass for network effect","Monetizing free social behaviors is hard"].map(x=><div key={x} style={{ fontSize:12, color:"#374151", marginBottom:5 }}>● {x}</div>)}</div>
        </div>
      </div>
    ),
  };

  return (
    <div style={{ padding: "20px 0 40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase" as const, color: "var(--clr-text-4)" }}>What you'll get</span>
        <span style={{ fontSize: 11, fontStyle: "italic" as const, color: "var(--clr-text-3)", background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 5, padding: "2px 8px" }}>« AI habit tracker with social accountability »</span>
        <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--clr-text-4)" }}>Click the tabs ↓</span>
      </div>
      <div style={{ background: "var(--clr-surface)", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden", display: "flex", height: 420 }}>
        {/* Sidebar */}
        <div style={{ width: 190, background: "#fafafa", borderRight: "1px solid #e5e7eb", padding: "12px 8px", display: "flex", flexDirection: "column" as const, gap: 2, flexShrink: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase" as const, color: "#9ca3af", marginBottom: 6, paddingLeft: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>Analysis</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "1px 6px", borderRadius: 999, background: "#dcfce7", border: "1px solid #86efac", fontSize: 8, fontWeight: 700, color: "#16a34a" }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#10b981", animation: "pulse 1.5s ease-in-out infinite" }} />
              Live
            </span>
          </div>
          {tabs.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{ display: "flex", alignItems: "center", width: "100%", padding: "7px 10px", borderRadius: 7, fontSize: 12, cursor: "pointer", gap: 7, border: activeTab === i ? "1px solid #e5e7eb" : "1px solid transparent", background: activeTab === i ? "white" : "transparent", color: activeTab === i ? "#111" : "#374151", fontWeight: activeTab === i ? 600 : 400, fontFamily: "inherit", boxShadow: activeTab === i ? "0 1px 2px rgba(0,0,0,0.05)" : "none", textAlign: "left" as const }}>
              <span style={{ fontSize: 10, color: activeTab === i ? "#6366f1" : "#9ca3af", flexShrink: 0 }}>{activeTab === i ? "●" : "✓"}</span>
              <span style={{ flex: 1 }}>{tab}</span>
              {i === 0 && <span style={{ background: "#6366f1", color: "white", padding: "1px 5px", borderRadius: 3, fontSize: 10, fontWeight: 700 }}>74</span>}
            </button>
          ))}
        </div>
        {/* Content */}
        <div style={{ flex: 1, padding: "18px 20px", overflowY: "auto" as const }}>
          {tabContent[activeTab]}
        </div>
      </div>
      {/* Unlock bar */}
      <div style={{ background: "#111", borderRadius: 12, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginTop: 12 }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>Run this on <strong style={{ color: "#fff" }}>your idea</strong> — all 10 sections, live data from today, market score, launch roadmap</span>
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 18px", background: "#fff", color: "#111", borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", border: "none", whiteSpace: "nowrap" as const }}>
          ★ Dig my idea · 1 credit
        </button>
      </div>
    </div>
  );
}

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

// ââ Loading Skeleton âââââââââââââââââââââââââââââââââââââââââââ
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
        Running {tool.name}â¦
      </div>
    </div>
  );
}

// ââ Space Score Card âââââââââââââââââââââââââââââââââââââââââââ
function deriveScoreLabel(pct: number): { emoji: string; label: string } {
  if (pct >= 81) return { emoji: "ð¥", label: "Explosive" };
  if (pct >= 61) return { emoji: "ð¢", label: "Growing" };
  if (pct >= 41) return { emoji: "ð¡", label: "Warming Up" };
  if (pct >= 21) return { emoji: "ð ", label: "Crowded" };
  return { emoji: "ð´", label: "Dead Zone" };
}

function SpaceScoreCard({ score, summary, label }: { score: number; summary: string; label?: string }) {
  const pct = Math.max(0, Math.min(100, score));
  const labelEmojiMap: Record<string, string> = {
    "Dead Zone": "ð´", "Uncharted": "ð", "Fading": "ð«ï¸", "Crowded": "ð ",
    "Warming Up": "ð¡", "Growing": "ð¢", "Explosive": "ð¥",
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

/* ââ Trend Feed Result âââââââââââââââââââââââââââââââââââââââââââ */
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
              const dirIcon = sub.direction === "rising" ? "â" : sub.direction === "falling" ? "â" : "â";
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
                    {"â".repeat(Math.round(app.rating ?? 0))} {(app.rating ?? 0).toFixed(1)}
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
                  â² {ph.votes}
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

// ââ Data Source Badges ââââââââââââââââââââââââââââââââââââââââââ
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

// ââ Tool Selector Card âââââââââââââââââââââââââââââââââââââââââ
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
        fontSize: "0.75rem", fontWeight: 700,
        color: "var(--clr-text)", marginBottom: "0.5rem",
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
        {isSelected ? "Selected" : "Open"}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ transform: isSelected ? "translateX(2px)" : "none", transition: "transform 0.2s" }}>
          <path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

// ââ Input Section ââââââââââââââââââââââââââââââââââââââââââââââ
function InputSection({
  tool, idea, setIdea, budget, setBudget, techLevel, setTechLevel, platform, setPlatform,
  onSubmit, loading, textareaRef,
}: {
  tool: ToolConfig; idea: string; setIdea: (v: string) => void;
  budget: Budget; setBudget: (v: Budget) => void;
  techLevel: TechLevel; setTechLevel: (v: TechLevel) => void;
  platform: Platform; setPlatform: (v: Platform) => void;
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

          {/* Stack extras */}
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

          {/* Platform */}
          {tool.id === "stack-advisor" && (
            <div style={{ marginTop: 10 }}>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, color: "var(--clr-text-4)", marginBottom: "0.5rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Target platform
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { id: "web" as Platform, label: "Web", sub: "Browser / SaaS" },
                  { id: "mobile" as Platform, label: "Mobile", sub: "iOS / Android" },
                  { id: "both" as Platform, label: "Both", sub: "Web + Mobile" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setPlatform(opt.id)}
                    style={{
                      flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      padding: "0.5rem 0.4rem", borderRadius: 9, gap: 2,
                      background: platform === opt.id ? "rgba(var(--clr-text-rgb),0.08)" : "transparent",
                      border: platform === opt.id ? "1px solid rgba(var(--clr-text-rgb),0.3)" : "1px solid var(--clr-border)",
                      cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
                    }}
                  >
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: platform === opt.id ? "var(--clr-text)" : "var(--clr-text-3)" }}>{opt.label}</span>
                    <span style={{ fontSize: "0.65rem", color: platform === opt.id ? "var(--clr-text-3)" : "var(--clr-text-6)" }}>{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit row */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginTop: "1.125rem", paddingTop: "1.125rem",
            borderTop: "1px solid var(--clr-border-deep)",
          }}>
            <span style={{ fontSize: "0.7rem", color: "var(--clr-text-8)" }}>ââµ to run</span>
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
                  Runningâ¦
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

// ââ GitHub repo type ââââââââââââââââââââââââââââââââââââââââââââ
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

// ââ Dig structured types âââââââââââââââââââââââââââââ
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
interface GapCommunitySignal {
  quote: string;
  source: "reddit" | "twitter";
  sentiment: "pain" | "need" | "positive";
  subredditOrHandle: string;
}
interface GapRedditPost {
  subreddit: string;
  title: string;
  body: string;
  upvotes?: number;
  sentiment: "pain" | "need" | "positive";
}
interface GapXPost {
  handle: string;
  text: string;
  likes?: number;
  sentiment: "pain" | "need" | "positive";
}
interface GapValidationItem {
  assumption: string;
  risk: "high" | "medium" | "low";
  howToTest: string;
}
interface GapMarketSize {
  tam: string;
  sam: string;
  som: string;
  growthRate: string;
}
interface GapSynthesis {
  oneParagraph: string;
  workingForYou: string[];
  watchOutFor: string[];
}
interface GapTargetCustomerDeep {
  whoTheyAre: string;
  howTheyThink: string;
  availableMoney: string;
  howTheyBuy: string;
  triggerEvents: string[];
  whereToFindThem: string[];
}
interface GapIndustryTrend {
  trend: string;
  evidence: string;
  impact: "high" | "medium" | "low";
}
interface GapIndustryTrends {
  now: GapIndustryTrend[];
  emerging: GapIndustryTrend[];
  structural: GapIndustryTrend[];
}
interface GapMarketSegment {
  name: string;
  fit: "primary" | "secondary" | "tertiary";
  size: string;
  growth: string;
  description: string;
}
interface GapGTMChannel {
  name: string;
  type: "primary" | "secondary" | "experimental";
  estimatedCAC: string;
  description: string;
}
interface GapLaunchPhase {
  phase: number;
  name: string;
  duration: string;
  steps: string[];
}
interface GapGoToMarket {
  channels: GapGTMChannel[];
  launchTarget: string;
  launchPhases: GapLaunchPhase[];
}
interface GapCustomerInterviewGuide {
  questions: string[];
  whereToFindThem: string[];
  greenSignals: string[];
  redSignals: string[];
  targetInterviews: number;
}
interface GapRevenueScenario { mrr: string; probability: string; assumption: string; }
interface GapFinancialDeep {
  monthlyBurn: { total: string; infrastructure: string; tools: string; marketing: string; acquisition: string; };
  breakEvenMonth: string;
  twelveMonthMRR: string;
  revenueScenarios: { cautious: GapRevenueScenario; middle: GapRevenueScenario; optimistic: GapRevenueScenario; };
  pricingBenchmark: string;
}
interface GapFundabilityDimension { score: number; note: string; }
interface GapFundabilityRadar {
  team: GapFundabilityDimension;
  marketSize: GapFundabilityDimension;
  product: GapFundabilityDimension;
  competition: GapFundabilityDimension;
  marketing: GapFundabilityDimension;
  fundingNeed: GapFundabilityDimension;
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
  targetCustomerDeep?: GapTargetCustomerDeep;
  industryTrends?: GapIndustryTrends;
  marketSegments?: GapMarketSegment[];
  goToMarket?: GapGoToMarket;
  customerInterviewGuide?: GapCustomerInterviewGuide;
  financialDeep?: GapFinancialDeep;
  fundabilityRadar?: GapFundabilityRadar;
  communitySignals?: GapCommunitySignal[];
  redditPosts?: GapRedditPost[];
  xPosts?: GapXPost[];
  oneLiner?: string;
  marketSize?: GapMarketSize;
  validationChecklist?: GapValidationItem[];
  synthesis?: GapSynthesis;
}

function parseGapAnalysisJSON(raw: string): GapAnalysisData | null {
  const fenceMatch = raw.match(/```json\s*([\s\S]*?)```/);
  const rawTrimmed = raw.trim();
  const jsonStr = fenceMatch ? fenceMatch[1] : (rawTrimmed.startsWith('{') ? rawTrimmed : null);
  if (!jsonStr) return null;
  try {
    const data = JSON.parse(jsonStr);
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

// ââ Stack structured types ââââââââââââââââââââââââââââ
interface StackPhaseCosts {
  tools: { name: string; purpose: string; freeTier: boolean; monthlyCost: string }[];
  total: string;
}
interface StackPhase {
  name: string;
  subtitle: string;
  tools: { name: string; purpose: string; price: string; free: boolean; alternatives?: { name: string; reason: string }[] }[];
  costs?: StackPhaseCosts;
  vibeGuide?: { tool: string; url: string; prompt: string; tip?: string }[];
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

// ââ Stack Visual Result ââââââââââââââââââââââââââââââ
const PHASE_COLORS = ["var(--clr-text)", "var(--clr-text-2)", "var(--clr-text-3)", "var(--clr-text-5)", "var(--clr-text-6)"];
const PHASE_BGS = ["rgba(var(--clr-text-rgb),0.04)", "rgba(var(--clr-text-rgb),0.04)", "rgba(var(--clr-text-rgb),0.04)", "rgba(var(--clr-text-rgb),0.04)", "rgba(var(--clr-text-rgb),0.04)"];

function StackAdvisorResult({ data, ytVideos }: { data: StackAdvisorData; ytVideos?: YouTubeVideo[] }) {
  // Build a lookup: tool name (lowercased) â best matching YouTube video
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
  const [stackTab, setStackTab] = useState(0);
  const stackTabs = [
    { label: "Overview", icon: "●" },
    ...data.phases.map((p, i) => ({ label: p.name.replace(/^Phase \d+:\s*/i, ''), icon: isPhaseZero(p.name) ? "0" : String(i) })),
    ...(data.buildOrder.length > 0 ? [{ label: "Build Order", icon: "→" }] : []),
    ...(data.mistakes.length > 0 ? [{ label: "Avoid These", icon: "✗" }] : []),
    ...((data.scalability.length > 0 || data.upgrades.length > 0) ? [{ label: "Scale Up", icon: "↑" }] : []),
  ];
  const totalCost = data.phases.reduce((sum, p) => {
    const t = p.costs?.total ?? "";
    const m = t.match(/\$([\d.]+)/);
    return sum + (m ? parseFloat(m[1]) : 0);
  }, 0);

  const renderStackTab = () => {
    // Overview tab
    if (stackTab === 0) return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {data.headline && (
          <div style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, color: "#7c3aed", marginBottom: 4, letterSpacing: "0.07em" }}>Recommendation</div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#111827", lineHeight: 1.55 }}>{data.headline}</p>
            {data.timeToMvp && (
              <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 6, background: "rgba(99,102,241,0.08)", border: "1px solid #ddd6fe", fontSize: 12, fontWeight: 600, color: "#4f46e5" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  MVP: {data.timeToMvp}
                </span>
                {totalCost > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: 12, fontWeight: 600, color: "#16a34a" }}>~${totalCost}/mo total</span>}
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 6, background: "rgba(99,102,241,0.06)", border: "1px solid #e0e7ff", fontSize: 12, fontWeight: 600, color: "#6366f1" }}>{data.phases.length} phases</span>
              </div>
            )}
          </div>
        )}
        {/* Phase overview cards */}
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
          {data.phases.map((phase, pi) => {
            const isP0 = isPhaseZero(phase.name);
            const colors = ["#6366f1","#10b981","#0ea5e9","#f59e0b","#8b5cf6"];
            const bgs = ["#f5f3ff","#f0fdf4","#f0f9ff","#fffbeb","#faf5ff"];
            const c = colors[pi] ?? colors[0];
            const bg = bgs[pi] ?? bgs[0];
            const phaseName = phase.name.replace(/^Phase\s*\d+:\s*/i, '');
            return (
              <button key={pi} onClick={() => setStackTab(pi + 1)}
                style={{ background: bg, border: `1px solid ${c}33`, borderRadius: 10, padding: "12px 16px", cursor: "pointer", textAlign: "left" as const, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                {/* Phase number circle */}
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${c}18`, border: `2px solid ${c}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: c }}>{isP0 ? "0" : String(pi)}</span>
                </div>
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" as const }}>
                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: c }}>{isP0 ? "Start here" : `Phase ${pi}`}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{phaseName}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.4 }}>{phase.subtitle}</div>
                </div>
                {/* Right: cost + tools count */}
                <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                  {phase.costs?.total && <div style={{ fontSize: 11, fontWeight: 700, color: c, marginBottom: 2 }}>{phase.costs.total.split("(")[0].trim()}</div>}
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>{phase.tools.length} tools →</div>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    );

    // Phase tabs
    const phaseIdx = stackTab - 1;
    if (phaseIdx >= 0 && phaseIdx < data.phases.length) {
      const phase = data.phases[phaseIdx];
      const isP0 = isPhaseZero(phase.name);
      const colors = ["#6366f1","#10b981","#0ea5e9","#f59e0b","#8b5cf6"];
      const c = colors[phaseIdx] ?? colors[0];
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: c, marginBottom: 3 }}>
                {isP0 ? "● Do This First" : `● Phase ${phaseIdx}`}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{phase.name.replace(/^Phase \d+:\s*/i, '')}</div>
              {phase.subtitle && <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{phase.subtitle}</div>}
            </div>
            {phase.costs?.total && (
                  <div style={{ textAlign: "right" as const, flexShrink: 0, maxWidth: 140 }}>
                <div style={{ fontSize: 9, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 2 }}>Phase total</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#111827", lineHeight: 1.3 }}>{phase.costs.total.split('(')[0].split('/mo')[0].trim() + (phase.costs.total.includes('/mo') ? '/mo' : '')}</div>
                {phase.costs.total.includes('(') && (
                  <div style={{ fontSize: 9, color: "#9ca3af", lineHeight: 1.4, marginTop: 2, wordBreak: "break-word" as const }}>{phase.costs.total.split('(')[1].replace(')','').trim()}</div>
                )}
              </div>
            )}
          </div>

          {/* Tools list */}
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
            {phase.tools.map((tool, ti) => {
              const ytVid = ytToolMap.get(tool.name.toLowerCase());
              return (
                <div key={ti} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "11px 14px", background: "#fafafa" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", flex: 1 }}>{tool.name}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: tool.free ? "#dcfce7" : "#fff7ed", color: tool.free ? "#16a34a" : "#ea580c", flexShrink: 0 }}>{tool.free ? "Free" : tool.price}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 6px 0", lineHeight: 1.5 }}>{tool.purpose}</p>
                  {tool.alternatives && tool.alternatives.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 5, marginTop: 6, borderTop: "1px solid #f3f4f6", paddingTop: 6 }}>
                      {tool.alternatives.map((alt, ai) => (
                        <div key={ai} style={{ display: "flex", flexDirection: "column" as const, gap: 2 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 5px", borderRadius: 3, background: "#f3f4f6", border: "1px solid #e5e7eb", color: "#9ca3af", flexShrink: 0, letterSpacing: "0.04em" }}>ALT</span>
                            <span style={{ fontSize: 11, color: "#374151", fontWeight: 600 }}>{alt.name}</span>
                          </div>
                          {alt.reason && <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", lineHeight: 1.4 }}>{alt.reason}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {ytVid && (
                    <a href={`https://youtube.com/watch?v=${ytVid.videoId}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, padding: "5px 8px", borderRadius: 6, background: "#fef2f2", border: "1px solid #fecaca", textDecoration: "none" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#dc2626"><path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.2 2.8 12 2.8 12 2.8s-4.2 0-6.8.1c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.3v2c0 2.1.3 4.2.3 4.2s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.2 21.6 12 21.6 12 21.6s4.2 0 6.8-.2c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.1.3-4.2v-2C23.3 9.1 23 7 23 7zm-13.5 8.6V8.4l8.1 3.6-8.1 3.6z"/></svg>
                      <span style={{ fontSize: 10, color: "#dc2626", fontWeight: 600 }}>{ytVid.title.substring(0, 45)}…</span>
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          {/* Cost breakdown */}
          {phase.costs && phase.costs.tools.length > 0 && (
            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, color: "#9ca3af", marginBottom: 9, letterSpacing: "0.07em" }}>Cost Breakdown</div>
              {phase.costs.tools.map((ct, ci) => (
                <div key={ci} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: ci < phase.costs!.tools.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{ct.name}</span>
                    <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>{ct.purpose}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {ct.freeTier && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: "#dcfce7", color: "#16a34a" }}>FREE</span>}
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{ct.monthlyCost}</span>
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, paddingTop: 8, borderTop: "1px solid #e5e7eb" }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>{phase.costs.total}</span>
              </div>
            </div>
          )}

          {/* Vibe Guide */}
          {(phase as any).vibeGuide && (phase as any).vibeGuide.length > 0 && (
            <div style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #f0f9ff 100%)", border: "1px solid #d1fae5", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                <span style={{ fontSize: 14 }}>🚀</span>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: "#0d9488" }}>How to actually do this</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                {(phase as any).vibeGuide.map((step: any, si: number) => (
                  <div key={si} style={{ background: "white", borderRadius: 8, padding: "12px 14px", border: "1px solid #d1fae5" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#0d9488", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, flexShrink: 0 }}>{si + 1}</div>
                      <a href={step.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 700, color: "#0d9488", textDecoration: "none" }}>Open {step.tool} →</a>
                    </div>
                    <div style={{ background: "#f0fdfa", borderRadius: 6, padding: "8px 10px", marginBottom: step.tip ? 8 : 0 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#0d9488", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 4 }}>Type this:</div>
                      <p style={{ fontSize: 13, color: "#134e4a", margin: 0, lineHeight: 1.6 }}>{step.prompt}</p>
                    </div>
                    {step.tip && (
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 8 }}>
                        <span style={{ fontSize: 12 }}>💡</span>
                        <p style={{ fontSize: 12, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>{step.tip}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Build Order tab
    const buildOrderTabIdx = data.phases.length + 1;
    const avoidTabIdx = buildOrderTabIdx + (data.buildOrder.length > 0 ? 1 : 0);
    const scaleTabIdx = avoidTabIdx + (data.mistakes.length > 0 ? 1 : 0);

    if (stackTab === buildOrderTabIdx && data.buildOrder.length > 0) return (
      <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
        {data.buildOrder.map((block, bi) => {
          const isLast = bi === data.buildOrder.length - 1;
          const colors = ["#6366f1","#10b981","#0ea5e9","#f59e0b","#8b5cf6"];
          const c = colors[bi % colors.length];
          return (
            <div key={bi} style={{ display: "flex", gap: "1rem", position: "relative", paddingBottom: isLast ? 0 : "1.25rem" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32, flexShrink: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${c}18`, border: `2px solid ${c}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: c, zIndex: 1 }}>{bi + 1}</div>
                {!isLast && <div style={{ width: 2, flex: 1, background: "#e5e7eb", marginTop: 4 }} />}
              </div>
              <div style={{ flex: 1, padding: "0.625rem 1rem", borderRadius: 12, background: "#fafafa", border: "1px solid #e5e7eb", marginTop: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: c, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{block.week}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{block.title}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {block.steps.map((step, si) => (
                    <div key={si} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", width: 16, height: 16, borderRadius: "50%", background: "white", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>{si + 1}</span>
                      <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );

    // Avoid These tab
    if (stackTab === avoidTabIdx && data.mistakes.length > 0) return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {data.mistakes.map((m, i) => (
          <div key={i} style={{ borderLeft: "4px solid #ef4444", paddingLeft: 14, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 5 }}>⚠ {m.title}</div>
            <p style={{ fontSize: 12, color: "#6b7280", margin: 0, lineHeight: 1.6 }}>{m.description}</p>
          </div>
        ))}
      </div>
    );

    // Scale Up tab
    if (stackTab === scaleTabIdx && (data.scalability.length > 0 || data.upgrades.length > 0)) return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {data.scalability.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, color: "#9ca3af", letterSpacing: "0.07em", marginBottom: 8 }}>Scalability Triggers</div>
            {data.scalability.map((s, i) => {
              const sevColor = s.severity === "high" ? "#ef4444" : s.severity === "medium" ? "#f59e0b" : "#10b981";
              return (
                <div key={i} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{s.trigger}</div>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: `${sevColor}18`, color: sevColor, flexShrink: 0, marginLeft: 8 }}>{s.severity.toUpperCase()}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 6px 0" }}>🔴 {s.whatBreaks}</p>
                  <p style={{ fontSize: 12, color: "#10b981", margin: 0 }}>→ Upgrade to: {s.upgradeTo}</p>
                </div>
              );
            })}
          </div>
        )}
        {data.upgrades.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, color: "#9ca3af", letterSpacing: "0.07em", marginBottom: 8 }}>Upgrade Path</div>
            {data.upgrades.map((u, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "#fafafa", border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{u.tool}</span>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>{u.trigger}</span>
                <span style={{ fontSize: 11, color: "#6366f1", marginLeft: "auto", fontWeight: 600 }}>→ {u.migrateTo}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );

    return null;
  };

  return (
    <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden", display: "flex", height: "calc(100vh - 180px)", marginTop: 8 }}>
      {/* Left tab sidebar */}
      <div style={{ width: 220, borderRight: "1px solid #e5e7eb", padding: "14px 8px", flexShrink: 0, background: "#fafafa", display: "flex", flexDirection: "column" as const, gap: 2, overflowY: "auto" as const }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.09em", color: "#9ca3af", marginBottom: 8, paddingLeft: 8, display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: 8 }}>
          <span>Stack</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 7px", borderRadius: 999, background: "#dbeafe", border: "1px solid #93c5fd", fontSize: 9, fontWeight: 700, color: "#1d4ed8" }}>
            March 2026
          </span>
        </div>
        {stackTabs.map((tab, ti) => {
          const isActive = stackTab === ti;
          const isPhase = ti > 0 && ti <= data.phases.length;
          const phaseColors = ["#6366f1","#10b981","#0ea5e9","#f59e0b","#8b5cf6"];
          const dotColor = ti === 0 ? "#6366f1" : isPhase ? (phaseColors[(ti-1) % phaseColors.length]) : "#9ca3af";
          return (
            <button key={ti} onClick={() => { setStackTab(ti); document.getElementById('stack-tab-content')?.scrollTo({top:0}); }}
              style={{ display: "flex", alignItems: "flex-start", width: "100%", padding: "8px 10px", borderRadius: 8, background: isActive ? "white" : "transparent", border: `1px solid ${isActive ? "#e5e7eb" : "transparent"}`, cursor: "pointer", textAlign: "left" as const, boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.05)" : "none", gap: 6 }}>
              <span style={{ fontSize: 11, color: dotColor, flexShrink: 0, fontWeight: 700, marginTop: 1 }}>{isActive ? "●" : isPhase ? "✓" : tab.icon}</span>
              <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? "#111827" : "#374151", flex: 1, lineHeight: 1.35, wordBreak: "break-word" as const }}>{tab.label}</span>
              {isPhase && data.phases[ti-1].costs?.total && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", flexShrink: 0, marginTop: 1 }}>{data.phases[ti-1].costs?.total?.split(' ')[0]}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right content */}
      <div id="stack-tab-content" style={{ flex: 1, padding: 22, overflowY: "auto" as const, background: "white" }}>
        {renderStackTab()}
      </div>
    </div>
  );
}

// ââ Main âââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// ── AI Analysis block ──────────────────────────────────────────────────────
function AiBlock({ what, diff, gap }: { what:string|null; diff:string|null; gap:string|null }) {
  if (!what && !diff && !gap) return null;
  return (
    <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginTop:"0.75rem"}}>
      {what && (
        <div style={{flex:"1 1 150px",background:"rgba(var(--clr-text-rgb),0.03)",border:"1px solid var(--clr-border)",borderRadius:8,padding:"8px 10px"}}>
          <div style={{fontSize:"0.5625rem",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",color:"#534AB7",marginBottom:3}}>What it does</div>
          <div style={{fontSize:"0.75rem",color:"var(--clr-text-3)",lineHeight:1.5}}>{what}</div>
        </div>
      )}
      {diff && (
        <div style={{flex:"1 1 140px",background:"rgba(var(--clr-text-rgb),0.03)",border:"1px solid var(--clr-border)",borderRadius:8,padding:"8px 10px"}}>
          <div style={{fontSize:"0.5625rem",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",color:"#0F6E56",marginBottom:3}}>Different because</div>
          <div style={{fontSize:"0.75rem",color:"var(--clr-text-3)",lineHeight:1.5}}>{diff}</div>
        </div>
      )}
      {gap && (
        <div style={{flex:"1 1 140px",background:"rgba(250,199,117,0.08)",border:"1px solid rgba(250,199,117,0.55)",borderRadius:8,padding:"8px 10px"}}>
          <div style={{fontSize:"0.5625rem",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",color:"#854F0B",marginBottom:3}}>Blind spot</div>
          <div style={{fontSize:"0.75rem",color:"#633806",lineHeight:1.5}}>{gap}</div>
        </div>
      )}
    </div>
  );
}

function HomeInner() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [credits, setCredits] = useState<number | null>(null);
  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/credits").then(r => r.json()).then(d => setCredits(d.credits ?? 0)).catch(() => {});
  }, [isSignedIn]);
  const { openSignIn } = useClerk();
  const [selectedTool, setSelectedTool] = useState<ToolId | null>(null);
  const searchParams = useSearchParams();
  useEffect(() => {
    const tool = searchParams.get("tool");
    if (tool === "gap-analysis" || tool === "stack-advisor") {
      setSelectedTool(tool as ToolId);
    } else {
      setSelectedTool(null);
    }
  }, [searchParams]);
  const [idea, setIdea] = useState("");
  const [budget, setBudget] = useState<Budget>("bootstrap");
  const [techLevel, setTechLevel] = useState<TechLevel>("nocode");
  const [platform, setPlatform] = useState<Platform>("web");
  const [loading, setLoading] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [error, setError] = useState("");
  const [outOfCredits, setOutOfCredits] = useState(false);
  const [hasResults, setHasResults] = useState(false);

  // ── Pulse inline state ────────────────────────────────────────────────────
  const [pulseTab, setPulseTab] = useState<"ph"|"appstore">("ph");
  const [pulseSignals, setPulseSignals] = useState<Array<{source:string;sourceLabel:string;emoji:string;title:string;subtitle:string;signal:string;url:string;timestamp:string;movementType?:string;imageUrl?:string;topics?:string[];tagline?:string;externalUrl?:string;claudeGap?:string;}>>([]);
  const [pulseLoading, setPulseLoading] = useState(false);
  const [pulseError, setPulseError] = useState<string|null>(null);
  const [pulseAsDays, setPulseAsDays] = useState<Array<{date:string;isToday:boolean;apps:Array<{app_id:string;app_name:string;developer:string;category:string;price:string;icon_url:string;store_url:string;release_date:string;description:string;rating:number|null;review_count:number;min_os:string;age_rating:string;languages:string[];screenshot_urls:string[];file_size_mb:number|null;claude_what:string|null;claude_different:string|null;claude_missing:string|null;}>;appCount:number;generatedAt:string;}>>([]);
  const [pulseAsLoading, setPulseAsLoading] = useState(false);
  const [pulsePhSearch, setPulsePhSearch] = useState("");
  const [pulsePhTopic, setPulsePhTopic] = useState("all");
  const [pulseAsSearch, setPulseAsSearch] = useState("");
  const [pulseAsCat, setPulseAsCat] = useState("all");
  const PULSE_TOPIC_COLORS = ["#6366f1","#06b6d4","#f59e0b","#ec4899","#22c55e","#8b5cf6","#f97316","#14b8a6"];
  const PULSE_MOVE_COLORS: Record<string,string> = { rank_jump:"#22c55e",new_entry:"#3b82f6",review_spike:"#f59e0b",top_mover:"#8b5cf6",weekly_mover:"#06b6d4",monthly_mover:"#ec4899" };
  const pulseRelTime = (ts:string) => { const m=Math.floor((Date.now()-new Date(ts).getTime())/60000); if(m<1)return"just now"; if(m<60)return m+"m ago"; const h=Math.floor(m/60); if(h<24)return h+"h ago"; return Math.floor(h/24)+"d ago"; };
  const pulseParseGap = (gap?:string) => { if(!gap)return null; const p=gap.split("✦").map(s=>s.trim()); if(p.length<3)return null; return{what:p[0].replace(/^What:\s*/i,""),different:p[1].replace(/^Different:\s*/i,""),missing:p[2].replace(/^Missing:\s*/i,"")}; };
  const pulseFmtDate = (d:string) => new Date(d+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
  const fetchPulseSignals = useCallback(async()=>{ if(pulseSignals.length>0)return; setPulseLoading(true); try{const res=await fetch("/api/pulse");const data=await res.json();if(!res.ok)throw new Error(data.error||"Failed");setPulseSignals(data.signals??[]);setPulseError(null);}catch(e){setPulseError(e instanceof Error?e.message:"Error");}finally{setPulseLoading(false);} },[pulseSignals.length]);
  const fetchPulseAS = useCallback(async()=>{ if(pulseAsDays.length>0)return; setPulseAsLoading(true); try{const r=await fetch("/api/pulse/appstore");const d=await r.json();setPulseAsDays(d.days??[]);}catch{}finally{setPulseAsLoading(false);} },[pulseAsDays.length]);
  useEffect(()=>{ if(selectedTool===null)fetchPulseSignals(); },[selectedTool,fetchPulseSignals]);
  useEffect(()=>{ if(selectedTool===null&&pulseTab==="appstore")fetchPulseAS(); },[selectedTool,pulseTab,fetchPulseAS]);
  const phSignals = useMemo(()=>pulseSignals.filter(s=>s.source==="producthunt"),[pulseSignals]);
  const phTopics = useMemo(()=>Array.from(new Set(phSignals.flatMap(s=>s.topics||[]))).sort(),[phSignals]);
  const phFiltered = useMemo(()=>{ let list=pulsePhTopic==="all"?phSignals:phSignals.filter(s=>s.topics?.includes(pulsePhTopic)); if(pulsePhSearch){const q=pulsePhSearch.toLowerCase();list=list.filter(s=>s.title?.toLowerCase().includes(q)||s.tagline?.toLowerCase().includes(q));} return list; },[phSignals,pulsePhTopic,pulsePhSearch]);
  const allAsApps = useMemo(()=>pulseAsDays.flatMap(d=>d.apps),[pulseAsDays]);
  const asCategories = useMemo(()=>Array.from(new Set(allAsApps.map(a=>a.category).filter(Boolean))).sort(),[allAsApps]);
  const asFiltered = useMemo(()=>{ let list=pulseAsCat==="all"?allAsApps:allAsApps.filter(a=>a.category===pulseAsCat); if(pulseAsSearch){const q=pulseAsSearch.toLowerCase();list=list.filter(a=>a.app_name?.toLowerCase().includes(q)||a.developer?.toLowerCase().includes(q));} return list.sort((a,b)=>new Date(b.release_date||0).getTime()-new Date(a.release_date||0).getTime()); },[allAsApps,pulseAsCat,pulseAsSearch]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [trendFeedData, setTrendFeedData] = useState<any>(null);
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

  const inputSectionRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scanTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const resultsRef = useRef<HTMLDivElement>(null);
  const pendingAutoSubmit = useRef(false);

  
  // Number of scan steps for the current tool (used for timer logic)
  const scanStepCounts: Record<string, number> = { "trend-feed": 5, "gap-analysis": 4, "stack-advisor": 4, "competitor-radar": 1 };
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
      }, [loading, selectedTool, scanStep]);

  useEffect(() => {
    if (hasResults) {
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [hasResults]);

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

  const handleSelectTool = (toolId: ToolId | null) => {
    // Reset all result state when switching tools
    scanTimersRef.current.forEach(clearTimeout);
    setScanStep(-1);
    setHasResults(false);
    setStreamedContent("");
    setError("")
    setOutOfCredits(false);;
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
    if (!isSignedIn) { openSignIn(); return; }
    if (!selectedTool || idea.trim().length < 3) return;
    const tool = TOOLS.find((t) => t.id === selectedTool)!;

    setLoading(true);
    setHasResults(false);
    setStreamedContent("");
    setError("")
    setOutOfCredits(false);;
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
          if (res.status === 402) { setOutOfCredits(true); setLoading(false); return; }
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

    // ââ Other tools: existing flow ââ
     else {
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

    const body: Record<string, string> = { idea, tool: selectedTool ?? "" };
    if (selectedTool === "stack-advisor") {
      body.budget = budget;
      body.techLevel = techLevel;
      body.platform = platform;
    }

    try {
      const res = await fetch(tool.apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        if (res.status === 402) { setOutOfCredits(true); setLoading(false); return; }
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
    setScanStep(-1);
    setHasResults(false);
    setTimeout(() => {
      const main = document.querySelector("main");
      if (main) main.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
    setStreamedContent("");
    setError("")
    setOutOfCredits(false);;
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
    setError("")
    setOutOfCredits(false);;
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
  // Normalize variation selectors so "ð¡ï¸" (with FE0F) and "ð¡" (without) both match
  const stripVS = (s: string) => s.replace(/\uFE0F/g, "");
  const scoreSection = allSections.find((s) => stripVS(s.emoji) === stripVS("ð¡ï¸"));
  const sections = allSections.filter((s) => stripVS(s.emoji) !== stripVS("ð¡ï¸"));
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

      {/* Shell */}
      <div style={{ display: "flex", height: "100vh" }}>

        {/* Sidebar */}



        {/* Main content */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", padding: "0 16px" }}>

          {/* ââ Scanning overlay ââ */}
          {scanStep >= 0 ? (() => {
            const SCAN_STEPS_MAP: Record<string, { label: string; icon: React.ReactNode }[]> = {
              "gap-analysis": [
                { label: "Searching App Store",    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg> },
                { label: "Searching Google Play",  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.04c.29.12.62.18.97.18.49 0 .97-.14 1.42-.42l.02-.01 1.73-1.01L17.63 22c1.07 0 2.01-.56 2.56-1.43l-9.6-5.55-7.4 8.02zm-.63-1.73l7.22-7.83L2.35 8.7c-.22.44-.35.94-.35 1.48V19.82c0 .6.18 1.15.55 1.49zm17.8-3.38c.59-.36 1.03-.94 1.2-1.63l.01-.04.04-.18c.06-.3.1-.63.1-.97v-.52l-.01-.03c-.05-.63-.32-1.18-.72-1.59L17.7 11.3l-2.87 3.12 5.52 3.51zm-.3-10.2L7.36 1.37 4.57 2.99 14.83 11.3l5.22-3.57z"/></svg> },
                { label: "Searching YouTube",      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 00.5 6.19 31.6 31.6 0 000 12a31.6 31.6 0 00.5 5.81 3.02 3.02 0 002.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 002.12-2.14A31.6 31.6 0 0024 12a31.6 31.6 0 00-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg> },
                { label: "Analyzing with AI",      icon: <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M10 2l1.8 5.4H17l-4.2 3.1 1.6 5-4.4-3.2L5.6 15.5l1.6-5L3 7.4h5.2L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
              ],
              "stack-advisor": [
                { label: "Analyzing your requirements", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg> },
                { label: "Matching tools to your budget", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg> },
                { label: "Building your tech roadmap", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg> },
                { label: "Estimating costs and timeline", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg> },
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
              ]
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
                      {selectedTool === "stack-advisor" ? "Evaluating toolsâ¦" : "Gathering intelligence..."}
                    </h2>
                    <p style={{ fontSize: "0.8rem", color: "var(--clr-text-5)", margin: 0, lineHeight: 1.5, maxWidth: 280, marginInline: "auto", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "normal" }}>
                      {idea}
                    </p>
                  </div>

                  {/* Steps */}
                  {selectedTool === "stack-advisor" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem", maxHeight: 320, overflowY: "auto" }}>
                      {(SCAN_STEPS_MAP[selectedTool ?? "gap-analysis"] ?? SCAN_STEPS_MAP["gap-analysis"]).map((step, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: 8,
                          opacity: i < scanStep ? 1 : i === scanStep ? 0.8 : 0.25,
                          fontSize: "0.78rem", color: "var(--clr-text-3)",
                          transition: "opacity 0.3s",
                        }}>
                          <span style={{ opacity: i <= scanStep ? 1 : 0.3 }}>{step.icon}</span>
                          <span>{step.label}</span>
                          {i < scanStep && <span style={{ marginLeft: "auto", color: "var(--clr-accent)", fontSize: "0.7rem" }}>â</span>}
                        </div>
                      ))}
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
                            {isActive && <span style={{ animation: "blink 1.1s step-end infinite" }}>â¦</span>}
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

              {/* ── Pulse Panel (default view) ── */}
              {!selectedTool && !hasResults && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  {/* ── HERO ── */}
                  <div style={{ padding: "1.75rem 1.5rem 1.5rem", margin: "12px 12px 0", flexShrink: 0, borderRadius: 14, border: "1px solid var(--clr-border)", background: "#f7f6f3" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--clr-text-4)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
                      For vibe coders
                    </div>
                    <h1 style={{ fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1, color: "var(--clr-text)", margin: 0 }}>
                      Hello, Vibecoder!
                    </h1>
                    <p style={{ fontSize: "1.62rem", fontWeight: 400, color: "var(--clr-text-3)", fontStyle: "italic", margin: "0 0 14px", letterSpacing: "-0.02em", lineHeight: 1 }}>
                      Another idea dropped?
                    </p>
                    <p style={{ fontSize: "0.875rem", color: "var(--clr-text-2)", lineHeight: 1.6, margin: "0 0 18px", whiteSpace: "nowrap" as const }}>
                      <strong style={{ color: "var(--clr-text)", fontWeight: 700 }}>Don't build what already exists.</strong>
                      {" "}We'll show you what doesn't — and exactly how to build it.
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                      <button
                        onClick={() => setSelectedTool("gap-analysis")}
                        style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 16px", background: "var(--clr-text)", color: "var(--clr-bg)", borderRadius: 8, fontSize: "0.8rem", fontWeight: 700, fontFamily: "inherit", cursor: "pointer", border: "none", letterSpacing: "-0.01em", transition: "opacity 0.12s" }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = "1"}
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2l1.5 4.5H14L10 9l1.5 4.5L8 11 4.5 13.5 6 9 2 6.5h4.5L8 2z" fill="currentColor"/></svg>
                        Dig my idea
                      </button>
                      <button
                        onClick={() => setSelectedTool("stack-advisor")}
                        style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 16px", background: "transparent", color: "var(--clr-text-2)", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600, fontFamily: "inherit", cursor: "pointer", border: "1px solid var(--clr-border)", letterSpacing: "-0.01em", transition: "all 0.12s" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--clr-surface-2)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                      >
                        Get my Stack →
                      </button>
                      <span style={{ fontSize: "0.7rem", color: "var(--clr-text-4)" }}>1 credit each · Free to browse</span>
                    </div>
                  </div>

                  {/* Feed header */}
                  <div style={{ padding: "1rem 1.5rem 0", flexShrink: 0 }}>
                    <h2 style={{ fontSize: "1.26rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--clr-text)", margin: 0 }}>What Launched Today</h2>
                  </div>
                  {/* Tab bar */}
                  <div style={{ display: "flex", borderBottom: "1px solid var(--clr-border)", padding: "0 1.5rem", flexShrink: 0, background: "var(--clr-bg)" }}>
                    {([{id:"ph" as const,label:"Product Hunt",color:"#DA552F"},{id:"appstore" as const,label:"App Store",color:"#007AFF"}]).map(t=>(
                      <button key={t.id} onClick={()=>setPulseTab(t.id)} style={{ background:"none", border:"none", borderBottom: pulseTab===t.id?"2px solid "+t.color:"2px solid transparent", padding:"12px 16px", cursor:"pointer", fontSize:"0.875rem", fontWeight: pulseTab===t.id?600:400, color: pulseTab===t.id?t.color:"var(--clr-text-3)", fontFamily:"inherit", marginBottom:-1, transition:"color 0.15s,border-color 0.15s" }}>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Feed */}
                  <div style={{ flex:1, overflowY:"auto", padding:"1.25rem 1.5rem" }}>

                    {/* ── PRODUCT HUNT ── */}
                    {pulseTab==="ph" && (
                      <div>
                        {/* Filters */}
                        <div style={{ display:"flex", gap:8, marginBottom:"1.25rem", flexWrap:"wrap" }}>
                          <input value={pulsePhSearch} onChange={e=>setPulsePhSearch(e.target.value)} placeholder="Search..." style={{ flex:1, minWidth:160, padding:"7px 12px", border:"1px solid var(--clr-border)", borderRadius:8, fontSize:"0.875rem", background:"var(--clr-surface)", color:"var(--clr-text)", outline:"none" }}/>
                          {phTopics.length>0&&(
                            <select value={pulsePhTopic} onChange={e=>setPulsePhTopic(e.target.value)} style={{ padding:"7px 12px", border:"1px solid var(--clr-border)", borderRadius:8, fontSize:"0.875rem", background:"var(--clr-surface)", color:"var(--clr-text)", cursor:"pointer", outline:"none" }}>
                              <option value="all">All Topics</option>
                              {phTopics.map(t=><option key={t} value={t}>{t}</option>)}
                            </select>
                          )}
                        </div>

                        {pulseLoading && (
                          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                            {[1,2,3,4].map(i=>(
                              <div key={i} className="shimmer" style={{ height:80, borderRadius:10 }}/>
                            ))}
                          </div>
                        )}
                        {pulseError && !pulseLoading && (
                          <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, padding:"1rem", color:"#ef4444", fontSize:"0.875rem" }}>{pulseError}</div>
                        )}
                        {!pulseLoading && phFiltered.length===0 && pulseSignals.length>0 && (
                          <div style={{ textAlign:"center", padding:"3rem 0", color:"var(--clr-text-3)" }}>No results. <button onClick={()=>{setPulsePhSearch("");setPulsePhTopic("all");}} style={{ color:"#DA552F", background:"none", border:"none", cursor:"pointer" }}>Clear</button></div>
                        )}
                        {!pulseLoading && phFiltered.length>0 && (
                          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                            {phFiltered.map((s,i)=>{
                              const mc=PULSE_MOVE_COLORS[s.movementType??""];
                              const gap=pulseParseGap(s.claudeGap);
                              const topic1 = s.topics?.[0] || "";
                              const topic2 = s.topics?.[1] || "";
                              const topicStr = topic2 ? `${topic1} × ${topic2}` : topic1;
                              const titleWord = s.title?.split(" ")?.[0] || "this";
                              const ctaVariants = [
                                topicStr ? <>Building in <strong>{topicStr}</strong>? There's a gap here.</> : <>See a gap in this space?</>,
                                topicStr ? <>Got a better angle on <strong>{topicStr}</strong>?</> : <>Your take could be different.</>,
                                <><strong>{titleWord}</strong> just validated this market. Your turn.</>,
                                topicStr ? <>The <strong>{topicStr}</strong> space just moved. Worth checking.</> : <>This space just moved.</>,
                                <>Someone built it. Now find out if yours is <strong>different enough</strong>.</>,
                              ];
                              const ctaText = ctaVariants[i % ctaVariants.length];
                              return (
                                <div key={s.title+i} style={{ background:"var(--clr-surface)", border:"1px solid var(--clr-border)", borderLeft:mc?"3px solid "+mc:"1px solid var(--clr-border)", borderRadius:12, overflow:"hidden" }}>
                                  <a href={s.externalUrl||s.url} target="_blank" rel="noopener noreferrer"
                                    style={{ display:"flex", alignItems:"flex-start", gap:"1rem", padding:"1.125rem", textDecoration:"none", color:"inherit", transition:"background 0.15s" }}
                                    onMouseEnter={e=>e.currentTarget.style.background="rgba(0,0,0,0.02)"}
                                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                                  >
                                    {s.imageUrl
                                      ? <img src={s.imageUrl} alt="" width={56} height={56} style={{ borderRadius:12, flexShrink:0, objectFit:"cover", border:"1px solid var(--clr-border)" }}/>
                                      : <div style={{ width:56, height:56, borderRadius:12, background:"var(--clr-border)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.5rem" }}>{s.emoji}</div>
                                    }
                                    <div style={{ flex:1, minWidth:0 }}>
                                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3, flexWrap:"wrap" }}>
                                        <span style={{ fontSize:"0.9375rem", fontWeight:600, color:"var(--clr-text)", letterSpacing:"-0.015em" }}>{s.title}</span>
                                        {mc&&s.movementType&&<span style={{ fontSize:"0.5625rem", fontWeight:700, padding:"0.1rem 0.4rem", borderRadius:999, background:mc+"20", color:mc, letterSpacing:"0.04em", textTransform:"uppercase" }}>{s.movementType==="rank_jump"?"RANK ↑":s.movementType==="new_entry"?"NEW":s.movementType==="review_spike"?"REVIEWS↑":"TOP"}</span>}
                                        <span style={{ fontSize:"0.6875rem", color:"var(--clr-text-4)", marginLeft:"auto" }}>{pulseRelTime(s.timestamp)}</span>
                                      </div>
                                      {s.tagline&&<p style={{ fontSize:"0.8125rem", color:"var(--clr-text-3)", margin:"0 0 6px", lineHeight:1.45 }}>{s.tagline}</p>}
                                      {s.topics&&s.topics.length>0&&(
                                        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                                          {s.topics.map((t,ti)=><span key={t} style={{ fontSize:"0.5625rem", fontWeight:600, padding:"0.15rem 0.5rem", borderRadius:999, background:PULSE_TOPIC_COLORS[ti%PULSE_TOPIC_COLORS.length]+"18", color:PULSE_TOPIC_COLORS[ti%PULSE_TOPIC_COLORS.length] }}>{t}</span>)}
                                        </div>
                                      )}
                                      {gap&&<AiBlock what={gap.what??null} diff={gap.different??null} gap={gap.missing??null}/>}
                                    </div>
                                  </a>
                                  {/* CTA strip */}
                                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 14px 10px", background:"var(--clr-bg)", borderTop:"1px solid var(--clr-border)", gap:12 }}>
                                    <span style={{ fontSize:"0.75rem", color:"var(--clr-text-3)", display:"flex", alignItems:"center", gap:4, flexWrap:"wrap" as const }}>{ctaText}</span>
                                    <button
                                      onClick={e => { e.preventDefault(); setSelectedTool("gap-analysis"); }}
                                      style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:"0.7rem", fontWeight:700, padding:"5px 12px", borderRadius:6, background:"var(--clr-text)", color:"var(--clr-bg)", cursor:"pointer", border:"none", fontFamily:"inherit", letterSpacing:"-0.01em", whiteSpace:"nowrap", flexShrink:0, transition:"opacity 0.12s" }}
                                      onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.opacity="0.8"}
                                      onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.opacity="1"}
                                    >
                                      Dig my angle →
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── APP STORE ── */}
                    {pulseTab==="appstore" && (
                      <div>
                        <div style={{ display:"flex", gap:8, marginBottom:"1.25rem", flexWrap:"wrap" }}>
                          <input value={pulseAsSearch} onChange={e=>setPulseAsSearch(e.target.value)} placeholder="Search apps..." style={{ flex:1, minWidth:160, padding:"7px 12px", border:"1px solid var(--clr-border)", borderRadius:8, fontSize:"0.875rem", background:"var(--clr-surface)", color:"var(--clr-text)", outline:"none" }}/>
                          {asCategories.length>0&&(
                            <select value={pulseAsCat} onChange={e=>setPulseAsCat(e.target.value)} style={{ padding:"7px 12px", border:"1px solid var(--clr-border)", borderRadius:8, fontSize:"0.875rem", background:"var(--clr-surface)", color:"var(--clr-text)", cursor:"pointer", outline:"none" }}>
                              <option value="all">All Categories</option>
                              {asCategories.map(c=><option key={c} value={c}>{c}</option>)}
                            </select>
                          )}
                        </div>
                        {pulseAsLoading&&<div style={{ display:"flex",flexDirection:"column",gap:8 }}>{[1,2,3].map(i=><div key={i} className="shimmer" style={{ height:80, borderRadius:10 }}/>)}</div>}
                        {!pulseAsLoading&&pulseAsDays.length===0&&<div style={{ textAlign:"center", padding:"4rem 0", color:"var(--clr-text-3)" }}>No App Store data yet. Check back after 08:00 UTC.</div>}
                        {!pulseAsLoading&&asFiltered.length>0&&(
                          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                            {(() => {
                              const byDate = new Map<string,{day:typeof pulseAsDays[0];apps:typeof allAsApps}>();
                              for (const day of pulseAsDays) { const da=asFiltered.filter(a=>day.apps.some(da=>da.app_id===a.app_id)); if(da.length>0) byDate.set(day.date,{day,apps:da}); }
                              return Array.from(byDate.values()).map(({day,apps})=>(
                                <div key={day.date}>
                                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                                    <span style={{ fontSize:"0.875rem", fontWeight:700, color:"var(--clr-text)" }}>{pulseFmtDate(day.date)}</span>
                                    {day.isToday&&<span style={{ fontSize:"0.5625rem", fontWeight:700, padding:"0.15rem 0.5rem", borderRadius:999, background:"rgba(0,122,255,0.12)", color:"#007AFF" }}>TODAY</span>}
                                    <span style={{ fontSize:"0.75rem", color:"var(--clr-text-4)" }}>{apps.length} apps</span>
                                  </div>
                                  <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
                                    {apps.map(app=>(
                                      <div key={app.app_id} style={{background:"var(--clr-surface)",border:"1px solid var(--clr-border)",borderLeft:day.isToday?"3px solid #007AFF":"1px solid var(--clr-border)",borderRadius:12,overflow:"hidden"}}>
                                        <a href={app.store_url} target="_blank" rel="noopener noreferrer"
                            style={{display:"flex",flexDirection:"column",gap:"0.875rem",padding:"1.25rem",textDecoration:"none",color:"inherit",transition:"background 0.15s"}}
                            onMouseEnter={e=>e.currentTarget.style.background="rgba(var(--clr-text-rgb),0.02)"}
                            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                            <div style={{display:"flex",alignItems:"flex-start",gap:"1rem"}}>
                              {app.icon_url
                                ? <img src={app.icon_url} alt="" width={64} height={64} style={{borderRadius:14,flexShrink:0,objectFit:"cover",border:"1px solid var(--clr-border)"}}/>
                                : <div style={{width:64,height:64,borderRadius:14,background:"var(--clr-border)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.75rem"}}>📱</div>}
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.25rem",flexWrap:"wrap"}}>
                                  <span style={{fontSize:"1rem",fontWeight:650,color:"var(--clr-text)",letterSpacing:"-0.02em"}}>{app.app_name}</span>
                                  {app.category&&<span style={{fontSize:"0.5625rem",fontWeight:700,letterSpacing:"0.04em",textTransform:"uppercase",padding:"0.1rem 0.4rem",borderRadius:999,background:"rgba(99,102,241,0.12)",color:"#6366f1"}}>{app.category}</span>}
                                  {app.price&&app.price!=="Free"&&<span style={{fontSize:"0.6875rem",fontWeight:700,color:"#22c55e"}}>{app.price}</span>}
                                  {app.age_rating&&<span style={{fontSize:"0.6875rem",color:"var(--clr-text-4)"}}>{app.age_rating}</span>}
                                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{marginLeft:"auto",flexShrink:0,color:"var(--clr-text-4)"}}><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                                <div style={{fontSize:"0.8125rem",color:"var(--clr-text-3)",marginBottom:"0.25rem"}}>{app.developer}</div>
                                <div style={{display:"flex",gap:"0.75rem",flexWrap:"wrap",fontSize:"0.75rem",color:"var(--clr-text-4)"}}>
                                  {app.min_os&&<span>iOS {app.min_os}+</span>}
                                  {app.file_size_mb&&<span>{app.file_size_mb} MB</span>}
                                  {app.languages?.length>0&&<span>{app.languages.slice(0,3).join(", ")}{app.languages.length>3?" +"+(app.languages.length-3):""}</span>}
                                </div>
                              </div>
                            </div>
                            {app.screenshot_urls&&app.screenshot_urls.length>0&&(
                              <div style={{overflowX:"auto",display:"flex",gap:"0.5rem",paddingBottom:"0.25rem"}} onClick={e=>e.preventDefault()}>
                                {app.screenshot_urls.slice(0,5).map((url,si)=>(
                                  <img key={si} src={url} alt={"Screenshot "+(si+1)} style={{height:160,width:"auto",borderRadius:8,flexShrink:0,border:"1px solid var(--clr-border)",objectFit:"cover"}}/>
                                ))}
                              </div>
                            )}
                            <AiBlock what={app.claude_what} diff={app.claude_different} gap={app.claude_missing}/>
                          </a>
                          {/* CTA strip */}
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 14px 10px",background:"var(--clr-bg)",borderTop:"1px solid var(--clr-border)",gap:12}}>
                            <span style={{fontSize:"0.75rem",color:"var(--clr-text-3)"}}>
                              {app.category ? <><strong>{app.category}</strong> space just got a new player.</> : <>A new app just launched in this space.</>}
                            </span>
                            <button
                              onClick={e=>{e.preventDefault();setSelectedTool("gap-analysis");}}
                              style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:"0.7rem",fontWeight:700,padding:"5px 12px",borderRadius:6,background:"var(--clr-text)",color:"var(--clr-bg)",cursor:"pointer",border:"none",fontFamily:"inherit",letterSpacing:"-0.01em",whiteSpace:"nowrap",flexShrink:0,transition:"opacity 0.12s"}}
                              onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.opacity="0.8"}
                              onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.opacity="1"}
                            >Dig my angle →</button>
                          </div>
                        </div>
                                    ))}
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ââ Input section ââ */}
              {selectedTool && currentTool && !hasResults && !loading && (
                <div ref={inputSectionRef}>
                  {/* Dig hero */}
                  {selectedTool === "gap-analysis" && (
                    <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", padding: "28px 24px 20px", borderBottom: "1px solid var(--clr-border)", background: "var(--clr-surface)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--clr-text-4)", marginBottom: 10 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
                        Live data · Updated continuously
                      </div>
                      <h1 style={{ fontSize: "1.625rem", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, color: "var(--clr-text)", textAlign: "center" as const, marginBottom: 7 }}>
                        Your idea is 3 hours old.
                        <br />
                        <span style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                          So is our data.
                        </span>
                      </h1>
                      <p style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", textAlign: "center" as const, maxWidth: 420, lineHeight: 1.6, marginBottom: 18, fontStyle: "italic" as const }}>
                        Other tools guess from 2023 training data.<br />We read Reddit from this morning.
                      </p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap" as const }}>
                        {[{ label: "70+ live sources", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" }, { label: "Reddit · X · YouTube", color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" }, { label: "App Store · Google Play", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" }].map(b => (
                          <span key={b.label} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.625rem", fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: b.bg, border: `1px solid ${b.border}`, color: b.color, whiteSpace: "nowrap" as const }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: b.color, opacity: 0.7 }} />
                            {b.label}
                          </span>
                        ))}
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.625rem", fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: "#111", border: "1px solid #111", color: "#fff", whiteSpace: "nowrap" as const }}>★ Claude Opus · Extended Thinking</span>
                      </div>
                    </div>
                  )}
                  <InputSection
                    tool={currentTool}
                    idea={idea}
                    setIdea={setIdea}
                    budget={budget}
                    setBudget={setBudget}
                    techLevel={techLevel}
                    setTechLevel={setTechLevel}
                    platform={platform}
                    setPlatform={setPlatform}
                    onSubmit={handleSubmit}
                    loading={loading}
                    textareaRef={textareaRef}
                  />
                  {/* Dig sample report */}
                  {selectedTool === "gap-analysis" && (
                    <DigSampleReport />
                  )}
                </div>
              )}
              {/* ââ Results — inline below input ââ */}
              {hasResults && (
              <div ref={resultsRef} style={{ paddingTop: "1rem", paddingBottom: "5rem", animation: "fadeSlideIn 0.3s ease" }}>

              {/* ââ Compact query bar ââ */}
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
                    </div>
                    {selectedTool === "stack-advisor" && (
                      <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" as const }}>
                        {[
                          { label: budget === "bootstrap" ? "Bootstrapped" : budget === "growing" ? "Growing" : budget === "funded" ? "Funded" : "Scale", icon: "$" },
                          { label: techLevel === "nocode" ? "No-code" : techLevel === "lowcode" ? "Low-code" : "Developer", icon: "⚙" },
                          { label: platform === "web" ? "Web" : platform === "mobile" ? "Mobile" : "Web + Mobile", icon: "🖥" },
                        ].map((badge, i) => (
                          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: "0.65rem", fontWeight: 600, padding: "2px 7px", borderRadius: 4, background: "var(--clr-surface-2)", border: "1px solid var(--clr-border)", color: "var(--clr-text-4)" }}>
                            {badge.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
                    <button
                      onClick={() => {
                        const toolLabel = selectedTool === "gap-analysis" ? "Dig" : "Stack";
                        const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
                        const esc = (s: unknown) => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
                        let p: Record<string, unknown> = {};
                        try { const m = streamedContent.match(/```json\s*([\s\S]*?)```/); p = JSON.parse(m ? m[1] : streamedContent); } catch {}

                        const arr = <T,>(v: unknown): T[] => Array.isArray(v) ? v as T[] : [];
                        const str = (v: unknown) => typeof v === "string" ? v : "";
                        const obj = (v: unknown): Record<string,string> => (v && typeof v === "object" && !Array.isArray(v)) ? v as Record<string,string> : {};

                        const sections: string[] = [];

                        // Overview / score
                        const score = p.marketScore ? `<div class="score">${esc(p.marketScore)}<span class="score-sub">/100</span></div>` : "";
                        const summary = str(p.marketScoreSummary);
                        if (summary) sections.push(`<h2>Overview</h2>${score}<p>${esc(summary)}</p>`);
                        const ol = obj(p.oneLiner); if (ol.text || str(p.oneLiner)) sections.push(`<h2>One-liner positioning</h2><blockquote>"${esc(ol.text || str(p.oneLiner))}"</blockquote>`);

                        // Market Data
                        const ms = obj(p.marketSizing);
                        if (ms.tam || ms.summary) sections.push(`<h2>Market Data</h2>${ms.tam ? `<p><strong>TAM:</strong> ${esc(ms.tam)}</p>` : ""}${ms.sam ? `<p><strong>SAM:</strong> ${esc(ms.sam)}</p>` : ""}${ms.summary ? `<p>${esc(ms.summary)}</p>` : ""}`);

                        // Community Signals
                        const reddit = arr<{title:string;votes:string;url:string}>(p.redditPosts);
                        const xposts = arr<{text:string;likes:string}>(p.xPosts);
                        if (reddit.length || xposts.length) {
                          let html = "<h2>Community Signals</h2>";
                          if (reddit.length) { html += "<h3>Reddit</h3><ul>" + reddit.map(r=>`<li><strong>${esc(r.title)}</strong> — ${esc(r.votes)} votes</li>`).join("") + "</ul>"; }
                          if (xposts.length) { html += "<h3>X / Twitter</h3><ul>" + xposts.map(x=>`<li>${esc(x.text)} <em>(${esc(x.likes)} likes)</em></li>`).join("") + "</ul>"; }
                          sections.push(html);
                        }

                        // Competitors
                        const comps = arr<{name:string;tagline:string;rating:string;reviews:string;platform:string}>(p.competitors);
                        if (comps.length) sections.push(`<h2>Competitors</h2><ul>${comps.map(c=>`<li><strong>${esc(c.name)}</strong> — ${esc(c.tagline)}${c.rating ? ` (${esc(c.rating)}★, ${esc(c.reviews)} reviews)` : ""}</li>`).join("")}</ul>`);

                        // Market Gaps
                        const gaps = arr<{title:string;description:string;opportunity:string}>(p.marketGaps);
                        if (gaps.length) sections.push(`<h2>Market Gaps</h2>${gaps.map(g=>`<div class="gap"><strong>${esc(g.title)}</strong><p>${esc(g.description)}</p>${g.opportunity?`<p class="opp">${esc(g.opportunity)}</p>`:""}</div>`).join("")}`);

                        // Pain Points
                        const pain = arr<{quote:string;source:string;badge:string[]}>(p.painPoints);
                        if (pain.length) sections.push(`<h2>Pain Points</h2><ul>${pain.map(pp=>`<li>"${esc(pp.quote)}" <em>(${esc(pp.source)})</em></li>`).join("")}</ul>`);

                        // GTM
                        const gtm = obj(p.goToMarket);
                        if (gtm.summary || gtm.cac) sections.push(`<h2>Go-to-Market</h2>${gtm.summary?`<p>${esc(gtm.summary)}</p>`:""}${gtm.primaryChannel?`<p><strong>Primary channel:</strong> ${esc(gtm.primaryChannel)}</p>`:""}${gtm.cac?`<p><strong>CAC estimate:</strong> ${esc(gtm.cac)}</p>`:""}`);

                        // Financials
                        const fin = obj(p.financials);
                        if (fin.summary || fin.revenueModel) sections.push(`<h2>Financials</h2>${fin.revenueModel?`<p><strong>Revenue model:</strong> ${esc(fin.revenueModel)}</p>`:""}${fin.summary?`<p>${esc(fin.summary)}</p>`:""}`);

                        // Action Plan
                        const ap = arr<{step:string;description:string;timeline:string}>(p.actionPlan);
                        if (ap.length) sections.push(`<h2>Action Plan</h2><ol>${ap.map(a=>`<li><strong>${esc(a.step)}</strong>${a.timeline?` <em>(${esc(a.timeline)})</em>`:""}<br>${esc(a.description)}</li>`).join("")}</ol>`);

                        // Synthesis
                        const syn = obj(p.synthesis);
                        const synText = syn.oneParagraph || str(p.synthesis);
                        const pros = arr<string>(syn.working || p.workingForYou);
                        const cons = arr<string>(syn.watchOut || p.watchOut);
                        if (synText || pros.length || cons.length) {
                          let html = "<h2>Synthesis</h2>";
                          if (synText) html += `<p>${esc(synText)}</p>`;
                          if (pros.length) html += `<h3>Working for you</h3><ul>${pros.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`;
                          if (cons.length) html += `<h3>Watch out</h3><ul>${cons.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`;
                          sections.push(html);
                        }

                        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(toolLabel)} — ${esc(idea)}</title><style>
*{box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;color:#111;max-width:760px;margin:0 auto;padding:40px 32px;line-height:1.65;font-size:14px}
.header{margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #e5e7eb}
.badge{display:inline-block;background:#eff6ff;color:#1d4ed8;padding:2px 9px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin-bottom:10px}
h1{font-size:22px;font-weight:700;margin:0 0 4px}.meta{color:#6b7280;font-size:13px;margin:0}
.score{font-size:48px;font-weight:800;color:#6366f1;line-height:1;margin:12px 0 0}.score-sub{font-size:20px;color:#9ca3af}
h2{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#374151;margin:36px 0 10px;padding-bottom:5px;border-bottom:1px solid #e5e7eb}
h3{font-size:12px;font-weight:700;color:#6b7280;margin:14px 0 6px;text-transform:uppercase;letter-spacing:.05em}
p{margin:0 0 10px}ul,ol{margin:0 0 12px;padding-left:20px}li{margin-bottom:5px}
blockquote{background:#faf5ff;border-left:3px solid #7c6fff;margin:0 0 16px;padding:12px 16px;font-style:italic;color:#4c1d95;border-radius:0 6px 6px 0}
.gap{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:12px 14px;margin-bottom:10px}
.opp{color:#059669;font-size:13px;margin:4px 0 0}
.footer{margin-top:48px;padding-top:16px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:11px;text-align:center}
@media print{body{padding:20px}h2{page-break-after:avoid}.gap{page-break-inside:avoid}}
</style></head><body>
<div class="header"><div class="badge">${esc(toolLabel)}</div><h1>${esc(idea)}</h1><p class="meta">${dateStr}</p></div>
${sections.join("\n")}
<div class="footer">Generated by Unbuilt.me · ${dateStr}</div>
</body></html>`;

                        // Use shared generatePdf - same as My Reports
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const jsPDFLib = (window as any).jspdf?.jsPDF;
                        if (!jsPDFLib) { alert("PDF library loading, please try again."); return; }
                        const reportObj = {
                          id: "live",
                          tool: (selectedTool === "stack-advisor" ? "stack-advisor" : "gap-analysis") as "gap-analysis" | "stack-advisor",
                          idea,
                          created_at: new Date().toISOString(),
                          json_content: streamedContent,
                        };
                        generatePdf(reportObj, jsPDFLib);
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "0.375rem 0.875rem", borderRadius: 9,
                        background: "transparent", border: "1px solid var(--clr-border)",
                        color: "var(--clr-text-3)", fontSize: "0.775rem", fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2v7M5 6l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 10v2.5A1.5 1.5 0 004.5 14h7a1.5 1.5 0 001.5-1.5V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                      Download PDF
                    </button>
                    <button
                      onClick={backToTools}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "0.375rem 1rem", borderRadius: 9,
                        background: "#7c6fff",
                        border: "none",
                        color: "white", fontSize: "0.775rem", fontWeight: 700,
                        cursor: "pointer", fontFamily: "inherit", letterSpacing: "-0.01em",
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = "0.9"}
                      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = "1"}
                    >
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
                      New analysis
                    </button>
                  </div>
                </div>
              )}

              {/* ââ Data source badges + cache badge ââ */}

              {/* Loading skeleton — only while nothing has streamed yet */}
              {loading && (selectedTool === "gap-analysis" || selectedTool === "stack-advisor") && <GapAnalysisSkeleton />}
              {loading && selectedTool !== "gap-analysis" && selectedTool !== "stack-advisor" && selectedTool !== "trend-feed" && sections.length === 0 && currentTool && <LoadingSkeleton tool={currentTool} />}

              {/* Error */}
              {outOfCredits && (
                <div style={{ margin: "16px 0", padding: "14px 18px", borderRadius: 10, background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.3)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,80,80,0.9)" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "rgba(255,80,80,0.9)" }}>Out of credits</span>
                  </div>
                  <a href="/pricing" style={{ fontSize: "0.8rem", fontWeight: 700, color: "#fff", background: "rgba(255,80,80,0.85)", padding: "6px 14px", borderRadius: 7, textDecoration: "none" }}>Buy credits →</a>
                </div>
              )}
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

              {/* Dig: structured visual report */}
              {selectedTool === "gap-analysis" && !loading && streamedContent ? (
                (() => {
                  const gapData = parseGapAnalysisJSON(streamedContent);
                  if (gapData) return <div style={{ padding:"0 16px 16px 12px" }}><GapAnalysisResult data={gapData} itunesApps={itunesApps} gplayApps={gplayApps} /></div>;
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

              {/* ââ App Stores (Dig only) — unified merged list ââ */}




              </div>
              )}
            </div>
          )}
        </main>

      </div>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" strategy="lazyOnload" />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" strategy="lazyOnload" />
    </>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeInner />
    </Suspense>
  );
}
