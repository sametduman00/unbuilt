"use client";
import { useEffect, useRef } from "react";

export default function StackLanding({ onStackClick }: { onStackClick: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const els = rootRef.current.querySelectorAll("[data-a]");
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { (e.target as HTMLElement).classList.add("sl-vis"); io.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div ref={rootRef}>
      <style>{`
        .sl-vis { --sl-on: 1; }
        [data-a] { opacity: 0; transform: translateY(40px); transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1); }
        [data-a].sl-vis { opacity: 1; transform: translateY(0); }
        [data-a="left"] { transform: translateX(-60px) translateY(0); opacity: 0; }
        [data-a="left"].sl-vis { transform: translateX(0); opacity: 1; }
        [data-a="right"] { transform: translateX(60px) translateY(0); opacity: 0; }
        [data-a="right"].sl-vis { transform: translateX(0); opacity: 1; }
        [data-a="scale"] { transform: scale(0.85); opacity: 0; }
        [data-a="scale"].sl-vis { transform: scale(1); opacity: 1; }
        [data-d="1"] { transition-delay: 0.1s; }
        [data-d="2"] { transition-delay: 0.2s; }
        [data-d="3"] { transition-delay: 0.3s; }
        [data-d="4"] { transition-delay: 0.4s; }
        [data-d="5"] { transition-delay: 0.5s; }
        [data-d="6"] { transition-delay: 0.6s; }
        [data-d="7"] { transition-delay: 0.7s; }
        [data-d="8"] { transition-delay: 0.8s; }

        @keyframes sl-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .sl-marquee { display: flex; gap: 32px; animation: sl-marquee 30s linear infinite; width: max-content; }
        .sl-marquee:hover { animation-play-state: paused; }

        @keyframes sl-orbit { from { transform: rotate(0deg) translateX(var(--r)) rotate(0deg); } to { transform: rotate(360deg) translateX(var(--r)) rotate(-360deg); } }
        .sl-orbit { animation: sl-orbit var(--dur) linear infinite; }

        @keyframes sl-pulse-ring { 0% { transform: scale(1); opacity: 0.4; } 100% { transform: scale(2.2); opacity: 0; } }

        @keyframes sl-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .sl-float { animation: sl-float 3s ease-in-out infinite; }
        .sl-float-d { animation: sl-float 3s ease-in-out 0.8s infinite; }
        .sl-float-d2 { animation: sl-float 3s ease-in-out 1.6s infinite; }

        .sl-gradient { background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #a855f7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .sl-section { padding: 5rem 1.5rem; max-width: 780px; margin: 0 auto; }
        .sl-ticker-wrap { overflow: hidden; padding: 1rem 0; border-top: 1px solid rgba(0,0,0,0.06); border-bottom: 1px solid rgba(0,0,0,0.06); }
        .sl-sticky { font-size: clamp(2.5rem, 5vw, 3.5rem); font-weight: 700; letter-spacing: -0.04em; line-height: 1.1; }

        @keyframes sl-tab-open { from { max-height:0; opacity:0; } to { max-height:300px; opacity:1; } }

        @keyframes sl-cost-fill { from { width: 0; } }
        .sl-cost-bar.sl-vis .sl-cost-inner { animation: sl-cost-fill 1.5s cubic-bezier(0.16,1,0.3,1) 0.3s forwards; }

        .sl-tool-card { padding: 12px 16px; border-radius: 12px; border: 1px solid #e5e7eb; background: #fff; display: flex; align-items: center; gap: 12px; transition: transform 0.3s, box-shadow 0.3s; }
        .sl-tool-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
      `}</style>

      {/* ── SECTION 1: THE JUNGLE ── */}
      <div className="sl-section" style={{ textAlign: "center", paddingTop: "8rem" }}>
        <div data-a="">
          <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#0ea5e9" }}>
            THE PROBLEM
          </span>
        </div>
        <h2 data-a="" data-d="1" className="sl-sticky" style={{ marginBottom: 20 }}>
          700+ tools.<br/>
          <span className="sl-gradient">You&apos;ll pick the wrong ones.</span>
        </h2>
        <p data-a="" data-d="2" style={{ fontSize: "1.0625rem", color: "#6b7280", lineHeight: 1.7, maxWidth: 520, margin: "0 auto 3rem" }}>
          You Googled &ldquo;best tools for vibecoding&rdquo; and got 14 blog posts,<br/>
          each recommending something different. Three hours later, you&apos;re still reading.
        </p>

        {/* Chaos orbit visual */}
        <div data-a="scale" data-d="3" style={{ position: "relative", width: 220, height: 220, margin: "0 auto" }}>
          {/* Center */}
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 56, height: 56, borderRadius: 14, background: "#111", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
            <span style={{ fontSize: 20, color: "#fff", fontWeight: 800 }}>?</span>
          </div>
          {/* Pulse rings */}
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 56, height: 56, borderRadius: 14, border: "2px solid #6366f1", animation: "sl-pulse-ring 2s ease-out infinite" }} />
          {/* Orbiting tools */}
          {[
            { name: "Supabase", bg: "#3ecf8e", r: 80, dur: "8s", d: "0s" },
            { name: "Vercel", bg: "#000", r: 80, dur: "8s", d: "2.7s" },
            { name: "Stripe", bg: "#635bff", r: 80, dur: "8s", d: "5.3s" },
            { name: "Railway", bg: "#e74c3c", r: 105, dur: "12s", d: "0s" },
            { name: "Neon", bg: "#0ea5e9", r: 105, dur: "12s", d: "3s" },
            { name: "Render", bg: "#46e3b7", r: 105, dur: "12s", d: "6s" },
            { name: "Fly.io", bg: "#7c3aed", r: 105, dur: "12s", d: "9s" },
          ].map((t, i) => (
            <div key={i} style={{ position: "absolute", top: "50%", left: "50%", width: 0, height: 0 }}>
              <div className="sl-orbit" style={{ "--r": `${t.r}px`, "--dur": t.dur, animationDelay: t.d } as React.CSSProperties}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#fff", fontWeight: 700, transform: "translate(-50%,-50%)", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
                  {t.name.slice(0, 2).toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
        <p data-a="" data-d="4" style={{ fontSize: "0.8125rem", color: "#9ca3af", marginTop: 20 }}>
          This is your brain on tool research
        </p>
      </div>

      {/* ── MONEY PIT TICKER ── */}
      <div className="sl-ticker-wrap" data-a="" style={{ background: "#fafafa" }}>
        <div className="sl-marquee">
          {[
            "Paid $32/mo for Bubble → Lovable does it free",
            "Used Firebase → Supabase free tier had everything",
            "Bought Webflow Pro → Vercel + Next.js was $0",
            "Paid $99/mo for Algolia → Meilisearch is free",
            "$49/mo for email service → Resend gives 3K/mo free",
            "Bought hosting for $20/mo → Railway hobby plan is $5",
            "$29/mo for analytics → PostHog free tier = 1M events",
            "Paid for Heroku → Render has a free tier now",
            "Paid $32/mo for Bubble → Lovable does it free",
            "Used Firebase → Supabase free tier had everything",
            "Bought Webflow Pro → Vercel + Next.js was $0",
            "Paid $99/mo for Algolia → Meilisearch is free",
            "$49/mo for email service → Resend gives 3K/mo free",
            "Bought hosting for $20/mo → Railway hobby plan is $5",
          ].map((t, i) => (
            <span key={i} style={{ whiteSpace: "nowrap", fontSize: "0.8125rem", color: "#6b7280", fontWeight: 500 }}>
              <span style={{ color: "#dc2626" }}>✗</span> {t}
            </span>
          ))}
        </div>
      </div>

      {/* ── SECTION 2: THE COST OF GUESSING ── */}
      <div className="sl-section" style={{ textAlign: "center" }}>
        <h2 data-a="" className="sl-sticky" style={{ marginBottom: 16, fontSize: "clamp(2rem, 4.5vw, 2.75rem)" }}>
          The average vibe coder spends<br/>
          <span className="sl-gradient">$47/mo on tools they don&apos;t need.</span>
        </h2>
        <p data-a="" data-d="1" style={{ fontSize: "1rem", color: "#6b7280", lineHeight: 1.7, maxWidth: 480, margin: "0 auto 2.5rem" }}>
          We analyzed hundreds of stacks. Most people overpay for 2-3 tools<br/>
          that have identical free alternatives.
        </p>

        {/* Cost comparison bars */}
        <div style={{ maxWidth: 500, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
          <div data-a="left" data-d="2" className="sl-cost-bar" style={{ textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#111" }}>Without Stack</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#dc2626" }}>$47/mo average</span>
            </div>
            <div style={{ height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
              <div className="sl-cost-inner" style={{ height: "100%", width: "85%", background: "linear-gradient(90deg, #f87171, #dc2626)", borderRadius: 4 }} />
            </div>
          </div>
          <div data-a="right" data-d="3" className="sl-cost-bar" style={{ textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#111" }}>With Stack</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#22c55e" }}>$0-5/mo to start</span>
            </div>
            <div style={{ height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
              <div className="sl-cost-inner" style={{ height: "100%", width: "12%", background: "linear-gradient(90deg, #4ade80, #22c55e)", borderRadius: 4 }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: THREE INPUTS, ONE STACK ── */}
      <div className="sl-section" style={{ textAlign: "center" }}>
        <div data-a="">
          <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#0ea5e9" }}>
            HOW IT WORKS
          </span>
        </div>
        <h2 data-a="" data-d="1" className="sl-sticky" style={{ marginBottom: 16, fontSize: "clamp(2rem, 4.5vw, 2.75rem)" }}>
          Your idea. Your budget. Your level.<br/>
          <span className="sl-gradient">One perfect stack.</span>
        </h2>
        <p data-a="" data-d="2" style={{ fontSize: "1rem", color: "#6b7280", lineHeight: 1.7, maxWidth: 440, margin: "0 auto 3rem" }}>
          We don&apos;t give you a list. We give you THE stack —<br/>
          matched to exactly where you are right now.
        </p>

        {/* Convergence visual: 3 inputs → 1 output */}
        <div data-a="scale" data-d="3" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { icon: "💡", label: "Your idea", sub: "marketplace for designers", bg: "#eff6ff" },
              { icon: "💰", label: "Your budget", sub: "$0 — bootstrapped", bg: "#f0fdf4" },
              { icon: "🔧", label: "Your level", sub: "no-code", bg: "#faf5ff" },
            ].map((item, i) => (
              <div key={i} className={i === 0 ? "sl-float" : i === 1 ? "sl-float-d" : "sl-float-d2"} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 12, background: item.bg, border: "1px solid rgba(0,0,0,0.06)" }}>
                <span style={{ fontSize: "1.25rem" }}>{item.icon}</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#111", letterSpacing: "0.03em" }}>{item.label}</div>
                  <div style={{ fontSize: "0.625rem", color: "#6b7280" }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Arrow */}
          <div style={{ padding: "0 24px" }}>
            <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
              <path d="M0 12h40M34 6l8 6-8 6" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Output stack */}
          <div style={{ padding: "20px", borderRadius: 16, background: "#111827", minWidth: 200 }}>
            <div style={{ fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6366f1", marginBottom: 10 }}>YOUR STACK</div>
            {[
              { name: "Lovable", price: "Free", color: "#f97316" },
              { name: "Supabase", price: "Free", color: "#3ecf8e" },
              { name: "Vercel", price: "Free", color: "#fff" },
              { name: "Stripe", price: "2.9%/txn", color: "#635bff" },
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 3, background: t.color }} />
                  <span style={{ fontSize: "0.75rem", color: "#e5e7eb", fontWeight: 500 }}>{t.name}</span>
                </div>
                <span style={{ fontSize: "0.625rem", color: "#22c55e", fontWeight: 600 }}>{t.price}</span>
              </div>
            ))}
            <div style={{ marginTop: 10, fontSize: "0.6875rem", fontWeight: 700, color: "#22c55e", textAlign: "center" }}>Total: $0/mo</div>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: THE 4 PHASES ── */}
      <div className="sl-section">
        <div data-a="" style={{ textAlign: "center" }}>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#0ea5e9" }}>
            NOT JUST TOOLS
          </span>
        </div>
        <h2 data-a="" data-d="1" className="sl-sticky" style={{ marginBottom: 12, textAlign: "center", fontSize: "clamp(2rem, 4.5vw, 2.75rem)" }}>
          A roadmap in 4 phases.
        </h2>
        <p data-a="" data-d="2" style={{ fontSize: "1rem", color: "#6b7280", lineHeight: 1.7, textAlign: "center", maxWidth: 440, margin: "0 auto 3rem" }}>
          Start with $0. Scale only when you need to.<br/>
          Every upgrade has a trigger — we tell you when.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { phase: "0", name: "Validate", cost: "$0/mo", desc: "Prove people want it before writing code", color: "#6366f1", tools: ["Telegram Bot", "Google Forms", "Carrd"], free: true },
            { phase: "1", name: "MVP", cost: "$0-20/mo", desc: "Ship the first version in days, not months", color: "#10b981", tools: ["Lovable", "Supabase", "Vercel", "Stripe"], free: true },
            { phase: "2", name: "Growth", cost: "$25-45/mo", desc: "Add search, analytics, and scale the database", color: "#f59e0b", tools: ["PostHog", "Meilisearch", "Supabase Pro"], free: false },
            { phase: "3", name: "Scale", cost: "$50+/mo", desc: "Multi-region, background jobs, error tracking", color: "#ef4444", tools: ["Stripe Connect", "Railway", "Sentry"], free: false },
          ].map((p, i) => (
            <div key={i} data-a={i % 2 === 0 ? "left" : "right"} data-d={String(i + 1)} style={{ display: "flex", gap: 16, padding: "20px 0", borderBottom: i < 3 ? "1px solid #f3f4f6" : "none" }}>
              {/* Phase number */}
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${p.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1.5px solid ${p.color}30` }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 800, color: p.color }}>{p.phase}</span>
              </div>
              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#111" }}>
                    {p.name}
                    {p.free && <span style={{ marginLeft: 8, fontSize: "0.5625rem", fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#dcfce7", color: "#16a34a", letterSpacing: "0.05em" }}>FREE START</span>}
                  </div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: p.color }}>{p.cost}</span>
                </div>
                <div style={{ fontSize: "0.8125rem", color: "#6b7280", marginBottom: 8, lineHeight: 1.4 }}>{p.desc}</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {p.tools.map((t, j) => (
                    <span key={j} style={{ fontSize: "0.625rem", fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: "#f3f4f6", color: "#374151" }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 5: THE VIBE GUIDE DIFFERENCE ── */}
      <div style={{ background: "#fafafa", borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
        <div className="sl-section" style={{ textAlign: "center" }}>
          <div data-a="">
            <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#0ea5e9" }}>
              NOT JUST &ldquo;USE SUPABASE&rdquo;
            </span>
          </div>
          <h2 data-a="" data-d="1" className="sl-sticky" style={{ marginBottom: 12, fontSize: "clamp(2rem, 4.5vw, 2.75rem)" }}>
            We tell you exactly<br/>
            <span className="sl-gradient">what to type. Where to click.</span>
          </h2>
          <p data-a="" data-d="2" style={{ fontSize: "1rem", color: "#6b7280", lineHeight: 1.7, maxWidth: 460, margin: "0 auto 2.5rem" }}>
            Every tool comes with a Vibe Guide — step-by-step instructions<br/>
            written for people who&apos;ve never used it before.
          </p>

          {/* Mock vibe guide card */}
          <div data-a="scale" data-d="3" style={{ maxWidth: 480, margin: "0 auto", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "24px", textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#3ecf8e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L.235 12.9a.396.396 0 0 0 .302.643h9.362v8.958a.396.396 0 0 0 .716.233L21.664 9.997a.396.396 0 0 0-.302-.643z"/></svg>
              </div>
              <div>
                <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#111" }}>Supabase — Vibe Guide</div>
                <div style={{ fontSize: "0.6875rem", color: "#6b7280" }}>Database + Auth + Storage in one click</div>
              </div>
            </div>
            {[
              { step: 1, text: "Go to supabase.com → Click \"Start your project\"" },
              { step: 2, text: "Sign up with GitHub (one click)" },
              { step: 3, text: "Create project → Copy your URL and anon key" },
              { step: 4, text: "Paste keys into your Lovable app config" },
              { step: 5, text: "Done. You have a full database." },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderTop: i > 0 ? "1px solid #f3f4f6" : "none" }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: i === 4 ? "#dcfce7" : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.625rem", fontWeight: 700, color: i === 4 ? "#16a34a" : "#6b7280" }}>
                  {i === 4 ? "✓" : s.step}
                </div>
                <span style={{ fontSize: "0.8125rem", color: "#374151", lineHeight: 1.5 }}>{s.text}</span>
              </div>
            ))}
            <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "#eff6ff", border: "1px solid #bfdbfe" }}>
              <span style={{ fontSize: "0.6875rem", color: "#1e40af" }}>💡 <strong>Tip:</strong> Don&apos;t worry about SQL. Supabase has templates. Just make sure each table has an id (primary key).</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 6: WHAT OTHERS DO VS WHAT WE DO ── */}
      <div className="sl-section" style={{ textAlign: "center" }}>
        <h2 data-a="" className="sl-sticky" style={{ marginBottom: 12, fontSize: "clamp(2rem, 4.5vw, 2.75rem)" }}>
          Other tools say &ldquo;use Supabase.&rdquo;<br/>
          <span className="sl-gradient">We say &ldquo;here&apos;s how.&rdquo;</span>
        </h2>
        <p data-a="" data-d="1" style={{ fontSize: "1rem", color: "#6b7280", lineHeight: 1.7, maxWidth: 460, margin: "0 auto 2.5rem" }}>
          ChatGPT gives you a list. We give you the playbook.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 560, margin: "0 auto" }}>
          {/* ChatGPT side */}
          <div data-a="left" data-d="2" style={{ padding: "20px", borderRadius: 14, background: "#fafafa", border: "1px solid #e5e7eb", textAlign: "left" }}>
            <div style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 12 }}>CHATGPT</div>
            <div style={{ fontSize: "0.8125rem", color: "#6b7280", lineHeight: 1.8 }}>
              &ldquo;I&apos;d recommend using <strong>React</strong>, <strong>Node.js</strong>, <strong>PostgreSQL</strong>, and <strong>Stripe</strong> for payments. You could deploy on <strong>AWS</strong> or <strong>Vercel</strong>...&rdquo;
            </div>
            <div style={{ marginTop: 12, fontSize: "0.6875rem", color: "#dc2626", fontWeight: 500 }}>
              ⚠ No costs. No alternatives. No steps.
            </div>
          </div>

          {/* unbuilt side */}
          <div data-a="right" data-d="3" style={{ padding: "20px", borderRadius: 14, background: "#111827", border: "1px solid #1f2937", textAlign: "left" }}>
            <div style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6366f1", marginBottom: 12 }}>UNBUILT STACK</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { tool: "Lovable", cost: "$0", badge: "Builder" },
                { tool: "Supabase", cost: "$0", badge: "Database" },
                { tool: "Stripe", cost: "2.9%", badge: "Payments" },
              ].map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: "0.75rem", color: "#e5e7eb", fontWeight: 600 }}>{t.tool}</span>
                    <span style={{ fontSize: "0.5rem", padding: "1px 5px", borderRadius: 4, background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}>{t.badge}</span>
                  </div>
                  <span style={{ fontSize: "0.625rem", color: "#22c55e", fontWeight: 600 }}>{t.cost}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: "0.6875rem", color: "#22c55e", fontWeight: 600 }}>
              ✓ + step-by-step guide for each
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 7: STATS BAR ── */}
      <div style={{ background: "#fafafa", borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb", padding: "2rem 1.5rem" }}>
        <div data-a="" style={{ display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap", maxWidth: 700, margin: "0 auto" }}>
          {[
            { num: "700+", label: "tools evaluated" },
            { num: "4", label: "phases to ship" },
            { num: "$0", label: "to start" },
            { num: "~30s", label: "to get your stack" },
          ].map((s, i) => (
            <div key={i} data-d={String(i + 1)} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111", letterSpacing: "-0.03em" }}>{s.num}</div>
              <div style={{ fontSize: "0.6875rem", color: "#6b7280", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 8: FINAL CTA ── */}
      <div style={{ padding: "5rem 1.5rem", textAlign: "center" }}>
        <div data-a="scale">
          <div style={{ padding: "4rem 2rem", borderRadius: 20, background: "#111827", maxWidth: 680, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.25rem)", fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", marginBottom: 8, lineHeight: 1.15 }}>
              Stop Googling.<br/>Start building.
            </h2>
            <p style={{ fontSize: "0.9375rem", color: "#6b7280", marginBottom: 24, lineHeight: 1.6 }}>
              Describe your idea. We&apos;ll build your stack in 30 seconds.
            </p>
            <button
              onClick={onStackClick}
              style={{
                padding: "12px 32px", borderRadius: 12, background: "#0ea5e9", color: "#fff",
                fontSize: "1rem", fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 4px 24px rgba(14,165,233,0.4)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(14,165,233,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 24px rgba(14,165,233,0.4)"; }}
            >
              Get my Stack →
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
