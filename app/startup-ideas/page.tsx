"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Idea {
  id: string;
  title: string;
  slug: string;
  category: string;
  one_liner: string;
  problem: string;
  target_audience: string;
  market_size: string;
  competition_level: string;
  difficulty: string;
  why_now: string;
  gap_reason: string;
  created_at: string;
}

function timeAgo(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function difficultyColor(d: string) {
  if (d?.toLowerCase().includes("easy")) return { bg: "#dcfce7", color: "#15803d" };
  if (d?.toLowerCase().includes("hard")) return { bg: "#fee2e2", color: "#dc2626" };
  return { bg: "#fef3c7", color: "#d97706" };
}

function competitionColor(c: string) {
  if (c?.toLowerCase().includes("low")) return { bg: "#dcfce7", color: "#15803d" };
  if (c?.toLowerCase().includes("high")) return { bg: "#fee2e2", color: "#dc2626" };
  return { bg: "#fef3c7", color: "#d97706" };
}

function categoryLabel(c: string) {
  return c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

export default function StartupIdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [category, setCategory] = useState("all");

  const fetchIdeas = useCallback(async () => {
    try {
      const url = category === "all"
        ? "/api/ideas/list?limit=50"
        : `/api/ideas/list?limit=50&category=${category}`;
      const res = await fetch(url);
      const data = await res.json();
      setIdeas(data.ideas || []);
    } catch { }
    setLoading(false);
  }, [category]);

  useEffect(() => {
    fetchIdeas();
    // Poll every 30s for new ideas
    const interval = setInterval(fetchIdeas, 30000);
    return () => clearInterval(interval);
  }, [fetchIdeas]);

  const categories = ["all", ...Array.from(new Set(ideas.map(i => i.category)))];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 16px 4rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--clr-text)", marginBottom: 8 }}>
          Startup Ideas
        </h1>
        <p style={{ fontSize: "1rem", color: "var(--clr-text-3)", lineHeight: 1.6, marginBottom: 12 }}>
          AI-generated startup ideas with mini analysis. New idea every ~10 minutes.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 12px", borderRadius: 999,
            background: "var(--clr-surface)", border: "1px solid var(--clr-border)",
            fontSize: "0.8125rem", color: "var(--clr-text-3)",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
            New idea every ~10 min
          </span>
          <span style={{
            padding: "4px 12px", borderRadius: 999,
            background: "var(--clr-surface)", border: "1px solid var(--clr-border)",
            fontSize: "0.8125rem", color: "var(--clr-text-3)",
          }}>
            {ideas.length} ideas generated
          </span>
        </div>
      </div>

      {/* Category filter */}
      {categories.length > 2 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: "1.5rem" }}>
          {categories.slice(0, 12).map(cat => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setLoading(true); }}
              style={{
                padding: "5px 12px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 500,
                border: "none", cursor: "pointer", fontFamily: "inherit",
                background: category === cat ? "var(--clr-text)" : "var(--clr-surface-2)",
                color: category === cat ? "#fff" : "var(--clr-text-3)",
                transition: "all 0.12s",
              }}
            >
              {cat === "all" ? "All" : categoryLabel(cat)}
            </button>
          ))}
        </div>
      )}

      {/* Ideas list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--clr-text-4)" }}>Loading ideas...</div>
      ) : ideas.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--clr-text-4)" }}>No ideas yet. First one generating soon...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ideas.map(idea => {
            const isOpen = expandedId === idea.id;
            const dc = difficultyColor(idea.difficulty);
            const cc = competitionColor(idea.competition_level);
            return (
              <div key={idea.id} style={{
                border: "1px solid var(--clr-border)",
                borderRadius: 14,
                background: "var(--clr-surface)",
                overflow: "hidden",
                transition: "border-color 0.15s",
                ...(isOpen ? { borderColor: "var(--clr-text-4)" } : {}),
              }}>
                {/* Collapsed row */}
                <button
                  onClick={() => setExpandedId(isOpen ? null : idea.id)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 18px", background: "transparent", border: "none",
                    cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="var(--clr-text-3)" strokeWidth="1.8"
                    style={{ flexShrink: 0, transition: "transform 0.15s", transform: isOpen ? "rotate(90deg)" : "none" }}>
                    <polyline points="4 2 8 6 4 10" />
                  </svg>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--clr-text)", marginBottom: 2 }}>{idea.title}</div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{idea.one_liner}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: "0.6875rem", padding: "2px 8px", borderRadius: 6, background: "var(--clr-surface-2)", color: "var(--clr-text-4)", fontWeight: 500 }}>
                      {categoryLabel(idea.category)}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--clr-text-4)", whiteSpace: "nowrap", minWidth: 55, textAlign: "right" }}>
                      {timeAgo(idea.created_at)}
                    </span>
                  </div>
                </button>

                {/* Expanded panel */}
                {isOpen && (
                  <div style={{ padding: "0 18px 18px", borderTop: "1px solid var(--clr-border)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: "14px 0" }}>
                      <div style={{ background: "var(--clr-bg)", borderRadius: 10, padding: "10px 12px" }}>
                        <div style={{ fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.06em", color: "var(--clr-text-4)", textTransform: "uppercase", marginBottom: 4 }}>Difficulty</div>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: dc.bg, color: dc.color }}>{idea.difficulty}</span>
                      </div>
                      <div style={{ background: "var(--clr-bg)", borderRadius: 10, padding: "10px 12px" }}>
                        <div style={{ fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.06em", color: "var(--clr-text-4)", textTransform: "uppercase", marginBottom: 4 }}>Competition</div>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: cc.bg, color: cc.color }}>{idea.competition_level}</span>
                      </div>
                      <div style={{ background: "var(--clr-bg)", borderRadius: 10, padding: "10px 12px" }}>
                        <div style={{ fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.06em", color: "var(--clr-text-4)", textTransform: "uppercase", marginBottom: 4 }}>Market</div>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--clr-text-2)" }}>{idea.market_size}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.06em", color: "var(--clr-text-4)", textTransform: "uppercase", marginBottom: 4 }}>Problem</div>
                        <p style={{ fontSize: "0.875rem", color: "var(--clr-text-2)", lineHeight: 1.6, margin: 0 }}>{idea.problem}</p>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.06em", color: "var(--clr-text-4)", textTransform: "uppercase", marginBottom: 4 }}>Target audience</div>
                        <p style={{ fontSize: "0.875rem", color: "var(--clr-text-2)", lineHeight: 1.6, margin: 0 }}>{idea.target_audience}</p>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.06em", color: "var(--clr-text-4)", textTransform: "uppercase", marginBottom: 4 }}>Why now</div>
                        <p style={{ fontSize: "0.875rem", color: "var(--clr-text-2)", lineHeight: 1.6, margin: 0 }}>{idea.why_now}</p>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.06em", color: "var(--clr-text-4)", textTransform: "uppercase", marginBottom: 4 }}>Gap</div>
                        <p style={{ fontSize: "0.875rem", color: "var(--clr-text-2)", lineHeight: 1.6, margin: 0 }}>{idea.gap_reason}</p>
                      </div>
                    </div>

                    {/* CTA */}
                    <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                      <Link
                        href={`/?tab=dig&idea=${encodeURIComponent(idea.one_liner)}`}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "8px 18px", borderRadius: 10,
                          background: "var(--clr-text)", color: "#fff",
                          fontSize: "0.8125rem", fontWeight: 600,
                          textDecoration: "none", transition: "opacity 0.12s",
                        }}
                      >
                        Dig this idea →
                      </Link>
                      <Link
                        href={`/?tab=stack&idea=${encodeURIComponent(idea.one_liner)}`}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "8px 18px", borderRadius: 10,
                          background: "var(--clr-surface-2)", color: "var(--clr-text-2)",
                          fontSize: "0.8125rem", fontWeight: 500,
                          textDecoration: "none", border: "1px solid var(--clr-border)",
                          transition: "opacity 0.12s",
                        }}
                      >
                        Get stack for this
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
}
