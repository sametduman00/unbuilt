"use client";

import { useState } from "react";
import Link from "next/link";

/* ── Types ───────────────────────────────────────────────────── */

interface Opportunity {
  title: string;
  type: string;
  difficulty: string;
  targetAudience: string;
  whyNow: string;
  searchQuery: string;
}

/* ── Categories ──────────────────────────────────────────────── */

const CATEGORIES = [
  { id: "gaming", emoji: "\uD83C\uDFAE", label: "Gaming" },
  { id: "health-fitness", emoji: "\uD83D\uDCAA", label: "Health & Fitness" },
  { id: "finance-fintech", emoji: "\uD83D\uDCB0", label: "Finance & Fintech" },
  { id: "education", emoji: "\uD83C\uDF93", label: "Education" },
  { id: "developer-tools", emoji: "\uD83D\uDEE0\uFE0F", label: "Developer Tools" },
  { id: "home-lifestyle", emoji: "\uD83C\uDFE0", label: "Home & Lifestyle" },
  { id: "business-productivity", emoji: "\uD83D\uDCBC", label: "Business & Productivity" },
  { id: "social-relationships", emoji: "\u2764\uFE0F", label: "Social & Relationships" },
];

/* ── Badge colors ────────────────────────────────────────────── */

const TYPE_COLORS: Record<string, { bg: string; fg: string }> = {
  "Mobile App": { bg: "#1a1a2e", fg: "#7c8cf8" },
  "Web SaaS": { bg: "#1a2e1a", fg: "#7cf88c" },
  "Developer Tool": { bg: "#2e1a2e", fg: "#c87cf8" },
  "Marketplace": { bg: "#2e2a1a", fg: "#f8c87c" },
  "Community": { bg: "#1a2e2e", fg: "#7cf8e8" },
};

const DIFF_COLORS: Record<string, { bg: string; fg: string }> = {
  "Easy": { bg: "#1a2e1a", fg: "#6ec96e" },
  "Medium": { bg: "#2e2a1a", fg: "#e0c04a" },
  "Hard": { bg: "#2e1a1a", fg: "#e06a6a" },
};

/* ── Page ────────────────────────────────────────────────────── */

export default function OpportunitiesPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = CATEGORIES.find(c => c.id === selected);

  async function handleSelect(categoryId: string) {
    setSelected(categoryId);
    setLoading(true);
    setError(null);
    setOpportunities([]);

    try {
      const res = await fetch(`/api/opportunities?category=${categoryId}`);
      if (!res.ok) throw new Error("Failed to fetch opportunities");
      const data = await res.json();
      setOpportunities(data.opportunities ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    setSelected(null);
    setOpportunities([]);
    setError(null);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080808",
      color: "#e5e5e5",
      fontFamily: "var(--font-inter), system-ui, -apple-system, sans-serif",
    }}>
      {/* ── Navbar ── */}
      <nav style={{
        borderBottom: "1px solid #151515",
        position: "sticky",
        top: 0,
        background: "rgba(8,8,8,0.85)",
        backdropFilter: "blur(12px)",
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 2rem",
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
        }}>
          <Link href="/" style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
          }}>
            <svg width="20" height="20" viewBox="0 0 19 19" fill="none">
              <path d="M2.5 5.5h14M2.5 9.5h10M2.5 13.5h6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{ fontWeight: 700, fontSize: "1rem", color: "#fff", letterSpacing: "-0.02em" }}>
              Unbuilt
            </span>
          </Link>
          <Link href="/how-it-works" style={{ fontSize: "0.875rem", color: "#666", textDecoration: "none" }}>
            How it works
          </Link>
          <span style={{ fontSize: "0.875rem", color: "#fff", fontWeight: 500 }}>
            Opportunities
          </span>
        </div>
      </nav>

      {/* ── Content ── */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "3rem 1.5rem 6rem" }}>

        {!selected ? (
          /* ── Level 1: Category Grid ── */
          <>
            <div style={{ marginBottom: "2.5rem" }}>
              <h1 style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "-0.02em",
                marginBottom: "0.5rem",
              }}>
                Opportunities
              </h1>
              <p style={{ color: "#777", fontSize: 15, lineHeight: 1.5 }}>
                AI-generated market opportunities for indie developers. Pick a category to explore.
              </p>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "1rem",
            }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleSelect(cat.id)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 8,
                    padding: "1.5rem",
                    background: "#111",
                    border: "1px solid #1a1a1a",
                    borderRadius: 12,
                    cursor: "pointer",
                    transition: "border-color 0.15s, background 0.15s",
                    textAlign: "left",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "#333";
                    e.currentTarget.style.background = "#161616";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "#1a1a1a";
                    e.currentTarget.style.background = "#111";
                  }}
                >
                  <span style={{ fontSize: 28 }}>{cat.emoji}</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{cat.label}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          /* ── Level 2: Opportunities List ── */
          <>
            <button
              onClick={handleBack}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                color: "#888",
                fontSize: 14,
                cursor: "pointer",
                fontFamily: "inherit",
                marginBottom: "1.5rem",
                padding: 0,
                transition: "color 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#888"; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              All categories
            </button>

            <div style={{ marginBottom: "2rem" }}>
              <h1 style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "-0.02em",
                marginBottom: "0.25rem",
              }}>
                {selectedCategory?.emoji} {selectedCategory?.label}
              </h1>
              <p style={{ color: "#666", fontSize: 14 }}>
                {loading ? "Generating opportunities..." : `${opportunities.length} opportunities found`}
              </p>
            </div>

            {loading && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#111",
                      border: "1px solid #1a1a1a",
                      borderRadius: 12,
                      padding: "1.5rem",
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  >
                    <div style={{ height: 20, width: "60%", background: "#1a1a1a", borderRadius: 6, marginBottom: 12 }} />
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      <div style={{ height: 22, width: 80, background: "#1a1a1a", borderRadius: 6 }} />
                      <div style={{ height: 22, width: 60, background: "#1a1a1a", borderRadius: 6 }} />
                    </div>
                    <div style={{ height: 14, width: "80%", background: "#1a1a1a", borderRadius: 6, marginBottom: 8 }} />
                    <div style={{ height: 14, width: "70%", background: "#1a1a1a", borderRadius: 6 }} />
                  </div>
                ))}
                <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
              </div>
            )}

            {error && (
              <div style={{
                background: "#1a1111",
                border: "1px solid #331a1a",
                borderRadius: 12,
                padding: "1.5rem",
                color: "#e06a6a",
                fontSize: 14,
              }}>
                {error}
              </div>
            )}

            {!loading && !error && opportunities.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {opportunities.map((opp, i) => {
                  const typeColor = TYPE_COLORS[opp.type] ?? { bg: "#1a1a1a", fg: "#999" };
                  const diffColor = DIFF_COLORS[opp.difficulty] ?? { bg: "#1a1a1a", fg: "#999" };

                  return (
                    <div
                      key={i}
                      style={{
                        background: "#111",
                        border: "1px solid #1a1a1a",
                        borderRadius: 12,
                        padding: "1.5rem",
                        transition: "border-color 0.15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#2a2a2a"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#1a1a1a"; }}
                    >
                      <h3 style={{
                        fontSize: 17,
                        fontWeight: 600,
                        color: "#fff",
                        marginBottom: "0.625rem",
                        letterSpacing: "-0.01em",
                      }}>
                        {opp.title}
                      </h3>

                      <div style={{ display: "flex", gap: 8, marginBottom: "0.75rem", flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: 12,
                          fontWeight: 500,
                          padding: "3px 10px",
                          borderRadius: 6,
                          background: typeColor.bg,
                          color: typeColor.fg,
                        }}>
                          {opp.type}
                        </span>
                        <span style={{
                          fontSize: 12,
                          fontWeight: 500,
                          padding: "3px 10px",
                          borderRadius: 6,
                          background: diffColor.bg,
                          color: diffColor.fg,
                        }}>
                          {opp.difficulty}
                        </span>
                      </div>

                      <p style={{ color: "#aaa", fontSize: 14, marginBottom: "0.375rem", lineHeight: 1.5 }}>
                        <span style={{ color: "#666" }}>For:</span> {opp.targetAudience}
                      </p>
                      <p style={{ color: "#999", fontSize: 13, marginBottom: "1rem", lineHeight: 1.5 }}>
                        <span style={{ color: "#666" }}>Why now:</span> {opp.whyNow}
                      </p>

                      <Link
                        href={`/?tool=trend-feed&q=${encodeURIComponent(opp.searchQuery)}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#888",
                          textDecoration: "none",
                          transition: "color 0.15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = "#fff"; }}
                        onMouseLeave={e => { e.currentTarget.style.color = "#888"; }}
                      >
                        Analyze this
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
