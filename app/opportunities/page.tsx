"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth, UserButton, SignInButton } from "@clerk/nextjs";
import { CATEGORIES, type Category } from "@/app/lib/categories";

/* ── Types ───────────────────────────────────────────────────── */

interface Opportunity {
  title: string;
  type: string;
  difficulty: string;
  description: string;
  evidence: string;
  typeReason: string;
  targetAudience: string;
  difficultyReason: string;
  searchQuery: string;
}

interface Stats {
  totalApps: number;
  avgRating: number;
  newReleases: number;
  phPosts: number;
}

/* ── Constants ───────────────────────────────────────────────── */

const TYPE_COLORS: Record<string, string> = {
  Momentum: "#2ecc71",
  Monopoly: "#e74c3c",
  Gap: "#3498db",
  Complaint: "#e67e22",
  Price: "#9b59b6",
  Bundle: "#f1c40f",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "#2ecc71",
  Medium: "#f1c40f",
  Hard: "#e74c3c",
};

/* ── Page ────────────────────────────────────────────────────── */

export default function OpportunitiesPage() {
  const { isSignedIn } = useAuth();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Drill-down state
  const [view, setView] = useState<"categories" | "subcategories" | "opportunities">("categories");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Theme sync
  useEffect(() => {
    const saved = localStorage.getItem("theme") as "dark" | "light" | null;
    if (saved) {
      setTheme(saved);
      if (saved === "light") document.documentElement.classList.add("light");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("light");
  };

  // Fetch opportunities
  const fetchOpportunities = useCallback(async (category: Category, subcategory: string) => {
    setLoading(true);
    setError(null);
    setOpportunities([]);
    setStats(null);
    setExpandedIndex(null);
    try {
      const res = await fetch(
        `/api/opportunities?category=${encodeURIComponent(category.slug)}&subcategory=${encodeURIComponent(subcategory)}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch opportunities");
      setOpportunities(data.opportunities ?? []);
      setStats(data.stats ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  // Navigation handlers
  const selectCategory = (cat: Category) => {
    setSelectedCategory(cat);
    setView("subcategories");
  };

  const selectSubcategory = (sub: string) => {
    if (!selectedCategory) return;
    setSelectedSubcategory(sub);
    setView("opportunities");
    setLoading(true);
    setError(null);
    setOpportunities([]);
    setStats(null);
    setExpandedIndex(null);
    fetchOpportunities(selectedCategory, sub);
  };

  const goBack = () => {
    if (view === "opportunities") {
      setView("subcategories");
      setOpportunities([]);
      setStats(null);
      setError(null);
      setSelectedSubcategory(null);
    } else if (view === "subcategories") {
      setView("categories");
      setSelectedCategory(null);
    }
  };

  /* ── Render ─────────────────────────────────────────────────── */

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--clr-bg)", color: "var(--clr-text)" }}>

      {/* ── Header ── */}
      <header style={{
        borderBottom: "1px solid var(--clr-border-deep)",
        backdropFilter: "blur(16px)",
        background: "var(--clr-bg)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto", padding: "0 2rem",
          height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <svg width="20" height="20" viewBox="0 0 19 19" fill="none">
                <path d="M2.5 5.5h14M2.5 9.5h10M2.5 13.5h6" stroke="var(--clr-accent)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--clr-text)", letterSpacing: "-0.02em" }}>Unbuilt</span>
            </Link>
            <Link href="/how-it-works" style={{
              fontSize: "0.875rem", fontWeight: 400, color: "var(--clr-text-3)",
              textDecoration: "none", transition: "color 0.15s", marginLeft: "1.5rem",
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--clr-text)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--clr-text-3)"; }}
            >
              How it works
            </Link>
            <span style={{
              fontSize: "0.875rem", fontWeight: 500, color: "var(--clr-text)",
              marginLeft: "1rem",
            }}>
              Opportunities
            </span>
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              style={{
                background: "none", border: "1px solid var(--clr-border-2)",
                borderRadius: "50%", width: 32, height: 32,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "var(--clr-text-3)",
                transition: "border-color 0.15s, color 0.15s",
              }}
            >
              {theme === "dark" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button style={{
                  padding: "0.375rem 1rem", borderRadius: 999,
                  background: "transparent", border: "1px solid var(--clr-border-3)",
                  color: "var(--clr-text)", fontSize: "0.875rem", fontWeight: 500,
                  cursor: "pointer", fontFamily: "inherit", transition: "border-color 0.15s",
                }}>
                  Sign in
                </button>
              </SignInButton>
            ) : (
              <UserButton appearance={{ elements: { avatarBox: { width: 32, height: 32 } } }} />
            )}
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "2rem", flex: 1 }}>

        {/* ── Breadcrumb ── */}
        {view !== "categories" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem" }}>
            <button
              onClick={goBack}
              style={{
                background: "none", border: "1px solid var(--clr-border-2)",
                borderRadius: 6, padding: "0.25rem 0.75rem",
                color: "var(--clr-text-3)", fontSize: "0.8125rem",
                cursor: "pointer", fontFamily: "inherit",
                transition: "border-color 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--clr-border-3)"; e.currentTarget.style.color = "var(--clr-text)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--clr-border-2)"; e.currentTarget.style.color = "var(--clr-text-3)"; }}
            >
              ← Back
            </button>
            <span style={{ color: "var(--clr-text-3)", fontSize: "0.8125rem" }}>
              Categories
              {selectedCategory && <> &rsaquo; {selectedCategory.emoji} {selectedCategory.label}</>}
              {selectedSubcategory && <> &rsaquo; {selectedSubcategory}</>}
            </span>
          </div>
        )}

        {/* ── Level 1: Categories ── */}
        {view === "categories" && (
          <>
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <h1 style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>
                Find Your Next Build
              </h1>
              <p style={{ color: "var(--clr-text-3)", fontSize: "1rem", maxWidth: 500, margin: "0 auto" }}>
                Explore 18 App Store categories. Drill into subcategories. Discover data-driven opportunities.
              </p>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "1rem",
            }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => selectCategory(cat)}
                  style={{
                    background: "var(--clr-surface)",
                    border: "1px solid var(--clr-border)",
                    borderLeft: `3px solid ${cat.color}`,
                    borderRadius: 10,
                    padding: "1.25rem",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                    transition: "border-color 0.15s, transform 0.1s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--clr-border)"; e.currentTarget.style.borderLeftColor = cat.color; e.currentTarget.style.transform = "none"; }}
                >
                  <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{cat.emoji}</div>
                  <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--clr-text)", marginBottom: "0.25rem" }}>
                    {cat.label}
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)" }}>
                    {cat.subcategories.length} subcategories
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Level 2: Subcategories ── */}
        {view === "subcategories" && selectedCategory && (
          <>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.25rem" }}>
              {selectedCategory.emoji} {selectedCategory.label}
            </h2>
            <p style={{ color: "var(--clr-text-3)", fontSize: "0.9375rem", marginBottom: "1.5rem" }}>
              Pick a subcategory to discover opportunities
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "0.75rem",
            }}>
              {selectedCategory.subcategories.map((sub) => (
                <button
                  key={sub}
                  onClick={() => selectSubcategory(sub)}
                  style={{
                    background: "var(--clr-surface)",
                    border: "1px solid var(--clr-border)",
                    borderRadius: 8,
                    padding: "1rem 1.25rem",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = selectedCategory.color; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--clr-border)"; }}
                >
                  <span style={{ fontWeight: 500, fontSize: "0.9375rem", color: "var(--clr-text)" }}>
                    {sub}
                  </span>
                  <span style={{ color: "var(--clr-text-3)", fontSize: "0.875rem" }}>→</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Level 3: Opportunities ── */}
        {view === "opportunities" && selectedCategory && selectedSubcategory && (
          <>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
              {selectedSubcategory}
            </h2>

            {/* Stats bar */}
            {stats && (
              <div style={{
                display: "flex", gap: "1.5rem", flexWrap: "wrap",
                marginBottom: "1.5rem", fontSize: "0.8125rem", color: "var(--clr-text-3)",
              }}>
                <span><strong style={{ color: "var(--clr-text)" }}>{stats.totalApps}</strong> apps found</span>
                <span><strong style={{ color: "var(--clr-text)" }}>{stats.avgRating}</strong> avg rating</span>
                <span><strong style={{ color: "var(--clr-text)" }}>{stats.newReleases}</strong> new releases</span>
                <span><strong style={{ color: "var(--clr-text)" }}>{stats.phPosts}</strong> PH posts</span>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} style={{
                    background: "var(--clr-surface)",
                    border: "1px solid var(--clr-border)",
                    borderLeft: "3px solid var(--clr-border)",
                    borderRadius: 10,
                    padding: "1.5rem",
                    animation: "pulse 1.5s ease-in-out infinite",
                    animationDelay: `${i * 0.1}s`,
                  }}>
                    {/* Badge row */}
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      <div style={{ width: 82, height: 22, borderRadius: 4, background: "var(--clr-border)" }} />
                      <div style={{ width: 52, height: 22, borderRadius: 4, background: "var(--clr-border)" }} />
                    </div>
                    {/* Title */}
                    <div style={{ width: "55%", height: 19, borderRadius: 4, background: "var(--clr-border)", marginBottom: "0.625rem" }} />
                    {/* Description lines */}
                    <div style={{ width: "95%", height: 14, borderRadius: 4, background: "var(--clr-border)", marginBottom: "0.3rem" }} />
                    <div style={{ width: "80%", height: 14, borderRadius: 4, background: "var(--clr-border)", marginBottom: "0.3rem" }} />
                    <div style={{ width: "60%", height: 14, borderRadius: 4, background: "var(--clr-border)" }} />
                  </div>
                ))}
                <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                background: "#1a0000", border: "1px solid #330000", borderRadius: 8,
                padding: "1rem 1.25rem", color: "#ff6b6b", marginBottom: "1rem",
              }}>
                {error}
              </div>
            )}

            {/* Opportunity cards */}
            {!loading && opportunities.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {opportunities.map((opp, i) => {
                  const typeColor = TYPE_COLORS[opp.type] || "#888";
                  const diffColor = DIFFICULTY_COLORS[opp.difficulty] || "#888";
                  const isExpanded = expandedIndex === i;
                  return (
                    <div
                      key={i}
                      style={{
                        background: "var(--clr-surface)",
                        border: `1px solid ${isExpanded ? typeColor + "60" : "var(--clr-border)"}`,
                        borderLeft: `3px solid ${typeColor}`,
                        borderRadius: 10,
                        padding: "1.5rem",
                        transition: "border-color 0.2s",
                      }}
                    >
                      {/* Header area — clickable to toggle */}
                      <div
                        onClick={() => setExpandedIndex(isExpanded ? null : i)}
                        style={{ cursor: "pointer" }}
                      >
                        {/* Badges + expand indicator */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                          <span style={{
                            display: "inline-block", padding: "0.2rem 0.6rem",
                            borderRadius: 4, fontSize: "0.75rem", fontWeight: 600,
                            background: `${typeColor}18`, color: typeColor, letterSpacing: "0.01em",
                          }}>
                            {opp.type}
                          </span>
                          <span style={{
                            display: "inline-block", padding: "0.2rem 0.6rem",
                            borderRadius: 4, fontSize: "0.75rem", fontWeight: 500,
                            background: `${diffColor}18`, color: diffColor,
                          }}>
                            {opp.difficulty}
                          </span>
                          <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--clr-text-3)", transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "none" }}>
                            ▼
                          </span>
                        </div>

                        {/* Title */}
                        <h3 style={{ fontSize: "1.0625rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--clr-text)" }}>
                          {opp.title}
                        </h3>

                        {/* Description (always visible) */}
                        <p style={{ fontSize: "0.875rem", color: "var(--clr-text-3)", lineHeight: 1.6, marginBottom: "0.5rem" }}>
                          {opp.description}
                        </p>

                        {/* Evidence (always visible) */}
                        <p style={{ color: "var(--clr-text-3)", fontSize: "0.8125rem", lineHeight: 1.5, marginBottom: isExpanded ? "1rem" : 0 }}>
                          <strong style={{ color: "var(--clr-text-2)" }}>Evidence:</strong> {opp.evidence}
                        </p>
                      </div>

                      {/* Expanded content — clicks don't toggle accordion */}
                      {isExpanded && (
                        <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          {/* Why this type */}
                          <div style={{
                            fontSize: "0.8125rem", color: "var(--clr-text-3)",
                            background: "var(--clr-bg)", borderRadius: 6,
                            padding: "0.75rem 1rem",
                          }}>
                            <div style={{ fontWeight: 600, color: "var(--clr-text-2)", marginBottom: "0.25rem", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Why {opp.type}?</div>
                            {opp.typeReason}
                          </div>

                          {/* Target Audience */}
                          <div style={{
                            fontSize: "0.8125rem", color: "var(--clr-text-3)",
                            background: "var(--clr-bg)", borderRadius: 6,
                            padding: "0.75rem 1rem",
                          }}>
                            <div style={{ fontWeight: 600, color: "var(--clr-text-2)", marginBottom: "0.25rem", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Target Audience</div>
                            {opp.targetAudience}
                          </div>

                          {/* Difficulty Explanation */}
                          <div style={{
                            fontSize: "0.8125rem", color: "var(--clr-text-3)",
                            background: "var(--clr-bg)", borderRadius: 6,
                            padding: "0.75rem 1rem",
                          }}>
                            <div style={{ fontWeight: 600, color: diffColor, marginBottom: "0.25rem", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Difficulty: {opp.difficulty}</div>
                            {opp.difficultyReason}
                          </div>

                          {/* CTA */}
                          <div style={{ paddingTop: "0.5rem" }}>
                            <Link
                              href={`/?tool=gap-analysis&q=${encodeURIComponent(opp.searchQuery)}`}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                fontSize: "0.8125rem", fontWeight: 500,
                                color: typeColor, textDecoration: "none",
                                transition: "opacity 0.15s",
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.8"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                            >
                              Have an idea? Try Gap Analysis →
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && opportunities.length === 0 && (
              <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--clr-text-3)" }}>
                No opportunities found. Try a different subcategory.
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: "1px solid var(--clr-border)",
        padding: "1.5rem 2rem",
        textAlign: "center",
        fontSize: "0.75rem",
        color: "var(--clr-text-3)",
      }}>
        © {new Date().getFullYear()} Unbuilt. All rights reserved.
      </footer>
    </div>
  );
}
