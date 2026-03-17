"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

interface Signal {
  source: string; sourceLabel: string; emoji: string;
  title: string; subtitle: string; signal: string; url: string; timestamp: string;
  movementType?: string; prevRank?: number; newRank?: number; rankChange?: number;
  imageUrl?: string; topics?: string[]; tagline?: string; makerName?: string;
  externalUrl?: string; claudeGap?: string; rating?: number; reviewCount?: number;
  votesCount?: number; isLive?: boolean;
}
interface PHAnalysis { name: string; what: string; different: string; missing: string; }
interface AppStoreApp {
  id: number; app_id: string; app_name: string; developer: string; category: string;
  description: string; icon_url: string; store_url: string; price: string;
  release_date: string; first_seen_at: string; rating: number | null; review_count: number;
  claude_what: string | null; claude_different: string | null; claude_missing: string | null;
}

const TOPIC_COLORS = ["#6366f1","#06b6d4","#f59e0b","#ec4899","#22c55e","#8b5cf6","#f97316","#14b8a6"];
const MOVEMENT_COLORS: Record<string, string> = {
  rank_jump: "#22c55e", new_entry: "#3b82f6", review_spike: "#f59e0b",
  top_mover: "#8b5cf6", weekly_mover: "#06b6d4", monthly_mover: "#ec4899"
};

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + "h ago";
  return Math.floor(hours / 24) + "d ago";
}
function renderStars(r: number): string {
  const full = Math.floor(r); const half = r - full >= 0.5 ? 1 : 0;
  return "\u2605".repeat(full) + (half ? "\u00BD" : "") + "\u2606".repeat(5 - full - half);
}
function parseClaudeGap(gap: string | undefined): { what: string; different: string; missing: string } | null {
  if (!gap) return null;
  const parts = gap.split("\u2726").map(s => s.trim());
  if (parts.length < 3) return null;
  const what = parts[0].replace(/^What:\s*/i, "").trim();
  const different = parts[1].replace(/^Different:\s*/i, "").trim();
  const missing = parts[2].replace(/^Missing:\s*/i, "").trim();
  return { what, different, missing };
}

export default function PulsePage() {
  const [activeTab, setActiveTab] = useState<"ph" | "appstore">("ph");
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMovementData, setHasMovementData] = useState(false);
  const analyzingRef = useRef(false);
  const [asApps, setAsApps] = useState<AppStoreApp[]>([]);
  const [asLoading, setAsLoading] = useState(false);
  const [asGeneratedAt, setAsGeneratedAt] = useState<string | null>(null);
  const [asFilter, setAsFilter] = useState("all");
  const [phTopicFilter, setPhTopicFilter] = useState("all");
  const [isDark, setIsDark] = useState(true);

  // Dark/light mode
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const dark = stored ? stored === "dark" : true;
    setIsDark(dark);
    document.documentElement.classList.toggle("light", !dark);
  }, []);
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("light", !next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const analyzeNewPHSignals = useCallback(async (sigs: Signal[]) => {
    if (analyzingRef.current) return;
    const unanalyzed = sigs.filter((s) => s.source === "producthunt" && !s.claudeGap);
    if (unanalyzed.length === 0) return;
    analyzingRef.current = true; setAnalyzing(true);
    try {
      const res = await fetch("/api/pulse/analyze-ph", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ signals: unanalyzed }) });
      if (!res.ok) return;
      const data = await res.json();
      const analyses: PHAnalysis[] = data.analyses ?? [];
      if (!analyses.length) return;
      const gapMap = new Map<string, string>();
      for (const a of analyses) gapMap.set(a.name?.trim().toLowerCase(), a.what + " \u2726 Different: " + a.different + " \u2726 Missing: " + a.missing);
      setSignals((prev) => prev.map((s) => {
        if (s.source !== "producthunt" || s.claudeGap) return s;
        const g = gapMap.get(s.title?.trim().toLowerCase());
        return g ? { ...s, claudeGap: g } : s;
      }));
      await fetch("/api/pulse", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ updates: Array.from(gapMap.entries()).map(([name, claudeGap]) => ({ name, claudeGap })) }) }).catch(() => {});
    } catch { } finally { analyzingRef.current = false; setAnalyzing(false); }
  }, []);

  const fetchSignals = useCallback(async () => {
    try {
      const res = await fetch("/api/pulse"); const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      const fetched: Signal[] = data.signals ?? [];
      setSignals(fetched); setHasMovementData(data.hasMovementData ?? false); setError(null);
      analyzeNewPHSignals(fetched);
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); } finally { setLoading(false); }
  }, [analyzeNewPHSignals]);

  useEffect(() => { fetchSignals(); const t = setInterval(fetchSignals, 3600000); return () => clearInterval(t); }, [fetchSignals]);

  const fetchAppStore = useCallback(async () => {
    setAsLoading(true);
    try { const res = await fetch("/api/pulse/appstore"); const data = await res.json(); setAsApps(data.apps ?? []); setAsGeneratedAt(data.generatedAt ?? null); } catch { } finally { setAsLoading(false); }
  }, []);
  useEffect(() => { if (activeTab === "appstore" && asApps.length === 0) fetchAppStore(); }, [activeTab, asApps.length, fetchAppStore]);

  // Get all unique topics from PH signals
  const phSignals = signals.filter(s => s.source === "producthunt");
  const allTopics = Array.from(new Set(phSignals.flatMap(s => s.topics || []))).sort();
  const filteredPH = phTopicFilter === "all" ? phSignals : phSignals.filter(s => s.topics?.includes(phTopicFilter));

  const AS_CATS = ["all","Business","Productivity","Finance","Health & Fitness","Education","Utilities","Developer Tools","Social Networking"];

  return (
    <div style={{ minHeight: "100vh", background: "var(--clr-bg)", color: "var(--clr-text)" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid var(--clr-border)", backdropFilter: "blur(16px)", background: "var(--clr-bg)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 2rem", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <svg width="20" height="20" viewBox="0 0 19 19" fill="none"><path d="M2.5 5.5h14M2.5 9.5h10M2.5 13.5h6" stroke="var(--clr-accent)" strokeWidth="2" strokeLinecap="round" /></svg>
              <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--clr-text)", letterSpacing: "-0.02em" }}>Unbuilt</span>
            </Link>
            <span style={{ marginLeft: "0.5rem", fontSize: "0.875rem", color: "var(--clr-text-3)" }}>/ Pulse</span>
          </div>
          {/* Dark/Light toggle */}
          <button onClick={toggleTheme} style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 8, padding: "0.375rem 0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: "0.8125rem", color: "var(--clr-text-3)", transition: "all 0.15s" }}>
            {isDark ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
            {isDark ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid var(--clr-border)", background: "var(--clr-bg)", position: "sticky", top: 56, zIndex: 40 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 2rem", display: "flex" }}>
          {([{ id: "ph" as const, label: "Product Hunt", color: "#DA552F" }, { id: "appstore" as const, label: "App Store", color: "#007AFF" }]).map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: "none", border: "none", borderBottom: activeTab === tab.id ? "2px solid " + tab.color : "2px solid transparent", padding: "0.75rem 1.25rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: activeTab === tab.id ? 600 : 400, color: activeTab === tab.id ? tab.color : "var(--clr-text-3)", transition: "color 0.15s, border-color 0.15s", letterSpacing: "-0.01em" }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 2rem 4rem" }}>

        {/* ─── PRODUCT HUNT TAB ─── */}
        {activeTab === "ph" && (
          <div>
            {/* Title row */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>Product Hunt</h1>
                {!loading && (hasMovementData
                  ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.625rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: 999, background: "rgba(34,197,94,0.12)", color: "#22c55e", letterSpacing: "0.05em" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "livePulse 2s ease-in-out infinite" }} />LIVE</span>
                  : <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.625rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: 999, background: "rgba(251,191,36,0.12)", color: "#fbbf24", letterSpacing: "0.05em" }}>INITIALIZING</span>
                )}
              </div>
              <p style={{ color: "var(--clr-text-3)", fontSize: "0.875rem", margin: "0 0 0.75rem" }}>
                {hasMovementData ? `${phSignals.length} products tracked — upvotes updated hourly` : "Collecting first snapshot — movement detection starts next hour"}
              </p>
              {analyzing && <p style={{ color: "var(--clr-text-4)", fontSize: "0.75rem", margin: "0 0 0.75rem", display: "flex", alignItems: "center", gap: 4 }}><span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#DA552F", animation: "livePulse 1.5s ease-in-out infinite" }} />Analyzing new products...</p>}

              {/* Topic filters */}
              {allTopics.length > 0 && (
                <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                  {["all", ...allTopics.slice(0, 12)].map((t) => (
                    <button key={t} onClick={() => setPhTopicFilter(t)} style={{ background: phTopicFilter === t ? "rgba(218,85,47,0.12)" : "var(--clr-surface)", border: phTopicFilter === t ? "1px solid rgba(218,85,47,0.35)" : "1px solid var(--clr-border)", color: phTopicFilter === t ? "#DA552F" : "var(--clr-text-3)", borderRadius: 999, padding: "0.25rem 0.75rem", fontSize: "0.75rem", fontWeight: phTopicFilter === t ? 600 : 400, cursor: "pointer", transition: "all 0.15s" }}>
                      {t === "all" ? "All" : t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Loading skeletons */}
            {loading && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {[1,2,3,4,5].map((i) => (
                  <div key={i} style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 12, padding: "1.25rem", animation: "shimmerPulse 1.5s ease-in-out infinite", animationDelay: i * 0.1 + "s" }}>
                    <div style={{ display: "flex", gap: "1rem" }}>
                      <div style={{ width: 64, height: 64, borderRadius: 14, background: "var(--clr-border)", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ width: "50%", height: 16, borderRadius: 6, background: "var(--clr-border)", marginBottom: 8 }} />
                        <div style={{ width: "30%", height: 12, borderRadius: 6, background: "var(--clr-border)", marginBottom: 12 }} />
                        <div style={{ width: "80%", height: 12, borderRadius: 6, background: "var(--clr-border)" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && !loading && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "1rem 1.25rem", color: "#ef4444", fontSize: "0.875rem" }}>{error}</div>}
            {!loading && !error && filteredPH.length === 0 && <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--clr-text-3)" }}>No products found.</div>}

            {!loading && filteredPH.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {filteredPH.map((s, i) => {
                  const mc = MOVEMENT_COLORS[s.movementType ?? ""] ?? undefined;
                  const gap = parseClaudeGap(s.claudeGap);
                  const votes = s.votesCount ?? parseInt(s.subtitle?.match(/^(\d+)/)?.[1] ?? "0");
                  const isLive = s.isLive !== false; // default true for backward compat

                  return (
                    <a key={s.source + i} href={s.externalUrl || s.url} target="_blank" rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "1.25rem 1.25rem", background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderLeft: mc ? "3px solid " + mc : "1px solid var(--clr-border)", borderRadius: 12, textDecoration: "none", color: "inherit", transition: "border-color 0.15s, background 0.15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--clr-border-3)"; e.currentTarget.style.background = "rgba(var(--clr-text-rgb),0.02)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = mc ? mc : "var(--clr-border)"; e.currentTarget.style.background = "var(--clr-surface)"; }}>

                      {/* App icon */}
                      {s.imageUrl
                        ? <img src={s.imageUrl} alt="" width={64} height={64} style={{ borderRadius: 14, flexShrink: 0, objectFit: "cover", border: "1px solid var(--clr-border)" }} />
                        : <div style={{ width: 64, height: 64, borderRadius: 14, background: "var(--clr-border)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem" }}>{s.emoji}</div>
                      }

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>

                        {/* Top row: title + time + live/frozen badge */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "1rem", fontWeight: 650, color: "var(--clr-text)", letterSpacing: "-0.02em" }}>{s.title}</span>
                          {s.movementType && s.movementType !== "trending" && s.movementType !== "ph_trending" && (
                            <span style={{ fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", padding: "0.1rem 0.4rem", borderRadius: 999, background: (mc ?? "") + "20", color: mc }}>
                              {s.movementType === "rank_jump" ? "RANK JUMP" : s.movementType === "new_entry" ? "NEW ENTRY" : s.movementType === "review_spike" ? "REVIEW SPIKE" : s.movementType === "top_mover" ? "TOP MOVER" : s.movementType === "weekly_mover" ? "WEEKLY" : "MONTHLY"}
                            </span>
                          )}
                          <span style={{ fontSize: "0.6875rem", color: "var(--clr-text-4)", marginLeft: "auto" }}>{relativeTime(s.timestamp)}</span>
                        </div>

                        {/* Tagline */}
                        {s.tagline && <p style={{ fontSize: "0.875rem", color: "var(--clr-text-3)", margin: "0 0 0.5rem", lineHeight: 1.45 }}>{s.tagline}</p>}

                        {/* Upvotes row */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(218,85,47,0.1)", border: "1px solid rgba(218,85,47,0.2)", borderRadius: 8, padding: "0.25rem 0.625rem" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="#DA552F"><path d="M12 4l8 8H4z"/></svg>
                            <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#DA552F" }}>{votes.toLocaleString()}</span>
                            <span style={{ fontSize: "0.75rem", color: "rgba(218,85,47,0.7)", fontWeight: 500 }}>upvotes</span>
                          </div>
                          {isLive
                            ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.625rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: 999, background: "rgba(34,197,94,0.1)", color: "#22c55e", letterSpacing: "0.04em" }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "livePulse 2s ease-in-out infinite" }} />LIVE</span>
                            : <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.625rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: 999, background: "rgba(148,163,184,0.1)", color: "var(--clr-text-4)", letterSpacing: "0.04em" }}>❄ FROZEN</span>
                          }
                        </div>

                        {/* Topics */}
                        {s.topics && s.topics.length > 0 && (
                          <div style={{ display: "flex", gap: "0.25rem", marginBottom: "0.625rem", flexWrap: "wrap" }}>
                            {s.topics.map((t, ti) => (
                              <span key={t} style={{ fontSize: "0.625rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: 999, background: TOPIC_COLORS[ti % TOPIC_COLORS.length] + "18", color: TOPIC_COLORS[ti % TOPIC_COLORS.length], letterSpacing: "0.02em" }}>{t}</span>
                            ))}
                          </div>
                        )}

                        {/* AI Analysis */}
                        {gap ? (
                          <div style={{ background: "rgba(var(--clr-text-rgb),0.03)", border: "1px solid var(--clr-border)", borderRadius: 10, padding: "0.75rem 1rem", marginTop: "0.25rem" }}>
                            <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--clr-text-4)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: 5 }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                              AI Analysis
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                              <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                                <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#6366f1", background: "rgba(99,102,241,0.12)", padding: "0.1rem 0.45rem", borderRadius: 5, flexShrink: 0, marginTop: 1 }}>WHAT</span>
                                <span style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", lineHeight: 1.5 }}>{gap.what}</span>
                              </div>
                              <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                                <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#06b6d4", background: "rgba(6,182,212,0.12)", padding: "0.1rem 0.35rem", borderRadius: 5, flexShrink: 0, marginTop: 1 }}>DIFF</span>
                                <span style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", lineHeight: 1.5 }}>{gap.different}</span>
                              </div>
                              <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                                <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#f59e0b", background: "rgba(245,158,11,0.12)", padding: "0.1rem 0.3rem", borderRadius: 5, flexShrink: 0, marginTop: 1 }}>GAP</span>
                                <span style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", lineHeight: 1.5 }}>{gap.missing}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: "0.75rem", color: "var(--clr-text-4)", fontStyle: "italic", opacity: 0.6, marginTop: "0.25rem", display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "var(--clr-text-4)", animation: "livePulse 1.5s ease-in-out infinite" }} />Analyzing...
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: "var(--clr-text-4)", marginTop: 4, alignSelf: "center" }}><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── APP STORE TAB ─── */}
        {activeTab === "appstore" && (
          <div>
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>New & Rising</h1>
                <span style={{ fontSize: "0.625rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: 999, background: "rgba(0,122,255,0.12)", color: "#007AFF", letterSpacing: "0.05em" }}>APP STORE</span>
              </div>
              <p style={{ color: "var(--clr-text-3)", fontSize: "0.875rem", margin: "0 0 0.75rem" }}>New apps from the last 90 days</p>
              {asGeneratedAt && <p style={{ color: "var(--clr-text-4)", fontSize: "0.75rem", margin: "0 0 0.75rem" }}>Updated {relativeTime(asGeneratedAt)}</p>}
              <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                {AS_CATS.map((cat) => (
                  <button key={cat} onClick={() => setAsFilter(cat)} style={{ background: asFilter === cat ? "rgba(0,122,255,0.12)" : "var(--clr-surface)", border: asFilter === cat ? "1px solid rgba(0,122,255,0.3)" : "1px solid var(--clr-border)", color: asFilter === cat ? "#007AFF" : "var(--clr-text-3)", borderRadius: 999, padding: "0.25rem 0.75rem", fontSize: "0.75rem", fontWeight: asFilter === cat ? 600 : 400, cursor: "pointer", transition: "all 0.15s" }}>
                    {cat === "all" ? "All" : cat}
                  </button>
                ))}
              </div>
            </div>

            {asLoading && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {[1,2,3,4,5].map((i) => (
                  <div key={i} style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 12, padding: "1.25rem", animation: "shimmerPulse 1.5s ease-in-out infinite", animationDelay: i * 0.1 + "s" }}>
                    <div style={{ display: "flex", gap: "1rem" }}>
                      <div style={{ width: 64, height: 64, borderRadius: 14, background: "var(--clr-border)", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ width: "50%", height: 16, borderRadius: 6, background: "var(--clr-border)", marginBottom: 8 }} />
                        <div style={{ width: "80%", height: 12, borderRadius: 6, background: "var(--clr-border)" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!asLoading && asApps.length === 0 && (
              <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--clr-text-3)" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>\uD83D\uDD04</div>
                <div style={{ fontWeight: 600, marginBottom: "0.375rem" }}>Data collection started</div>
                <div style={{ fontSize: "0.875rem" }}>Check back tomorrow.</div>
              </div>
            )}
            {!asLoading && asApps.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {asApps.filter((app) => asFilter === "all" || app.category === asFilter).map((app) => {
                  const hasAnalysis = app.claude_what || app.claude_different || app.claude_missing;
                  return (
                    <a key={app.app_id} href={app.store_url} target="_blank" rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "1.25rem", background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderLeft: "3px solid #007AFF", borderRadius: 12, textDecoration: "none", color: "inherit", transition: "border-color 0.15s, background 0.15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(var(--clr-text-rgb),0.02)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "var(--clr-surface)"; }}>
                      {app.icon_url
                        ? <img src={app.icon_url} alt="" width={64} height={64} style={{ borderRadius: 14, flexShrink: 0, objectFit: "cover", border: "1px solid var(--clr-border)" }} />
                        : <div style={{ width: 64, height: 64, borderRadius: 14, background: "var(--clr-border)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem" }}>\uD83D\uDCF1</div>
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "1rem", fontWeight: 650, color: "var(--clr-text)", letterSpacing: "-0.02em" }}>{app.app_name}</span>
                          {app.category && <span style={{ fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", padding: "0.1rem 0.4rem", borderRadius: 999, background: "rgba(99,102,241,0.12)", color: "#6366f1" }}>{app.category}</span>}
                          {app.price && app.price !== "Free" && <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#22c55e" }}>{app.price}</span>}
                          <span style={{ fontSize: "0.6875rem", color: "var(--clr-text-4)", marginLeft: "auto" }}>{relativeTime(app.first_seen_at)}</span>
                        </div>
                        {app.rating != null && (
                          <div style={{ fontSize: "0.8125rem", color: "#f59e0b", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                            <span>{renderStars(app.rating)}</span>
                            <span style={{ color: "var(--clr-text-3)", fontSize: "0.75rem" }}>{app.rating.toFixed(1)}{app.review_count ? " \u2022 " + app.review_count.toLocaleString() + " reviews" : ""}</span>
                          </div>
                        )}
                        {hasAnalysis ? (
                          <div style={{ background: "rgba(var(--clr-text-rgb),0.03)", border: "1px solid var(--clr-border)", borderRadius: 10, padding: "0.75rem 1rem", marginTop: "0.25rem" }}>
                            <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--clr-text-4)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: 5 }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                              AI Analysis
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                              {app.claude_what && <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}><span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#6366f1", background: "rgba(99,102,241,0.12)", padding: "0.1rem 0.45rem", borderRadius: 5, flexShrink: 0, marginTop: 1 }}>WHAT</span><span style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", lineHeight: 1.5 }}>{app.claude_what}</span></div>}
                              {app.claude_different && <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}><span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#06b6d4", background: "rgba(6,182,212,0.12)", padding: "0.1rem 0.35rem", borderRadius: 5, flexShrink: 0, marginTop: 1 }}>DIFF</span><span style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", lineHeight: 1.5 }}>{app.claude_different}</span></div>}
                              {app.claude_missing && <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}><span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#f59e0b", background: "rgba(245,158,11,0.12)", padding: "0.1rem 0.3rem", borderRadius: 5, flexShrink: 0, marginTop: 1 }}>GAP</span><span style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", lineHeight: 1.5 }}>{app.claude_missing}</span></div>}
                            </div>
                          </div>
                        ) : <div style={{ fontSize: "0.75rem", color: "var(--clr-text-4)", fontStyle: "italic", opacity: 0.6, marginTop: "0.25rem" }}>Analyzing...</div>}
                      </div>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: "var(--clr-text-4)", alignSelf: "center" }}><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        @keyframes livePulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }
        @keyframes shimmerPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
                        }
