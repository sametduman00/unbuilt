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

interface PHAnalysis {
  name: string;
  what: string;
  different: string;
  missing: string;
}
interface AppStoreApp {
  id: number;
  app_id: string;
  app_name: string;
  developer: string;
  category: string;
  description: string;
  icon_url: string;
  store_url: string;
  price: string;
  release_date: string;
  first_seen_at: string;
  rating: number | null;
  review_count: number;
  claude_what: string | null;
  claude_different: string | null;
  claude_missing: string | null;
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
  const [activeTab, setActiveTab] = useState<'ph' | 'appstore'>('ph');
  const [asApps, setAsApps] = useState<AppStoreApp[]>([]);
  const [asLoading, setAsLoading] = useState(false);
  const [asGeneratedAt, setAsGeneratedAt] = useState<string | null>(null);
  const [asFilter, setAsFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMovementData, setHasMovementData] = useState(false);
  const analyzingRef = useRef(false);

  // Analyze unanalyzed PH products, then save results back to Supabase cache
  const analyzeNewPHSignals = useCallback(async (currentSignals: Signal[]) => {
    if (analyzingRef.current) return;
    const unanalyzed = currentSignals.filter(
      (s) => s.source === "producthunt" && !s.claudeGap
    );
    if (unanalyzed.length === 0) return;

    analyzingRef.current = true;
    setAnalyzing(true);

    try {
      // 1. Run analysis
      const res = await fetch("/api/pulse/analyze-ph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signals: unanalyzed }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const analyses: PHAnalysis[] = data.analyses ?? [];
      if (analyses.length === 0) return;

      // 2. Build claudeGap map
      const gapMap = new Map<string, string>();
      for (const a of analyses) {
        const gap = `${a.what} \u2726 Different: ${a.different} \u2726 Missing: ${a.missing}`;
        gapMap.set(a.name?.trim().toLowerCase(), gap);
      }

      // 3. Merge into local state immediately (user sees it now)
      setSignals((prev) =>
        prev.map((s) => {
          if (s.source !== "producthunt" || s.claudeGap) return s;
          const gap = gapMap.get(s.title?.trim().toLowerCase());
          return gap ? { ...s, claudeGap: gap } : s;
        })
      );

      // 4. Persist analyses back to Supabase cache so next visitor doesn't re-analyze
      await fetch("/api/pulse", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: Array.from(gapMap.entries()).map(([name, claudeGap]) => ({
            name,
            claudeGap,
          })),
        }),
      }).catch(() => {}); // fire-and-forget, non-critical
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

  const fetchAppStore = async () => {
    setAsLoading(true);
    try {
      const res = await fetch("/api/pulse/appstore");
      const data = await res.json();
      setAsApps(data.apps ?? []);
      setAsGeneratedAt(data.generatedAt ?? null);
    } catch (_) {}
    finally { setAsLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'appstore' && asApps.length === 0) {
      fetchAppStore();
    }
  }, [activeTab]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--clr-bg)", color: "var(--clr-text)" }}>
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

      {/* ── Tab Navigation ── */}
      <div style={{ borderBottom: "1px solid var(--clr-border)", background: "var(--clr-bg)", position: "sticky", top: 56, zIndex: 40 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 1.5rem", display: "flex" }}>
          {([
            { id: "ph" as const, label: "Product Hunt", color: "#DA552F" },
            { id: "appstore" as const, label: "App Store", color: "#007AFF" },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: "none", border: "none",
                borderBottom: activeTab === tab.id ? `2px solid ${tab.color}` : "2px solid transparent",
                padding: "0.75rem 1.25rem", cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? tab.color : "var(--clr-text-3)",
                transition: "color 0.15s, border-color 0.15s",
                letterSpacing: "-0.01em",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
        {activeTab === "ph" && (
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
            {hasMovementData ? "Tracking rank movements, new entries, and review spikes" : "Collecting first snapshot \u2014 movement detection starts next hour"}
          </p>
          {analyzing && (
            <p style={{ color: "var(--clr-text-4)", fontSize: "0.75rem", margin: "0.25rem 0 0", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#DA552F", animation: "livePulse 1.5s ease-in-out infinite" }} />
              Analyzing new products...
            </p>
          )}
        </div>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[1,2,3,4,5,6].map((i) => (
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

        {error && !loading && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "1rem 1.25rem", color: "#ef4444", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}

        {!loading && !error && signals.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--clr-text-3)" }}>
            No signals right now. Check back soon.
          </div>
        )}

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
                  style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", padding: "0.875rem 1rem", background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderLeft: movementColor ? `3px solid ${movementColor}` : "1px solid var(--clr-border)", borderRadius: 10, textDecoration: "none", color: "inherit", transition: "border-color 0.15s, background 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(var(--clr-text-rgb),0.03)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--clr-surface)"; }}
                >
                  {isPH && s.imageUrl ? (
                    <img src={s.imageUrl} alt="" width={48} height={48} style={{ borderRadius: 10, flexShrink: 0, objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: "1.5rem", flexShrink: 0, width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.emoji}</span>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
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

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--clr-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{s.title}</div>
                      {showRankChange && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: "0.75rem", fontWeight: 700, color: "#22c55e", flexShrink: 0, padding: "0.125rem 0.4rem", borderRadius: 6, background: "rgba(34,197,94,0.1)" }}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 2L8 6H2L5 2Z" fill="#22c55e" /></svg>
                          {s.rankChange}
                        </span>
                      )}
                    </div>

                    {isPH && s.makerName && (
                      <div style={{ fontSize: "0.75rem", color: "var(--clr-text-4)", marginTop: "0.125rem" }}>by {s.makerName}</div>
                    )}

                    {isPH && s.topics && s.topics.length > 0 && (
                      <div style={{ display: "flex", gap: "0.25rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
                        {s.topics.map((topic, ti) => (
                          <span key={topic} style={{ fontSize: "0.5625rem", fontWeight: 600, letterSpacing: "0.03em", padding: "0.1rem 0.375rem", borderRadius: 999, background: `${TOPIC_COLORS[ti % TOPIC_COLORS.length]}18`, color: TOPIC_COLORS[ti % TOPIC_COLORS.length] }}>
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}

                    {s.prevRank && s.newRank && s.movementType !== "trending" && (
                      <div style={{ fontSize: "0.8125rem", fontWeight: 600, marginTop: "0.125rem", color: "var(--clr-text-2)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <span style={{ color: "var(--clr-text-4)" }}>#{s.prevRank}</span>
                        <span style={{ color: "var(--clr-text-4)", fontSize: "0.75rem" }}>{"\u2192"}</span>
                        <span style={{ color: "#22c55e" }}>#{s.newRank}</span>
                      </div>
                    )}

                    {s.source === "appstore" && s.rating && (
                      <div style={{ fontSize: "0.75rem", color: "#f59e0b", marginTop: "0.125rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        <span>{renderStars(s.rating)}</span>
                        <span style={{ color: "var(--clr-text-4)" }}>{s.rating.toFixed(1)}{s.reviewCount ? ` \u2022 ${s.reviewCount.toLocaleString()} reviews` : ""}</span>
                      </div>
                    )}

                    <div style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", marginTop: "0.125rem" }}>{s.signal}</div>

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

                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: "var(--clr-text-4)", marginTop: 4 }}>
                    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              );
            })}
          </div>
        )}

        {/* ── App Store Tab ── */}
        {activeTab === "appstore" && (
          <div>
            <div style={{ marginBottom: "1.5rem" }}>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.03em", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
                New &amp; Rising
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.6875rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: 999, background: "rgba(0,122,255,0.12)", color: "#007AFF", letterSpacing: "0.02em" }}>
                  APP STORE
                </span>
              </h1>
              <p style={{ color: "var(--clr-text-3)", fontSize: "0.9375rem", margin: "0.25rem 0 0" }}>
                New apps from the last 90 days — filtered by category
              </p>
              {asGeneratedAt && (
                <p style={{ color: "var(--clr-text-4)", fontSize: "0.75rem", margin: "0.25rem 0 0" }}>
                  Updated {relativeTime(asGeneratedAt)}
                </p>
              )}
            </div>
            <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
              {["all","Business","Productivity","Finance","Health & Fitness","Education","Utilities","Developer Tools","Social Networking"].map((cat) => (
                <button key={cat} onClick={() => setAsFilter(cat)} style={{ background: asFilter === cat ? "rgba(0,122,255,0.12)" : "var(--clr-surface)", border: asFilter === cat ? "1px solid rgba(0,122,255,0.3)" : "1px solid var(--clr-border)", color: asFilter === cat ? "#007AFF" : "var(--clr-text-3)", borderRadius: 999, padding: "0.25rem 0.75rem", fontSize: "0.75rem", fontWeight: asFilter === cat ? 600 : 400, cursor: "pointer", transition: "all 0.15s" }}>
                  {cat === "all" ? "All" : cat}
                </button>
              ))}
            </div>
            {asLoading && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[1,2,3,4,5].map((i) => (
                  <div key={i} style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 10, padding: "1rem 1.25rem", animation: "pulse 1.5s ease-in-out infinite" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: 48, height: 48, borderRadius: 10, background: "var(--clr-border)", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}><div style={{ width: "60%", height: 14, borderRadius: 4, background: "var(--clr-border)", marginBottom: 6 }} /><div style={{ width: "40%", height: 12, borderRadius: 4, background: "var(--clr-border)" }} /></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!asLoading && asApps.length === 0 && (
              <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--clr-text-3)" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🔄</div>
                <div style={{ fontWeight: 600, marginBottom: "0.375rem" }}>Data collection started</div>
                <div style={{ fontSize: "0.875rem" }}>Check back tomorrow — new apps will appear here daily.</div>
              </div>
            )}
            {!asLoading && asApps.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {asApps.filter((app) => asFilter === "all" || app.category === asFilter).map((app) => (
                  <a key={app.app_id} href={app.store_url} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", padding: "0.875rem 1rem", background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderLeft: "3px solid #007AFF", borderRadius: 10, textDecoration: "none", color: "inherit", transition: "border-color 0.15s, background 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(var(--clr-text-rgb),0.03)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--clr-surface)"; }}
                  >
                    {app.icon_url ? (<img src={app.icon_url} alt="" width={48} height={48} style={{ borderRadius: 10, flexShrink: 0, objectFit: "cover" }} />) : (<span style={{ fontSize: "1.5rem", flexShrink: 0, width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>📱</span>)}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", padding: "0.125rem 0.5rem", borderRadius: 999, background: "rgba(0,122,255,0.12)", color: "#007AFF" }}>App Store</span>
                        {app.category && (<span style={{ fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", padding: "0.1rem 0.4rem", borderRadius: 999, background: "rgba(99,102,241,0.12)", color: "#6366f1" }}>{app.category}</span>)}
                        <span style={{ fontSize: "0.6875rem", color: "var(--clr-text-4)" }}>{relativeTime(app.first_seen_at)}</span>
                        {app.price && app.price !== "Free" && (<span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#22c55e" }}>{app.price}</span>)}
                      </div>
                      <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--clr-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.app_name}</div>
                      {app.developer && (<div style={{ fontSize: "0.75rem", color: "var(--clr-text-4)", marginTop: "0.125rem" }}>by {app.developer}</div>)}
                      {app.rating != null && (<div style={{ fontSize: "0.75rem", color: "#f59e0b", marginTop: "0.125rem", display: "flex", alignItems: "center", gap: "0.375rem" }}><span>{renderStars(app.rating)}</span><span style={{ color: "var(--clr-text-4)" }}>{app.rating.toFixed(1)}{app.review_count ? ` • ${app.review_count.toLocaleString()} reviews` : ""}</span></div>)}
                      {(app.claude_what || app.claude_different || app.claude_missing) ? (
                        <div style={{ fontSize: "0.75rem", color: "var(--clr-text-4)", marginTop: "0.375rem", fontStyle: "italic", display: "flex", alignItems: "flex-start", gap: "0.25rem" }}>
                          <span style={{ flexShrink: 0 }}>💡</span>
                          <span>{app.claude_what} ✦ Different: {app.claude_different} ✦ Missing: {app.claude_missing}</span>
                        </div>
                      ) : (<div style={{ fontSize: "0.75rem", color: "var(--clr-text-4)", marginTop: "0.375rem", fontStyle: "italic", opacity: 0.5 }}>Analyzing...</div>)}
                    </div>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: "var(--clr-text-4)", marginTop: 4 }}><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <style>{`
        @keyframes livePulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}
