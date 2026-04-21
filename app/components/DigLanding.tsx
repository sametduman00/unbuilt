"use client";
import { useEffect, useRef } from "react";

export default function DigLanding({ onDigClick }: { onDigClick: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const els = rootRef.current.querySelectorAll("[data-a]");
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { (e.target as HTMLElement).classList.add("dl-vis"); io.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div ref={rootRef}>
      <style>{`
        .dl-vis { --dl-on: 1; }
        [data-a] { opacity: 0; transform: translateY(40px); transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1); }
        [data-a].dl-vis { opacity: 1; transform: translateY(0); }
        [data-a="left"] { transform: translateX(-60px) translateY(0); opacity: 0; }
        [data-a="left"].dl-vis { transform: translateX(0); opacity: 1; }
        [data-a="right"] { transform: translateX(60px) translateY(0); opacity: 0; }
        [data-a="right"].dl-vis { transform: translateX(0); opacity: 1; }
        [data-a="scale"] { transform: scale(0.85); opacity: 0; }
        [data-a="scale"].dl-vis { transform: scale(1); opacity: 1; }
        [data-d="1"] { transition-delay: 0.1s; }
        [data-d="2"] { transition-delay: 0.2s; }
        [data-d="3"] { transition-delay: 0.3s; }
        [data-d="4"] { transition-delay: 0.4s; }
        [data-d="5"] { transition-delay: 0.5s; }
        [data-d="6"] { transition-delay: 0.6s; }

        @keyframes dl-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .dl-marquee { display: flex; gap: 32px; animation: dl-marquee 25s linear infinite; width: max-content; }
        .dl-marquee:hover { animation-play-state: paused; }

        @keyframes dl-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        .dl-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; animation: dl-pulse 2s ease-in-out infinite; }

        @keyframes dl-count { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        @keyframes dl-bar-fill { from { width: 0; } }
        .dl-bar.dl-vis .dl-bar-inner { animation: dl-bar-fill 1.2s cubic-bezier(0.16,1,0.3,1) forwards; }

        @keyframes dl-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .dl-float { animation: dl-float 3s ease-in-out infinite; }
        .dl-float-d { animation: dl-float 3s ease-in-out 1s infinite; }

        .dl-gradient-text {
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .dl-section { padding: 5rem 1.5rem; max-width: 780px; margin: 0 auto; }
        .dl-ticker-wrap { overflow: hidden; padding: 1rem 0; border-top: 1px solid rgba(0,0,0,0.06); border-bottom: 1px solid rgba(0,0,0,0.06); }
        .dl-sticky-text { font-size: clamp(2.5rem, 5vw, 3.5rem); font-weight: 700; letter-spacing: -0.04em; line-height: 1.1; }
      `}</style>

      {/* ── SECTION 1: THE GRAVEYARD ── */}
      <div className="dl-section" style={{ textAlign: "center", paddingTop: "4rem" }}>
        <div data-a="" style={{ marginBottom: 16 }}>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6366f1" }}>
            THE PROBLEM
          </span>
        </div>
        <h2 data-a="" data-d="1" className="dl-sticky-text" style={{ marginBottom: 20 }}>
          Most apps die because<br/>
          <span className="dl-gradient-text">nobody checked the market.</span>
        </h2>
        <p data-a="" data-d="2" style={{ fontSize: "1.0625rem", color: "#6b7280", lineHeight: 1.7, maxWidth: 520, margin: "0 auto 3rem" }}>
          You had the idea. You built for 3 months. You launched to silence.<br/>
          Turns out, 6 apps already did this. Better. With funding.
        </p>

        {/* Ghost counter */}
        <div data-a="scale" data-d="3" style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "14px 28px", borderRadius: 999, background: "#fef2f2", border: "1px solid #fecaca" }}>
          <span style={{ fontSize: "2rem", fontWeight: 800, color: "#dc2626" }}>92%</span>
          <span style={{ fontSize: "0.875rem", color: "#991b1b", textAlign: "left", lineHeight: 1.3 }}>of ideas we scanned<br/><strong>already had competitors</strong></span>
        </div>
      </div>

      {/* ── FAILED IDEAS TICKER ── */}
      <div className="dl-ticker-wrap" data-a="" style={{ marginBottom: 0, background: "#fafafa" }}>
        <div className="dl-marquee">
          {[
            "\"Simple todo app\" → 259K reviews on Microsoft To Do",
            "\"AI writing tool\" → 40+ funded competitors",
            "\"Expense tracker\" → Apple built it natively",
            "\"Social media scheduler\" → Buffer raised $75M",
            "\"Habit tracker\" → 200+ apps in App Store",
            "\"Recipe app\" → Tasty has 100M downloads",
            "\"Fitness tracker\" → Apple Watch killed this",
            "\"Note-taking app\" → Notion valued at $10B",
            "\"Simple todo app\" → 259K reviews on Microsoft To Do",
            "\"AI writing tool\" → 40+ funded competitors",
            "\"Expense tracker\" → Apple built it natively",
            "\"Social media scheduler\" → Buffer raised $75M",
            "\"Habit tracker\" → 200+ apps in App Store",
            "\"Recipe app\" → Tasty has 100M downloads",
            "\"Fitness tracker\" → Apple Watch killed this",
            "\"Note-taking app\" → Notion valued at $10B",
          ].map((t, i) => (
            <span key={i} style={{ fontSize: "0.8125rem", color: "#9ca3af", whiteSpace: "nowrap", fontWeight: 500 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* ── SECTION 2: TIME SAVED ── */}
      <div className="dl-section" style={{ textAlign: "center" }}>
        <div data-a="">
          <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6366f1" }}>
            BEFORE DIG
          </span>
        </div>
        <h2 data-a="" data-d="1" className="dl-sticky-text" style={{ marginBottom: 40 }}>
          47 hours of tabs.<br/>Or type one sentence.
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 640, margin: "0 auto" }}>
          {/* Without */}
          <div data-a="left" style={{ textAlign: "left", padding: 24, borderRadius: 16, background: "#fafafa", border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 16 }}>WITHOUT DIG</div>
            {["Search App Store manually", "Browse Product Hunt for hours", "Read 50 Reddit threads", "Check Crunchbase one by one", "Build a spreadsheet", "Hope you didn't miss anything"].map((t, i) => (
              <div key={i} data-a="" data-d={String(i + 1)} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: "0.8125rem", color: "#6b7280" }}>
                <span style={{ color: "#d1d5db" }}>—</span> {t}
              </div>
            ))}
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #e5e7eb", textAlign: "center" }}>
              <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "#ef4444" }}>~47 hours</span>
              <div style={{ fontSize: "0.6875rem", color: "#9ca3af", marginTop: 2 }}>and you still missed things</div>
            </div>
          </div>

          {/* With */}
          <div data-a="right" style={{ textAlign: "left", padding: 24, borderRadius: 16, background: "#f0fdf4", border: "2px solid #86efac" }}>
            <div style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#16a34a", marginBottom: 16 }}>WITH DIG</div>
            {["12 competitors with funding data", "Reddit pain points extracted", "App Store ratings analyzed", "Market gaps identified", "Score: build, pivot, or skip", "Full PDF report"].map((t, i) => (
              <div key={i} data-a="" data-d={String(i + 1)} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: "0.8125rem", color: "#14532d", fontWeight: 500 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg> {t}
              </div>
            ))}
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #86efac", textAlign: "center" }}>
              <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "#16a34a" }}>~2 min</span>
              <div style={{ fontSize: "0.6875rem", color: "#15803d", marginTop: 2 }}>nothing missed</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: LIVE SOURCES ── */}
      <div style={{ padding: "5rem 1.5rem", background: "#111827", color: "#fff" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
          <div data-a="">
            <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#818cf8" }}>
              THE ENGINE
            </span>
          </div>
          <h2 data-a="" data-d="1" style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: 12 }}>
            70+ live sources.<br/>One click.
          </h2>
          <p data-a="" data-d="2" style={{ fontSize: "1rem", color: "#9ca3af", lineHeight: 1.7, maxWidth: 480, margin: "0 auto 3rem" }}>
            Dig doesn't guess. It reads real data from real platforms — in real time.
          </p>

          {/* Source grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, maxWidth: 560, margin: "0 auto" }}>
            {[
              { name: "App Store", count: "8 sources", color: "#3b82f6", icon: "📱" },
              { name: "Google Play", count: "8 sources", color: "#22c55e", icon: "🤖" },
              { name: "Reddit", count: "15 sources", color: "#f97316", icon: "💬" },
              { name: "Product Hunt", count: "5 sources", color: "#ef4444", icon: "🚀" },
              { name: "X / Twitter", count: "8 sources", color: "#60a5fa", icon: "𝕏" },
              { name: "YouTube", count: "6 sources", color: "#dc2626", icon: "▶" },
              { name: "Crunchbase", count: "4 sources", color: "#8b5cf6", icon: "💰" },
              { name: "LinkedIn", count: "3 sources", color: "#0ea5e9", icon: "🔗" },
              { name: "G2 & Reviews", count: "6 sources", color: "#f59e0b", icon: "⭐" },
            ].map((s, i) => (
              <div key={s.name} data-a="scale" data-d={String((i % 3) + 1)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "rgba(255,255,255,0.05)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ fontSize: "1.25rem" }}>{s.icon}</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: "0.5625rem", color: "#6b7280" }}>{s.count}</div>
                </div>
                <div className="dl-dot" style={{ marginLeft: "auto" }} />
              </div>
            ))}
          </div>

          <div data-a="" data-d="3" style={{ marginTop: 24, display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 8, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
            <span style={{ fontSize: "0.75rem", color: "#a5b4fc" }}>Powered by</span>
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#fff" }}>Claude Opus 4.6</span>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: HONESTY ── */}
      <div className="dl-section" style={{ textAlign: "center" }}>
        <div data-a="">
          <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6366f1" }}>
            HONEST SCORING
          </span>
        </div>
        <h2 data-a="" data-d="1" className="dl-sticky-text" style={{ marginBottom: 12 }}>
          We don't sugarcoat.
        </h2>
        <p data-a="" data-d="2" style={{ fontSize: "1.0625rem", color: "#6b7280", lineHeight: 1.7, maxWidth: 480, margin: "0 auto 3rem" }}>
          ChatGPT says "Great idea!" to everything. Dig gives you a score calibrated against 1,247 real analyses.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 600, margin: "0 auto" }}>
          <div data-a="left" style={{ background: "#fafafa", borderRadius: 14, padding: "20px 18px", textAlign: "left" }}>
            <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>ChatGPT / generic AI</div>
            {[
              { range: "80-100", w: "88%" },
              { range: "60-79", w: "36%" },
              { range: "40-59", w: "14%" },
              { range: "0-39", w: "4%" },
            ].map(b => (
              <div key={b.range} className="dl-bar" data-a="" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: "0.5625rem", color: "#9ca3af", width: 32, textAlign: "right" }}>{b.range}</span>
                <div style={{ flex: 1, height: 10, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                  <div className="dl-bar-inner" style={{ width: b.w, height: "100%", background: "#d4d4d4", borderRadius: 4 }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 10, fontSize: "0.75rem", color: "#9ca3af" }}>Median: <strong style={{ color: "#6b7280" }}>~82</strong></div>
            <div style={{ fontSize: "0.625rem", color: "#d1d5db", marginTop: 2 }}>Feels good. Means nothing.</div>
          </div>

          <div data-a="right" style={{ background: "#fff", borderRadius: 14, padding: "20px 18px", textAlign: "left", border: "2px solid #111" }}>
            <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#111", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>Unbuilt · 1,247 ideas</div>
            {[
              { range: "80-100", w: "2%", color: "#22c55e" },
              { range: "60-79", w: "9%", color: "#3b82f6" },
              { range: "40-59", w: "40%", color: "#f59e0b" },
              { range: "0-39", w: "93%", color: "#ef4444" },
            ].map(b => (
              <div key={b.range} className="dl-bar" data-a="" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: "0.5625rem", color: "#6b7280", width: 32, textAlign: "right" }}>{b.range}</span>
                <div style={{ flex: 1, height: 10, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                  <div className="dl-bar-inner" style={{ width: b.w, height: "100%", background: b.color, borderRadius: 4 }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 10, fontSize: "0.75rem", color: "#6b7280" }}>Median: <strong style={{ color: "#111" }}>~28</strong></div>
            <div style={{ fontSize: "0.625rem", color: "#6b7280", marginTop: 2 }}>Hurts. But it's real.</div>
          </div>
        </div>
      </div>

      {/* ── SECTION 5: WHAT'S IN A REPORT ── */}
      <div style={{ padding: "5rem 1.5rem", background: "#fafafa" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
          <div data-a="">
            <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6366f1" }}>
              THE REPORT
            </span>
          </div>
          <h2 data-a="" data-d="1" className="dl-sticky-text" style={{ marginBottom: 12 }}>
            Not a paragraph.<br/>A full playbook.
          </h2>
          <p data-a="" data-d="2" style={{ fontSize: "1.0625rem", color: "#6b7280", lineHeight: 1.7, maxWidth: 500, margin: "0 auto 3rem" }}>
            10 sections. Real data. Every claim linked to evidence.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, maxWidth: 620, margin: "0 auto" }}>
            {[
              { tab: "Overview", desc: "Market score, verdict, action plan", icon: "📊", accent: "#6366f1" },
              { tab: "Competitors", desc: "Funding, ratings, strengths, weaknesses", icon: "⚔️", accent: "#ef4444" },
              { tab: "Market Gaps", desc: "Where incumbents aren't looking", icon: "🎯", accent: "#22c55e" },
              { tab: "Pain Points", desc: "Real quotes from Reddit, X, YouTube", icon: "💬", accent: "#f59e0b" },
              { tab: "Go-to-Market", desc: "Channels, CAC, launch phases", icon: "🚀", accent: "#8b5cf6" },
              { tab: "Financials", desc: "MRR scenarios, burn rate, pricing", icon: "💰", accent: "#0ea5e9" },
              { tab: "Validation", desc: "Assumptions ranked by risk", icon: "✅", accent: "#10b981" },
              { tab: "Synthesis", desc: "Working for you + watch out", icon: "🧬", accent: "#ec4899" },
            ].map((t, i) => (
              <div key={t.tab} data-a="" data-d={String((i % 4) + 1)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", textAlign: "left" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: t.accent + "12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.125rem", flexShrink: 0 }}>{t.icon}</div>
                <div>
                  <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#111" }}>{t.tab}</div>
                  <div style={{ fontSize: "0.6875rem", color: "#9ca3af" }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 6: REAL INSIGHT EXAMPLES ── */}
      <div className="dl-section" style={{ textAlign: "center" }}>
        <div data-a="">
          <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6366f1" }}>
            REAL INSIGHTS
          </span>
        </div>
        <h2 data-a="" data-d="1" className="dl-sticky-text" style={{ marginBottom: 40 }}>
          The kind of intel<br/>you can't Google.
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 560, margin: "0 auto", textAlign: "left" }}>
          {[
            { label: "GAP FOUND", text: "No CRM-native meeting transcription exists. Fireflies and Otter don't integrate with HubSpot pipelines.", color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0" },
            { label: "THREAT FLAGGED", text: "Apple Reminders added sub-tasks, tags, and Smart Lists in 2024. Your floor competitor is free and pre-installed on 1.5B devices.", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
            { label: "PIVOT SUGGESTED", text: "Generic 'AI writing tool' scores 12. But 'AI proposal writer for freelance developers' has zero competition and validated demand on r/freelance.", color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe" },
          ].map((item, i) => (
            <div key={i} data-a={i === 0 ? "left" : i === 1 ? "right" : "left"} data-d={String(i + 1)} style={{ padding: "16px 20px", borderRadius: 12, background: item.bg, border: `1px solid ${item.border}` }}>
              <div style={{ fontSize: "0.5625rem", fontWeight: 800, letterSpacing: "0.1em", color: item.color, marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontSize: "0.875rem", color: "#111", lineHeight: 1.6, fontWeight: 500 }}>{item.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 7: STATS BAR ── */}
      <div style={{ padding: "3rem 1.5rem", borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb", background: "#fafafa" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          {[
            { num: "1,247", label: "Ideas scanned" },
            { num: "70+", label: "Live sources" },
            { num: "~2 min", label: "Per report" },
            { num: "10", label: "Report sections" },
          ].map((s, i) => (
            <div key={s.label} data-a="" data-d={String(i + 1)} style={{ padding: "16px 8px" }}>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#111" }}>{s.num}</div>
              <div style={{ fontSize: "0.6875rem", color: "#9ca3af", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 8: FINAL CTA ── */}
      <div style={{ padding: "5rem 1.5rem", textAlign: "center" }}>
        <div data-a="scale">
          <div style={{ padding: "4rem 2rem", borderRadius: 20, background: "#111827", maxWidth: 680, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.25rem)", fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", marginBottom: 8, lineHeight: 1.15 }}>
              Stop guessing.<br/>Start digging.
            </h2>
            <p style={{ fontSize: "0.9375rem", color: "#6b7280", marginBottom: 24, lineHeight: 1.6 }}>
              One sentence is enough. We'll tell you the truth.
            </p>
            <button
              onClick={onDigClick}
              style={{
                padding: "12px 32px", borderRadius: 12, background: "#6366f1", color: "#fff",
                fontSize: "1rem", fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 4px 24px rgba(99,102,241,0.4)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(99,102,241,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 24px rgba(99,102,241,0.4)"; }}
            >
              Dig my idea →
            </button>
            <div style={{ marginTop: 16, fontSize: "0.75rem", color: "#6b7280" }}>
              Free to try · No credit card required
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
