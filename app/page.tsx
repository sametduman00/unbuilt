"use client";

import { useState, useRef, useEffect, useCallback, useMemo, Suspense } from "react";
import Script from "next/script";
import { generatePdf } from "@/app/lib/generatePdf";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
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
          <Card title="TL;DR - Executive Summary" sub={"Market score: "+sc+"/100"} right={<Pill text={data.marketScoreLabel??"Opportunity"} color={sc>=70?"green":sc>=50?"orange":"red"} />}>
            <div style={{ display:"flex", flexDirection:(typeof window!=="undefined"&&window.innerWidth<768)?"column":"row" as const, alignItems:(typeof window!=="undefined"&&window.innerWidth<768)?"center":"flex-start" as const, gap:20, marginBottom:20 }}>
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
const DIG_SAMPLE_JSON = `{"appStoreQuery":"shift worker sleep","marketScore":68,"marketScoreLabel":"Real Opportunity","marketScoreSummary":"The sleep app market is booming at 14.4% CAGR, but the only direct shift-worker sleep competitor (Timeshifter) has a dismal 2.6-star rating on Google Play, and mainstream trackers like Sleep Cycle and AutoSleep fundamentally assume a 9-to-5 sleep window, leaving shift workers vocally underserved on Reddit and forums.","competitors":[{"name":"Timeshifter Shift Work","tagline":"Science-based shift work sleep and alertness optimization","threatLevel":4,"strengths":["Only dedicated shift-work app with B2B enterprise sales channel"],"weaknesses":["Abysmal 2.6-star rating on Google Play signals poor execution"]},{"name":"SleepSync (Monash University)","tagline":"World-first personalized sleep-wake scheduling for shift workers","threatLevel":3,"strengths":["Peer-reviewed clinical evidence from ICU and ED nurse trials"],"weaknesses":["Academic research project, not yet a commercial consumer product"]},{"name":"Sleep Cycle","tagline":"AI sound-analysis sleep tracker for over 3 million users","threatLevel":3,"strengths":["Massive user base with 22K reviews and 4.7-star rating"],"weaknesses":["Assumes standard nighttime sleep window, ignores shift schedules"]},{"name":"AutoSleep","tagline":"Automatic Apple Watch sleep tracking with no button presses","threatLevel":2,"strengths":["61K reviews at 4.7 stars, seamless Apple Watch integration"],"weaknesses":["No shift-aware features or circadian rhythm personalization"]},{"name":"AfterShift","tagline":"Indie sleep and recovery app for shift workers","threatLevel":2,"strengths":["Purpose-built for non-9-to-5 users, founder active on Reddit"],"weaknesses":["Solo side project with no visible traction or funding"]},{"name":"Shift Worker Sleep Management","tagline":"Sleep planning for night and rotating shift workers","threatLevel":2,"strengths":["Directly targets rotating and night shift sleep planning"],"weaknesses":["Minimal visibility, no reviews or market presence data available"]}],"painPoints":[{"quote":"I have an Epix Gen 2 and have played with the nap feature as well as activating sleep mode and nothing seems to do a fair job tracking sleep for variable shift workers","source":"Reddit r/GarminWatches","severity":"high"},{"quote":"Are there any sleep tracker apps that will record sleep during the day, because specifically for sleep tracking on nights I have found most apps do not register daytime sleep properly","source":"Reddit r/Nightshift","severity":"high"},{"quote":"Data without intervention is just anxiety in a ring, we do not need more sleep scores, we need tech that actually triggers behavioral change","source":"Twitter/X","severity":"high"},{"quote":"Nurses at high risk of shift work disorder commonly experienced as excessive sleepiness face a significant increase in the risk of errors, accidents and injuries","source":"Monash University / YouTube research summary","severity":"high"},{"quote":"I built a sleep app that does not assume you work 9 to 5 because every sleep tracker I tried was fundamentally broken for anyone on rotating shifts","source":"Reddit r/SideProject","severity":"medium"}],"marketGaps":[{"title":"Circadian-Aware Adaptive Sleep Scheduling","description":"SleepSync research proved personalized sleep-wake timing improves outcomes for shift workers, yet no commercial app integrates real-time shift calendar data with circadian biology to generate dynamic sleep plans","opportunityScore":9,"status":"emerging"},{"title":"Daytime Sleep Tracking That Actually Works","description":"Reddit users report that mainstream trackers like Garmin and most apps fail to properly detect or score daytime sleep, a critical need for night shift workers who sleep from 7am to 3pm","opportunityScore":9,"status":"untapped"},{"title":"Nurse-Specific Wellness Integration","description":"Mental health apps for nurses exist (Bearable, Happify, Moodfit) and shift calendars exist (Shwoca, LRHSoft) but no single app combines sleep tracking, mood logging, and shift scheduling in one nurse-focused experience","opportunityScore":8,"status":"untapped"},{"title":"B2B Hospital Safety and Compliance Channel","description":"Timeshifter positions for enterprise but has terrible ratings; hospitals face liability from fatigued nurse errors, creating a B2B buyer willing to pay per-seat for a proven fatigue management tool","opportunityScore":8,"status":"emerging"},{"title":"Actionable Interventions Over Passive Scores","description":"Twitter signal confirms users are frustrated with passive sleep scores that cause anxiety without driving behavioral change; an app that delivers timed light exposure, caffeine cutoff, and nap alerts fills this gap","opportunityScore":7,"status":"untapped"}],"swot":{"strengths":["Direct competitor Timeshifter has 2.6 stars, massive execution gap","Clinical validation exists via SleepSync peer-reviewed research","Sleep app market growing at 14.4% CAGR through 2033","Reddit threads show vocal unmet demand from shift workers"],"weaknesses":["Niche audience requires specialized circadian science expertise","Sleep tracking accuracy depends on device hardware integration","High customer acquisition costs in health app category"],"opportunities":["B2B hospital sales for nurse fatigue risk reduction","No dominant player in shift-specific sleep niche yet","Eight Sleep $1.5B valuation proves investor appetite for sleep tech","Combine shift calendar plus sleep tracking in single app"],"threats":["Sleep Cycle or AutoSleep could add shift-aware features","Apple or Garmin could natively support variable sleep windows","Timeshifter may improve execution with enterprise revenue","Aggressive pricing pressure and high CAC in sleep market"]},"opportunity":{"headline":"The leading shift-work sleep competitor has a 2.6-star rating and the only clinically validated solution is stuck in academia — this is a wide-open niche inside a $3.6B market growing at 14.4% CAGR","urgency":"high","actionItems":[{"step":1,"action":"Validate with 20 ICU and ED nurses in 2 weeks","detail":"SleepSync research targeted ICU and emergency department nurses specifically; recruit from r/Nightshift, r/nursing, and nursing Facebook groups to run problem interviews"},{"step":2,"action":"Build an MVP that solves daytime sleep tracking and shift-aware scheduling","detail":"Reddit data shows the two highest-severity pain points are broken daytime sleep detection and no integration with shift calendars; solve these two problems first"},{"step":3,"action":"License or replicate the SleepSync circadian algorithm","detail":"Monash University published their methodology in PMC; use the peer-reviewed personalized sleep-wake management protocol as a science-backed differentiator"},{"step":4,"action":"Launch a B2B pilot with one hospital system","detail":"Timeshifter markets to enterprises to reduce employee fatigue risk and absenteeism; pitch a free pilot to a single hospital system to generate outcome data and a case study"},{"step":5,"action":"Pursue seed funding in the $2-5M range","detail":"Sleep.ai raised $5.5M and Eight Sleep hit $1.5B valuation; investor appetite for sleep tech is demonstrably strong, and a shift-worker niche with clinical evidence is a compelling thesis"}]},"targetCustomer":{"persona":"The Exhausted Night Shift Nurse","jobTitle":"ICU or Emergency Department Registered Nurse","demographics":"Ages 25-45, works at hospitals with 200+ beds, predominantly female, rotates between day and night shifts every 2-4 weeks","painPoints":["Sleep apps do not track daytime sleep accurately after a night shift","Rotating schedules destroy any consistent sleep routine","Chronic fatigue increases risk of medical errors and personal health problems"],"currentTools":["Sleep Cycle or AutoSleep for general tracking","Shift Work Calendar apps like Shwoca for scheduling","Calm or Headspace for relaxation before sleep"],"willingnessToPay":"$4.99 to $9.99 per month for consumer; hospitals willing to pay $3-8 per seat per month for B2B fatigue management"},"targetCustomerDeep":{"whoTheyAre":"Registered nurses and healthcare workers in ICUs, emergency departments, and other 24/7 hospital units who rotate between day and night shifts. The SleepSync trial specifically recruited intensive care and emergency department nurses at high risk of shift work disorder. They are joined by a broader population of paramedics, firefighters, factory workers, and logistics workers on rotating schedules.","howTheyThink":"They are pragmatic problem-solvers who value tools that fit seamlessly into chaotic schedules without adding cognitive load. They are deeply skeptical of wellness apps that feel generic or designed for 9-to-5 desk workers. As one Reddit user put it, they need apps that do not assume you work 9 to 5. They want actionable guidance, not just sleep scores that create anxiety without driving change.","availableMoney":"Individual nurses earn $70K-$95K annually and typically spend $5-15 per month on health and wellness apps. The larger opportunity is institutional: US hospitals collectively spend billions on workforce wellness programs, and a fatigue management app can be positioned as a risk reduction and patient safety investment.","howTheyBuy":"They discover apps through peer recommendations in nursing communities, Reddit threads in r/Nightshift and r/nursing, and word of mouth on units. They evaluate by trying free tiers and reading App Store reviews. Institutional buying happens through nursing leadership, occupational health departments, or chief nursing officers evaluating fatigue management solutions.","triggerEvents":["Starting a new rotating shift schedule at a hospital for the first time","Experiencing a near-miss medical error attributed to fatigue after a night shift","A colleague or peer recommending a solution after visibly struggling with sleep"],"whereToFindThem":["Reddit communities: r/Nightshift, r/nursing, r/GarminWatches","Nursing Facebook groups and allnurses.com forums","Hospital employee wellness programs and nursing conferences"]},"industryTrends":{"now":[{"trend":"Sleep monitoring apps market has reached $1.4 billion in 2026 with accelerating consumer adoption","evidence":"Persistence Market Research reports global sleep monitoring apps market at US$1.4 billion in 2026 growing to US$3.6 billion by 2033 at 14.4% CAGR","impact":"high"},{"trend":"Massive venture capital flowing into sleep technology with Eight Sleep reaching unicorn status","evidence":"Eight Sleep raised $50M at $1.5B valuation in March 2026 per TechCrunch; Sleep.ai raised $5.5M in 2025 for AI sleep solutions","impact":"high"},{"trend":"Academic research validating mobile apps for shift worker sleep management","evidence":"Monash University published SleepSync pilot trial in PMC demonstrating improved sleep and mood outcomes in 27 ICU and ED nurses over two weeks","impact":"medium"}],"emerging":[{"trend":"AI-powered personalized sleep interventions replacing passive tracking","evidence":"Eight Sleep expanding into predictive AI-driven health per BusinessWire; Sleep.ai building AI models to analyze sleep patterns per MedCity News","impact":"high"},{"trend":"Enterprise and B2B channels emerging for shift worker fatigue management","evidence":"Timeshifter positions to employers to reduce employee risk and increase safety and productivity per their website; SleepSync research framed around hospital patient safety outcomes","impact":"medium"}],"structural":[{"trend":"Sleep trackers market scaling toward $18.37 billion by 2035 as sleep becomes a pillar of preventive health","evidence":"Precedence Research projects global sleep trackers market from $7.02B in 2025 to $18.37B by 2035","impact":"high"},{"trend":"Basic sleep tracking commoditizing while personalized intervention-based apps capture premium value","evidence":"Persistence Market Research notes basic tracking captures 50% of revenue in 2026 but intervention-driven apps command higher willingness to pay; Twitter signal confirms demand for tech that triggers behavioral change over passive scores","impact":"high"}]},"marketSegments":[{"name":"Hospital Nurses on Rotating Shifts","fit":"primary","size":"$180M","growth":"14.4%","description":"There are approximately 4 million registered nurses in the US alone, with a large percentage working rotating or night shifts in hospitals. SleepSync research specifically targeted ICU and ED nurses as highest-risk for shift work disorder. This is the beachhead segment with the clearest pain and willingness to pay both individually and through employer wellness programs."},{"name":"General Shift Workers (Manufacturing, Logistics, Emergency Services)","fit":"secondary","size":"$520M","growth":"14.4%","description":"Approximately 16% of the US workforce does shift work including factory workers, warehouse workers, paramedics, firefighters, and police. Timeshifter and shift calendar apps like Shwoca target this broader group. The pain points are universal but the messaging and features must be adapted beyond healthcare."},{"name":"Enterprise Hospital and Healthcare Systems","fit":"secondary","size":"$300M","growth":"17.5%","description":"B2B sales to hospital systems and healthcare employers who face regulatory pressure, liability from fatigue-related errors, and high nurse turnover. Timeshifter already targets this channel but has poor product ratings. Research Nester projects the broader sleep monitoring apps market growing at 17.5% CAGR suggesting strong enterprise demand."},{"name":"Sleep App Power Users with Wearables","fit":"tertiary","size":"$1.4B","growth":"14.4%","description":"Users of Apple Watch, Garmin, Oura Ring, and other wearables who are frustrated with default sleep tracking that assumes nighttime sleep. Reddit r/GarminWatches users specifically report broken tracking for variable schedules. Integration partnerships with wearable platforms could unlock this segment."}],"goToMarket":{"channels":[{"name":"Nursing Community Organic Marketing","type":"primary","estimatedCAC":"$3","description":"Reddit r/Nightshift, r/nursing, allnurses.com forums, and nursing Facebook groups are where shift workers actively seek sleep solutions. The AfterShift founder successfully posted in r/SideProject. Organic community seeding with a free tier drives lowest CAC."},{"name":"App Store Optimization for Shift Sleep Keywords","type":"primary","estimatedCAC":"$5","description":"Live search data shows searches for shift worker sleep app and free sleep tracking app for shift workers with minimal quality results. Timeshifter has the only dedicated listing and it has 2.6 stars. ASO for these keywords is high-ROI with low competition."},{"name":"B2B Hospital Wellness Program Sales","type":"secondary","estimatedCAC":"$150","description":"Higher CAC but dramatically higher LTV. Timeshifter positions for enterprise sales. Pitch to chief nursing officers and occupational health departments using SleepSync-style clinical evidence to reduce fatigue-related incidents. LinkedIn notes high customer acquisition costs as a risk in North America sleep apps market."},{"name":"Clinical Research Partnerships","type":"secondary","estimatedCAC":"$8","description":"Monash University published SleepSync research; partner with sleep medicine researchers at academic medical centers to validate the app and generate peer-reviewed evidence that drives organic press coverage and hospital trust"},{"name":"Healthcare Influencer and Nurse Creator Partnerships","type":"experimental","estimatedCAC":"$12","description":"Nurse influencers on TikTok and Instagram have large followings. DailyNurse and similar publications cover wellness tools for nurses specifically. Sponsor content targeting the intersection of nursing burnout and sleep health."}],"launchTarget":"ICU and emergency department nurses working rotating 12-hour shifts at a single large hospital system in a major US metro area","launchPhases":[{"phase":1,"name":"Nurse Beta Community","duration":"3-4 months","steps":["Recruit 50-100 night shift nurses from r/Nightshift, r/nursing, and allnurses.com for a free beta program","Launch MVP with two core features: daytime-aware sleep tracking and shift calendar integration","Collect sleep outcome data and NPS scores to build initial clinical-quality evidence","Iterate on circadian-based sleep scheduling recommendations using SleepSync published methodology"]},{"phase":2,"name":"Consumer App Store Launch","duration":"3-4 months","steps":["Launch on iOS and Android with freemium model targeting shift worker sleep keywords","Publish beta outcome data as blog posts and pitch to nursing and health tech publications like MobiHealthNews and Sleepopolis","Add Apple Watch and Garmin integration to solve the wearable tracking gap identified on Reddit"]},{"phase":3,"name":"B2B Hospital Pilot and Seed Round","duration":"4-6 months","steps":["Pitch a free 90-day pilot to two to three hospital systems using nurse beta outcome data","Build enterprise admin dashboard for nurse managers to monitor team fatigue risk","Use hospital pilot data and consumer traction to raise a $2-4M seed round"]}]},"customerInterviewGuide":{"questions":["Walk me through what happens from the moment your last shift ends to when you actually fall asleep — what does that look like?","When you transition from day shifts to night shifts, how do you currently try to adjust your sleep, and what usually goes wrong?","Have you tried any apps or tools to help with your sleep around shift work, and what made you keep using them or stop?","Can you tell me about a time when poor sleep after a shift affected your work performance or personal life?","If something could change about how you manage sleep around your shifts, what would make the biggest difference for you?"],"whereToFindThem":["Reddit r/Nightshift and r/nursing communities","allnurses.com forums and nursing Facebook groups","Hospital break rooms and nursing union meetings","Night shift productivity and wellness Discord servers"],"greenSignals":["Nurse describes a detailed workaround they have built to manage sleep around rotating shifts, indicating high motivation to solve this problem","Interviewee has tried and abandoned multiple sleep apps specifically because they could not handle non-standard sleep windows","Hospital manager expresses concern about fatigue-related errors and says they would pay for a fatigue management tool"],"redSignals":["Most nurses say they sleep fine and do not perceive shift-related sleep disruption as a significant problem","Interviewees are unwilling to use any app for sleep and prefer to just deal with it or rely on caffeine alone","Hospital decision-makers see fatigue management as a personal responsibility not an institutional investment"],"targetInterviews":20},"financialDeep":{"monthlyBurn":{"total":"$8,500","infrastructure":"$1,200 — cloud hosting, sleep data storage, API integrations with wearable platforms","tools":"$800 — analytics, monitoring, development tools, and app store fees","marketing":"$3,500 — community marketing, ASO, content creation for nursing communities","acquisition":"$3,000 — based on estimated $3-5 CAC for organic nursing community channels to acquire 600-1000 monthly users"},"breakEvenMonth":"Month 14","twelveMonthMRR":"$18,000","revenueScenarios":{"cautious":{"mrr":"$8,000","probability":"30%","assumption":"Consumer-only freemium model converts 3% of 5,000 free users at $4.99 per month with no B2B traction"},"middle":{"mrr":"$18,000","probability":"45%","assumption":"8,000 free users at 4% conversion to $5.99 per month premium plus one small hospital pilot at $500 per month"},"optimistic":{"mrr":"$45,000","probability":"25%","assumption":"15,000 free users at 5% conversion plus two hospital B2B contracts at $3,000 per month each for 200-seat deployments"}},"pricingBenchmark":"AutoSleep charges a one-time $8.99; Sleep Cycle and SleepScore offer subscriptions at $3.99-$9.99 per month; Timeshifter charges premium pricing for enterprise shift work plans; general sleep apps cluster around $4.99-$6.99 per month for consumer premium"},"fundabilityRadar":{"team":{"score":6,"note":"Requires credible sleep science or circadian biology expertise; SleepSync was built by Monash University researchers, setting a high bar for scientific legitimacy"},"marketSize":{"score":8,"note":"Sleep monitoring apps market at $1.4B growing to $3.6B by 2033 at 14.4% CAGR; broader sleep trackers market reaching $18.37B by 2035 per Precedence Research"},"product":{"score":8,"note":"Leading direct competitor Timeshifter has 2.6-star rating; clear execution gap to build a better product with shift-aware tracking and circadian scheduling"},"competition":{"score":7,"note":"Niche is lightly contested with no dominant player; Timeshifter has poor reviews, SleepSync is academic, AfterShift is a side project, and mainstream trackers ignore shift workers"},"marketing":{"score":7,"note":"Tight-knit nursing communities on Reddit, allnurses.com, and Facebook groups provide efficient organic acquisition; B2B hospital channel offers high-LTV distribution"},"fundingNeed":{"score":7,"note":"Sleep.ai raised $5.5M and Eight Sleep hit $1.5B valuation proving strong investor appetite; a shift-worker niche with clinical data could raise $2-4M seed comfortably"}},"communitySignals":[{"quote":"I have an Epix Gen 2 and have played with the nap feature as well as activating sleep mode and nothing seems to do a fair job tracking sleep for variable shift workers","source":"reddit","sentiment":"pain","subredditOrHandle":"r/GarminWatches"},{"quote":"Are there any sleep tracker apps that will record sleep during the day because most apps do not register daytime sleep properly","source":"reddit","sentiment":"pain","subredditOrHandle":"r/Nightshift"},{"quote":"Specifically for sleep I have found the Oura ring to track best because I work nights and it will learn your sleep cycle and register when it is off","source":"reddit","sentiment":"need","subredditOrHandle":"r/Nightshift"},{"quote":"Data without intervention is just anxiety in a ring, we do not need more sleep scores, we need tech that actually triggers behavioral change","source":"twitter","sentiment":"pain","subredditOrHandle":"@justineliaa reply"},{"quote":"I built a sleep app that does not assume you work 9 to 5 because every sleep tracker I tried was fundamentally broken for anyone on rotating shifts","source":"reddit","sentiment":"need","subredditOrHandle":"r/SideProject"}],"redditPosts":[{"subreddit":"r/GarminWatches","title":"Anyone found a good way to track sleep for variable shift workers","body":"I have an Epix Gen 2 similar to Fenix 7 and have played with the nap feature manually as well as activating sleep mode. Nothing seems to do a fair job. I have set my sleep schedule to 3-11 and manually enter sleep mode when I am early but it seems there are a lot of times I wake up and it does not register properly.","upvotes":0,"sentiment":"pain"},{"subreddit":"r/Nightshift","title":"Are there any sleep tracker apps that will record sleep during the day","body":"Specifically for sleep I have found the Oura ring to track best. I work nights and it will learn your sleep cycle and register when it is off. Most standard sleep tracking apps do not register daytime sleep properly for night shift workers.","upvotes":0,"sentiment":"need"},{"subreddit":"r/SideProject","title":"I built a sleep app that does not assume you work 9 to 5","body":"So I built AfterShift, a sleep and recovery app designed specifically for shift workers. Every sleep tracker I tried was fundamentally broken for anyone on rotating shifts. Sleepcraft is another sleep tracking app with individual scores but it still does not handle variable schedules well.","upvotes":0,"sentiment":"need"},{"subreddit":"r/Nightshift","title":"Discussion on sleep tracker apps recording daytime sleep","body":"The Oura ring learns your sleep cycle for night shift work and registers when it is off. Most apps assume you sleep at night and fail to properly record split or daytime sleep sessions that shift workers rely on.","upvotes":0,"sentiment":"pain"},{"subreddit":"r/GarminWatches","title":"Sleep tracking issues for shift workers using Garmin devices","body":"I have activated sleep mode manually and set my schedule to 3-11 but there are a lot of times I wake up and the watch does not capture it properly. Variable shift sleep is fundamentally not supported by Garmin's default sleep tracking algorithm.","upvotes":0,"sentiment":"pain"}],"xPosts":[{"handle":"@unknown_replier","text":"Data without intervention is just anxiety in a ring. We do not need more sleep scores, we need tech that actually triggers behavioral change.","likes":0,"sentiment":"pain"},{"handle":"@unknown_replier","text":"Note: Only one Twitter/X post was found in the live data provided. Remaining X post slots cannot be populated without fabrication. The single signal strongly suggests users want actionable interventions, not passive tracking.","likes":0,"sentiment":"need"}],"oneLiner":"The only sleep app that adapts to your shift schedule instead of assuming you sleep at night.","marketSize":{"tam":"$3.6B — global sleep monitoring apps market by 2033 per Persistence Market Research","sam":"$520M — shift workers and healthcare workers sleep optimization segment within sleep apps market","som":"$5.2M — realistic first 2 years capturing nurse early adopters and 1-2 hospital B2B pilots in the US","growthRate":"14.4% CAGR from Persistence Market Research 2026-2033 forecast"},"validationChecklist":[{"assumption":"Night shift nurses actively seek and would pay for a shift-specific sleep app","risk":"high","howToTest":"Post a landing page in r/Nightshift and r/nursing describing the app concept and measure email signups over 7 days; target 200 signups from 2000 page views"},{"assumption":"Daytime sleep tracking is a must-have feature that mainstream apps genuinely fail at","risk":"high","howToTest":"Interview 10 night shift nurses this week and ask them to show you their current sleep tracker data; verify if daytime sleep sessions are missing or inaccurate"},{"assumption":"Hospital systems would buy a B2B fatigue management app for their nursing staff","risk":"high","howToTest":"Cold email 15 chief nursing officers and occupational health directors at large hospital systems with a one-page pitch and track response rates; target 3 discovery calls"},{"assumption":"Users want actionable sleep scheduling guidance, not just passive tracking metrics","risk":"medium","howToTest":"Create a simple prototype that generates a personalized sleep schedule based on an entered shift pattern and test it with 10 nurses; measure whether they find the recommendations useful and would follow them"},{"assumption":"The nursing community channels on Reddit and allnurses.com are efficient acquisition channels","risk":"medium","howToTest":"Post genuinely helpful sleep tips for shift workers in r/Nightshift and r/nursing with a subtle mention of the project; track engagement, DMs, and link clicks over one week"}],"synthesis":{"oneParagraph":"This is a genuinely compelling niche: the sleep app market is growing at 14.4% CAGR toward $3.6B, investors are pouring money into sleep tech (Eight Sleep at $1.5B, Sleep.ai at $5.5M), and the only dedicated shift-worker competitor Timeshifter has a miserable 2.6-star rating on Google Play while mainstream trackers like Sleep Cycle and AutoSleep fundamentally ignore non-standard sleep schedules. The clinical validation from Monash University's SleepSync research proves the concept works, but no one has turned it into a polished commercial product — creating a rare window where academic evidence, market demand, and competitive weakness all align for a focused new entrant.","workingForYou":["Timeshifter's 2.6-star rating proves demand exists but execution has failed, giving a clear opening","Peer-reviewed SleepSync research provides a validated scientific framework to build upon without starting from zero","Multiple Reddit threads show shift workers actively searching for sleep solutions and finding nothing adequate"],"watchOutFor":["Sleep Cycle with 22K reviews or AutoSleep with 61K reviews could ship shift-aware features and instantly dominate the niche","LinkedIn market research warns of aggressive pricing pressure and high customer acquisition costs in the sleep app space","Building a scientifically credible circadian algorithm requires sleep science expertise that is difficult and expensive to hire"]},"itunesApps":[{"trackName":"Sleep Cycle - Tracker & Sounds","artworkUrl60":"https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/3d/8d/22/3d8d22b7-89da-b59f-3992-e88665c6a272/AppIconSleepCycle-0-0-1x_U007epad-0-1-0-sRGB-85-220.png/60x60bb.jpg","averageUserRating":4.66296,"userRatingCount":21559,"description":"Built on science, Sleep Cycle uses sound analysis to track and improve sleep for over 3 million users worldwide. Our AI sleep coach, sleep tracker and Smart Alarm clock app help users to identify pote","formattedPrice":"Free","sellerName":"Sleep Cycle AB"},{"trackName":"Eight Sleep","artworkUrl60":"https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/7f/e7/9a/7fe79a9b-b9ee-0d1b-4b70-f3c53f00d841/AppIcon-0-0-1x_U007emarketing-0-8-0-sRGB-85-220.png/60x60bb.jpg","averageUserRating":4.74362,"userRatingCount":14541,"description":"The Eight Sleep Pod is the intelligent sleep system that gives you up to one hour more of sleep every night. It cools. It heats. It elevates. \\n\\nPERSONALIZED SLEEP WITH AUTOPILOT\\nAutopilot is the intel","formattedPrice":"Free","sellerName":"Eight Sleep, Inc"},{"trackName":"Sleep Monitor: Sleep Tracker","artworkUrl60":"https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/de/2c/89/de2c8960-191b-14a3-7da6-3e1a43f40c6f/AppIcon-0-0-1x_U007emarketing-0-11-0-85-220.png/60x60bb.jpg","averageUserRating":4.61003,"userRatingCount":5026,"description":"Are you a snorer or a sleep talker? Sleep Monitor is your professional sleep companion to help you sleep better and feel more refreshed.\\nWith advanced technology and an easy-to-use interface, the app ","formattedPrice":"Free","sellerName":"Xi'an Monster Software Technology Co., Ltd"},{"trackName":"Sleep Tracker: Recorder, Sound","artworkUrl60":"https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/cb/69/8d/cb698d7c-3653-0492-5628-3c5319598393/AppIcon-0-0-1x_U007emarketing-0-6-0-sRGB-85-220.png/60x60bb.jpg","averageUserRating":4.75783,"userRatingCount":7309,"description":"Do you know how you sleep every night? \\nSLEEP TRACKER is your intelligent sleep assistant, now available for FREE download. Our app combines a precise sleep recorder and sleep-talking tracker with a r","formattedPrice":"Free","sellerName":"Leap Health Fitness Limited"},{"trackName":"Supershift Shift Work Calendar","artworkUrl60":"https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/68/1d/43/681d4330-7d09-3f14-f229-9ef0217d2dec/AppIcon-0-0-1x_U007epad-0-0-0-1-0-0-sRGB-85-220.png/60x60bb.jpg","averageUserRating":4.86263,"userRatingCount":4768,"description":"Supershift is great for keeping up with your shift working schedule and all other calendar events in between. With Supershift, scheduling is easy and quick, plus it works with the Apple Watch for a qu","formattedPrice":"Free","sellerName":"Supershift GmbH"},{"trackName":"My Shift Planner - Calendar","artworkUrl60":"https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/95/12/53/95125311-40a8-97d0-ddd9-ee067e9359a4/AppIcon-0-0-1x_U007emarketing-0-8-0-0-85-220.png/60x60bb.jpg","averageUserRating":4.81996,"userRatingCount":3094,"description":"MyShiftPlanner – The Ultimate Shift Work Calendar. Stay organised, save time and take control of your shift life with MyShiftPlanner, the #1 calendar app made just for shift workers.\\n\\nFrom nurses, dri","formattedPrice":"Free","sellerName":"MyBuzz Technologies Limited"},{"trackName":"Sleep Recorder & Sleep Tracker","artworkUrl60":"https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/b8/6a/11/b86a11d6-b20b-f2be-9a43-22729492cd24/AppIconSleepRecorderFree-0-0-1x_U007emarketing-0-8-0-85-220.png/60x60bb.jpg","averageUserRating":4.50479,"userRatingCount":12940,"description":"Analyze snoring, talking, sounds, and more. Track your night like never before!\\nAwake or deep, light sleep too, Track it all—it’s made for you.\\n\\n\\n● Sleep Quality Analysis\\n● Sleep Stages Tracking\\n● Sno","formattedPrice":"Free","sellerName":"Apirox, s.r.o."},{"trackName":"Pillow: Sleep Tracker","artworkUrl60":"https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/5f/e2/95/5fe295c3-91dd-9917-e535-c62bbe7aa6d7/AppIcon-v5-0-0-1x_U007epad-0-0-0-1-0-0-sRGB-85-220.png/60x60bb.jpg","averageUserRating":4.37249,"userRatingCount":95363,"description":"Sleep trouble? Sleep better with Pillow, your smart sleep tracker. Pillow can analyze your sleep cycles automatically using your Apple Watch, iPhone or iPad.\\n\\nUse Pillow as a smart alarm clock to wake","formattedPrice":"Free","sellerName":"Neybox Digital Ltd."}]}`;

function DigSampleReport() {
  const data = parseGapAnalysisJSON(DIG_SAMPLE_JSON);
  if (!data) return null;
  return (
    <div style={{ padding: "20px 0 40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase" as const, color: "var(--clr-text-4)" }}>Sample Dig Report</span>
        <span style={{ fontSize: 11, fontStyle: "italic" as const, color: "var(--clr-text-3)", background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 5, padding: "2px 8px" }}>« sleep tracking app for shift workers and nurses »</span>
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
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase" as const, color: "var(--clr-text-4)" }}>Sample Stack Report</span>
        <span style={{ fontSize: 11, fontStyle: "italic" as const, color: "var(--clr-text-3)", background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 5, padding: "2px 8px" }}>« Handmade jewelry marketplace with payments & reviews »</span>
      </div>
      <StackAdvisorResult data={data} />
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
  // Strip anything before ```json (emojis, whitespace, etc.)
  const stripped = raw.replace(/^[\s\S]*?```json\s*/m, '').replace(/```[\s\S]*$/, '').trim();
  // Also try direct JSON if no fences
  const rawTrimmed = raw.trim();
  const jsonStr = stripped.startsWith('{') ? stripped : (rawTrimmed.startsWith('{') ? rawTrimmed : null);
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
        setSelectedTool(pendingTool as ToolId);
        setIdea(pendingIdea);
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
  const searchParams = useSearchParams();
  useEffect(() => {
    const tool = searchParams.get("tool");
    const newTool = (tool === "gap-analysis" || tool === "stack-advisor") ? tool as ToolId : null;
    // Full reset when URL tool changes (sidebar navigation)
    if (abortControllerRef.current) { abortControllerRef.current.abort(); abortControllerRef.current = null; }
    scanTimersRef.current.forEach(clearTimeout);
    setScanStep(-1);
    setHasResults(false);
    setStreamedContent("");
    setIdea("");
    setLoading(false);
    setError("");
    setOutOfCredits(false);
    setResultCached(null);
    setSelectedTool(newTool);
  }, [searchParams]);
  const [idea, setIdea] = useState("");
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
  const [pulseTab, setPulseTab] = useState<"ph"|"appstore">("appstore");
  const [showSampleReport, setShowSampleReport] = useState(false);
  // Reset sample report when tool changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setShowSampleReport(false); }, [selectedTool]);
  const [pulseSignals, setPulseSignals] = useState<Array<{source:string;sourceLabel:string;emoji:string;title:string;subtitle:string;signal:string;url:string;timestamp:string;movementType?:string;imageUrl?:string;topics?:string[];tagline?:string;externalUrl?:string;claudeGap?:string;}>>([]);
  const [pulseLoading, setPulseLoading] = useState(false);
  const [pulseError, setPulseError] = useState<string|null>(null);
  const [pulseAsDays, setPulseAsDays] = useState<Array<{date:string;isToday:boolean;apps:Array<{app_id:string;app_name:string;developer:string;category:string;price:string;icon_url:string;store_url:string;release_date:string;description:string;rating:number|null;review_count:number;min_os:string;age_rating:string;languages:string[];screenshot_urls:string[];file_size_mb:number|null;claude_what:string|null;claude_different:string|null;claude_missing:string|null;claude_difficulty:"simple"|"medium"|"hard"|null;claude_difficulty_note:string|null;claude_competitors:string[]|null;claude_build_with:{name:string;role:string}[]|null;}>;appCount:number;generatedAt:string;}>>([]);
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
    if (!isSignedIn) { sessionStorage.setItem("unbuilt_pending_idea", idea); sessionStorage.setItem("unbuilt_pending_tool", selectedTool ?? ""); openSignIn(); return; }
    if (credits !== null && credits <= 0) { setShowNoCreditsModal(true); return; }
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

    const body: Record<string, string> = { idea, tool: selectedTool ?? "" };
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
                    <p style={{ fontSize: "0.875rem", color: "var(--clr-text-2)", lineHeight: 1.6, margin: "0 0 18px", whiteSpace: "normal" as const }}>
                      <strong style={{ color: "var(--clr-text)", fontWeight: 700 }}>Don't build what already exists.</strong>
                      {" "}We'll show you what doesn't — and exactly how to build it.
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                      <button
                        onClick={() => router.push("/?tool=gap-analysis")}
                        style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 18px", background: "rgba(99,102,241,0.1)", color: "rgb(79,82,221)", borderRadius: 999, fontSize: "0.8rem", fontWeight: 600, fontFamily: "inherit", cursor: "pointer", border: "1px solid rgba(99,102,241,0.25)", letterSpacing: "0em", transition: "opacity 0.12s" }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = "1"}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                        Dig my idea →
                      </button>
                      <button
                        onClick={() => router.push("/?tool=stack-advisor")}
                        style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 18px", background: "rgba(16,185,129,0.1)", color: "rgb(5,150,105)", borderRadius: 999, fontSize: "0.8rem", fontWeight: 600, fontFamily: "inherit", cursor: "pointer", border: "1px solid rgba(16,185,129,0.25)", letterSpacing: "0em", transition: "opacity 0.12s" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
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
                    {([{id:"appstore" as const,label:"App Store",color:"#007AFF"},{id:"ph" as const,label:"Product Hunt",color:"#DA552F"}]).map(t=>(
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
                          <div className="ph-card-grid" style={{ display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:10 }}>
                            {phFiltered.map((s,i)=>{
                              return (
                                <div key={s.title+i} style={{ background:"var(--clr-surface)", border:"1px solid var(--clr-border)", borderRadius:12, overflow:"hidden", display:"flex", flexDirection:"column" }}>
                                  <a href={s.externalUrl||s.url} target="_blank" rel="noopener noreferrer"
                                    style={{ display:"flex", alignItems:"flex-start", gap:"1rem", padding:"1.125rem 1.125rem 0.875rem", textDecoration:"none", color:"inherit", transition:"background 0.15s" }}
                                    onMouseEnter={e=>e.currentTarget.style.background="rgba(0,0,0,0.02)"}
                                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                                  >
                                    {s.imageUrl
                                      ? <img src={s.imageUrl} alt="" width={48} height={48} style={{ borderRadius:10, flexShrink:0, objectFit:"cover", border:"1px solid var(--clr-border)" }}/>
                                      : <div style={{ width:48, height:48, borderRadius:10, background:"var(--clr-border)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.25rem" }}>{s.emoji}</div>
                                    }
                                    <div style={{ flex:1, minWidth:0 }}>
                                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                                        <span style={{ fontSize:"0.9375rem", fontWeight:600, color:"var(--clr-text)", letterSpacing:"-0.015em" }}>{s.title}</span>
                                        <span style={{ fontSize:"0.6875rem", color:"var(--clr-text-4)", marginLeft:"auto", flexShrink:0 }}>{pulseRelTime(s.timestamp)}</span>
                                      </div>
                                      {s.tagline&&<p style={{ fontSize:"0.8125rem", color:"var(--clr-text-3)", margin:"0 0 8px", lineHeight:1.45 }}>{s.tagline}</p>}
                                      {s.topics&&s.topics.length>0&&(
                                        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                                          {s.topics.map((t,ti)=><span key={t} style={{ fontSize:"0.5625rem", fontWeight:600, padding:"0.15rem 0.5rem", borderRadius:999, background:PULSE_TOPIC_COLORS[ti%PULSE_TOPIC_COLORS.length]+"18", color:PULSE_TOPIC_COLORS[ti%PULSE_TOPIC_COLORS.length] }}>{t}</span>)}
                                        </div>
                                      )}
                                    </div>
                                  </a>
                                  <div style={{ borderTop:"1px solid var(--clr-border)", padding:"8px 14px", display:"flex", justifyContent:"flex-end", marginTop:"auto" }}>
                                    <button
                                      onClick={e=>{e.preventDefault();handleSelectTool("gap-analysis");setTimeout(()=>setIdea(s.tagline||s.title||""),0);}}
                                      style={{ fontSize:"0.6875rem", fontWeight:600, color:"#534AB7", background:"rgba(99,102,241,0.08)", border:"0.5px solid rgba(99,102,241,0.25)", borderRadius:999, padding:"4px 12px", cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}
                                    >Dig this niche →</button>
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
                          <div key={pulseAsCat+"_"+pulseAsSearch} style={{ display:"flex", flexDirection:"column", gap:8 }}>
                            {asFiltered.map(app=>(
                              <div key={app.app_id} style={{background:"var(--clr-surface)",border:"1px solid var(--clr-border)",borderRadius:12,overflow:"hidden"}}>
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
                                <div style={{fontSize:"0.8125rem",color:"var(--clr-text-2)",marginBottom:"0.25rem"}}>{app.developer}</div>
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
                            {(app.claude_what||app.claude_difficulty||app.claude_competitors||app.claude_build_with)&&<div style={{marginTop:8}}>
{app.claude_what&&<div style={{display:"grid",gridTemplateColumns:"80px 1fr",gap:"8px",alignItems:"center",padding:"10px 0",borderTop:"1px solid var(--clr-border)"}}><span style={{fontSize:"0.6rem",fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",color:"var(--clr-text-4)"}}>What</span><p style={{fontSize:"0.8rem",color:"var(--clr-text)",margin:0,lineHeight:1.5}}>{app.claude_what}</p></div>}
{app.claude_difficulty&&<div style={{display:"grid",gridTemplateColumns:"80px 1fr",gap:"8px",alignItems:"center",padding:"10px 0",borderTop:"1px solid var(--clr-border)"}}><span style={{fontSize:"0.6rem",fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",color:"var(--clr-text-4)"}}>Difficulty</span><div style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:7,height:7,borderRadius:"50%",background:app.claude_difficulty==="simple"?"#639922":app.claude_difficulty==="medium"?"#BA7517":"#A32D2D",flexShrink:0,display:"inline-block"}}/><span style={{fontSize:"0.8rem",fontWeight:600,color:app.claude_difficulty==="simple"?"#3B6D11":app.claude_difficulty==="medium"?"#854F0B":"#A32D2D",textTransform:"capitalize"}}>{app.claude_difficulty}</span>{app.claude_difficulty_note&&<span className="diff-note" style={{fontSize:"0.75rem",color:"var(--clr-text-3)"}}>{"— "}{app.claude_difficulty_note}</span>}</div></div>}
{app.claude_competitors&&app.claude_competitors.length>0&&<div style={{display:"grid",gridTemplateColumns:"80px 1fr",gap:"8px",alignItems:"center",padding:"10px 0",borderTop:"1px solid var(--clr-border)"}}><span style={{fontSize:"0.6rem",fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",color:"var(--clr-text-4)"}}>Competitors</span><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{app.claude_competitors.map((comp:string)=><a key={comp} href={"https://apps.apple.com/search?term="+encodeURIComponent(comp)} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{fontSize:"0.75rem",padding:"2px 9px",borderRadius:999,background:"var(--clr-surface)",border:"1px solid var(--clr-border)",color:"var(--clr-text)",textDecoration:"none",whiteSpace:"nowrap"}}>{comp}</a>)}</div></div>}
{app.claude_build_with&&app.claude_build_with.length>0&&<div style={{display:"grid",gridTemplateColumns:"80px 1fr",gap:"8px",alignItems:"flex-start",padding:"8px 0 4px",borderTop:"1px solid var(--clr-border)"}}><span style={{fontSize:"0.6rem",fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",color:"var(--clr-text-4)",paddingTop:4}}>Build with</span><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{app.claude_build_with.map((t:{name:string;role:string})=><div key={t.name} style={{display:"flex",flexDirection:"column",alignItems:"center",background:"var(--clr-surface)",border:"1px solid var(--clr-border)",borderRadius:7,padding:"3px 9px",gap:1}}><span style={{fontSize:"0.72rem",fontWeight:600,color:"var(--clr-text)"}}>{t.name}</span><span style={{fontSize:"0.6rem",color:"var(--clr-text-4)"}}>{t.role}</span></div>)}</div></div>}
</div>}
                          </a>
                          {/* A-2 footer */}
                          <div className="as-a2-footer" style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderTop:"1px solid var(--clr-border)"}}>
                            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRight:"1px solid var(--clr-border)"}}>
                              <div style={{flexShrink:0,width:30,height:30,borderRadius:8,background:"rgba(99,102,241,0.08)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#534AB7" strokeWidth="1.3"/><path d="M11 11l2.5 2.5" stroke="#534AB7" strokeWidth="1.3" strokeLinecap="round"/></svg>
                              </div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:"0.6875rem",fontWeight:600,color:"var(--clr-text)",marginBottom:1}}>Got a better idea?</div>
                                <div style={{fontSize:"0.625rem",color:"var(--clr-text-3)"}}>Analyze competitors & gaps</div>
                              </div>
                              <button onClick={e=>{e.preventDefault();router.push("/?tool=gap-analysis");}} style={{flexShrink:0,fontSize:"0.6875rem",fontWeight:600,color:"#534AB7",background:"rgba(99,102,241,0.08)",border:"0.5px solid rgba(99,102,241,0.25)",borderRadius:999,padding:"4px 10px",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>Dig my idea →</button>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px"}}>
                              <div style={{flexShrink:0,width:30,height:30,borderRadius:8,background:"rgba(16,185,129,0.08)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1.2" stroke="rgb(5,150,105)" strokeWidth="1.3"/><rect x="9" y="2" width="5" height="5" rx="1.2" stroke="rgb(5,150,105)" strokeWidth="1.3"/><rect x="2" y="9" width="5" height="5" rx="1.2" stroke="rgb(5,150,105)" strokeWidth="1.3"/><rect x="9" y="9" width="5" height="5" rx="1.2" stroke="rgb(5,150,105)" strokeWidth="1.3"/></svg>
                              </div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:"0.6875rem",fontWeight:600,color:"var(--clr-text)",marginBottom:1}}>Want to build this yourself?</div>
                                <div style={{fontSize:"0.625rem",color:"var(--clr-text-3)"}}>Get your personal tool stack</div>
                              </div>
                              <button onClick={e=>{e.preventDefault();router.push("/?tool=stack-advisor");}} style={{flexShrink:0,fontSize:"0.6875rem",fontWeight:600,color:"rgb(5,150,105)",background:"rgba(16,185,129,0.08)",border:"0.5px solid rgba(16,185,129,0.25)",borderRadius:999,padding:"4px 10px",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>Get my Stack →</button>
                            </div>
                          </div>
                        </div>
                            ))}
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
                      {selectedTool === "gap-analysis" ? <DigSampleReport /> : <StackSampleReport />}
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
