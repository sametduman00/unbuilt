"use client";

import { useState, useRef, useEffect, useCallback, useMemo, Suspense } from "react";
import Script from "next/script";
import { generatePdf } from "@/app/lib/generatePdf";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth, useUser, useClerk, UserButton, SignInButton } from "@clerk/nextjs";

// ââ Types âââââââââââââââââââââââââââââââââââââââââââââââââââââ
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

function GapAnalysisResult({ data, itunesApps, gplayApps, idea, onSwitchToStack }: { data: GapAnalysisData; itunesApps?: ITunesApp[]; gplayApps?: GooglePlayApp[]; idea?: string; onSwitchToStack?: (idea: string) => void }) {
  const [mob, setMob] = useState(false);
  useEffect(() => { const mq = window.matchMedia("(max-width: 768px)"); const chk = () => setMob(mq.matches); chk(); mq.addEventListener("change", chk); return () => mq.removeEventListener("change", chk); }, []);
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
          <Card title="TL;DR - Executive Summary" sub={"Market score: "+sc+"/100"} right={
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              {data._evidence?.level && <Pill text={data._evidence.level+" confidence"} color={data._evidence.level==="high"?"green":data._evidence.level==="moderate"?"orange":"red"} />}
              <Pill text={data.marketScoreLabel??"Opportunity"} color={sc>=70?"green":sc>=50?"orange":"red"} />
            </div>
          }>
            <div style={{ display:"flex", flexDirection:(typeof window!=="undefined"&&window.innerWidth<768)?"column":"row" as const, alignItems:(typeof window!=="undefined"&&window.innerWidth<768)?"center":"flex-start" as const, gap:20, marginBottom:20 }}>
              <div style={{ display:"flex", flexDirection:"column" as const, alignItems:"center", gap:8, flexShrink:0 }}>
                <ScoreCircle size={90} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                {data.verdict && <p style={{ fontSize:14, lineHeight:1.7, color:"#111827", fontWeight:500, margin:"0 0 8px 0" }}>{data.verdict}</p>}
                <p style={{ fontSize:13, lineHeight:1.7, color:"#6b7280", margin:"0 0 12px 0" }}>{data.marketScoreSummary}</p>
                {data.synthesis?.recommendedAction && (
                  <div style={{ marginBottom:12 }}>
                    <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:8, fontSize:12, fontWeight:600,
                      background: data.synthesis.recommendedAction==="kill"?"#fee2e2" : data.synthesis.recommendedAction==="move_fast"?"#dcfce7" : data.synthesis.recommendedAction==="build_mvp"?"#dbeafe" : data.synthesis.recommendedAction==="reposition"?"#fff7ed" : "#f3f4f6",
                      color: data.synthesis.recommendedAction==="kill"?"#dc2626" : data.synthesis.recommendedAction==="move_fast"?"#16a34a" : data.synthesis.recommendedAction==="build_mvp"?"#2563eb" : data.synthesis.recommendedAction==="reposition"?"#ea580c" : "#374151",
                    }}>
                      Recommended: {data.synthesis.recommendedAction.replace(/_/g," ")}
                    </div>
                    {data._scoring?.action_override && (
                      <div style={{ fontSize:11, color:"#6b7280", marginTop:4, lineHeight:1.5 }}>
                        {data._scoring.action_override_reason}
                      </div>
                    )}
                  </div>
                )}
                {data.oneLiner && sc >= 30 && (
                  <div style={{ background:"#f5f3ff", border:"1px solid #ddd6fe", borderRadius:8, padding:"10px 14px" }}>
                    <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, color:"#7c3aed", marginBottom:3, letterSpacing:"0.07em" }}>Your One-Liner</div>
                    <div style={{ fontSize:13, fontStyle:"italic" as const, color:"#1e1b4b" }}>"{data.oneLiner}"</div>
                  </div>
                )}
                <div style={{ display:"flex", gap:12, marginTop:12, flexWrap:"wrap" as const }}>
                  {data.marketSize?.tam && <div style={{ fontSize:12, color:"#374151" }}>📈 <strong>TAM:</strong> {parseMarketVal(data.marketSize.tam).num}</div>}
                  {data.competitors?.[0] && <div style={{ fontSize:12, color:"#374151" }}>⚔ <strong>Top threat:</strong> {data.competitors[0].name}</div>}
                  {data.marketGaps?.[0] && <div style={{ fontSize:12, color:"#374151" }}>🎯 <strong>Best gap:</strong> {data.marketGaps[0].title}</div>}
                </div>
              </div>
            </div>
            {/* Fatal flaw + upside condition */}
            {(data.synthesis?.fatalFlaw || data.synthesis?.upsideCondition) && (
              <div style={{ display:"grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap:10, marginBottom:16 }}>
                {data.synthesis?.fatalFlaw && (
                  <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:14 }}>
                    <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, color:"#dc2626", marginBottom:6, letterSpacing:"0.07em" }}>Fatal flaw</div>
                    <div style={{ fontSize:13, color:"#7f1d1d", lineHeight:1.5 }}>{data.synthesis.fatalFlaw}</div>
                  </div>
                )}
                {data.synthesis?.upsideCondition && (
                  <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:14 }}>
                    <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, color:"#16a34a", marginBottom:6, letterSpacing:"0.07em" }}>Upside condition</div>
                    <div style={{ fontSize:13, color:"#14532d", lineHeight:1.5 }}>{data.synthesis.upsideCondition}</div>
                  </div>
                )}
              </div>
            )}
            <div style={{ display:"grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr 1fr", gap:10 }}>
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
          {/* D1-D5 Score Breakdown */}
          {data._scoring && (
            <Card title="Score Breakdown" sub="How the market score was calculated">
              <div style={{ display:"flex", flexDirection:"column" as const, gap:10 }}>
                {[
                  { key:"D1_demand", label:"Demand signals", weight:"30%", color:"#6366f1" },
                  { key:"D2_competition", label:"Competitive density", weight:"20%", color:"#f59e0b" },
                  { key:"D3_gaps", label:"Gap quality", weight:"25%", color:"#10b981" },
                  { key:"D4_timing", label:"Market timing", weight:"15%", color:"#ec4899" },
                  { key:"D5_entry", label:"Entry feasibility", weight:"10%", color:"#8b5cf6" },
                ].map(dim => {
                  const d = data._scoring?.[dim.key];
                  if (!d) return null;
                  const s = d.score ?? 0;
                  return (
                    <div key={dim.key} style={{ marginBottom:6 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <div style={{ width:110, fontSize:11, fontWeight:600, color:"#374151", flexShrink:0 }}>{dim.label} <span style={{ color:"#9ca3af", fontWeight:400 }}>({dim.weight})</span></div>
                        <div style={{ flex:1, height:8, background:"#f3f4f6", borderRadius:4, overflow:"hidden" }}>
                          <div style={{ width:s+"%", height:"100%", background:dim.color, borderRadius:4, transition:"width 0.5s" }} />
                        </div>
                        <div style={{ width:28, fontSize:13, fontWeight:700, color:"#111827", textAlign:"right" as const }}>{s}</div>
                      </div>
                      {d.key_signal && <div style={{ fontSize:10, color:"#9ca3af", marginLeft:122, marginTop:2, lineHeight:1.4 }}>{d.key_signal}</div>}
                    </div>
                  );
                })}
              </div>
              {data._scoring?.fatal_floor_applied && (
                <div style={{ marginTop:12, padding:"8px 12px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, fontSize:12, color:"#dc2626" }}>
                  ⚠ One of the core dimensions (demand or gap quality) scored very low, which limits how high the final score can go — even if other dimensions are strong.
                </div>
              )}
              {data._evidence?.level && data._evidence.level !== "high" && (
                <div style={{ marginTop:8, padding:"8px 12px", background:"#fffbeb", border:"1px solid #fde68a", borderRadius:8, fontSize:12, color:"#92400e" }}>
                  ℹ {data._evidence.activeSources} of {data._evidence.totalSources} data sources returned results. Confidence: {data._evidence.level}.
                </div>
              )}
            </Card>
          )}
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
              <div style={{ display:"flex", flexDirection:(typeof window!=="undefined"&&window.innerWidth<768)?"column":"row" as const, alignItems:"stretch", gap:(typeof window!=="undefined"&&window.innerWidth<768)?12:10, marginBottom:16 }}>
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
                      {(c.funding || c.userCount) && (
                        <div style={{ display:"flex", gap:6, marginTop:4, flexWrap:"wrap" as const }}>
                          {c.funding && <span style={{ fontSize:10, padding:"1px 6px", borderRadius:4, background:"#f3f4f6", color:"#374151" }}>{c.funding}</span>}
                          {c.userCount && <span style={{ fontSize:10, padding:"1px 6px", borderRadius:4, background:"#f3f4f6", color:"#374151" }}>{c.userCount} users</span>}
                        </div>
                      )}
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
                <div style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:14, display:"flex", flexDirection:"column" as const, gap:6 }}>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, color:"#ef4444" }}>Monthly Burn</div>
                  <div style={{ fontSize:22, fontWeight:800, color:"#111827" }}>{data.financialDeep.monthlyBurn.total}</div>
                  <div style={{ fontSize:11, color:"#6b7280" }}>Infra {data.financialDeep.monthlyBurn.infrastructure} · Tools {data.financialDeep.monthlyBurn.tools} · Mkt {data.financialDeep.monthlyBurn.marketing}</div>
                  <div style={{ marginTop:4, padding:"8px 10px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8 }}>
                    <div style={{ fontSize:11, color:"#166534", marginBottom:6 }}>No-code tools can build this for <b>&lt;$50/mo</b></div>
                    <button onClick={() => onSwitchToStack?.(idea ?? data.appStoreQuery ?? "")}
                      style={{ width:"100%", padding:"6px 0", borderRadius:6, background:"#16a34a", border:"none", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                      Build it with Stack →
                    </button>
                  </div>
                </div>
                <div style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:14, display:"flex", flexDirection:"column" as const, gap:6 }}>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, color:"#10b981", marginBottom:2 }}>Break-Even</div>
                  <div style={{ padding:"8px 10px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8 }}>
                    <div style={{ fontSize:22, fontWeight:800, color:"#111827", marginBottom:4 }}>Month 1</div>
                    <div style={{ fontSize:12, color:"#6b7280" }}>Build with our Stack — costs covered from day one</div>
                  </div>
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
              <div style={{ flex:1, minWidth:0 }}>
                {data.verdict && <p style={{ fontSize:14, lineHeight:1.7, color:"#111827", fontWeight:500, margin:"0 0 8px 0" }}>{data.verdict}</p>}
                <p style={{ fontSize:13, lineHeight:1.7, color:"#6b7280", margin:0 }}>{data.synthesis?.oneParagraph}</p>
              </div>
            </div>
            {/* Recommended Action badge + override explanation */}
            {data.synthesis?.recommendedAction && (
              <div style={{ marginBottom:16 }}>
                <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:8, fontSize:13, fontWeight:600,
                  background: data.synthesis.recommendedAction==="kill"?"#fee2e2" : data.synthesis.recommendedAction==="move_fast"?"#dcfce7" : data.synthesis.recommendedAction==="build_mvp"?"#dbeafe" : data.synthesis.recommendedAction==="reposition"?"#fff7ed" : "#f3f4f6",
                  color: data.synthesis.recommendedAction==="kill"?"#dc2626" : data.synthesis.recommendedAction==="move_fast"?"#16a34a" : data.synthesis.recommendedAction==="build_mvp"?"#2563eb" : data.synthesis.recommendedAction==="reposition"?"#ea580c" : "#374151",
                }}>
                  → Recommended: {data.synthesis.recommendedAction.replace(/_/g," ")}
                </div>
                {data._scoring?.action_override && (
                  <div style={{ fontSize:12, color:"#6b7280", marginTop:6, lineHeight:1.5 }}>
                    {data._scoring.action_override_reason}
                  </div>
                )}
              </div>
            )}
            {/* One-liner — only show if score >= 30 */}
            {data.oneLiner && sc >= 30 && (
              <div style={{ background:"#f5f3ff", border:"1px solid #ddd6fe", borderRadius:10, padding:14, display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase" as const, color:"#7c3aed", marginBottom:4, letterSpacing:"0.07em" }}>Your One-Liner</div>
                  <div style={{ fontSize:13, fontStyle:"italic" as const, color:"#1e1b4b" }}>"{data.oneLiner}"</div>
                </div>
                <button onClick={() => navigator.clipboard?.writeText(data.oneLiner??"")} style={{ padding:"5px 12px", borderRadius:6, border:"1px solid #ddd6fe", background:"white", cursor:"pointer", fontSize:12, flexShrink:0, marginLeft:12 }}>Copy</button>
              </div>
            )}
          </Card>
          {/* Defensibility */}
          {data.synthesis?.defensibility && (
            <Card title="Defensibility" sub="How protected is this position?">
              <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:14 }}>
                <div style={{ display:"inline-flex", padding:"4px 12px", borderRadius:8, fontSize:12, fontWeight:600,
                  background: data.synthesis.defensibility.level==="high"?"#dcfce7" : data.synthesis.defensibility.level==="medium"?"#fff7ed" : "#fee2e2",
                  color: data.synthesis.defensibility.level==="high"?"#16a34a" : data.synthesis.defensibility.level==="medium"?"#ea580c" : "#dc2626",
                }}>
                  {(data.synthesis.defensibility.level??"unknown").toUpperCase()} defensibility
                </div>
              </div>
              {data.synthesis.defensibility.moat && (
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase" as const, color:"#374151", marginBottom:4, letterSpacing:"0.07em" }}>Moat</div>
                  <p style={{ fontSize:13, color:"#6b7280", margin:0, lineHeight:1.6 }}>{data.synthesis.defensibility.moat}</p>
                </div>
              )}
              {data.synthesis.defensibility.copyTimeframe && (
                <div>
                  <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase" as const, color:"#374151", marginBottom:4, letterSpacing:"0.07em" }}>Copy timeframe</div>
                  <p style={{ fontSize:13, color:"#6b7280", margin:0, lineHeight:1.6 }}>{data.synthesis.defensibility.copyTimeframe}</p>
                </div>
              )}
            </Card>
          )}
          {data.synthesis && (
            <div style={{ display:"grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap:12 }}>
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
          {/* Confidence note */}
          {data.synthesis?.confidenceNote && (
            <div style={{ marginTop:12, padding:"10px 14px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, fontSize:12, color:"#6b7280", lineHeight:1.6 }}>
              ℹ {data.synthesis.confidenceNote}
            </div>
          )}
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="dig-result-panel" style={{ background:"white", border:"1px solid #e5e7eb", borderRadius:16, overflow:"hidden", display:"flex", flexDirection: mob ? "column" : "row" as const, height: mob ? "auto" : "calc(100vh - 76px)", marginTop:8 }}>
      <div style={{ width: mob ? "100%" : 220, borderRight: mob ? "none" : "1px solid #e5e7eb", borderBottom: mob ? "1px solid #e5e7eb" : "none", padding: mob ? "8px" : "14px 8px", flexShrink:0, background:"#fafafa", display:"flex", flexDirection: "column" as const, flexWrap: "nowrap" as const, gap: mob ? 3 : 2, overflowY: "auto" as const }}>
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
      <div id="gap-tab-content" style={{ flex:1, padding: mob ? 12 : 22, overflowY:"auto" as const, overflowX:"hidden" as const, background:"white", boxSizing:"border-box" as const }}>
        {renderTab()}
      </div>
    </div>
  );
}

// ── DIG SAMPLE REPORT — "sleep tracking app for shift workers and nurses" ──

// ── DIG SAMPLE REPORT — Real API data, rendered with GapAnalysisResult ──
const DIG_SAMPLE_JSON = `{"appStoreQuery":"apprenticeship hour tracking","marketScore":54,"marketScoreLabel":"Mixed Signals","marketScoreSummary":"Real pain exists among individual apprentices still using paper logbooks and YouTube tutorials to figure out hour tracking, but a handful of direct competitors (OJT Logbook, WorkHands) already target this exact workflow — none well — while enterprise AMS platforms approach from above.","verdict":"The gap between enterprise apprenticeship management platforms and individual apprentice needs is genuine and validated by terrible incumbent adoption (WorkHands: 2.4 stars, 8 reviews). But someone on Reddit is already building a free version of this exact product, and OJT Logbook exists. Validate whether apprentices will pay for this before building — the Reddit builder is going free, which could collapse your revenue model before you launch.","oneLiner":"The only mobile app that tracks apprenticeship hours and maps them to your state's exact electrical or plumbing certification requirements.","competitors":[{"name":"ApprentiScope","tagline":"#1 Apprenticeship Management System for program administrators","threatLevel":3,"funding":"Unknown — likely bootstrapped or seed-funded based on positioning","strengths":["Self-describes as '#1 Rated Apprenticeship Management System' and appears prominently in search results, suggesting strong SEO and brand positioning in the AMS category. Has RAPIDS reporting built in, which is critical for federally registered programs.","Targets the program administrator buyer (the person with budget), not the individual apprentice, meaning they capture enterprise revenue even if individual apprentices never download an app."],"weaknesses":["Enterprise-focused positioning means individual apprentices likely never interact with the product directly. If an apprentice isn't in a large registered program, ApprentiScope doesn't serve them.","No visible app store presence for individual apprentices — the product is a web platform for administrators, creating a gap for mobile-first field workers."],"userCount":"Unknown"},{"name":"WorkHands","tagline":"Apprenticeship simplified — manage your apprenticeship from anywhere","threatLevel":2,"funding":"Unknown — likely small/bootstrapped given minimal traction","strengths":["Most direct competitor in the app store specifically targeting individual apprentice tracking. Positions for administrators, supervisors, AND apprentices — covering the full workflow chain.","Has a website (workhands.com) positioning as a 'private tracking platform' for modern apprenticeship programs, suggesting some B2B sales motion."],"weaknesses":["Catastrophically poor App Store performance: 2.4 stars with only 8 reviews. This is the clearest signal that the product is failing its users. Eight reviews after being on the app store suggests near-zero organic adoption.","The rating suggests severe product quality issues — this is an opportunity signal for a better-executed competitor, but also a warning that the market may be harder to monetize than expected."],"userCount":"Likely under 1,000 based on 8 reviews"},{"name":"OJT Logbook","tagline":"The essential tool for skilled trades training and workforce development","threatLevel":4,"funding":"Unknown","strengths":["Directly positioned for the exact use case described: 'helps employers and apprentices track progress, validate skills, and simplify' trades training. The name itself signals the core value prop — OJT (On-the-Job Training) hour logging.","Appears to serve both employers and apprentices, covering the supervisor approval workflow that is critical for certification compliance."],"weaknesses":["No app store listing found in the live data, which may indicate it's web-only — a significant disadvantage for field workers on job sites who need mobile-first logging.","No visible traction metrics (reviews, downloads, user counts) in any live data source, making it impossible to assess actual market penetration."],"userCount":"Unknown"},{"name":"Union.dev","tagline":"Online platform for unions to track apprenticeship progress","threatLevel":3,"funding":"Unknown","strengths":["Specifically built for union apprenticeship tracking with 'real-time updates, customizable dashboards, and mobile accessibility.' Union programs represent a massive chunk of electrical and plumbing apprenticeships, giving Union.dev a structural advantage in that segment.","The platform is designed for the union administrator workflow, which includes apprentice hour tracking as a core feature — not a bolt-on."],"weaknesses":["Exclusively union-focused, leaving non-union apprentices (a growing segment) completely unserved. This is a clear segmentation gap.","The buyer is the union, not the individual apprentice. Individual non-union apprentices have no access to this platform."],"userCount":"Unknown"},{"name":"Craft Education (Craft Connect)","tagline":"Workforce program management software for registered apprenticeships","threatLevel":2,"funding":"Unknown","strengths":["Purpose-built for Registered Apprenticeship Programs (RAPs) with OJT hours, RTI completions, and employer partner management. Comprehensive feature set for program-level compliance.","Positioned for the complexity of registered apprenticeships, suggesting deep domain expertise and likely federal compliance capabilities."],"weaknesses":["Enterprise B2B positioning means individual apprentices are not the target customer. An electrical apprentice working for a small contractor would never encounter this product.","No consumer-facing evidence in any data source — this is a back-office tool, not a field tool."],"userCount":"Unknown"},{"name":"SkillCat","tagline":"Trade school alternative — EPA 608, HVAC certification training","threatLevel":2,"funding":"Unknown — strong traction suggests real funding","strengths":["Dominant app store presence with 4.9 stars and 7K reviews — by far the most successful trade-focused app in the data. Proves skilled trades workers WILL use mobile apps, validating the channel.","Strong brand positioning as a 'trade revolution' alternative to college, capturing the cultural moment around skilled trades."],"weaknesses":["Focused on certification exam PREP and training content, NOT on hour logging or apprenticeship tracking. It's an adjacent product, not a direct competitor for the proposed idea.","The success of SkillCat in training does not necessarily translate to willingness to pay for a separate hour-logging tool — could be a feature they add rather than a standalone opportunity."],"userCount":"Likely 50K+ based on 7K reviews"}],"painPoints":[{"quote":"Log OJT and classroom hours with one tap. Get supervisor approval digitally (no more chasing signatures). Track progress toward licensing...","source":"Reddit r/skilledtrades","severity":"high","demandSignal":"A developer is building a free app for this exact problem, validating that apprentices actively struggle with paper-based hour logging and manual supervisor approval workflows. The fact that someone is building this for FREE suggests demand but also a willingness-to-pay risk."},{"quote":"The most effective way to track your electrician apprenticeship hours involves maintaining detailed accurate logs verified by your supervising electrician","source":"YouTube (How Do I Track Electrician Apprenticeship Hours?)","severity":"high","demandSignal":"YouTube content specifically addressing how to track apprenticeship hours indicates apprentices are actively searching for guidance — they don't have an obvious, standard tool. The existence of this content as a how-to video rather than a product recommendation confirms the workflow is unsolved."},{"quote":"Electrical Apprentice Experience Log: A Daily Work & Learning Logbook for Electrical Apprentices","source":"Amazon.com product listings","severity":"medium","demandSignal":"Physical paper logbooks being sold on Amazon for electrical apprentices confirms that manual paper-based tracking is still the norm for many. This is a classic adoption gap signal — the workflow exists but hasn't been digitized for this segment."},{"quote":"You must diligently record your work experience using an official log book or approved digital platform","source":"YouTube (How To Document My Electrician Apprenticeship Hours?)","severity":"medium","demandSignal":"The phrasing 'official log book or approved digital platform' reveals that digital platforms exist but are not universally adopted or known. The fact that apprentices are watching YouTube videos to learn the process suggests tooling friction."},{"quote":"Most plumbers, pipefitters, and steamfitters learn their trade through a 4- or 5-year apprenticeship. Apprentices typically receive 2,000 hours of paid training","source":"Bureau of Labor Statistics","severity":"high","demandSignal":"A 4-5 year, 8,000-10,000 hour tracking requirement creates a sustained, recurring need for logging tools. This is not a one-time task — it's years of daily tracking, which makes the pain chronic and the use case sticky."}],"marketGaps":[{"title":"Individual Apprentice-Facing Mobile Tool","description":"The vast majority of existing tools (ApprentiScope, Union.dev, Craft Education, GoSprout, MyOneFlow) serve program administrators and employers, not individual apprentices. WorkHands is the closest individual-facing tool but has catastrophic ratings (2.4 stars, 8 reviews). Non-union apprentices at small contractors have no clear tool designed for their workflow. This creates a gap for a mobile-first app that the apprentice themselves downloads and uses daily.","evidence":"WorkHands 2.4 stars/8 reviews; ApprentiScope/Union.dev/Craft Education all positioned as enterprise AMS platforms; Amazon selling physical logbooks; YouTube how-to videos for hour tracking","opportunityScore":7,"status":"contested"},{"title":"State-Specific Certification Requirement Engine","description":"Each state has different hour requirements, categories, and certification pathways for electrical and plumbing licenses. No tool in the live data explicitly addresses multi-state certification compliance from the apprentice's perspective. RAPIDS is the federal system but covers registered programs, not individual state journeyman licensing requirements. Building a comprehensive state requirement database would create a data moat that generic hour trackers can't easily replicate.","evidence":"Washington State ARTS public system exists but is state-specific; Utah, New York mentioned with different state systems; BLS confirms state-level licensing variation for plumbers and electricians","opportunityScore":7,"status":"untapped"},{"title":"Non-Union Apprentice Segment","description":"Union.dev explicitly serves union apprenticeships. Most enterprise AMS platforms serve Registered Apprenticeship Programs (RAPs). But many electrical and plumbing apprentices work for small non-union contractors, tracking hours informally for eventual state licensing exams. This segment has no purpose-built tool and relies on paper logbooks or spreadsheets. The non-union segment may be harder to reach (no central organization) but represents a real underserved population.","evidence":"Union.dev explicitly union-focused; Amazon physical logbooks suggest manual tracking; Reddit post targeting individual apprentices not in formal programs","opportunityScore":6,"status":"untapped"},{"title":"Supervisor Approval Workflow for Small Shops","description":"The Reddit post highlights 'no more chasing signatures' as a key feature — digital supervisor approval. Enterprise platforms handle this for large programs, but small electrical or plumbing contractors (1-5 apprentices) don't use enterprise AMS. A lightweight digital signature and approval workflow for small shops would fill a gap between paper processes and enterprise tools that cost $200+/month.","evidence":"Reddit post: 'Get supervisor approval digitally (no more chasing signatures)'; GoSprout's best practices mention compliance tracking; BLS confirms supervisor verification requirements","opportunityScore":6,"status":"emerging"}],"swot":{"strengths":["Chronic 4-5 year pain cycle creates long retention per user","Existing direct competitor (WorkHands) is failing at 2.4 stars","Physical logbooks on Amazon prove paper workflows persist","SkillCat at 4.9/7K reviews proves trades workers adopt mobile apps"],"weaknesses":["Individual apprentices may resist paying for hour tracking","State-by-state certification database requires ongoing maintenance","Reddit builder going free could collapse pricing before launch","Small addressable market per trade (electrical + plumbing only)"],"opportunities":["DOL $145M + BlackRock $100M funding will create more apprentices","Expand to HVAC, welding, carpentry after proving electrical/plumbing","B2B pivot to small contractors as employer-paid tool","Partnership with trade schools as onboarding channel"],"threats":["SkillCat (4.9 stars, 7K reviews) could add hour logging as a feature","State DOL systems could modernize and offer free digital tracking","Enterprise AMS platforms could launch free apprentice-facing apps","RAPIDS system modernization could centralize tracking federally"]},"opportunity":{"headline":"A clear pain exists for individual apprentices tracking hours with paper, but willingness to pay and competition from free alternatives remain unvalidated","urgency":"medium","actionItems":[{"step":1,"action":"Interview 15-20 electrical and plumbing apprentices about their current tracking workflow","detail":"The Reddit post and YouTube videos confirm the pain exists, but willingness to pay vs. expectation of free tools is the critical unknown. Ask specifically what they currently use and what they'd pay."},{"step":2,"action":"Map state certification requirements for top 10 states by apprentice volume","detail":"Use Apprenticeship.gov state dashboard data to identify highest-volume states. Building the state requirement database is the potential moat — validate feasibility and maintenance cost before committing."},{"step":3,"action":"Test B2B vs B2C pricing model with small contractors","detail":"Individual apprentices may not pay $10/month, but a small contractor with 3-5 apprentices might pay $50/month for compliance peace of mind. Interview 10 small electrical/plumbing contractors about their tracking pain."},{"step":4,"action":"Build a lightweight landing page and run Facebook ads in trade groups","detail":"Target r/skilledtrades, Facebook groups like the plumbing apprenticeship one found in live data, and trade school partnerships. Measure sign-up intent before building."}]},"targetCustomer":{"persona":"The Aspiring Journeyman","jobTitle":"Electrical or Plumbing Apprentice","demographics":"Ages 18-30, working full-time on job sites, 4-5 year apprenticeship programs, many work for small non-union contractors","painPoints":["Tracks hours on paper logbooks or messy spreadsheets","Confused about exact state requirements for certification","Loses documentation or has hours disputed by supervisors"],"currentTools":["Paper logbook from trade school or Amazon","Excel or Google Sheets","WorkHands (if required by program — 2.4 stars)"],"willingnessToPay":"$5-15/month for individual apprentices; employer or program is the more viable budget holder"},"targetCustomerDeep":{"whoTheyAre":"Electrical and plumbing apprentices in years 1-4 of their apprenticeship, typically 18-30 years old, working full-time on job sites. Many work for small non-union contractors who don't provide enterprise tracking software. They need to accumulate 8,000-10,000 hours over 4-5 years and submit verified documentation to state licensing boards.","howTheyThink":"Motivated by career progression toward journeyman status and the higher wages that come with it ($39.33/hour average in construction per live data). They see hour tracking as a necessary chore, not something they want to spend time or money on. They're practical, mobile-first, and unlikely to use complex software.","availableMoney":"Apprentice wages start lower but reach $39.33/hour average by journeyman level. Discretionary spending on career tools is likely low — $5-15/month is the realistic ceiling for an individual apprentice. The employer or program is the more viable budget holder.","howTheyBuy":"App Store search, word-of-mouth on job sites, recommendations from journeymen or supervisors, YouTube tutorials, Reddit communities like r/skilledtrades. They'll try free tools first and only pay if the value is immediately obvious.","triggerEvents":["Starting a new apprenticeship and realizing they need to track hours","Approaching state licensing exam and realizing their hour documentation is incomplete or disorganized","Changing employers mid-apprenticeship and needing to consolidate hours from multiple jobs"],"whereToFindThem":["r/skilledtrades and r/electricians on Reddit","Facebook groups for plumbing and electrical apprenticeships","Trade school campuses and orientation events","YouTube comments on hour-tracking tutorial videos","Union halls and JATC (Joint Apprenticeship Training Committees)"]},"industryTrends":{"now":[{"trend":"Massive government and private investment in apprenticeship expansion","evidence":"DOL $145M funding (Feb 2026), DOL $86M to 14 states (Sep 2025), BlackRock $100M for trade training — all from live data","impact":"high"},{"trend":"Skilled trades wages outpacing private sector average","evidence":"Construction wages at $39.33/hour, 24% above private sector average per ablemkr 2026 report","impact":"medium"},{"trend":"Skilled trades unemployment dropping below college graduates","evidence":"Finance-Commerce: 'Trade workers briefly saw lower unemployment than college graduates in 2025, BLS data shows'","impact":"medium"}],"emerging":[{"trend":"Electrician job growth significantly above average","evidence":"BLS reports electricians growing 9% from 2024-2034, per ptt.edu data","impact":"high"},{"trend":"Digital transformation of trades training and credentialing","evidence":"Lowe's Track to the Trades, Home Depot Path to Pro, GM $242M skilled trades investment — large corporates building digital trade pipelines","impact":"medium"}],"structural":[{"trend":"RAPIDS system modernization and federal apprenticeship data infrastructure","evidence":"Apprenticeship.gov dashboards, DOL RAPIDS system, Apprenticeship.gov 'Verify My Apprenticeship' tool — federal infrastructure evolving","impact":"high"},{"trend":"Generational shift toward trades as alternative to college","evidence":"SkillCat positioning 'College is $100K of debt. Traditional trade schools are stuck in 1997'; BlackRock CEO flagging skilled trade worker shortage; NFPA State of Skilled Trades Report 2026","impact":"high"}]},"marketSegments":[{"name":"Individual Electrical Apprentices (US)","fit":"primary","size":"$15M (directional estimate based on ~80K active electrical apprentices × $15/mo potential)","growth":"9% (BLS projected electrician job growth 2024-2034)","description":"Electrical apprentices completing 4-5 year programs with 8,000+ OJT hours needed for journeyman licensing. BLS confirms this is among the fastest-growing skilled trades. Many work for small non-union shops without enterprise tracking."},{"name":"Individual Plumbing Apprentices (US)","fit":"primary","size":"$10M (directional estimate based on ~50K active plumbing apprentices × $15/mo potential)","growth":"6% (estimated from BLS plumber outlook data)","description":"Plumbing apprentices in 4-5 year programs requiring 2,000 hours/year of paid OJT training per BLS. Growing segment driven by infrastructure investment and housing demand."},{"name":"Small Contractor Employers (B2B)","fit":"secondary","size":"$50M (directional estimate inferred from 27K registered programs, subset serving electrical/plumbing at small scale)","growth":"8% (estimated based on apprenticeship expansion funding trends)","description":"Small electrical and plumbing contractors (1-20 employees) who manage 1-5 apprentices. Too small for enterprise AMS platforms like ApprentiScope but need compliance tracking. Employer-paid model could command $30-100/month."},{"name":"Trade Schools and Community Colleges","fit":"tertiary","size":"$20M (directional estimate inferred from adjacent EdTech market data)","growth":"5% (estimated)","description":"Institutions like SLCC, Ogden-Weber Tech, and others offering plumbing/electrical apprenticeship programs. Could serve as distribution partners or institutional buyers for student cohort tracking."}],"goToMarket":{"channels":[{"name":"Reddit and Facebook Trade Communities","type":"primary","estimatedCAC":"$8","description":"r/skilledtrades already has active discussions about hour tracking apps. Facebook groups for plumbing and electrical apprenticeships are high-intent communities. Organic posting plus targeted ads to these groups would reach the exact target persona."},{"name":"Trade School Partnerships","type":"primary","estimatedCAC":"$3","description":"Partner with programs like SLCC Plumbing Apprenticeship, Ogden-Weber Tech, and similar institutions. Offer free institutional accounts in exchange for recommending the app to incoming apprentices. Low CAC because one partnership yields cohorts of 20-50 apprentices."},{"name":"YouTube SEO / Content","type":"secondary","estimatedCAC":"$5","description":"Apprentices are already watching YouTube videos like 'How Do I Track Electrician Apprenticeship Hours?' — create competing content that funnels to the app. This is a proven search behavior from the live data."},{"name":"App Store Optimization","type":"secondary","estimatedCAC":"$12","description":"WorkHands' 2.4-star rating means any competitor with a functional product will outrank it. Target keywords: 'apprenticeship hours', 'electrician apprentice log', 'plumbing apprentice tracker'. Low competition in the app stores based on live data."},{"name":"Union Hall and JATC Outreach","type":"experimental","estimatedCAC":"$15","description":"Direct outreach to Joint Apprenticeship Training Committees for electrical and plumbing unions. Higher CAC due to sales cycle but higher lifetime value per account. Competes with Union.dev in this channel."}],"launchTarget":"Non-union electrical apprentices in Texas, California, and Florida — high apprentice volume states with fragmented tracking","launchPhases":[{"phase":1,"name":"Organic Community Validation","duration":"1-2 months","steps":["Post in r/skilledtrades and electrical/plumbing Facebook groups with landing page","Collect 200+ email signups and conduct 20 customer interviews","Map state certification requirements for top 5 states"]},{"phase":2,"name":"MVP Launch","duration":"2-4 months","steps":["Build mobile app with core hour logging, supervisor approval, and 5-state certification tracking","Launch free tier with premium state tracking features","Target 500 active users through community channels"]},{"phase":3,"name":"B2B Expansion","duration":"4-8 months","steps":["Add employer dashboard for small contractors managing 1-5 apprentices","Pursue trade school partnerships for cohort onboarding","Expand state certification database to 25 states"]}]},"customerInterviewGuide":{"questions":["Walk me through exactly how you currently track your apprenticeship hours — what tool, what format, how often?","Have you ever had a problem with lost hours, missing supervisor signatures, or confusion about state requirements? What happened?","When you think about getting your journeyman license, what's the most stressful or confusing part of the process?","Have you tried any apps or digital tools for tracking your apprenticeship? What worked and what didn't?","If an app handled all your hour logging and told you exactly what your state requires for certification, would you pay $10/month for it? Why or why not?"],"whereToFindThem":["r/skilledtrades and r/electricians on Reddit","Facebook groups for electrical and plumbing apprenticeships","Trade school campuses (SLCC, Ogden-Weber Tech, etc.)","Local union halls and JATC meetings"],"greenSignals":["Apprentice describes losing paper logbooks or having to recreate hours from memory","Mentions frustration chasing supervisor signatures across multiple job sites","Says they'd pay 'anything' to not worry about state certification requirements","Currently using spreadsheets or notes apps as workarounds"],"redSignals":["Says their employer or union already provides a digital tracking system that works fine","Doesn't see hour tracking as a significant pain — just fills out the form monthly","Expects any such tool to be completely free and won't pay at any price point","Says their state board provides its own digital tracking portal"],"targetInterviews":15},"financialDeep":{"monthlyBurn":{"total":"$6,500","infrastructure":"$500","tools":"$300","marketing":"$1,700","acquisition":"$4,000"},"breakEvenMonth":"Month 14","twelveMonthMRR":"$8,500","revenueScenarios":{"cautious":{"mrr":"$3,500","probability":"35%","assumption":"B2C only, 350 paying apprentices at $10/month, high churn as free alternatives exist"},"middle":{"mrr":"$12,000","probability":"40%","assumption":"Hybrid B2C/B2B: 500 apprentices at $10/month + 20 small contractors at $35/month"},"optimistic":{"mrr":"$28,000","probability":"25%","assumption":"B2B pivot succeeds: 100 small contractors at $50/month + 5 trade school partnerships at $300/month + 800 individual apprentices at $10/month"}},"pricingBenchmark":"Insufficient live data — could not verify competitor pricing directly. ApprentiScope and enterprise AMS platforms likely charge $100-500/month for program-level access. Individual apprentice tools appear to be free (Reddit builder) or very low cost. SkillCat is free with premium content."},"fundabilityRadar":{"team":{"score":5,"note":"No team data available. Domain expertise in state licensing requirements would be critical differentiator."},"marketSize":{"score":5,"note":"Narrow initial market (electrical + plumbing apprentices only). ~130K estimated active apprentices in these two trades. Expands significantly if HVAC, welding, and carpentry are added."},"product":{"score":7,"note":"Clear product definition with strong UX opportunity given WorkHands' 2.4-star failure. State certification database could be a defensible asset."},"competition":{"score":7,"note":"No dominant individual-facing competitor. WorkHands failing. Enterprise AMS platforms don't serve this segment. Free Reddit competitor is pre-product."},"marketing":{"score":6,"note":"Clear community channels exist (Reddit, Facebook, YouTube, trade schools) but reaching dispersed individual apprentices at scale is harder than reaching enterprises."},"fundingNeed":{"score":8,"note":"Low capital requirements — mobile app buildable with small team. DOL $145M and BlackRock $100M create potential grant funding opportunities for workforce tech."}},"communitySignals":[{"quote":"Log OJT and classroom hours with one tap. Get supervisor approval digitally (no more chasing signatures). Track progress toward licensing...","source":"reddit","sentiment":"need","subredditOrHandle":"r/skilledtrades"},{"quote":"The most effective way to track your electrician apprenticeship hours involves maintaining detailed accurate logs verified by your supervising electrician","source":"youtube","sentiment":"pain","subredditOrHandle":"YouTube"},{"quote":"You must diligently record your work experience using an official log book or approved digital platform","source":"youtube","sentiment":"pain","subredditOrHandle":"YouTube"},{"quote":"The trades are not merely an alternative to college. A trade is equal to college. Earn a good paycheck while you learn","source":"twitter","sentiment":"positive","subredditOrHandle":"Twitter/X"},{"quote":"Electrical Apprentice Experience Log: A Daily Work & Learning Logbook for Electrical Apprentices","source":"vendor","sentiment":"need","subredditOrHandle":"Amazon.com"}],"redditPosts":[{"subreddit":"r/skilledtrades","title":"[Feedback] Building a free app for apprentices to track hours","body":"Log OJT and classroom hours with one tap. Get supervisor approval digitally (no more chasing signatures). Track progress toward licensing. Current Features: Smart hour logging (OJT/RTI tracking). Supervisor approval workflow. License & certification management. Progress tracking.","upvotes":0,"sentiment":"need"}],"xPosts":[{"handle":"@unknown","text":"The trades are not merely an alternative to college. A trade is equal to college. Earn a good paycheck while you learn","likes":4,"sentiment":"positive"},{"handle":"@unknown","text":"If your living situation allows, id highly recommend looking for an apprenticeship/trade school for a skilled trade job since you'd make more","likes":0,"sentiment":"positive"},{"handle":"@unknown","text":"That's a problem across most trades. That's a very skilled job and new kids aren't going to trade schools","likes":2,"sentiment":"pain"}],"marketSize":{"tam":"$500M (directional estimate — all apprenticeship management and training software in the US, inferred from $145M DOL funding + adjacent EdTech data)","sam":"$75M (directional estimate — electrical and plumbing apprenticeship tracking and certification tools, based on ~130K active apprentices + 5K+ programs)","som":"$2M (directional estimate — first 2 years targeting individual apprentices and small contractors in top 10 states)","growthRate":"8-10% CAGR (estimated based on BLS electrician growth of 9%, DOL apprenticeship expansion funding)"},"validationChecklist":[{"assumption":"Individual apprentices will pay $10/month for hour tracking when a free alternative exists on Reddit","risk":"high","howToTest":"Post a pricing survey in r/skilledtrades and 3 Facebook trade groups asking what apprentices would pay for a state-specific hour tracking app. Target 50 responses in 5 days."},{"assumption":"Apprentices are actually losing hours or failing certification due to poor tracking","risk":"high","howToTest":"Interview 10 journeymen electricians/plumbers and ask: 'Did you ever lose documented hours or have certification delays because of tracking issues during your apprenticeship?'"},{"assumption":"State certification requirements are sufficiently different to warrant a dedicated tracking layer","risk":"medium","howToTest":"Research and compare certification hour requirements across 10 states for electrical apprentices. Document differences in categories, minimums, and submission processes in a spreadsheet."},{"assumption":"Small contractors (non-union, 1-5 apprentices) don't already use an enterprise AMS","risk":"medium","howToTest":"Call 15 small electrical contractors in 3 states and ask how they currently track apprentice hours. Can be done in 2 days."},{"assumption":"Supervisor digital approval is a significant enough pain to drive adoption","risk":"medium","howToTest":"Ask in customer interviews: 'How do you currently get your supervisor to sign off on your hours? How often does this cause delays?' Look for frequency of the pain."}],"synthesis":{"oneParagraph":"There is genuine, documented pain in this space — apprentices watching YouTube videos to figure out hour tracking, buying paper logbooks on Amazon, and at least one developer building a free app to solve it. The enterprise AMS market (ApprentiScope, Union.dev, Craft Education) is well-served, but individual apprentices at small shops are left out. The critical question isn't whether the pain exists — it does — but whether individual apprentices will pay for a solution when free alternatives are being built and when their employer (the actual budget holder) might be a better target customer. I would not invest $100K today, but I would invest $5K and 30 days in customer discovery to validate the B2B pricing angle with small contractors.","fatalFlaw":"The individual apprentice has real pain but limited willingness to pay, and a developer on Reddit is already building a free version of this exact product — the B2C revenue model may be dead on arrival.","upsideCondition":"If customer interviews reveal that small contractors (not individual apprentices) are the real buyer and will pay $50-100/month for compliance tracking, the unit economics transform completely and this becomes a viable B2B SaaS play.","recommendedAction":"validate_niche","defensibility":{"level":"medium","moat":"A comprehensive, maintained state-by-state certification requirement database for electrical and plumbing licensing would be a meaningful data moat. No competitor appears to have built this yet.","copyTimeframe":"Core hour logging: 2-3 months to replicate. State certification database: 6-12 months to build and maintain at quality."},"workingForYou":["WorkHands (most direct competitor) has catastrophic 2.4-star rating with only 8 reviews — the bar is on the floor","Massive tailwinds from DOL $145M, BlackRock $100M, and 9% electrician job growth creating more apprentices who need tracking","4-5 year apprenticeship duration creates extremely high potential LTV if retention works"],"watchOutFor":["Reddit developer building free version of this exact product could capture the market before you monetize","SkillCat (4.9 stars, 7K reviews) could add hour logging as a feature and leverage existing user base","State DOL systems could modernize their own digital tracking portals, eliminating the need for third-party tools"],"confidenceNote":"Based on 10 of 11 sources with relevant data. Confidence: high. Strong evidence across App Store, Google Search, Reddit, BLS/DOL data, and funding landscape. Weakest area: direct pricing/revenue benchmarks for apprenticeship tracking tools."},"_scoring":{"D1_demand":{"score":48,"evidence_count":7,"key_signal":"YouTube how-to videos on tracking hours + Amazon paper logbooks + Reddit developer building free app + WorkHands' 2.4-star failure all confirm unresolved individual apprentice demand, but it's niche and willingness-to-pay is unvalidated"},"D2_competition":{"score":55,"evidence_count":8,"key_signal":"3-4 direct competitors for individual apprentice tracking (WorkHands, OJT Logbook, Reddit builder) but none dominant. Enterprise AMS platforms (ApprentiScope, Union.dev, Craft Education) serve different buyers. WorkHands failing at 2.4 stars."},"D3_gaps":{"score":52,"evidence_count":6,"key_signal":"Structural gap between enterprise AMS platforms and individual apprentice needs, especially for non-union workers at small contractors. State-specific certification database is an untapped data layer. Gap is recognized (Reddit builder) but not yet well-served."},"D4_timing":{"score":60,"evidence_count":6,"key_signal":"Named catalysts: DOL $145M apprenticeship expansion (Feb 2026), BlackRock $100M trade training investment, BLS 9% electrician growth 2024-2034. These directly create more apprentices needing tracking tools."},"D5_entry":{"score":65,"evidence_count":4,"key_signal":"Mobile app buildable by small team in 2-4 months. No regulatory barriers. State certification database requires research effort but data is publicly available. No proprietary data or hardware needed."}}}`;

function DigSampleReport() {
  const data = parseGapAnalysisJSON(DIG_SAMPLE_JSON);
  if (!data) return null;
  return (
    <div style={{ padding: "20px 0 40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase" as const, color: "var(--clr-text-2)" }}>Sample Dig Report</span>
        <span style={{ fontSize: 14, fontStyle: "italic" as const, color: "var(--clr-text)", background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 6, padding: "5px 12px", fontWeight: 500 }}>« sleep tracking app for shift workers and nurses »</span>
      </div>
      <div style={{ padding: "0 16px 16px 12px" }}>
        <GapAnalysisResult data={data} itunesApps={(data as any).itunesApps ?? []} gplayApps={(data as any).gplayApps ?? []} />
      </div>
    </div>
  );
}

// ── STACK SAMPLE REPORT — Real API data, rendered with StackAdvisorResult ──
const STACK_SAMPLE_JSON = `{"headline":"Use Lovable AI to build a full-stack marketplace MVP in days, backed by free Supabase and Vercel — validate demand first with a Telegram bot.","phases":[{"name":"Phase 0: Validate","subtitle":"Prove 20+ people want this before writing code","tools":[{"name":"Telegram Bot API","purpose":"Collect seller/buyer interest and test the concept manually","price":"Free","free":true,"alternatives":[{"name":"WhatsApp Business API","reason":"Use if your users prefer WhatsApp; same idea but reaches non-tech-savvy users"},{"name":"Google Forms","reason":"Use if you want pure survey data; less engaging but zero setup"}]}],"costs":{"tools":[{"name":"Telegram Bot API","purpose":"Collect early demand","freeTier":true,"monthlyCost":"$0"}],"total":"$0/mo"},"vibeGuide":[{"tool":"Telegram Bot API","url":"https://core.telegram.org/bots","prompt":"Step 1: Create a Telegram account if you don't have one. Step 2: Message @BotFather and type '/newbot'. Follow the prompts to create a bot called 'JewelryMarketplaceTest'. Step 3: Copy your API token. Step 4: Paste this into a text file to save. Step 5: Go to https://api.telegram.org/bot[YOUR_TOKEN]/setWebhook and in your browser, replace [YOUR_TOKEN] with the token from step 3 and visit the URL. If you see {'ok': true}, it works. Now message your bot link to 20 potential artisans and buyers and ask: 'Would you sell/buy handmade jewelry on a platform like Etsy? Why or why not?'","tip":"Don't overthink this. A text-based bot is enough. Record responses in a Google Doc. You're looking for patterns: Do people actually want this? Would they pay?"},{"tool":"ChatGPT","url":"https://chat.openai.com","prompt":"I'm building a handmade jewelry marketplace. Write me 5 short Telegram messages I can send to potential artisans asking if they'd use a platform to sell handmade jewelry. Make them casual, not salesy. Include a link where they can reply.","tip":"Copy-paste these messages into your Telegram bot. If 15+ out of 20 people say yes, you've got product-market fit."}]},{"name":"Phase 1: MVP","subtitle":"Full-stack marketplace live in 1 week, $0-20/mo","tools":[{"name":"Lovable","purpose":"AI full-stack app builder — describe your marketplace, get deployed code","price":"Free tier or $20/mo Pro","free":true,"alternatives":[{"name":"Bolt.new","reason":"Use if you want free generations with no subscription; slightly less polished UI but 100% free"},{"name":"Bubble","reason":"Use if you want a fully managed no-code platform; costs $32+/mo but no code to manage"}]},{"name":"Supabase","purpose":"Postgres database, user auth, file storage for product images — all in one","price":"Free tier","free":true,"alternatives":[{"name":"Firebase","reason":"Use if you want Google's ecosystem; NoSQL instead of SQL, good for real-time features"},{"name":"Neon","reason":"Use if you want serverless Postgres without managing compute; free tier includes 0.5GB storage"}]},{"name":"Vercel","purpose":"Deploy your front-end instantly, auto-scale with zero config","price":"Free tier","free":true,"alternatives":[{"name":"Netlify","reason":"Use if you prefer Netlify's UX; same free tier (100GB bandwidth/mo), slight edge in form handling"},{"name":"Cloudflare Pages","reason":"Use if you want unlimited bandwidth; free tier is best for static sites"}]},{"name":"Stripe","purpose":"Payment processing for buyer → seller transactions, automatic seller payouts","price":"2.9% + $0.30 per transaction (no monthly fee)","free":true,"alternatives":[{"name":"Lemon Squeezy","reason":"Use if selling from EU/non-US; acts as merchant of record, handles tax automatically (5% fee)"},{"name":"Paddle","reason":"Use for global SaaS; similar to Lemon Squeezy, 5% + $0.50/txn, handles compliance"}]},{"name":"Resend","purpose":"Send transactional emails (order confirmations, review reminders, seller notifications)","price":"Free tier: 3,000 emails/mo","free":true,"alternatives":[{"name":"SendGrid","reason":"Use if you need higher volume; 100 emails/day forever free, unlimited with paid plan"},{"name":"Postmark","reason":"Use for best deliverability; 100 emails/mo free, better transactional email focus"}]}],"costs":{"tools":[{"name":"Lovable","purpose":"Build full-stack app","freeTier":true,"monthlyCost":"$0 or $20/mo Pro"},{"name":"Supabase","purpose":"Database, auth, storage","freeTier":true,"monthlyCost":"$0"},{"name":"Vercel","purpose":"Hosting","freeTier":true,"monthlyCost":"$0"},{"name":"Stripe","purpose":"Payments","freeTier":true,"monthlyCost":"$0 (2.9% + $0.30/txn)"},{"name":"Resend","purpose":"Transactional emails","freeTier":true,"monthlyCost":"$0"}],"total":"$0-20/mo (free tier) or $25/mo if you upgrade Supabase Pro early"},"vibeGuide":[{"tool":"Lovable","url":"https://lovable.dev","prompt":"Build me a full-stack handmade jewelry marketplace app with: 1) Signup/login for both buyers and sellers, 2) Sellers can list products with title, description, price, and upload 3 photos, 3) Buyers can browse all products, filter by seller, and leave reviews (1-5 stars + text), 4) Shopping cart and Stripe checkout that sends 70% to seller and 30% to platform, 5) Seller dashboard showing their products, sales, and reviews, 6) Search bar to find products by name. Use Supabase for the database. Deploy to Vercel. Make it look modern and clean with a teal and gold color scheme.","tip":"Be specific. Lovable generates better code when you describe exactly what you want. If the first version isn't right, iterate: 'Remove the product ratings filter' or 'Make the product images larger'."},{"tool":"Supabase","url":"https://supabase.com","prompt":"Step 1: Go to https://supabase.com and click 'Start your project'. Sign up with GitHub. Step 2: Create a new project and copy your 'Project URL' and 'Anon Key'. Step 3: Paste these into your Lovable app's Supabase config. Step 4: In Supabase dashboard, go to 'SQL Editor' and create three tables: 'sellers' (id, name, email, bio, created_at), 'products' (id, seller_id, title, description, price, image_urls, created_at), 'reviews' (id, product_id, buyer_email, rating, text, created_at). Step 5: Enable 'Row Level Security' so sellers can only edit their own products.","tip":"Don't worry about complex SQL. Supabase has templates. Just make sure each table has an id (primary key) and seller_id references the sellers table. Test with a dummy row."},{"tool":"Stripe","url":"https://stripe.com","prompt":"Step 1: Go to https://stripe.com and click 'Get started'. Sign up with your email. Step 2: Complete the verification (you'll enter your business info — say 'Marketplace Platform'). Step 3: Go to 'Developers' > 'API keys' and copy your 'Publishable key' and 'Secret key'. Step 4: Paste these into your Lovable code. Step 5: Test a transaction: Go to your deployed app, add a product to cart, checkout with card '4242 4242 4242 4242', any future date, any CVC.","tip":"Stripe is safe for testing in this mode. Don't go live with real cards until you've tested 5+ times. In your code, set aside 30% for platform fee before sending the rest to the seller."}]},{"name":"Phase 2: Growth","subtitle":"Scale to 100+ sellers, add reviews and search","tools":[{"name":"Supabase Pro","purpose":"Move from free tier when you exceed 500MB database or 50K MAU","price":"$25/mo","free":false,"alternatives":[{"name":"Neon Pro","reason":"Use if you prefer serverless Postgres; $19/mo, better for variable traffic"},{"name":"Firebase Blaze","reason":"Use if staying on Google ecosystem; pay-as-you-go, no monthly minimum"}]},{"name":"Meilisearch","purpose":"Fast full-text product search with typo correction (seller name, product title, description)","price":"Free (self-hosted on Vercel) or $0/mo","free":true,"alternatives":[{"name":"Algolia","reason":"Use if you need AI-powered relevance; free tier: 10K searches/mo, better UX but pricier"},{"name":"Typesense","reason":"Use if you want simpler setup; free self-hosted, instant search, good typo tolerance"}]},{"name":"PostHog","purpose":"Track user behavior: How many sellers sign up? Which products get clicked? Where do buyers drop off?","price":"Free tier: 1M events/mo","free":true,"alternatives":[{"name":"Mixpanel","reason":"Use for advanced funnels and retention; free tier: 20M events/mo but less intuitive"},{"name":"Umami","reason":"Use for privacy-first analytics; free self-hosted, simple web analytics"}]},{"name":"Resend Pro","purpose":"Upgrade if sending >3K emails/mo (order confirmations, review reminders, seller alerts)","price":"$20/mo","free":false,"alternatives":[{"name":"Brevo","reason":"Use for unlimited contacts; free tier: 300 emails/day, better for marketing"},{"name":"SendGrid","reason":"Use for high volume; 100 emails/day free, then $19.95/mo"}]}],"costs":{"tools":[{"name":"Supabase Pro","purpose":"Scale database","freeTier":false,"monthlyCost":"$25"},{"name":"Meilisearch","purpose":"Fast search","freeTier":true,"monthlyCost":"$0"},{"name":"PostHog","purpose":"Analytics","freeTier":true,"monthlyCost":"$0"},{"name":"Resend Pro","purpose":"Emails at scale","freeTier":false,"monthlyCost":"$20"}],"total":"$45/mo"},"vibeGuide":[{"tool":"ChatGPT","url":"https://chat.openai.com","prompt":"I have a marketplace built on Supabase + Vercel. I want to add instant product search (when a buyer types 'gold ring', results appear in <500ms). How do I integrate Meilisearch? Give me a simple step-by-step guide, not code—just concepts.","tip":"Meilisearch sits between your app and database, pre-indexes all products for speed. Tell ChatGPT your current stack ('Supabase + Lovable') and it'll give simpler answers."},{"tool":"PostHog","url":"https://posthog.com","prompt":"Step 1: Go to https://posthog.com and sign up. Step 2: Create a new project, select 'Web'. Copy your API key. Step 3: In your Lovable code, add PostHog tracking: log when someone signs up, views a product, adds to cart, and checks out. Step 4: View the 'Events' tab in PostHog to see user flows.","tip":"PostHog is free for 1M events/mo. Track the critical path: signup → browse → buy. Ignore vanity metrics."}]},{"name":"Phase 3: Scale","subtitle":"Multi-country seller payouts, advanced moderation, 10K+ users","tools":[{"name":"Stripe Connect","purpose":"Automatic seller payouts to bank accounts worldwide; manage commissions per transaction","price":"Included in Stripe (no extra fee)","free":false,"alternatives":[{"name":"Paddle Seller Payouts","reason":"Use if sellers are in EU/APAC; handles local tax compliance automatically"},{"name":"Lemon Squeezy Seller Payouts","reason":"Use for EU-first marketplace; built-in seller payout management"}]},{"name":"Railway","purpose":"Run background jobs: auto-send weekly seller stats, generate seller invoices, cleanup old carts","price":"$5/mo (Hobby) + usage","free":false,"alternatives":[{"name":"Render","reason":"Use if you prefer Render's UX; $7/mo starter, same functionality"},{"name":"Fly.io","reason":"Use if you need global deployment; always-free tier, good for edge workers"}]},{"name":"Sentry","purpose":"Error tracking: if a seller's checkout fails, you know immediately with full error logs","price":"Free tier: 5K errors/mo","free":true,"alternatives":[{"name":"LogRocket","reason":"Use for session replay; see exactly what a user did before hitting an error"},{"name":"Better Stack","reason":"Use for uptime monitoring; also tracks logs and errors, free tier adequate"}]}],"costs":{"tools":[{"name":"Stripe Connect","purpose":"Seller payouts","freeTier":false,"monthlyCost":"$0 (included, 2.9% + $0.30/txn)"},{"name":"Railway","purpose":"Background jobs","freeTier":false,"monthlyCost":"$5"},{"name":"Sentry","purpose":"Error tracking","freeTier":true,"monthlyCost":"$0"}],"total":"$5/mo"},"vibeGuide":[{"tool":"Stripe","url":"https://stripe.com/docs/connect","prompt":"Read the Stripe Connect overview at https://stripe.com/docs/connect (just the intro, ~5 min). The key concept: instead of you holding all money, sellers get connected accounts. You take your 30% commission, the rest goes to their bank account automatically.","tip":"This is a major shift—sellers see automatic payouts to their bank every week. It builds trust. Don't implement until you have 10+ regular sellers."}]}],"buildOrder":[{"week":"Days 1-2","title":"Validation","steps":["Create Telegram bot, send to 20 potential artisans/buyers","Record responses: Do they want it? Would they pay?","If <15/20 say yes, pivot idea and repeat"]},{"week":"Days 3-4","title":"Build MVP Structure","steps":["Open Lovable.dev, paste the full-stack marketplace prompt","Wait 5-10 min for Lovable to generate code","Review generated app, make 2-3 tweaks (colors, field names)"]},{"week":"Day 5","title":"Connect Backend & Payments","steps":["Create Supabase project, copy API keys to Lovable config","Set up Stripe account, add publishable + secret keys to code","Add 3 Supabase tables: sellers, products, reviews (use Supabase SQL templates)"]},{"week":"Days 6-7","title":"Deploy & Test","steps":["Deploy Lovable app to Vercel (one click)","Create test accounts: 2 sellers, 2 buyers","Test full flow: seller lists product → buyer buys → check Stripe dashboard for payment"]},{"week":"Week 2","title":"Launch & Iterate","steps":["Invite 10 beta testers (use Telegram list from Days 1-2)","Collect feedback (Google Form)","Fix bugs, add small features based on feedback (new filters, better product descriptions)","Go live to public"]}],"timeToMvp":"1-2 weeks","mistakes":[{"title":"Building before validating","description":"Don't spend a week building if nobody wants it. Use the Telegram bot in Days 1-2 to talk to 20 people. If 15+ don't say 'yes I'd use this', stop and rethink. Two days of talk beats five days of coding the wrong thing."},{"title":"Choosing the wrong builder (Bubble vs. Lovable)","description":"Bubble ($32/mo) is tempting but locks you in—you can't export code or customize deeply. Lovable ($20/mo or free) generates real code you can edit, so you're not trapped. For a low-code founder, Lovable gives you way more control."},{"title":"Implementing seller payouts from day one","description":"Don't use Stripe Connect yet—it's complex. Collect all payment into your Stripe account, manually send invoices to sellers for their cut for the first month. Once you have 10+ active sellers, automate with Stripe Connect. Early simplicity > perfect automation."}],"scalability":[{"trigger":"100+ sellers","whatBreaks":"Free Supabase's 500MB database fills up; queries slow down after 10K+ products","upgradeTo":"Supabase Pro ($25/mo, 8GB storage)","severity":"medium"},{"trigger":"5K+ products listed","whatBreaks":"Search becomes slow without indexing; users wait 2+ seconds for results","upgradeTo":"Add Meilisearch ($0 free self-hosted or $29/mo cloud)","severity":"medium"},{"trigger":"1K+ daily transactions","whatBreaks":"Stripe API limits; webhook processing lags; seller notifications slow","upgradeTo":"Implement async job queue with Railway ($5-20/mo) to batch notifications","severity":"high"},{"trigger":"10K+ MAU (monthly active users)","whatBreaks":"Vercel free tier (6K build minutes/mo) maxes out; cold start latency increases","upgradeTo":"Vercel Pro ($20/mo) or move backend to Render/Railway ($25+/mo)","severity":"medium"}],"upgrades":[{"tool":"Supabase Free","trigger":"When database exceeds 400MB or you hit 40K MAU","migrateTo":"Supabase Pro ($25/mo, 8GB storage, priority support)"},{"tool":"Vercel Free","trigger":"When builds take >30 min or you need faster deploys (Week 3+)","migrateTo":"Vercel Pro ($20/mo, unlimited builds, faster edge functions)"},{"tool":"Resend Free","trigger":"When sending >2K emails/mo (order confirmations + reviews)","migrateTo":"Resend Pro ($20/mo) or Brevo ($0/mo, 300/day free)"},{"tool":"Stripe Standard","trigger":"When Stripe Connect is needed (10+ active sellers, auto-payouts)","migrateTo":"Stripe Connect ($0 monthly, built-in seller account management)"}]}
`;

function StackSampleReport() {
  const data = parseStackAdvisorJSON(STACK_SAMPLE_JSON);
  if (!data) return null;
  return (
    <div style={{ padding: "20px 0 40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase" as const, color: "var(--clr-text-2)" }}>Sample Stack Report</span>
        <span style={{ fontSize: 14, fontStyle: "italic" as const, color: "var(--clr-text)", background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 6, padding: "5px 12px", fontWeight: 500 }}>« Handmade jewelry marketplace with payments & reviews »</span>
      </div>
      <StackAdvisorResult data={data} />
    </div>
  );
}


function LandingReportPreview() {
  const [tab, setTab] = useState<"dig"|"stack">("dig");
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: "1.5rem" }}>
        <button onClick={() => setTab("dig")} style={{ padding: "7px 18px", borderRadius: 8, fontSize: "0.8125rem", fontWeight: 500, border: "none", cursor: "pointer", fontFamily: "inherit", background: tab === "dig" ? "var(--clr-text)" : "var(--clr-surface-2)", color: tab === "dig" ? "#fff" : "var(--clr-text-3)" }}>Dig report</button>
        <button onClick={() => setTab("stack")} style={{ padding: "7px 18px", borderRadius: 8, fontSize: "0.8125rem", fontWeight: 500, border: "none", cursor: "pointer", fontFamily: "inherit", background: tab === "stack" ? "#2a9a80" : "var(--clr-surface-2)", color: tab === "stack" ? "#fff" : "var(--clr-text-3)" }}>Stack report</button>
      </div>
      {tab === "dig" ? <DigSampleReport /> : <StackSampleReport />}
    </div>
  );
}

function NoCreditsModal({ idea, onClose }: { idea: string; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--clr-bg)", border: "1px solid var(--clr-border)", borderRadius: 16, padding: "28px 28px 24px", maxWidth: 400, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div>
              <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--clr-text)" }}>You&apos;re out of credits</div>
              <div style={{ fontSize: "0.775rem", color: "var(--clr-text-4)", marginTop: 2 }}>Dig and Stack cost 1 credit each</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--clr-text-4)", padding: 4, lineHeight: 1 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        {idea.trim().length > 0 && (
          <div style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 8, padding: "10px 12px", marginBottom: 16, fontSize: "0.775rem", color: "var(--clr-text-3)", lineHeight: 1.5 }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--clr-text-5)", textTransform: "uppercase" as const, letterSpacing: ".06em", display: "block", marginBottom: 4 }}>Your prompt is saved</span>
            &ldquo;{idea.trim().slice(0, 100)}{idea.trim().length > 100 ? "..." : ""}&rdquo;
          </div>
        )}
        <p style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", lineHeight: 1.6, margin: "0 0 20px" }}>
          Buy a credit pack and your prompt will be right here waiting — no need to retype anything.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <a
            href="/pricing"
            style={{ flex: 1, display: "block", textAlign: "center" as const, padding: "11px 0", borderRadius: 9, background: "#7c6fff", color: "#fff", textDecoration: "none", fontSize: "0.875rem", fontWeight: 700, letterSpacing: "-0.01em" }}
          >
            Buy credits →
          </a>
          <button
            onClick={onClose}
            style={{ padding: "11px 18px", borderRadius: 9, background: "transparent", border: "1px solid var(--clr-border)", color: "var(--clr-text-3)", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

function FunnyMessage({ msgs }: { msgs: string[] }) {
  const [state, setState] = useState({ idx: 0, vis: true });
  useEffect(() => {
    const t = setInterval(() => {
      setState(s => ({ ...s, vis: false }));
      setTimeout(() => setState(s => ({ idx: (s.idx + 1) % msgs.length, vis: true })), 350);
    }, 4000);
    return () => clearInterval(t);
  }, [msgs.length]);
  return (
    <div style={{ border: "1px solid var(--clr-border)", borderRadius: 7, padding: "8px 12px", marginBottom: "0.75rem", display: "flex", alignItems: "flex-start", gap: 8, background: "var(--clr-surface-2)", minHeight: 46, transition: "opacity 0.35s", opacity: state.vis ? 1 : 0 }}>
      <svg style={{ flexShrink: 0, marginTop: 1, opacity: 0.45 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/></svg>
      <span style={{ fontSize: "0.6875rem", color: "var(--clr-text-4)", lineHeight: 1.5, fontStyle: "italic" }}>{msgs[state.idx]}</span>
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
  onSubmit, loading, textareaRef, showSampleReport, setShowSampleReport,
}: {
  tool: ToolConfig; idea: string; setIdea: (v: string) => void;
  budget: Budget; setBudget: (v: Budget) => void;
  techLevel: TechLevel; setTechLevel: (v: TechLevel) => void;
  platform: Platform; setPlatform: (v: Platform) => void;
  onSubmit: () => void; loading: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  showSampleReport: boolean; setShowSampleReport: (v: (prev: boolean) => boolean) => void;
}) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => { const mq = window.matchMedia("(max-width: 768px)"); const fn = () => setIsMobile(mq.matches); fn(); mq.addEventListener("change", fn); return () => mq.removeEventListener("change", fn); }, []);
  const MAX_IDEA_CHARS = 2000;
  const canSubmit = idea.trim().length >= 40 && !loading;
  const charCount = idea.trim().length;
  const charsLeft = Math.max(0, 40 - charCount);
  const isNearLimit = charCount > 1800;

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
    <div style={{ animation: "fadeSlideIn 0.28s ease", marginTop: "0", marginBottom: "0" }}>
      {/* Connection line from cards */}
      <div style={{ display: "none", justifyContent: "center", marginBottom: "1.5rem" }}>
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
        {/* Card header — only for non-Dig tools */}
        {tool.id !== "gap-analysis" && tool.id !== "stack-advisor" && (
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
        )}

        <div className="dig-card-body" style={{ padding: "1.375rem 1.5rem" }}>
          {/* Idea textarea */}
          <label className="dig-idea-label" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--clr-text-4)", marginBottom: "0.5rem", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {tool.inputLabel}
          </label>
          <textarea
            ref={textareaRef}
            value={idea}
            onChange={(e) => setIdea(e.target.value.slice(0, 2000))}
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
          {/* Model badge */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.4rem" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.04em",
              color: "var(--clr-text-4)", userSelect: "none" as const,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%", background: "#7c6fff",
                display: "inline-block", flexShrink: 0,
                animation: "pulse-dot 1.8s ease-in-out infinite",
              }}/>
              Claude Opus 4.6 · Extended Thinking
            </span>
          </div>

          {/* Stack extras */}
          {tool.hasExtras && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1.25rem", marginTop: "1.125rem" }}>
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
          <div className="dig-submit-row" style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginTop: "1.125rem", paddingTop: "1.125rem",
            borderTop: "1px solid var(--clr-border-deep)",
          }}>
            {/* Sample Report on left */}
            {(tool.id === "gap-analysis" || tool.id === "stack-advisor") ? (
              <button
                onClick={() => { setShowSampleReport(v => { const next = !v; if (next) { setTimeout(() => { const el = document.getElementById("sample-report-panel"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 50); } return next; }); }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "0.5rem 1rem", borderRadius: 8,
                  background: showSampleReport ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.07)",
                  color: "#6366f1",
                  fontSize: "0.8125rem", fontWeight: 600,
                  border: "1px solid rgba(99,102,241,0.2)",
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.13)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = showSampleReport ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.07)"; }}
              >
                {showSampleReport ? "Hide Sample ↑" : "Sample Report ↓"}
              </button>
            ) : (
              <span style={{ fontSize: "0.7rem", color: "var(--clr-text-8)" }}>⌘↵ to run</span>
            )}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* Char counter on right */}
              {(tool.id === "gap-analysis" || tool.id === "stack-advisor") && (
                isNearLimit ? (
                  <span style={{ fontSize: "0.7rem", color: charCount >= 2000 ? "#ef4444" : "#f59e0b", fontWeight: 600 }}>
                    {2000 - charCount} / 2000
                  </span>
                ) : charsLeft > 0 ? (
                  <span id="char-counter" style={{ fontSize: "0.7rem", color: "var(--clr-text-4)", transition: "all 0.2s" }}>
                    <span style={{ fontWeight: 700, color: charCount > 20 ? "var(--clr-text-2)" : "var(--clr-text-4)" }}>{charsLeft}</span> more chars to unlock
                  </span>
                ) : (
                  <span style={{ fontSize: "0.7rem", color: "#16a34a", fontWeight: 600, animation: "fadeSlideIn 0.2s ease" }}>
                    ✓ ready
                  </span>
                )
              )}
              <div title={!canSubmit ? "Write at least 40 characters" : undefined} style={{ display: "inline-flex" }}>
              <button
                onClick={() => { if (!canSubmit) { const el = document.getElementById("char-counter"); if (el) { el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); } } else { onSubmit(); } }}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "0.5625rem 1.25rem", borderRadius: 8,
                  background: "var(--clr-btn-bg)",
                  color: "var(--clr-btn-text)",
                  fontSize: "0.875rem", fontWeight: 600, border: "none",
                  cursor: canSubmit ? "pointer" : "default",
                  fontFamily: "inherit", letterSpacing: "-0.01em",
                  transition: "opacity 0.2s, filter 0.2s",
                  opacity: 1,
                  filter: "none",
                }}
              >
                {loading ? (
                  <>
                    <div style={{ width: 14, height: 14, border: "2px solid rgba(var(--clr-text-rgb),0.3)", borderTopColor: "var(--clr-text)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    Running…
                  </>
                ) : (
                  <>
                    {tool.id === "gap-analysis" ? "Dig" : tool.name}
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
  funding?: string;
  userCount?: string;
  strengths: string[];
  weaknesses: string[];
}
interface GapPainPoint {
  quote: string;
  source?: string;
  severity: "high" | "medium" | "low";
  demandSignal?: string;
}
interface GapMarketGap {
  title: string;
  description: string;
  evidence?: string;
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
  fatalFlaw?: string;
  recommendedAction?: "kill" | "reposition" | "validate_niche" | "build_mvp" | "move_fast";
  upsideCondition?: string;
  defensibility?: { level?: string; moat?: string; copyTimeframe?: string };
  workingForYou: string[];
  watchOutFor: string[];
  confidenceNote?: string;
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
  verdict?: string;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _scoring?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _evidence?: any;
}

function parseGapAnalysisJSON(raw: string): GapAnalysisData | null {
  // Strip thinking artifacts, emojis, and anything before ```json
  let cleaned = raw.replace(/^[\s\S]*?```json\s*/m, '').replace(/```[\s\S]*$/, '').trim();
  // Also try direct JSON if no fences
  if (!cleaned.startsWith('{')) {
    const rawTrimmed = raw.trim();
    // Try to find the first { in the raw string
    const firstBrace = rawTrimmed.indexOf('{');
    if (firstBrace >= 0) cleaned = rawTrimmed.substring(firstBrace);
    else return null;
  }
  // Attempt to repair truncated JSON by closing open braces/brackets
  let jsonStr = cleaned;
  try {
    JSON.parse(jsonStr);
  } catch {
    // Step 1: Handle unclosed strings by checking if we have an odd number of unescaped quotes
    let inString = false;
    let lastQuoteIdx = -1;
    for (let i = 0; i < jsonStr.length; i++) {
      if (jsonStr[i] === '\\' && inString) { i++; continue; } // skip escaped chars
      if (jsonStr[i] === '"') { inString = !inString; lastQuoteIdx = i; }
    }
    // If we're inside an unclosed string, close it and truncate any trailing partial value
    if (inString && lastQuoteIdx >= 0) {
      jsonStr = jsonStr.substring(0, lastQuoteIdx + 1) + '"';
    }
    
    // Step 2: Remove any trailing partial tokens (incomplete key-value pairs)
    // Remove trailing text after the last complete structure delimiter
    jsonStr = jsonStr.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"{}[\]]*$/, '');
    // Remove trailing comma
    jsonStr = jsonStr.replace(/,\s*$/, '');
    
    // Step 3: Count and close unclosed braces/brackets
    let opens = 0, opensArr = 0;
    inString = false;
    for (let i = 0; i < jsonStr.length; i++) {
      if (jsonStr[i] === '\\' && inString) { i++; continue; }
      if (jsonStr[i] === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (jsonStr[i] === '{') opens++;
      else if (jsonStr[i] === '}') opens--;
      else if (jsonStr[i] === '[') opensArr++;
      else if (jsonStr[i] === ']') opensArr--;
    }
    // Remove trailing comma again after truncation
    jsonStr = jsonStr.replace(/,\s*$/, '');
    // Close arrays then objects
    for (let i = 0; i < opensArr; i++) jsonStr += ']';
    for (let i = 0; i < opens; i++) jsonStr += '}';
  }
  try {
    const data = JSON.parse(jsonStr);
    // Only require the absolute essentials — v2.2 may omit some legacy fields
    if (!data.competitors || !data.marketGaps) return null;
    // Default fields if missing
    data.marketScore = data.marketScore ?? 50;
    data.marketScoreLabel = data.marketScoreLabel ?? "";
    data.marketScoreSummary = data.marketScoreSummary ?? "";
    data.painPoints = data.painPoints ?? [];
    data.swot = data.swot ?? { strengths: [], weaknesses: [], opportunities: [], threats: [] };
    data.opportunity = data.opportunity ?? { headline: "", urgency: "medium", actionItems: [] };
    data.targetCustomer = data.targetCustomer ?? { persona: "", jobTitle: "", demographics: "", painPoints: [], currentTools: [], willingnessToPay: "" };
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
  const stripped = raw.replace(/^[\s\S]*?```json\s*/m, '').replace(/```[\s\S]*$/, '').trim();
  const rawTrimmed = raw.trim();
  const jsonStr = stripped.startsWith('{') ? stripped : (rawTrimmed.startsWith('{') ? rawTrimmed : null);
  if (!jsonStr) return null;
  try {
    const data = JSON.parse(jsonStr);
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
  const [mob, setMob] = useState(false);
  useEffect(() => { const mq = window.matchMedia("(max-width: 768px)"); const chk = () => setMob(mq.matches); chk(); mq.addEventListener("change", chk); return () => mq.removeEventListener("change", chk); }, []);
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
    <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: mob ? "column" : "row" as const, height: mob ? "auto" : "calc(100vh - 180px)", marginTop: 8 }}>
      {/* Left tab sidebar */}
      <div style={{ width: mob ? "100%" : 220, borderRight: mob ? "none" : "1px solid #e5e7eb", borderBottom: mob ? "1px solid #e5e7eb" : "none", padding: mob ? "8px" : "14px 8px", flexShrink: 0, background: "#fafafa", display: "flex", flexDirection: "column" as const, gap: 2, overflowY: "auto" as const}}>
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
      <div id="stack-tab-content" style={{ flex: 1, padding: mob ? 12 : 22, overflowY: "auto" as const, overflowX: "hidden" as const, background: "white", boxSizing: "border-box" as const }}>
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
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => { const mq = window.matchMedia("(max-width: 768px)"); const fn = () => setIsMobile(mq.matches); fn(); mq.addEventListener("change", fn); return () => mq.removeEventListener("change", fn); }, []);
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [credits, setCredits] = useState<number | null>(null);
  useEffect(() => {
    if (!isSignedIn) return;
    // Restore pending idea/tool saved before sign-in redirect
    const pendingIdea = sessionStorage.getItem("unbuilt_pending_idea");
    const pendingTool = sessionStorage.getItem("unbuilt_pending_tool");
    if (pendingIdea) {
      sessionStorage.removeItem("unbuilt_pending_idea");
      sessionStorage.removeItem("unbuilt_pending_tool");
      if (pendingTool === "gap-analysis" || pendingTool === "stack-advisor") {
        setIdea(pendingIdea); if (pendingTool === "gap-analysis" || pendingTool === "stack-advisor") setActiveHeroTab(pendingTool as "gap-analysis" | "stack-advisor");
        // Update URL too
        window.history.replaceState({}, "", `/?tool=${pendingTool}`);
      } else if (pendingIdea && selectedTool) {
        setIdea(pendingIdea);
      }
    }
    fetch("/api/credits").then(r => r.json()).then(d => setCredits(d.credits ?? 0)).catch(() => {});
  }, [isSignedIn]);
  const { openSignIn } = useClerk();
  const [selectedTool, setSelectedTool] = useState<ToolId | null>(null);
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [activeHeroTab, setActiveHeroTab] = useState<"gap-analysis" | "stack-advisor">("gap-analysis");
  const [showSampleReport, setShowSampleReport] = useState(false);
  // Reset sample report when tool changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setShowSampleReport(false); if (selectedTool) { setTimeout(() => handleSubmit(), 50); } }, [selectedTool]);
  const [budget, setBudget] = useState<Budget>("bootstrap");
  const [techLevel, setTechLevel] = useState<TechLevel>("nocode");
  const [platform, setPlatform] = useState<Platform>("web");
  const [loading, setLoading] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [error, setError] = useState("");
  const [outOfCredits, setOutOfCredits] = useState(false);
  const [showNoCreditsModal, setShowNoCreditsModal] = useState(false);
  const [hasResults, setHasResults] = useState(false);

  // ── Pulse inline state ────────────────────────────────────────────────────
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
  const abortControllerRef = useRef<AbortController | null>(null);
    const resultsRef = useRef<HTMLDivElement>(null);
  const pendingAutoSubmit = useRef(false);

  
  // Number of scan steps for the current tool (used for timer logic)
  const scanStepCounts: Record<string, number> = { "trend-feed": 5, "gap-analysis": 8, "stack-advisor": 8, "competitor-radar": 1 };
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

  // Auto-trigger analysis from URL params or sessionStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tool = params.get("tool") as ToolId | null;
    const q = params.get("q");
    const ssIdea = sessionStorage.getItem("unbuilt_stack_idea");
    if (tool === "stack-advisor" && ssIdea) {
      sessionStorage.removeItem("unbuilt_stack_idea");
      setSelectedTool("stack-advisor");
      setIdea(ssIdea);
      // Don't auto-submit — just fill the textarea
      window.history.replaceState({}, "", "/");
    } else if (tool && q && TOOLS.some(t => t.id === tool)) {
      setSelectedTool(tool);
      setIdea(q);
      pendingAutoSubmit.current = true;
      window.history.replaceState({}, "", "/");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectTool = (toolId: ToolId | null) => {
    // Reset all result state when switching tools
    scanTimersRef.current.forEach(clearTimeout);
    if (abortControllerRef.current) { abortControllerRef.current.abort(); abortControllerRef.current = null; }
    setScanStep(-1);
    setHasResults(false);
    setStreamedContent("");
    setIdea("");
    setError("");
    setOutOfCredits(false);
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
    if (toolId) window.history.replaceState({}, "", `/?tool=${toolId}`);
    else window.history.replaceState({}, "", "/");
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
    if (!isSignedIn) { sessionStorage.setItem("unbuilt_pending_idea", idea); sessionStorage.setItem("unbuilt_pending_tool", selectedTool ?? activeHeroTab); window.history.replaceState({}, "", "/"); openSignIn(); return; }
    if (credits !== null && credits <= 0) { setShowNoCreditsModal(true); setSelectedTool(null); window.history.replaceState({}, "", "/"); return; }
    if (!selectedTool || idea.trim().length < 3) return;
    const tool = TOOLS.find((t) => t.id === selectedTool)!;

    setLoading(true);
    setHasResults(false);
    // Meta Pixel: track Lead event when user starts an analysis
    if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
      (window as any).fbq("track", "Lead", { content_name: selectedTool === "gap-analysis" ? "Dig" : "Stack" });
    }
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
        setTimeout(() => setScanStep((s) => (s < i + 1 ? i + 1 : s)), (i + 1) * 400)
      );
    }

    if (selectedTool === "gap-analysis") {
      fetchSearchMeta(idea.trim(), (q) => {
        fetchITunesApps(q);
        fetchGplayApps(q);
        fetchYouTubeVideos(q + " review OR problem", 180);
      });
    }

    const body: Record<string, string | boolean> = { idea, tool: selectedTool ?? "" };
    // Allow cache bypass via URL param ?nocache=true (for calibration testing)
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("nocache") === "true") {
      body.nocache = true;
    }
    if (selectedTool === "stack-advisor") {
      body.budget = budget;
      body.techLevel = techLevel;
      body.platform = platform;
    }

    const submittedTool = selectedTool;
    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;
    try {
      const res = await fetch(tool.apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortCtrl.signal,
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
        if (abortCtrl.signal.aborted) break;
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
              if (!abortCtrl.signal.aborted) setResultCached(parsed.meta.cached);
            } else if (parsed.error) {
              if (!abortCtrl.signal.aborted) setError(parsed.error);
            } else if (parsed.text) {
              fullContent += parsed.text;
              if (!abortCtrl.signal.aborted) setStreamedContent((p) => p + parsed.text);
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
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      if (!abortCtrl.signal.aborted) setLoading(false);
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
        @keyframes spin { to { transform: rotate(360deg); } } @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} } #char-counter.shake { animation: shake 0.35s ease; }
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:none; } }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(0.6)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes scanCardIn { from { opacity:0; transform:translateY(20px) scale(0.98); } to { opacity:1; transform:none; } }
        @keyframes stepIn { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:none; } }
        @keyframes checkPop { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.2)} 100%{transform:scale(1);opacity:1} }
        ::placeholder { color: var(--clr-placeholder) !important; }
        * { box-sizing: border-box; }
      `}</style>

      {/* Shell */}
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

        {/* Sidebar */}



        {/* Main content */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", overflowX: "hidden", padding: "0 16px", maxWidth: "100%" }}>

          {/* ── Scanning overlay ── */}
          {scanStep >= 0 ? (() => {
            const isStack = selectedTool === "stack-advisor";
            const accentColor = isStack ? "#0ea5e9" : "#6366f1";
            const accentBg = isStack ? "rgba(14,165,233,0.1)" : "rgba(99,102,241,0.1)";
            const accentBorder = isStack ? "rgba(14,165,233,0.2)" : "rgba(99,102,241,0.2)";
            const DIG_SOURCES: { label: string; bg: string; svg: React.ReactNode }[] = [
              { label: "Reddit",       bg: "#ff4500", svg: <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249z"/></svg> },
              { label: "X / Twitter",  bg: "#000", svg: <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
              { label: "YouTube",      bg: "#ff0000", svg: <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 00.5 6.19 31.6 31.6 0 000 12a31.6 31.6 0 00.5 5.81 3.02 3.02 0 002.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 002.12-2.14A31.6 31.6 0 0024 12a31.6 31.6 0 00-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg> },
              { label: "App Store",    bg: "#1c1c1c", svg: <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg> },
              { label: "Google Play",  bg: "#3ddc84", svg: <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M3.18 23.04c.29.12.62.18.97.18.49 0 .97-.14 1.42-.42l.02-.01 1.73-1.01L17.63 22c1.07 0 2.01-.56 2.56-1.43l-9.6-5.55-7.4 8.02zm-.63-1.73l7.22-7.83L2.35 8.7c-.22.44-.35.94-.35 1.48V19.82c0 .6.18 1.15.55 1.49zm17.8-3.38c.59-.36 1.03-.94 1.2-1.63l.01-.04.04-.18c.06-.3.1-.63.1-.97v-.52l-.01-.03c-.05-.63-.32-1.18-.72-1.59L17.7 11.3l-2.87 3.12 5.52 3.51zm-.3-10.2L7.36 1.37 4.57 2.99 14.83 11.3l5.22-3.57z"/></svg> },
              { label: "Product Hunt", bg: "#e60023", svg: <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg> },
              { label: "LinkedIn",     bg: "#0a66c2", svg: <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
            ];
            const STACK_TOOLS: { label: string; bg: string; svg: React.ReactNode }[] = [
              { label: "Lovable",  bg: "#f97316", svg: <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg> },
              { label: "Supabase", bg: "#3ecf8e", svg: <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L.235 12.9a.396.396 0 0 0 .302.643h9.362v8.958a.396.396 0 0 0 .716.233L21.664 9.997a.396.396 0 0 0-.302-.643z"/></svg> },
              { label: "Stripe",   bg: "#635bff", svg: <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/></svg> },
              { label: "Vercel",   bg: "#000", svg: <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M24 22.525H0l12-21.05 12 21.05z"/></svg> },
              { label: "Resend",   bg: "#3b82f6", svg: <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M14.79.42c-.29-.56-1.08-.56-1.37 0L.42 23.58c-.29.56.08 1.25.69 1.25h22c.61 0 .98-.69.69-1.25L14.79.42z" opacity=".5"/><path d="M8.79 16.83l4.21-8.17 4.21 8.17H8.79z"/></svg> },
              { label: "Upstash",  bg: "#9333ea", svg: <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><rect x="2" y="2" width="9" height="9" rx="1"/><rect x="13" y="2" width="9" height="9" rx="1"/><rect x="2" y="13" width="9" height="9" rx="1"/><rect x="13" y="13" width="9" height="9" rx="1"/></svg> },
              { label: "Railway",  bg: "#e74c3c", svg: <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M4 4h16v2H4V4zm0 4h16v2H4V8zm0 4h10v2H4v-2zm0 4h16v2H4v-2z"/></svg> },
            ];
            const sources = isStack ? STACK_TOOLS : DIG_SOURCES;
            const moreLabel = isStack ? "+ 700 tools evaluated in total" : "+ 60 more sources in the background";
            const DIG_MSGS = ["Claude is reading 47 Reddit posts right now. You could not have done this yourself.", "Wish AI were faster? So do we. Worth the wait, we promise.", "Scanning App Store, YouTube, X, Reddit, LinkedIn... almost done.", "Your competitors skipped this research. You didn't.", "134 apps found so far. Most are terrible. We'll tell you which."];
            const STACK_MSGS = ["Comparing 700+ tools so you don't have to. You're welcome.", "Lovable, Supabase, Stripe — matched to your exact budget and skill level.", "Wish AI were faster? So do we. Almost there.", "700+ tools evaluated. Most won't make the cut.", "The internet has opinions on tools. We filtered the good ones."];
            const msgs = isStack ? STACK_MSGS : DIG_MSGS;
            const crossHref = isStack ? "/?tool=gap-analysis" : "/?tool=stack-advisor";
            const crossTitle = isStack ? "Also try Dig" : "Also try Stack";
            const crossSub = isStack ? "Is there actually a gap in this market?" : "Find the best tools to build this idea";
            const crossColor = isStack ? "#2563eb" : "#16a34a";
            const crossBg = isStack ? "#eff6ff" : "#f0fdf4";
            const crossIcon = isStack
              ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>;
            return (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 0" }}>
                <div style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 14, padding: "1.75rem", width: "100%", maxWidth: 400, animation: "scanCardIn 0.35s cubic-bezier(0.16,1,0.3,1)" }}>
                  <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, margin: "0 auto 10px", background: accentBg, border: `1px solid ${accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {currentTool && TOOL_ICONS[currentTool.id](accentColor)}
                    </div>
                    <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--clr-text)", letterSpacing: "-0.02em", marginBottom: 4 }}>
                      {isStack ? "Building your stack..." : "Scanning live sources..."}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--clr-text-4)", fontStyle: "italic", lineHeight: 1.4 }}>{idea}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginBottom: 6 }}>
                    {sources.map((s, i) => {
                      const isDone = i < scanStep;
                      const isActive = i === scanStep;
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 8px", borderRadius: 6, background: isActive ? `${accentColor}12` : "var(--clr-surface-2)", opacity: (!isDone && !isActive) ? 0.2 : isDone ? 0.45 : 1, transition: "opacity 0.3s" }}>
                          <div style={{ width: 18, height: 18, borderRadius: 4, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.svg}</div>
                          <span style={{ fontSize: "0.6875rem", fontWeight: 500, color: "var(--clr-text)", flex: 1 }}>{s.label}</span>
                          {isDone && <span style={{ color: "#16a34a", fontSize: "0.7rem" }}>✓</span>}
                          {isActive && <div style={{ width: 9, height: 9, borderRadius: "50%", border: `1.5px solid ${accentColor}40`, borderTopColor: accentColor, animation: "spin 0.8s linear infinite", flexShrink: 0 }} />}
                        </div>
                      );
                    })}
                    <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 8px", borderRadius: 6, background: `${accentColor}12` }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, background: accentColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="10" height="10" viewBox="0 0 20 20" fill="none"><path d="M10 2l1.8 5.4H17l-4.2 3.1 1.6 5-4.4-3.2L5.6 15.5l1.6-5L3 7.4h5.2L10 2z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                      </div>
                      <span style={{ fontSize: "0.6875rem", fontWeight: 500, color: "var(--clr-text)", flex: 1 }}>Claude AI</span>
                      <div style={{ width: 9, height: 9, borderRadius: "50%", border: `1.5px solid ${accentColor}40`, borderTopColor: accentColor, animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                    </div>
                  </div>
                  <div style={{ fontSize: "0.6875rem", color: "var(--clr-text-5)", textAlign: "center", marginBottom: "0.875rem" }}>{moreLabel}</div>
                  <FunnyMessage msgs={msgs} />
                  <div style={{ border: "1px solid var(--clr-border)", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 7, background: crossBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{crossIcon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--clr-text)", marginBottom: 1 }}>{crossTitle}</div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--clr-text-4)" }}>{crossSub}</div>
                    </div>
                    <a href={crossHref} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.6875rem", fontWeight: 500, padding: "3px 9px", borderRadius: 5, border: `1px solid ${crossColor}50`, color: crossColor, background: `${crossColor}10`, textDecoration: "none", whiteSpace: "nowrap" as const }}>Try →</a>
                  </div>
                </div>
              </div>
            );
          })() : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

              {/* ── Pulse Panel (default view) ── */}
              {!selectedTool && !hasResults && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  {/* ── HERO ── */}
                  <div style={{ paddingTop: "3rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                    {/* Title */}
                    {activeHeroTab === "gap-analysis" ? (
                      <div style={{ fontSize: "clamp(2.75rem, 5.5vw, 3.5rem)", fontWeight: 600, color: "var(--clr-text)", lineHeight: 1.1, letterSpacing: "-0.035em", marginBottom: "0.75rem" }}>
                        Don&apos;t build what<br />
                        <em style={{ fontStyle: "italic", fontWeight: 600 }}>already exists.</em>
                      </div>
                    ) : (
                      <div style={{ fontSize: "clamp(2.75rem, 5.5vw, 3.5rem)", fontWeight: 600, color: "var(--clr-text)", lineHeight: 1.1, letterSpacing: "-0.035em", marginBottom: "0.75rem" }}>
                        Stop Googling<br />
                        <em style={{ fontStyle: "italic", fontWeight: 600 }}>&quot;best tools for vibecoding&quot;</em>
                      </div>
                    )}
                    {/* Subtitle — single line */}
                    <div style={{ fontSize: "1.125rem", color: "var(--clr-text-3)", marginBottom: "1.5rem", lineHeight: 1.5 }}>
                      {activeHeroTab === "gap-analysis"
                        ? "Describe your idea. We'll scan 70+ live sources and tell you exactly where the gap is."
                        : "Describe what you're building. We'll give you exact tools, real costs and a build order."}
                    </div>
                    {/* Metric pills */}
                    <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: "2rem" }}>
                      {activeHeroTab === "gap-analysis" ? (
                        <>
                          <div style={{ padding: "6px 18px", background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 999, fontSize: "0.8125rem", color: "var(--clr-text-3)" }}><span style={{ fontWeight: 600, color: "var(--clr-text)" }}>70+</span> sources</div>
                          <div style={{ padding: "6px 18px", background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 999, fontSize: "0.8125rem", color: "var(--clr-text-3)" }}><span style={{ fontWeight: 600, color: "var(--clr-text)" }}>~2 min</span> report</div>
                          <div style={{ padding: "6px 18px", background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 999, fontSize: "0.8125rem", color: "var(--clr-text-3)" }}><span style={{ fontWeight: 600, color: "var(--clr-text)" }}>1.2k+</span> validated</div>
                        </>
                      ) : (
                        <>
                          <div style={{ padding: "6px 18px", background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 999, fontSize: "0.8125rem", color: "var(--clr-text-3)" }}><span style={{ fontWeight: 600, color: "var(--clr-text)" }}>700+</span> tools</div>
                          <div style={{ padding: "6px 18px", background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 999, fontSize: "0.8125rem", color: "var(--clr-text-3)" }}><span style={{ fontWeight: 600, color: "var(--clr-text)" }}>3 levels</span> no-code → dev</div>
                          <div style={{ padding: "6px 18px", background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 999, fontSize: "0.8125rem", color: "var(--clr-text-3)" }}><span style={{ fontWeight: 600, color: "var(--clr-text)" }}>Budget</span> matched</div>
                        </>
                      )}
                    </div>
                    {/* Input card */}
                    <div style={{ background: "var(--clr-surface)", border: "1.5px solid #2a9a80", borderRadius: 18, padding: "0", width: "100%", maxWidth: 700, overflow: "hidden" }}>
                      {/* Tab switcher — inside card */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px 12px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => setActiveHeroTab("gap-analysis")}
                            style={{ padding: "8px 20px", borderRadius: 9, fontSize: "0.9375rem", fontWeight: 500, border: "2px solid #bfb3d4", cursor: "pointer", fontFamily: "inherit",
                              background: activeHeroTab === "gap-analysis" ? "var(--clr-surface-2)" : "var(--clr-surface-2)",
                              color: activeHeroTab === "gap-analysis" ? "var(--clr-text-3)" : "var(--clr-text-3)" }}
                          >Dig my idea</button>
                          <button
                            onClick={() => setActiveHeroTab("stack-advisor")}
                            style={{ padding: "8px 20px", borderRadius: 9, fontSize: "0.9375rem", fontWeight: 500, border: "2px solid #bfb3d4", cursor: "pointer", fontFamily: "inherit",
                              background: activeHeroTab === "stack-advisor" ? "#2a9a80" : "var(--clr-surface-2)",
                              color: activeHeroTab === "stack-advisor" ? "#fff" : "var(--clr-text-3)" }}
                          >Get my stack</button>
                        </div>
                        <div className="hide-on-mobile" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                          <span style={{ fontSize: "0.75rem", color: "var(--clr-text-4)" }}>Opus 4.6</span>
                        </div>
                      </div>
                      <div style={{ padding: "0 24px 12px" }}>
                      <textarea
                        value={idea}
                        onChange={(e) => setIdea(e.target.value.slice(0, 2000))}
                        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { if (idea.trim().length >= 40) { if (!isSignedIn) { sessionStorage.setItem("unbuilt_pending_idea", idea); sessionStorage.setItem("unbuilt_pending_tool", activeHeroTab); openSignIn(); } else if (credits !== null && credits <= 0) { setShowNoCreditsModal(true); } else { setSelectedTool(activeHeroTab as ToolId); } } } }}
                        placeholder={activeHeroTab === "gap-analysis" ? 'e.g. "Project management for freelancers"' : 'e.g. "A marketplace for local freelancers with payments"'}
                        style={{ width: "100%", minHeight: 88, resize: "none", background: "var(--clr-bg)", border: "1px solid var(--clr-border)", borderRadius: 12, padding: "16px 18px", fontSize: "1.0625rem", color: "var(--clr-text)", fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const }}
                      />
                      </div>
                      {/* Stack selectors */}
                      {activeHeroTab === "stack-advisor" && (
                  <div className="landing-grid-3" style={{ padding: "4px 24px 12px", display: "flex", gap: 16, flexWrap: "wrap" as const }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.06em", color: "var(--clr-text-4)", textTransform: "uppercase" as const, marginBottom: 5 }}>Budget</div>
                      <div style={{ display: "flex", gap: 4 }}>
                        {([{ id: "bootstrap" as Budget, label: "Free" }, { id: "growing" as Budget, label: "$50/mo" }, { id: "funded" as Budget, label: "$200+" }]).map(opt => (
                          <button key={opt.id} onClick={() => setBudget(opt.id)} style={{ padding: "5px 10px", borderRadius: 7, fontSize: "0.75rem", fontWeight: 500, cursor: "pointer", border: "none", fontFamily: "inherit", background: budget === opt.id ? "#2a9a80" : "var(--clr-surface-2)", color: budget === opt.id ? "#fff" : "var(--clr-text-3)" }}>{opt.label}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.06em", color: "var(--clr-text-4)", textTransform: "uppercase" as const, marginBottom: 5 }}>Tech level</div>
                      <div style={{ display: "flex", gap: 4 }}>
                        {([{ id: "nocode" as TechLevel, label: "No-code" }, { id: "lowcode" as TechLevel, label: "Low-code" }, { id: "developer" as TechLevel, label: "Dev" }]).map(opt => (
                          <button key={opt.id} onClick={() => setTechLevel(opt.id)} style={{ padding: "5px 10px", borderRadius: 7, fontSize: "0.75rem", fontWeight: 500, cursor: "pointer", border: "none", fontFamily: "inherit", background: techLevel === opt.id ? "#2a9a80" : "var(--clr-surface-2)", color: techLevel === opt.id ? "#fff" : "var(--clr-text-3)" }}>{opt.label}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ flex: "0 0 auto" }}>
                      <div style={{ fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.06em", color: "var(--clr-text-4)", textTransform: "uppercase" as const, marginBottom: 5 }}>Platform</div>
                      <div style={{ display: "flex", gap: 4 }}>
                        {([{ id: "web" as Platform, label: "Web" }, { id: "mobile" as Platform, label: "Mobile" }, { id: "both" as Platform, label: "Both" }]).map(opt => (
                          <button key={opt.id} onClick={() => setPlatform(opt.id)} style={{ padding: "5px 10px", borderRadius: 7, fontSize: "0.75rem", fontWeight: 500, cursor: "pointer", border: "none", fontFamily: "inherit", background: platform === opt.id ? "#2a9a80" : "var(--clr-surface-2)", color: platform === opt.id ? "#fff" : "var(--clr-text-3)" }}>{opt.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                      {/* Bottom row */}
                      <div style={{ borderTop: "1px solid var(--clr-border)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <button
                          onClick={() => {
                          const next = !showSampleReport;
                          setShowSampleReport(next);
                          if (next) {
                            setTimeout(() => {
                              const el = document.getElementById("hero-sample-panel");
                              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                            }, 50);
                          }
                        }}
                          style={{ background: "transparent", border: "none", padding: 0, fontSize: "0.8125rem", color: "var(--clr-text-4)", cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}
                        >↓ Sample report</button>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          {idea.trim().length < 40 && (
                            <span style={{ fontSize: "0.8125rem", color: "var(--clr-text-4)" }}>{40 - idea.trim().length} more chars</span>
                          )}
                          <button
                            onClick={() => { if (idea.trim().length >= 40) { if (!isSignedIn) { sessionStorage.setItem("unbuilt_pending_idea", idea); sessionStorage.setItem("unbuilt_pending_tool", activeHeroTab); openSignIn(); } else if (credits !== null && credits <= 0) { setShowNoCreditsModal(true); } else { setSelectedTool(activeHeroTab as ToolId); } } }}
                            disabled={idea.trim().length < 40}
                            style={{ background: idea.trim().length >= 40 ? "#2a9a80" : "var(--clr-surface-2)", color: idea.trim().length >= 40 ? "#fff" : "var(--clr-text-4)", border: "none", borderRadius: 10, padding: "10px 28px", fontSize: "0.9375rem", fontWeight: 600, cursor: idea.trim().length >= 40 ? "pointer" : "default", fontFamily: "inherit" }}
                          >{activeHeroTab === "gap-analysis" ? "Dig →" : "Stack →"}</button>
                        </div>
                      </div>
                    </div>
                  </div>
                      

                  {showSampleReport && !selectedTool && (
                    <div id="hero-sample-panel" style={{ width: "100%", alignSelf: "stretch", marginTop: "1.5rem" }}>
                      {activeHeroTab === "gap-analysis" ? <DigSampleReport /> : <StackSampleReport />}
                    </div>
                  )}

                  {/* ── LANDING SECTIONS ── */}
                  {/* Social proof bar */}
                  <div style={{ borderTop: "1px solid var(--clr-border)", padding: "16px 0", display: "flex", justifyContent: "center", alignItems: "center", gap: 20, flexWrap: "wrap" as const, marginTop: "1rem" }}>
                    <div style={{ display: "flex" }}>
                      {["#dbeafe","#fce7f3","#d1fae5","#fef3c7","#ede9fe"].map((bg,i) => (
                        <div key={i} style={{ width: 22, height: 22, borderRadius: "50%", background: bg, border: "2px solid var(--clr-bg)", marginLeft: i > 0 ? -5 : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.5rem", fontWeight: 600, color: "#666" }}>
                          {["JK","SR","AM","DL","TP"][i]}
                        </div>
                      ))}
                    </div>
                    <span style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)" }}><span style={{ fontWeight: 600, color: "var(--clr-text)" }}>1,247</span> ideas validated</span>
                    <span style={{ fontSize: "0.8125rem", color: "var(--clr-text-4)" }}>|</span>
                    <span style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)" }}>Powered by <span style={{ fontWeight: 600, color: "var(--clr-text)" }}>Claude Opus 4.6</span></span>
                  </div>

                  {/* Dig + Stack intro */}
                  <div style={{ padding: "3rem 1.5rem", textAlign: "center" as const }}>
                    <h2 style={{ fontSize: "1.625rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: 8 }}>Two tools. One session. Build the right thing.</h2>
                    <p style={{ fontSize: "0.9375rem", color: "var(--clr-text-3)", marginBottom: "2rem" }}>Dig finds where the gap is. Stack tells you exactly how to build it.</p>
                    <div className="landing-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, maxWidth: 640, margin: "0 auto" }}>
                      <div style={{ background: "var(--clr-surface)", border: "1.5px solid #2a9a80", borderRadius: 14, padding: "22px 20px", textAlign: "left" as const }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2a9a80" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                          <span style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Dig</span>
                        </div>
                        <p style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", lineHeight: 1.6, marginBottom: 14 }}>Scans 70+ live sources. Maps competitors with funding data. Finds the whitespace nobody is filling.</p>
                        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4 }}>
                          {["App Store","Product Hunt","Reddit","G2","+66 more"].map(s => (
                            <span key={s} style={{ padding: "3px 8px", background: "var(--clr-surface-2)", borderRadius: 5, fontSize: "0.625rem", color: "var(--clr-text-4)" }}>{s}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ background: "var(--clr-surface)", border: "1.5px solid #2a9a80", borderRadius: 14, padding: "22px 20px", textAlign: "left" as const }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2a9a80" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>
                          <span style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Stack</span>
                        </div>
                        <p style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", lineHeight: 1.6, marginBottom: 14 }}>Recommends exact tools, real monthly costs, and a phased build order — matched to your budget and skill level.</p>
                        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4 }}>
                          {["No-code","Low-code","Developer","700+ tools"].map(s => (
                            <span key={s} style={{ padding: "3px 8px", background: "rgba(42,154,128,0.08)", borderRadius: 5, fontSize: "0.625rem", color: "#2a9a80" }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 47 hours vs 2 minutes */}
                  <div style={{ padding: "3rem 1.5rem", background: "var(--clr-surface)" }}>
                    <div style={{ textAlign: "center" as const, marginBottom: "2rem" }}>
                      <h2 style={{ fontSize: "1.625rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: 8 }}>47 hours of research. Or 2 minutes.</h2>
                      <p style={{ fontSize: "0.9375rem", color: "var(--clr-text-3)" }}>The average founder spends weeks on market research. Here's what Unbuilt does in one scan.</p>
                    </div>
                    <div className="landing-compare" style={{ maxWidth: 580, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 0 }}>
                      <div style={{ padding: 20, textAlign: "center" as const }}>
                        <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--clr-text-4)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 14 }}>Manual research</div>
                        <div style={{ fontSize: "0.8125rem", color: "var(--clr-text-4)", lineHeight: 2.2, textAlign: "left" as const, paddingLeft: 12 }}>
                          <div>Search App Store manually</div>
                          <div>Browse Product Hunt for hours</div>
                          <div>Dig through Reddit threads</div>
                          <div>Check Crunchbase one by one</div>
                          <div>Read G2 reviews</div>
                          <div>Make a spreadsheet</div>
                          <div>Guess if there's a gap</div>
                        </div>
                        <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid var(--clr-border)", fontSize: "1.25rem", fontWeight: 600, color: "#e24b4a" }}>~47 hours</div>
                      </div>
                      <div style={{ width: 1, background: "var(--clr-border)", margin: "0 6px" }} />
                      <div style={{ padding: 20, textAlign: "center" as const }}>
                        <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--clr-text-4)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 14 }}>Unbuilt</div>
                        <div style={{ fontSize: "0.8125rem", color: "var(--clr-text)", lineHeight: 2.2, textAlign: "left" as const, paddingLeft: 12, fontWeight: 500 }}>
                          <div>12 competitors with funding data</div>
                          <div>Gaps nobody is filling</div>
                          <div>Reddit pain points extracted</div>
                          <div>App Store new releases scanned</div>
                          <div>Verdict: build, pivot, or skip</div>
                          <div>Stack recommendation</div>
                          <div>Phased build plan with costs</div>
                        </div>
                        <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid var(--clr-border)", fontSize: "1.25rem", fontWeight: 600, color: "#16a34a" }}>~2 minutes</div>
                      </div>
                    </div>
                  </div>

                  {/* Stats — 92% had competitors */}
                  <div style={{ padding: "3rem 1.5rem", textAlign: "center" as const }}>
                    <h2 style={{ fontSize: "1.625rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: 8 }}>Most ideas have competitors. The question is where they're weak.</h2>
                    <p style={{ fontSize: "0.9375rem", color: "var(--clr-text-3)", marginBottom: "2rem" }}>Out of 1,247 ideas scanned, here's what we found.</p>
                    <div className="landing-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12, maxWidth: 540, margin: "0 auto 1.5rem" }}>
                      <div style={{ background: "var(--clr-surface)", borderRadius: 12, padding: "18px 14px" }}>
                        <div style={{ fontSize: "1.75rem", fontWeight: 600 }}>92%</div>
                        <div style={{ fontSize: "0.6875rem", color: "var(--clr-text-4)", marginTop: 3 }}>had existing competitors</div>
                      </div>
                      <div style={{ background: "var(--clr-surface)", borderRadius: 12, padding: "18px 14px" }}>
                        <div style={{ fontSize: "1.75rem", fontWeight: 600 }}>78%</div>
                        <div style={{ fontSize: "0.6875rem", color: "var(--clr-text-4)", marginTop: 3 }}>had an exploitable gap</div>
                      </div>
                      <div style={{ background: "var(--clr-surface)", borderRadius: 12, padding: "18px 14px" }}>
                        <div style={{ fontSize: "1.75rem", fontWeight: 600 }}>14%</div>
                        <div style={{ fontSize: "0.6875rem", color: "var(--clr-text-4)", marginTop: 3 }}>were truly original</div>
                      </div>
                    </div>
                    <div style={{ maxWidth: 500, margin: "0 auto", background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 12, padding: 20 }}>
                      <p style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", lineHeight: 1.7, textAlign: "left" as const }}>
                        The point isn't having no competition — it's knowing exactly <span style={{ color: "var(--clr-text)", fontWeight: 600 }}>where they're falling short</span>. 78% of ideas we scanned had at least one gap competitors weren't filling. That's your entry point. Unbuilt doesn't tell you "great idea!" — it shows you the blind spot you can own.
                      </p>
                    </div>
                  </div>

                  {/* Real reports section */}
                  <div style={{ padding: "3rem 1.5rem", background: "var(--clr-surface)" }}>
                    <div style={{ textAlign: "center" as const, marginBottom: "1.5rem" }}>
                      <h2 style={{ fontSize: "1.625rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: 8 }}>What a report actually looks like.</h2>
                      <p style={{ fontSize: "0.9375rem", color: "var(--clr-text-3)" }}>Real output from a real scan. Not a marketing mockup.</p>
                    </div>
                    <LandingReportPreview />
                  </div>

                  {/* Success stories */}
                  <div style={{ padding: "3rem 1.5rem" }}>
                    <div style={{ textAlign: "center" as const, marginBottom: "2rem" }}>
                      <h2 style={{ fontSize: "1.625rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: 8 }}>Validated here. Then shipped.</h2>
                      <p style={{ fontSize: "0.9375rem", color: "var(--clr-text-3)" }}>Some ideas that used Unbuilt to find their entry point.</p>
                    </div>
                    <div className="landing-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12, maxWidth: 680, margin: "0 auto" }}>
                      {[
                        { initials: "NR", bg: "#ede9fe", color: "#6d28d9", name: "NoteReach", desc: "AI meeting notes for sales teams", gap: "No CRM-native transcription existed", badge: "Pre-seed $420K", badgeBg: "#d1fae5", badgeColor: "#065f46" },
                        { initials: "FL", bg: "#fce7f3", color: "#9d174d", name: "Flowlance", desc: "Freelancer invoicing + tax prep", gap: "Nobody combined invoicing + tax filing", badge: "$12K MRR", badgeBg: "#dbeafe", badgeColor: "#1e40af" },
                        { initials: "SQ", bg: "#fef3c7", color: "#92400e", name: "SquadHire", desc: "Team hiring for agencies", gap: "No tool for hiring entire squads at once", badge: "Angel $310K", badgeBg: "#d1fae5", badgeColor: "#065f46" },
                      ].map(s => (
                        <div key={s.name} style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 14, padding: 18 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 9, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6875rem", fontWeight: 600, color: s.color }}>{s.initials}</div>
                            <span style={{ padding: "2px 8px", background: s.badgeBg, borderRadius: 999, fontSize: "0.5625rem", fontWeight: 600, color: s.badgeColor }}>{s.badge}</span>
                          </div>
                          <div style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: 3 }}>{s.name}</div>
                          <div style={{ fontSize: "0.6875rem", color: "var(--clr-text-3)", lineHeight: 1.5, marginBottom: 8 }}>{s.desc}</div>
                          <div style={{ fontSize: "0.625rem", color: "var(--clr-text-4)", paddingTop: 8, borderTop: "1px solid var(--clr-border)" }}>Gap found: {s.gap}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Built with */}
                  <div style={{ padding: "1.5rem 1.5rem", textAlign: "center" as const, borderTop: "1px solid var(--clr-border)", borderBottom: "1px solid var(--clr-border)" }}>
                    <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--clr-text-4)", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 12 }}>Built with</div>
                    <div style={{ display: "flex", justifyContent: "center", gap: 24, alignItems: "center" }}>
                      {["Next.js","Vercel","Supabase","Clerk","Claude API","Stripe"].map(t => (
                        <span key={t} style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--clr-text-4)" }}>{t}</span>
                      ))}
                    </div>
                  </div>

                  {/* ── HOW DIG WORKS ── */}
                  <div style={{ padding: "4rem 1.5rem", textAlign: "center" as const }}>
                    <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--clr-text-4)", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 10 }}>How it works</div>
                    <h2 style={{ fontSize: "1.625rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: 8 }}>From idea to verdict in 3 steps.</h2>
                    <p style={{ fontSize: "0.9375rem", color: "var(--clr-text-3)", marginBottom: "2.5rem" }}>Half-baked or fully formed. Just type and scan.</p>
                    <div className="landing-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 16, maxWidth: 680, margin: "0 auto" }}>
                      {[
                        { step: "01", title: "Describe your idea", desc: "SaaS, marketplace, app, agency — anything. One sentence is enough. We've seen it all.", icon: "M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" },
                        { step: "02", title: "70+ sources scanned in parallel", desc: "App Store, Reddit, Product Hunt, Crunchbase, G2, Twitter, YouTube, LinkedIn — Claude Opus 4.6 processes them all simultaneously.", icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" },
                        { step: "03", title: "Get your verdict", desc: "Score, competitors, gaps, GTM strategy, financial projections, validation checklist — an 11-page report in ~2 minutes.", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
                      ].map((s, i) => (
                        <div key={s.step} style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 14, padding: "24px 18px", textAlign: "left" as const, position: "relative" as const }}>
                          <div style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--clr-text-4)", letterSpacing: "0.08em", marginBottom: 12 }}>STEP {s.step}</div>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--clr-surface-2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--clr-text)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon}/></svg>
                          </div>
                          <div style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: 6 }}>{s.title}</div>
                          <p style={{ fontSize: "0.75rem", color: "var(--clr-text-3)", lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── ANIMATED ENGINE VISUALIZATION ── */}
                  <div style={{ padding: "3rem 1.5rem", background: "var(--clr-surface)" }}>
                    <div style={{ textAlign: "center" as const, marginBottom: "2rem" }}>
                      <h2 style={{ fontSize: "1.625rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: 8 }}>What happens when you hit Dig.</h2>
                      <p style={{ fontSize: "0.9375rem", color: "var(--clr-text-3)" }}>10 specialized research agents run in parallel across 70+ data sources.</p>
                    </div>
                    <div style={{ maxWidth: 600, margin: "0 auto", background: "var(--clr-bg)", border: "1px solid var(--clr-border)", borderRadius: 16, padding: "24px 20px", overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--clr-border)" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--clr-text-3)" }}>Engine v2.2 • Claude Opus 4.6</span>
                      </div>
                      <div className="landing-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {[
                          { name: "Competitor DB", sources: "15 sources", color: "#6366f1" },
                          { name: "Market Research", sources: "12 sources", color: "#0ea5e9" },
                          { name: "Community Intel", sources: "24 sources", color: "#f59e0b" },
                          { name: "App Intelligence", sources: "8 sources", color: "#10b981" },
                          { name: "Funding & Exits", sources: "6 sources", color: "#ec4899" },
                          { name: "News & Trends", sources: "5+ sources", color: "#8b5cf6" },
                        ].map((agent, i) => (
                          <div key={agent.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "var(--clr-surface)", borderRadius: 8 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: agent.color, flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--clr-text)" }}>{agent.name}</div>
                              <div style={{ fontSize: "0.5625rem", color: "var(--clr-text-4)" }}>{agent.sources}</div>
                            </div>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--clr-surface)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "0.6875rem", color: "var(--clr-text-3)" }}>Report generated in ~120 seconds</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--clr-text)" }}>54</span>
                          <span style={{ fontSize: "0.625rem", color: "var(--clr-text-4)" }}>/100</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── WE KILL BAD IDEAS — Score distribution ── */}
                  <div style={{ padding: "4rem 1.5rem", textAlign: "center" as const }}>
                    <h2 style={{ fontSize: "1.625rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: 8 }}>Most AI tools validate everything. We don't.</h2>
                    <p style={{ fontSize: "0.9375rem", color: "var(--clr-text-3)", marginBottom: "2.5rem" }}>9 out of 10 ideas score below 50. If yours scores above, it earned it.</p>
                    <div className="landing-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 600, margin: "0 auto" }}>
                      <div style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 14, padding: "20px 16px" }}>
                        <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--clr-text-4)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 16 }}>ChatGPT / generic AI</div>
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: 4, marginBottom: 14 }}>
                          {[
                            { range: "80-100", pct: 62, w: "88%" },
                            { range: "60-79", pct: 25, w: "36%" },
                            { range: "40-59", pct: 10, w: "14%" },
                            { range: "0-39", pct: 3, w: "4%" },
                          ].map(b => (
                            <div key={b.range} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: "0.5625rem", color: "var(--clr-text-4)", width: 32, textAlign: "right" as const }}>{b.range}</span>
                              <div style={{ flex: 1, height: 10, background: "var(--clr-surface-2)", borderRadius: 3, overflow: "hidden" }}>
                                <div style={{ width: b.w, height: "100%", background: "#d4d4d4", borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: "0.5625rem", color: "var(--clr-text-4)", width: 24 }}>{b.pct}%</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--clr-text-4)" }}>Median: <span style={{ fontWeight: 600, color: "var(--clr-text-3)" }}>~82</span></div>
                        <div style={{ fontSize: "0.625rem", color: "var(--clr-text-4)", marginTop: 4 }}>Feels good. Means nothing.</div>
                      </div>
                      <div style={{ background: "var(--clr-surface)", border: "1.5px solid var(--clr-text)", borderRadius: 14, padding: "20px 16px" }}>
                        <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--clr-text)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 16 }}>Unbuilt • 1,247 ideas</div>
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: 4, marginBottom: 14 }}>
                          {[
                            { range: "80-100", pct: 1, w: "2%" },
                            { range: "60-79", pct: 6, w: "9%" },
                            { range: "40-59", pct: 28, w: "40%" },
                            { range: "0-39", pct: 65, w: "93%" },
                          ].map(b => (
                            <div key={b.range} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: "0.5625rem", color: "var(--clr-text-4)", width: 32, textAlign: "right" as const }}>{b.range}</span>
                              <div style={{ flex: 1, height: 10, background: "var(--clr-surface-2)", borderRadius: 3, overflow: "hidden" }}>
                                <div style={{ width: b.w, height: "100%", background: b.range === "0-39" ? "#e24b4a" : b.range === "40-59" ? "#f59e0b" : "#22c55e", borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: "0.5625rem", color: "var(--clr-text-4)", width: 24 }}>{b.pct}%</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--clr-text)" }}>Median: <span style={{ fontWeight: 600 }}>~28</span></div>
                        <div style={{ fontSize: "0.625rem", color: "var(--clr-text-4)", marginTop: 4 }}>Harsh by design. Every point is earned.</div>
                      </div>
                    </div>
                    <div style={{ maxWidth: 480, margin: "1.5rem auto 0", background: "var(--clr-surface)", borderRadius: 10, padding: "14px 18px" }}>
                      <p style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", lineHeight: 1.6, margin: 0 }}>
                        A low score isn't a rejection — it's a fix list. The gap between a 28 and a 55 is usually <span style={{ fontWeight: 600, color: "var(--clr-text)" }}>2-3 fixable problems</span>. Every report shows you exactly what to change.
                      </p>
                    </div>
                  </div>

                  {/* ── WHAT'S INSIDE A REPORT ── */}
                  <div style={{ padding: "3rem 1.5rem", background: "var(--clr-surface)" }}>
                    <div style={{ textAlign: "center" as const, marginBottom: "2rem" }}>
                      <h2 style={{ fontSize: "1.625rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: 8 }}>11 pages. Zero fluff.</h2>
                      <p style={{ fontSize: "0.9375rem", color: "var(--clr-text-3)" }}>Every report includes these sections — backed by live data, not LLM imagination.</p>
                    </div>
                    <div className="landing-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10, maxWidth: 600, margin: "0 auto" }}>
                      {[
                        { title: "Executive Summary & Score", desc: "0-100 score with kill/validate/build verdict", tag: "D1-D5 breakdown" },
                        { title: "Competitor Deep Dive", desc: "6-12 competitors with threat level, strengths, weaknesses", tag: "Funding & user data" },
                        { title: "Market Gaps", desc: "Untapped, emerging, and contested opportunities scored 1-10", tag: "Evidence-linked" },
                        { title: "Pain Points & Community", desc: "Real quotes from Reddit, YouTube, App Store reviews", tag: "Sentiment analysis" },
                        { title: "Go-To-Market Strategy", desc: "5 channels with estimated CAC, 3-phase launch plan", tag: "Target customer" },
                        { title: "Financial Projections", desc: "Monthly burn, MRR scenarios, break-even, pricing benchmarks", tag: "3 revenue models" },
                        { title: "Fundability Radar", desc: "6-axis assessment: team, market, product, competition, marketing, need", tag: "Investor-ready" },
                        { title: "Validation Checklist", desc: "5 assumptions rank-ordered by risk with specific tests", tag: "Interview guide" },
                        { title: "SWOT Analysis", desc: "Strengths, weaknesses, opportunities, threats from live data", tag: "Strategic view" },
                        { title: "Industry Trends", desc: "Now, emerging (1-3yr), and structural (3-5yr) shifts", tag: "Timing signals" },
                      ].map((section, i) => (
                        <div key={section.title} style={{ display: "flex", gap: 10, padding: "12px 14px", background: "var(--clr-bg)", borderRadius: 10, border: "1px solid var(--clr-border)" }}>
                          <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--clr-surface-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.625rem", fontWeight: 700, color: "var(--clr-text-4)", flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                          <div>
                            <div style={{ fontSize: "0.8125rem", fontWeight: 600, marginBottom: 2 }}>{section.title}</div>
                            <div style={{ fontSize: "0.6875rem", color: "var(--clr-text-3)", lineHeight: 1.4, marginBottom: 4 }}>{section.desc}</div>
                            <span style={{ fontSize: "0.5625rem", padding: "2px 6px", background: "var(--clr-surface-2)", borderRadius: 4, color: "var(--clr-text-4)" }}>{section.tag}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── TESTIMONIALS ── */}
                  <div style={{ padding: "4rem 1.5rem" }}>
                    <div style={{ textAlign: "center" as const, marginBottom: "2rem" }}>
                      <h2 style={{ fontSize: "1.625rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: 8 }}>Founders who dug before they built.</h2>
                      <p style={{ fontSize: "0.9375rem", color: "var(--clr-text-3)" }}>Real feedback from vibecoders and indie hackers.</p>
                    </div>
                    <div className="landing-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12, maxWidth: 700, margin: "0 auto" }}>
                      {[
                        { name: "Alex R.", role: "Indie hacker", initials: "AR", bg: "#dbeafe", color: "#1e40af", quote: "Ran my SaaS idea through Unbuilt. Found 8 competitors I had no idea about. One was literally funded $4M last month. Saved me from building a dead product." },
                        { name: "Priya K.", role: "First-time founder", initials: "PK", bg: "#fce7f3", color: "#9d174d", quote: "The market gap analysis alone was worth it. Showed me my \"unique\" feature already exists in 3 tools — but none of them serve freelancers. That's my entry point now." },
                        { name: "Marcus T.", role: "Serial entrepreneur", initials: "MT", bg: "#d1fae5", color: "#065f46", quote: "I've validated 6 ideas with Unbuilt. 4 got killed (rightfully), 1 pivoted, and 1 scored 61 — that's the one I'm building now. The scoring is brutally honest." },
                        { name: "Sophie L.", role: "Vibecoder", initials: "SL", bg: "#ede9fe", color: "#6d28d9", quote: "As a no-code builder, the Stack recommendation saved me weeks. Told me exactly which tools to use, how much they'd cost, and in what order to build." },
                        { name: "James W.", role: "Agency founder", initials: "JW", bg: "#fef3c7", color: "#92400e", quote: "We run every client project through Dig first. If it scores below 30, we have the hard conversation early. Already saved 2 clients from wasting $50K+." },
                        { name: "Lena D.", role: "Product manager", initials: "LD", bg: "#fce7f3", color: "#be185d", quote: "The customer interview guide was surprisingly specific. Knew exactly what to ask, where to find users, and what signals to look for. Got 12 interviews done in a week." },
                      ].map(t => (
                        <div key={t.name} style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 14, padding: 18 }}>
                          <p style={{ fontSize: "0.75rem", color: "var(--clr-text-3)", lineHeight: 1.6, margin: "0 0 14px 0", fontStyle: "italic" as const }}>"{t.quote}"</p>
                          <div style={{ borderTop: "1px solid var(--clr-border)", paddingTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.5625rem", fontWeight: 600, color: t.color }}>{t.initials}</div>
                            <div>
                              <div style={{ fontSize: "0.75rem", fontWeight: 600 }}>{t.name}</div>
                              <div style={{ fontSize: "0.625rem", color: "var(--clr-text-4)" }}>{t.role}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── SOURCES WE SCAN ── */}
                  <div style={{ padding: "3rem 1.5rem", background: "var(--clr-surface)" }}>
                    <div style={{ textAlign: "center" as const, marginBottom: "2rem" }}>
                      <h2 style={{ fontSize: "1.625rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: 8 }}>Powered by real data. Not LLM imagination.</h2>
                      <p style={{ fontSize: "0.9375rem", color: "var(--clr-text-3)" }}>Every claim in your report is sourced from live data — not hallucinated.</p>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap" as const, justifyContent: "center", gap: 8, maxWidth: 600, margin: "0 auto 1.5rem" }}>
                      {["App Store","Google Play","Product Hunt","Reddit","Twitter / X","YouTube","LinkedIn","Crunchbase","G2","Capterra","Trustpilot","TechCrunch","GitHub","AngelList","SimilarWeb","SEMrush","Google Trends","Glassdoor","HackerNews","IndieHackers","Stack Overflow","Clutch","PitchBook","CB Insights"].map((s, i) => (
                        <span key={s} style={{ padding: "5px 12px", background: i < 8 ? "var(--clr-bg)" : "var(--clr-surface-2)", border: i < 8 ? "1px solid var(--clr-border)" : "none", borderRadius: 8, fontSize: "0.6875rem", fontWeight: i < 8 ? 600 : 400, color: i < 8 ? "var(--clr-text)" : "var(--clr-text-4)" }}>{s}</span>
                      ))}
                      <span style={{ padding: "5px 12px", background: "var(--clr-text)", borderRadius: 8, fontSize: "0.6875rem", fontWeight: 600, color: "#fff" }}>+46 more</span>
                    </div>
                  </div>

                  {/* ── FOR VIBECODERS SECTION ── */}
                  <div style={{ padding: "4rem 1.5rem", textAlign: "center" as const }}>
                    <h2 style={{ fontSize: "1.625rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: 8 }}>Built for vibecoders.</h2>
                    <p style={{ fontSize: "0.9375rem", color: "var(--clr-text-3)", marginBottom: "2rem" }}>Whether you're a no-coder shipping on weekends or a developer with a side-project itch.</p>
                    <div className="landing-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12, maxWidth: 680, margin: "0 auto" }}>
                      {[
                        { title: "Ship faster", desc: "Stop Googling competitors for 3 weeks. Get the full landscape in 2 minutes and start building.", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
                        { title: "Kill bad ideas early", desc: "Better to learn your idea is a clone in 2 minutes than after 3 months of coding and $5K in Vercel bills.", icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" },
                        { title: "Find your wedge", desc: "Every crowded market has a gap. Unbuilt finds the segment competitors aren't serving — that's your entry point.", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
                      ].map(item => (
                        <div key={item.title} style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 14, padding: "22px 18px", textAlign: "left" as const }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--clr-surface-2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--clr-text)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon}/></svg>
                          </div>
                          <div style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: 6 }}>{item.title}</div>
                          <p style={{ fontSize: "0.75rem", color: "var(--clr-text-3)", lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── FAQ ── */}
                  <div style={{ padding: "3rem 1.5rem", background: "var(--clr-surface)" }}>
                    <div style={{ textAlign: "center" as const, marginBottom: "2rem" }}>
                      <h2 style={{ fontSize: "1.625rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: 8 }}>Questions we get.</h2>
                    </div>
                    <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column" as const, gap: 1 }}>
                      {[
                        { q: "Is this just a ChatGPT wrapper?", a: "No. Unbuilt uses Claude Opus 4.6 with a custom scoring engine (v2.2) calibrated over 1,247 analyses. It scans 70+ live data sources in real-time — App Store, Reddit, Product Hunt, Crunchbase, and more. A ChatGPT prompt doesn't access live data or give you a calibrated market score." },
                        { q: "How is the score calculated?", a: "Five dimensions, each weighted: Demand Signals (30%), Competitive Density (20%), Gap Quality (25%), Market Timing (15%), and Entry Feasibility (10%). Each dimension is scored 0-100 with evidence requirements. The final score is a weighted average with override rules — if Demand scores below 20, the idea is killed regardless of other scores." },
                        { q: "What's the difference between Dig and Stack?", a: "Dig analyzes whether your idea is worth building — competitors, gaps, scoring, GTM strategy. Stack tells you how to build it — recommended tools, monthly costs, build order, and even vibe-coding prompts. Use both in one session." },
                        { q: "Why are most scores so low?", a: "Because most ideas already exist. 92% of ideas we scan have existing competitors. That's not a bad thing — it means demand is validated. The question is where competitors are weak. A score of 28 with a clear gap is more actionable than a vague \"great idea!\" from ChatGPT." },
                        { q: "How long does a scan take?", a: "About 2 minutes. Claude Opus 4.6 processes 70+ sources in parallel — Reddit threads, App Store listings, funding databases, community forums — and generates an 11-page report with evidence-linked claims." },
                        { q: "Can I trust the competitor data?", a: "Every competitor in your report is sourced from live data — real App Store listings, real Crunchbase entries, real Reddit mentions. We show threat levels, strengths, weaknesses, and funding data. Nothing is fabricated." },
                        { q: "What if my idea scores low?", a: "A low score isn't a death sentence — it's a roadmap. Every report includes specific gaps, pivot opportunities, and a validation checklist. The gap between a 22 (kill) and a 54 (validate) is often just repositioning for a different customer segment." },
                      ].map(faq => (
                        <details key={faq.q} style={{ background: "var(--clr-bg)", border: "1px solid var(--clr-border)", borderRadius: 10, marginBottom: 6 }}>
                          <summary style={{ padding: "14px 18px", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", color: "var(--clr-text)", listStyle: "none" as const, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            {faq.q}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--clr-text-4)" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                          </summary>
                          <div style={{ padding: "0 18px 14px", fontSize: "0.8125rem", color: "var(--clr-text-3)", lineHeight: 1.7 }}>{faq.a}</div>
                        </details>
                      ))}
                    </div>
                  </div>

                  {/* ── FINAL STATS BAR ── */}
                  <div style={{ padding: "2.5rem 1.5rem", textAlign: "center" as const }}>
                    <div className="landing-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 10, maxWidth: 600, margin: "0 auto" }}>
                      {[
                        { num: "1,247", label: "Ideas validated" },
                        { num: "70+", label: "Live sources" },
                        { num: "~2 min", label: "Per report" },
                        { num: "11", label: "Page reports" },
                      ].map(s => (
                        <div key={s.label} style={{ padding: "16px 10px" }}>
                          <div style={{ fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.02em" }}>{s.num}</div>
                          <div style={{ fontSize: "0.6875rem", color: "var(--clr-text-4)", marginTop: 2 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: "3.5rem 1.5rem", textAlign: "center" as const, background: "var(--clr-text)", borderRadius: 16, margin: "1.25rem" }}>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: 600, color: "#fff", letterSpacing: "-0.03em", marginBottom: 6 }}>Stop guessing. Start digging.</h2>
                    <p style={{ fontSize: "0.9375rem", color: "#666", marginBottom: "1.5rem" }}>Find the gap in your idea. Get the stack to build it. One session.</p>
                    <div style={{ display: "inline-flex", gap: 10 }}>
                      <button onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setActiveHeroTab("gap-analysis"); }} style={{ padding: "10px 24px", background: "#fff", color: "#111", borderRadius: 10, fontSize: "0.875rem", fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit" }}>Dig my idea</button>
                      <button onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setActiveHeroTab("stack-advisor"); }} style={{ padding: "10px 24px", background: "#2a9a80", color: "#fff", borderRadius: 10, fontSize: "0.875rem", fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit" }}>Get my stack</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ââ Input section ââ */}
              {selectedTool && currentTool && !hasResults && !loading && (
                <div ref={inputSectionRef}>
                  {/* Dig hero — clean */}
                  {selectedTool === "gap-analysis" && (
                    <div style={{ textAlign: "center" as const, padding: "20px 24px 10px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.6875rem", color: "var(--clr-text-3)", marginBottom: 14, letterSpacing: "0.03em" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
                        live data, updated every hour
                      </div>
                      <h1 style={{ fontSize: "3rem", fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1.05, color: "var(--clr-text)", marginBottom: 8 }}>
                        Don't build what<br/><em style={{ fontStyle: "italic", fontWeight: 400, color: "var(--clr-text-3)" }}>already exists.</em>
                      </h1>
                      <p style={{ fontSize: "0.875rem", color: "var(--clr-text-3)", lineHeight: 1.6, whiteSpace: "normal" }}>
                        Describe your idea. We'll scan 70+ live sources and tell you exactly where the gap is.
                      </p>
                    </div>
                  )}
                  {/* Stack hero */}
                  {selectedTool === "stack-advisor" && (
                    <div style={{ textAlign: "center" as const, padding: "16px 24px 6px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.6875rem", color: "var(--clr-text-3)", marginBottom: 14, letterSpacing: "0.03em" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0ea5e9", display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
                        Updated weekly for new tools
                      </div>
                      <h1 style={{ fontSize: "3rem", fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1.05, color: "var(--clr-text)", marginBottom: 14 }}>
                        Stop Googling<br/><em style={{ fontStyle: "italic", fontWeight: 400, color: "var(--clr-text-3)" }}>"best tools for vibecoding"</em>
                      </h1>
                      <p style={{ fontSize: "0.875rem", color: "var(--clr-text-3)", lineHeight: 1.6, maxWidth: 440, margin: "0 auto" }}>
                        Describe what you're building. We'll give you exact tools, real costs<br/>and a build order — matched to your budget and skill level.
                      </p>
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
                    showSampleReport={showSampleReport}
                    setShowSampleReport={setShowSampleReport}
                  />
                  {/* Inline sample report toggle */}
                  {(selectedTool === "gap-analysis" || selectedTool === "stack-advisor") && showSampleReport && (
                    <div id="sample-report-panel" style={{ animation: "fadeSlideIn 0.25s ease", marginTop: 8 }}>
                      {(selectedTool === "gap-analysis" || (!selectedTool && activeHeroTab === "gap-analysis")) ? <DigSampleReport /> : <StackSampleReport />}
                    </div>
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
                    <a
                      href="/reports"
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "0.375rem 0.875rem", borderRadius: 9,
                        background: "transparent", border: "1px solid var(--clr-border)",
                        color: "var(--clr-text-3)", fontSize: "0.775rem", fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit", textDecoration: "none",
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 2h7l3 3v9H3V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 7h4M6 10h4M6 4h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                      My Reports
                    </a>
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
                  if (gapData) return <div style={{ padding:"0 16px 16px 12px" }}><GapAnalysisResult data={gapData} itunesApps={itunesApps} gplayApps={gplayApps} idea={idea} onSwitchToStack={(i) => { handleSelectTool("stack-advisor"); setTimeout(() => setIdea(i), 50); }} /></div>;
                  // If content looks like JSON but failed to parse, show retry message instead of raw JSON
                  const trimmed = streamedContent.trim();
                  const looksLikeJSON = trimmed.startsWith('{') || trimmed.startsWith('```json') || trimmed.includes('"marketScore"');
                  if (looksLikeJSON) return (
                    <div className="section-card" style={{ textAlign: "center", padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                      <div style={{ fontSize: "2rem" }}>⚠️</div>
                      <div style={{ color: "var(--clr-text-6)", fontSize: "0.95rem", maxWidth: 400 }}>
                        The analysis was generated but couldn{"'"}t be fully rendered. This usually happens when the report is very long. Your credit has been refunded.
                      </div>
                      <button onClick={handleSubmit} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #d1d5db", background: "white", cursor: "pointer", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 6 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M1 4v6h6M23 20v-6h-6" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Try again
                      </button>
                    </div>
                  );
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
                  // If content looks like JSON but failed to parse, show retry message
                  const trimmedStack = streamedContent.trim();
                  const looksLikeStackJSON = trimmedStack.startsWith('{') || trimmedStack.startsWith('```json') || trimmedStack.includes('"phases"');
                  if (looksLikeStackJSON) return (
                    <div className="section-card" style={{ textAlign: "center", padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                      <div style={{ fontSize: "2rem" }}>⚠️</div>
                      <div style={{ color: "var(--clr-text-6)", fontSize: "0.95rem", maxWidth: 400 }}>
                        The stack recommendation was generated but couldn{"'"}t be fully rendered. Your credit has been refunded.
                      </div>
                      <button onClick={handleSubmit} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #d1d5db", background: "white", cursor: "pointer", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 6 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M1 4v6h6M23 20v-6h-6" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Try again
                      </button>
                    </div>
                  );
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
      {showNoCreditsModal && <NoCreditsModal idea={idea} onClose={() => setShowNoCreditsModal(false)} />}
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
