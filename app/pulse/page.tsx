"use client";
import { useState, useEffect, useCallback, useRef } from "react";
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
  imageUrl?: string;
  topics?: string[];
  tagline?: string;
  makerName?: string;
  externalUrl?: string;
  claudeGap?: string;
  rating?: number;
  reviewCount?: number;
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
  weekly_mover: "#06b6d4",
  monthly_mover: "#ec4899",
};

const TOPIC_COLORS = ["#6366f1", "#06b6d4", "#f59e0b", "#ec4899", "#22c55e", "#8b5cf6"];

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

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  return "\u2605".repeat(full) + (half ? "\u00BD" : "") + "\u2606".repeat(5 - full - half);
}

export default function PulsePage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMovementData, setHasMovementData] = useState(false);
  const analyzingRef = useRef(false);

  // Fetch PH signals without claudeGap and analyze them async
  const analyzeNewPHSignals = useCallback(async (currentSignals: Signal[]) => {
    if (analyzingRef.current) return;
    const unanalyzed = currentSignals.filter(
      (s) => s.source === "producthunt" && !s.claudeGap
    );
    if (unanalyzed.length === 0) return;

    analyzingRef.current = true;
    setAnalyzing(true);

    try {
      const res = await fetch("/api/pulse/analyze-ph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signals: unanalyzed }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const analyses: { name: string; different: string; missing: string }[] = data.analyses ?? [];
      if (analyses.length === 0) return;

      // Merge analyses back into signals
      setSignals((prev) =>
        prev.map((s) => {
          if (s.source !== "producthunt" || s.claudeGap) return s;
          const match = analyses.find(
            (a) => a.name?.trim().toLowerCase() === s.title?.trim().toLowerCase()
          );
          if (!match) return s;
          return {
            ...s,
            claudeGap: `${match.different} \u2726 Missing: ${match.missing}`,
          };
        })
      );
    } catch {
      // silently fail — analyses are a bonus
    } finally {
      analyzingRef.current = false;
      setAnalyzing(false);
    }
  }, []);

  const fetchSignals = useCallback(async () => {
    try {
      const res = await fetch("/api/pulse");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      const fetched: Signal[] = data.signals ?? [];
      setSignals(fetched);
      setHasMovementData(data.hasMovementData ?? false);
      setError(null);
      // After loading, kick off async analysis for any unanalyzed PH products
      analyzeNewPHSignals(fetched);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [analyzeNewPHSignals]);

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchSignals]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--clr-bg)", color: "var(--clr-text)" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid var(--clr-border)", backdropFilter: "blur(16px)", background: "var(--clr-bg)", position: "sticky", top: 0, zIndex: 50 }}>
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
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.6875rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: 999, background: "rgba(34,197,94,0.12)", color: "#22c55e", letterSpacing: "0.02em" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "livePulse 2s ease-in-out infinite" }} />
                  LIVE
                </span>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.6875rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: 999, background: "rgba(251,191,36,0.12)", color: "#fbbf24", letterSpacing: "0.02em" }}>
                  INITIALIZING
                </span>
              )
            )}
          </h1>
          <p style={{ color: "var(--clr-text-3)", fontSize: "0.9375rem", margin: "0.25rem 0 0" }}>
            {hasMovementData
              ? "Tracking rank movements, new entries, and review spikes"
              : "Collecting first snapshot \u2014 movement detection starts next hour"}
          </p>
          {/* Analyzing indicator */}
          {analyzing && (
            <p style={{ color: "var(--clr-text-4)", fontSize: "0.75rem", margin: "0.25rem 0 0", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#DA552F", animation: "livePulse 1.5s ease-in-out infinite" }} />
              Analyzing new products...
            </p>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 10, padding: "1rem 1.25rem", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 0.1}s` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: "var(--clr-border)", flexShrink: 0 }} />
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
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "1rem 1.25rem", color: "#ef4444", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && signals.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--clr-text-3)" }}>
            No signals right now. Check back soon.
          </div>
        )}

        {/* Signal cards */}
        {!loading && signals.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {signals.map((s, i) => {
              const sourceColor = SOURCE_COLORS[s.source] || "#888";
              const movementColor = MOVEMENT_COLORS[s.movementType ?? ""] ?? undefined;
              const showRankChange = s.rankChange && s.rankChange > 0 && s.movementType !== "trending";
              const isPH = s.source === "producthunt";

              return (
                <a
                  key={`${s.source}-${s.movementType}-${i}`}
                  href={s.externalUrl || s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "flex-start", gap: "0.875rem",
                    padding: "0.875rem 1rem",
                    background: "var(--clr-surface)",
                    border: "1px solid var(--clr-border)",
                    borderLeft: movementColor ? `3px solid ${movementColor}` : "1px solid var(--clr-border)",
                    borderRadius: 10, textDecoration: "none", color: "inherit",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(var(--clr-text-rgb),0.03)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--clr-surface)"; }}
                >
                  {/* Image or Emoji */}
                  {isPH && s.imageUrl ? (
                    <img src={s.imageUrl} alt="" width={48} height={48} style={{ borderRadius: 10, flexShrink: 0, objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: "1.5rem", flexShrink: 0, width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {s.emoji}
                    </span>
                  )}

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Source badge + movement type + time */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", padding: "0.125rem 0.5rem", borderRadius: 999, background: `${sourceColor}18`, color: sourceColor }}>
                        {s.sourceLabel}
                      </span>
                      {s.movementType && s.movementType !== "trending" && s.movementType !== "ph_trending" && (
                        <span style={{ fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", padding: "0.1rem 0.4rem", borderRadius: 999, background: `${movementColor}20`, color: movementColor }}>
                          {s.movementType === "rank_jump" && "RANK JUMP"}
                          {s.movementType === "new_entry" && "NEW ENTRY"}
                          {s.movementType === "review_spike" && "REVIEW SPIKE"}
                          {s.movementType === "top_mover" && "TOP MOVER"}
                          {s.movementType === "weekly_mover" && "WEEKLY"}
                          {s.movementType === "monthly_mover" && "MONTHLY"}
                        </span>
                      )}
                      <span style={{ fontSize: "0.6875rem", color: "var(--clr-text-4)" }}>{relativeTime(s.timestamp)}</span>
                    </div>

                    {/* Title + rank change */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--clr-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        {s.title}
                      </div>
                      {showRankChange && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: "0.75rem", fontWeight: 700, color: "#22c55e", flexShrink: 0, padding: "0.125rem 0.4rem", borderRadius: 6, background: "rgba(34,197,94,0.1)" }}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 2L8 6H2L5 2Z" fill="#22c55e" /></svg>
                          {s.rankChange}
                        </span>
                      )}
                    </div>

                    {/* PH: maker name */}
                    {isPH && s.makerName && (
                      <div style={{ fontSize: "0.75rem", color: "var(--clr-text-4)", marginTop: "0.125rem" }}>by {s.makerName}</div>
                    )}

                    {/* PH: topic pills */}
                    {isPH && s.topics && s.topics.length > 0 && (
                      <div style={{ display: "flex", gap: "0.25rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
                        {s.topics.map((topic, ti) => (
                          <span key={topic} style={{ fontSize: "0.5625rem", fontWeight: 600, letterSpacing: "0.03em", padding: "0.1rem 0.375rem", borderRadius: 999, background: `${TOPIC_COLORS[ti % TOPIC_COLORS.length]}18`, color: TOPIC_COLORS[ti % TOPIC_COLORS.length] }}>
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Rank movement */}
                    {s.prevRank && s.newRank && s.movementType !== "trending" && (
                      <div style={{ fontSize: "0.8125rem", fontWeight: 600, marginTop: "0.125rem", color: "var(--clr-text-2)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <span style={{ color: "var(--clr-text-4)" }}>#{s.prevRank}</span>
                        <span style={{ color: "var(--clr-text-4)", fontSize: "0.75rem" }}>{"\u2192"}</span>
                        <span style={{ color: "#22c55e" }}>#{s.newRank}</span>
                      </div>
                    )}

                    {/* App Store: rating */}
                    {s.source === "appstore" && s.rating && (
                      <div style={{ fontSize: "0.75rem", color: "#f59e0b", marginTop: "0.125rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        <span>{renderStars(s.rating)}</span>
                        <span style={{ color: "var(--clr-text-4)" }}>{s.rating.toFixed(1)}{s.reviewCount ? ` \u2022 ${s.reviewCount.toLocaleString()} reviews` : ""}</span>
                      </div>
                    )}

                    {/* Signal text */}
                    <div style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", marginTop: "0.125rem" }}>{s.signal}</div>

                    {/* Claude gap analysis */}
                    {s.claudeGap ? (
                      <div style={{ fontSize: "0.75rem", color: "var(--clr-text-4)", marginTop: "0.375rem", fontStyle: "italic", display: "flex", alignItems: "flex-start", gap: "0.25rem" }}>
                        <span style={{ flexShrink: 0 }}>{"\u{1F4A1}"}</span>
                        <span>{s.claudeGap}</span>
                      </div>
                    ) : isPH && (
                      <div style={{ fontSize: "0.75rem", color: "var(--clr-text-4)", marginTop: "0.375rem", fontStyle: "italic", opacity: 0.5 }}>
                        Analyzing...
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: "var(--clr-text-4)", marginTop: 4 }}>
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
