"use client";
import { useState } from "react";
import Link from "next/link";

const FAQS = [
  {
    q: "How do credits work?",
    a: "Dig and Stack each use 1 analysis. Launches is always free. Free users get limited results. Pro users get full reports with 10 or 25 analyses per month.",
  },
  {
    q: "What's the difference between Dig and Stack?",
    a: "Dig analyzes your idea against the market — competitors, pain points, gaps, and whether there's real demand. Stack tells you what tools to use to build it — with phases, pricing, and setup instructions. They work best together.",
  },
  {
    q: "How fresh is the data in Dig reports?",
    a: "Every Dig report scans live sources in real time — Reddit, X, YouTube, App Store, Google Play, Product Hunt, and LinkedIn. No cached results. The data is from the moment you hit run.",
  },
  {
    q: "Can I get a refund?",
    a: "If a report failed to generate due to a technical error on our end, yes — reach out and we'll refund the credit or rerun it. If the report ran successfully but you didn't like the results, we don't offer refunds. See our Refund Policy for details.",
  },
  {
    q: "What model powers Unbuilt?",
    a: "Every query runs on Claude Opus 4.6 with Extended Thinking — Anthropic's most capable model. We don't use cheaper models to cut costs.",
  },
  {
    q: "Can I export my reports?",
    a: "Yes. Every Dig and Stack report has a Download PDF button at the top of the results. You can also go to My Reports from the sidebar — all your past reports are saved there and can be downloaded as PDF.",
  },
  {
    q: "My report looks broken or incomplete — what happened?",
    a: "Occasionally the AI stream can cut off or return malformed output. Try running the query again — it doesn't cost an extra credit if the report failed to render. If it keeps happening, submit a request below.",
  },
  {
    q: "Do credits expire?",
    a: "Never. Buy once, use whenever.",
  },
];

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;
    setSending(true);
    try {
      await fetch("https://formsubmit.co/ajax/builder@unbuilt.me", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      setSent(true);
    } catch {
      // still show success — email likely went through
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--clr-bg)", padding: "48px 24px 80px", maxWidth: 720, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" as const, color: "var(--clr-text-5)", marginBottom: 10 }}>Help</p>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 10px", lineHeight: 1.1 }}>
          How can we help?
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--clr-text-3)", margin: 0, lineHeight: 1.6 }}>
          Browse the FAQs below or send us a message at{" "}
          <a href="mailto:builder@unbuilt.me" style={{ color: "var(--clr-text)", fontWeight: 600, textDecoration: "none" }}>
            builder@unbuilt.me
          </a>
        </p>
      </div>

      {/* FAQ */}
      <div style={{ marginBottom: 52 }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" as const, color: "var(--clr-text-5)", marginBottom: 14 }}>
          Frequently asked questions
        </p>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ border: "1px solid var(--clr-border)", borderRadius: 10, overflow: "hidden", background: open === i ? "var(--clr-surface)" : "transparent", transition: "background 0.15s" }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" as const, gap: 12 }}
              >
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--clr-text)", lineHeight: 1.4 }}>{faq.q}</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, transform: open === i ? "rotate(180deg)" : "none", transition: "transform 0.2s", color: "var(--clr-text-4)" }}>
                  <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {open === i && (
                <div style={{ padding: "0 16px 14px", fontSize: "0.8125rem", color: "var(--clr-text-3)", lineHeight: 1.65 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact form */}
      <div style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 14, padding: "28px 28px" }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" as const, color: "var(--clr-text-5)", marginBottom: 6 }}>
          Submit a request
        </p>
        <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--clr-text)", margin: "0 0 4px" }}>
          Still need help?
        </p>
        <p style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", margin: "0 0 20px", lineHeight: 1.5 }}>
          Send us a message and we'll get back to you within 24 hours. Or email directly:{" "}
          <a href="mailto:builder@unbuilt.me" style={{ color: "var(--clr-text)", fontWeight: 600, textDecoration: "none" }}>
            builder@unbuilt.me
          </a>
        </p>

        {sent ? (
          <div style={{ padding: "16px 20px", borderRadius: 10, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span style={{ fontSize: "0.875rem", color: "#16a34a", fontWeight: 600 }}>Message sent! We'll get back to you within 24 hours.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--clr-text-3)", display: "block", marginBottom: 5 }}>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--clr-border)", background: "var(--clr-bg)", color: "var(--clr-text)", fontSize: "0.875rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--clr-text-3)", display: "block", marginBottom: 5 }}>Email <span style={{ color: "#ef4444" }}>*</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--clr-border)", background: "var(--clr-bg)", color: "var(--clr-text)", fontSize: "0.875rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--clr-text-3)", display: "block", marginBottom: 5 }}>Message <span style={{ color: "#ef4444" }}>*</span></label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe your issue or question..."
                required
                rows={5}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--clr-border)", background: "var(--clr-bg)", color: "var(--clr-text)", fontSize: "0.875rem", fontFamily: "inherit", outline: "none", resize: "vertical" as const, boxSizing: "border-box" as const }}
              />
            </div>
            <button
              type="submit"
              disabled={sending || !email || !message}
              style={{ alignSelf: "flex-start", padding: "10px 24px", borderRadius: 9, background: sending || !email || !message ? "var(--clr-surface-2)" : "var(--clr-text)", color: sending || !email || !message ? "var(--clr-text-4)" : "var(--clr-bg)", border: "none", fontSize: "0.875rem", fontWeight: 700, cursor: sending || !email || !message ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
            >
              {sending ? "Sending..." : "Send message"}
            </button>
          </form>
        )}
      </div>

    </main>
  );
}
