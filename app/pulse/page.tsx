"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Signal {
  source: string;
  sourceLabel: string;
  emoji: string;
  title: string;
  subtitle: string;
  signal: string;
  url: string;
  timestamp: string;
  movementType?: string;
  prevRank?: number;
  newRank?: number;
  rankChange?: number;
}

const SOURCE_COLORS: Record<string, string> = {
  appstore: "#007AFF",
  playstore: "#34A853",
  producthunt: "#DA552F",
};

const MOVEMENT_COLORS: Record<string, string> = {
  rank_jump: "#22c55e",
  new_entry: "#3b82f6",
  review_spike: "#f59e0b",
  top_mover: "#8b5cf6",
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "appstore", label: "App Store" },
  { key: "playstore", label: "Google Play" },
  { key: "producthunt", label: "Product Hunt" },
];

function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function PulsePage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [hasMovementData, setHasMovementData] = useState(false);

  const fetchSignals = useCallback(async () => {
    try {
      const res = await fetch("/api/pulse");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      setSignals(data.signals ?? []);
      setHasMovementData(data.hasMovementData ?? false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchSignals]);

  const filtered = filter === "all" ? signals : signals.filter((s) => s.source === filter);

  return (
    <div style={{ minHeight: "100vh", background: "var(--clr-bg)", color: "var(--clr-text)" }}>

      {/* Header */}
      <header style={{
        borderBottom: "1px solid var(--clr-border)",
        backdropFilter: "blur(16px)",
        background: "var(--clr-bg)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 1.5rem", height: 56, display: "flex", alignItems: "center" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <svg width="20" height="20" viewBox="0 0 19 19" fill="none">
              <path d="M2.5 5.5h14M2.5 9.5h10M2.5 13.5h6" stroke="var(--clr-accent)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--clr-text)", letterSpacing: "-0.02em" }}>Unbuilt</span>
          </Link>
          <span style={{ marginLeft: "1rem", fontSize: "0.875rem", color: "var(--clr-text-3)" }}>/ Pulse</span>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>

        {/* Title + Status */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.03em", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            Pulse
            {!loading && (
              hasMovementData ? (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  fontSize: "0.6875rem", fontWeight: 600,
                  padding: "0.2rem 0.6rem", borderRadius: 999,
                  background: "rgba(34,197,94,0.12)", color: "#22c55e",
                  letterSpacing: "0.02em",
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%", background: "#22c55e",
                    display: "inline-block", animation: "livePulse 2s ease-in-out infinite",
                  }} />
                  LIVE
                </span>
              ) : (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  fontSize: "0.6875rem", fontWeight: 600,
                  padding: "0.2rem 0.6rem", borderRadius: 999,
                  background: "rgba(251,191,36,0.12)", color: "#fbbf24",
                  letterSpacing: "0.02em",
                }}>
                  INITIALIZING
                </span>
              )
            )}
          </h1>
          <p style={{ color: "var(--clr-text-3)", fontSize: "0.9375rem", margin: "0.25rem 0 0" }}>
            {hasMovementData
              ? "Tracking rank movements, new entries, and review spikes"
              : "Collecting first snapshot — movement detection starts next hour"}
          </p>
        </div>

        {/* Filter pills */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: "0.375rem 0.875rem",
                borderRadius: 999,
                fontSize: "0.8125rem",
                fontWeight: 500,
                fontFamily: "inherit",
                cursor: "pointer",
                transition: "all 0.15s",
                border: "1px solid",
                borderColor: filter === f.key ? "transparent" : "var(--clr-border-2)",
                background: filter === f.key ? "var(--clr-text)" : "transparent",
                color: filter === f.key ? "var(--clr-bg)" : "var(--clr-text-3)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{
                background: "var(--clr-surface)",
                border: "1px solid var(--clr-border)",
                borderRadius: 10,
                padding: "1rem 1.25rem",
                animation: "pulse 1.5s ease-in-out infinite",
                animationDelay: `${i * 0.1}s`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--clr-border)", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ width: "60%", height: 14, borderRadius: 4, background: "var(--clr-border)", marginBottom: 6 }} />
                    <div style={{ width: "40%", height: 12, borderRadius: 4, background: "var(--clr-border)" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 10, padding: "1rem 1.25rem", color: "#ef4444", fontSize: "0.875rem",
          }}>
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--clr-text-3)" }}>
            No signals right now. Check back soon.
          </div>
        )}

        {/* Signal cards */}
        {!loading && filtered.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {filtered.map((s, i) => {
              const sourceColor = SOURCE_COLORS[s.source] || "#888";
              const movementColor = MOVEMENT_COLORS[s.movementType ?? ""] ?? undefined;
              const showRankChange = s.rankChange && s.rankChange > 0 && s.movementType !== "trending";

              return (
                <a
                  key={`${s.source}-${s.movementType}-${i}`}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.875rem",
                    padding: "0.875rem 1rem",
                    background: "var(--clr-surface)",
                    border: "1px solid var(--clr-border)",
                    borderLeft: movementColor ? `3px solid ${movementColor}` : "1px solid var(--clr-border)",
                    borderRadius: 10,
                    textDecoration: "none",
                    color: "inherit",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(var(--clr-text-rgb),0.03)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--clr-surface)"; }}
                >
                  {/* Emoji */}
                  <span style={{ fontSize: "1.5rem", flexShrink: 0, width: 36, textAlign: "center" }}>
                    {s.emoji}
                  </span>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Source badge + movement type + time */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        padding: "0.125rem 0.5rem", borderRadius: 999,
                        background: `${sourceColor}18`, color: sourceColor,
                      }}>
                        {s.sourceLabel}
                      </span>
                      {s.movementType && s.movementType !== "trending" && s.movementType !== "ph_trending" && (
                        <span style={{
                          fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          padding: "0.1rem 0.4rem", borderRadius: 999,
                          background: `${movementColor}20`, color: movementColor,
                        }}>
                          {s.movementType === "rank_jump" && "RANK JUMP"}
                          {s.movementType === "new_entry" && "NEW ENTRY"}
                          {s.movementType === "review_spike" && "REVIEW SPIKE"}
                          {s.movementType === "top_mover" && "TOP MOVER"}
                        </span>
                      )}
                      <span style={{ fontSize: "0.6875rem", color: "var(--clr-text-4)" }}>
                        {relativeTime(s.timestamp)}
                      </span>
                    </div>

                    {/* Title + rank change */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{
                        fontSize: "0.9375rem", fontWeight: 600, color: "var(--clr-text)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        flex: 1,
                      }}>
                        {s.title}
                      </div>
                      {showRankChange && (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 2,
                          fontSize: "0.75rem", fontWeight: 700,
                          color: "#22c55e", flexShrink: 0,
                          padding: "0.125rem 0.4rem", borderRadius: 6,
                          background: "rgba(34,197,94,0.1)",
                        }}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M5 2L8 6H2L5 2Z" fill="#22c55e" />
                          </svg>
                          {s.rankChange}
                        </span>
                      )}
                    </div>

                    {/* Rank movement display */}
                    {s.prevRank && s.newRank && s.movementType !== "trending" && (
                      <div style={{
                        fontSize: "0.8125rem", fontWeight: 600, marginTop: "0.125rem",
                        color: "var(--clr-text-2)",
                        display: "flex", alignItems: "center", gap: "0.25rem",
                      }}>
                        <span style={{ color: "var(--clr-text-4)" }}>#{s.prevRank}</span>
                        <span style={{ color: "var(--clr-text-4)", fontSize: "0.75rem" }}>{"\u2192"}</span>
                        <span style={{ color: "#22c55e" }}>#{s.newRank}</span>
                      </div>
                    )}

                    {/* Signal text */}
                    <div style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", marginTop: "0.125rem" }}>
                      {s.signal}
                    </div>
                  </div>

                  {/* Arrow */}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: "var(--clr-text-4)" }}>
                    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              );
            })}
          </div>
        )}
      </main>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
