"use client";
import { useState, useEffect, useRef } from "react";

const SOURCES = [
  { name: "App Store", icon: "📱", color: "#007AFF" },
  { name: "Google Play", icon: "🤖", color: "#34A853" },
  { name: "Reddit", icon: "💬", color: "#FF4500" },
  { name: "Product Hunt", icon: "🚀", color: "#DA552F" },
  { name: "X / Twitter", icon: "𝕏", color: "#1DA1F2" },
  { name: "YouTube", icon: "▶️", color: "#FF0000" },
  { name: "Crunchbase", icon: "💰", color: "#0288D1" },
  { name: "LinkedIn", icon: "🔗", color: "#0A66C2" },
  { name: "G2 Reviews", icon: "⭐", color: "#FF492C" },
  { name: "Trustpilot", icon: "🟢", color: "#00B67A" },
  { name: "Hacker News", icon: "🟧", color: "#FF6600" },
  { name: "Stack Overflow", icon: "📚", color: "#F58025" },
  { name: "GitHub", icon: "🐙", color: "#333" },
  { name: "SimilarWeb", icon: "🌐", color: "#1B2A4A" },
  { name: "Statista", icon: "📊", color: "#1A3C6E" },
  { name: "TechCrunch", icon: "📰", color: "#0A0" },
  { name: "Indie Hackers", icon: "🛠", color: "#1F2937" },
  { name: "Capterra", icon: "🔍", color: "#FF9800" },
];

const FUNNY_MSGS = [
  "Claude is reading 47 Reddit posts right now. You could not have done this yourself.",
  "Your competitors skipped this research. You didn't. Smart move.",
  "134 apps found so far. Most are terrible. We'll tell you which.",
  "Scanning App Store reviews... people are angry about a lot of things.",
  "Found 6 competitors. 4 have terrible UX. Noting that for you.",
  "Reading 1-star reviews. They're basically your product roadmap.",
  "This is the part where ChatGPT would just say 'Great idea!' We won't.",
  "Cross-referencing Reddit complaints with App Store gaps...",
  "3 months of research, compressed into 4 minutes. You're welcome.",
  "If you leave now, you'll never know if your idea is a goldmine or a graveyard.",
  "Fun fact: 92% of ideas we scan already have competitors. Yours probably too.",
  "The AI is thinking harder than you think. Extended thinking mode: ON.",
  "Would you rather spend $5K and 3 months to learn this? Didn't think so.",
  "Analyzing market gaps... found something interesting. Hang tight.",
  "We're basically doing the work of a $200/hr consultant. For free. Almost done.",
];

const PHASES = [
  { label: "Gathering data", range: [0, 20] },
  { label: "Analyzing competitors", range: [20, 45] },
  { label: "Finding market gaps", range: [45, 65] },
  { label: "Scoring your idea", range: [65, 85] },
  { label: "Writing your report", range: [85, 100] },
];

export default function ScanningOverlay({ idea, isStack, scanStep, maxStep }: { idea: string; isStack: boolean; scanStep: number; maxStep: number }) {
  const [elapsed, setElapsed] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [litSources, setLitSources] = useState<number[]>([]);
  const startRef = useRef(Date.now());

  // Timer
  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  // Rotate messages
  useEffect(() => {
    const t = setInterval(() => setMsgIdx(p => (p + 1) % FUNNY_MSGS.length), 4500);
    return () => clearInterval(t);
  }, []);

  // Light up sources one by one
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    SOURCES.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setLitSources(p => [...p, i]);
      }, 800 + i * 700 + Math.random() * 400));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  const progress = maxStep > 0 ? Math.min(((scanStep + 1) / (maxStep + 1)) * 100, 100) : 0;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const phase = PHASES.find(p => progress >= p.range[0] && progress < p.range[1]) || PHASES[PHASES.length - 1];

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", minHeight: "70vh" }}>
      <style>{`
        @keyframes so-fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes so-pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes so-glow { 0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); } 50% { box-shadow: 0 0 20px 4px rgba(99,102,241,0.15); } }
        @keyframes so-scan-line { 0% { top: 0; } 100% { top: 100%; } }
        @keyframes so-spin { to { transform: rotate(360deg); } }
        @keyframes so-msg { 0% { opacity: 0; transform: translateY(8px); } 15% { opacity: 1; transform: translateY(0); } 85% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-8px); } }
        @keyframes so-dot-pulse { 0%,80%,100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }
        @keyframes so-bar { from { width: 0; } }
        @keyframes so-source-in { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        .so-source-lit { animation: so-source-in 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 520, animation: "so-fade-in 0.5s ease" }}>

        {/* Time & Progress header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 999, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", marginBottom: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", animation: "so-pulse 1.5s ease-in-out infinite" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6366f1" }}>Analysis in progress</span>
          </div>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111", letterSpacing: "-0.03em", marginBottom: 6 }}>
            {isStack ? "Building your stack..." : "Scanning the market..."}
          </h2>
          <p style={{ fontSize: "0.8125rem", color: "#9ca3af", marginBottom: 4, lineHeight: 1.4, maxWidth: 360, margin: "0 auto" }}>
            &ldquo;{idea.length > 60 ? idea.slice(0, 60) + "…" : idea}&rdquo;
          </p>
        </div>

        {/* Time display */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#6b7280" }}>{phase.label}</span>
            <div style={{ display: "flex", gap: 3 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "#6366f1", animation: `so-dot-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111", fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em" }}>{timeStr}</span>
            <span style={{ fontSize: "0.625rem", color: "#9ca3af" }}>/ ~4 min</span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, background: "#f3f4f6", borderRadius: 3, overflow: "hidden", marginBottom: 28 }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg, #6366f1, #a855f7, #6366f1)", backgroundSize: "200% 100%", borderRadius: 3, width: `${Math.max(progress, 3)}%`, transition: "width 1.5s cubic-bezier(0.16,1,0.3,1)", animation: "so-bar 0.8s ease" }} />
        </div>

        {/* Sources grid */}
        <div style={{ background: "#fafafa", borderRadius: 14, border: "1px solid #e5e7eb", padding: "16px 14px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
          <div style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 12 }}>
            SOURCES ({litSources.length}/{SOURCES.length}+)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            {SOURCES.map((s, i) => {
              const isLit = litSources.includes(i);
              return (
                <div key={i} className={isLit ? "so-source-lit" : ""} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "6px 8px",
                  borderRadius: 8, background: isLit ? "#fff" : "#f3f4f6",
                  border: isLit ? "1px solid #e5e7eb" : "1px solid transparent",
                  opacity: isLit ? 1 : 0.25,
                  transition: "opacity 0.3s, background 0.3s",
                }}>
                  <span style={{ fontSize: "0.875rem" }}>{s.icon}</span>
                  <span style={{ fontSize: "0.625rem", fontWeight: 600, color: isLit ? "#111" : "#9ca3af", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</span>
                  {isLit && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: "center", marginTop: 10, fontSize: "0.625rem", color: "#9ca3af" }}>
            + 52 more sources running in background
          </div>
        </div>

        {/* Funny message */}
        <div style={{ textAlign: "center", minHeight: 48, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <p key={msgIdx} style={{ fontSize: "0.8125rem", color: "#6b7280", lineHeight: 1.5, maxWidth: 400, fontStyle: "italic", animation: "so-msg 4.5s ease" }}>
            &ldquo;{FUNNY_MSGS[msgIdx]}&rdquo;
          </p>
        </div>

        {/* Don't leave warning */}
        <div style={{ textAlign: "center", padding: "12px 16px", borderRadius: 10, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#d97706", marginBottom: 2 }}>
            ☕ Grab a coffee — this takes ~4 minutes
          </div>
          <div style={{ fontSize: "0.6875rem", color: "#92400e" }}>
            Claude Opus is processing 70+ live sources with extended thinking. Don&apos;t close this tab.
          </div>
        </div>
      </div>
    </div>
  );
}
