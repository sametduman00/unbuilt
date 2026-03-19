"use client";
import GlobalHeader from "../components/GlobalHeader";
import { useState } from "react";

const tools = [
  {
    id: "pulse",
    label: "I NEED INSPIRATION",
    name: "Pulse",
    desc: "Discover what's trending before everyone else.",
    features: [
      "Product Hunt feed — updated daily",
      "App Store feed — updated daily",
      "AI breakdown per product",
      "WHAT it does · DIFF · MISS format",
      "Topic & category filters",
      "Unlimited browsing",
      "No account required",
      "Mobile-friendly",
      "Dark mode supported",
      "New products added automatically",
    ],
  },
  {
    id: "gap",
    label: "I HAVE AN IDEA",
    name: "Gap Analysis",
    desc: "Find the gaps in the market before you build.",
    features: [
      "Live Google search integration",
      "Live YouTube search integration",
      "Real competitor breakdown",
      "Market gap identification",
      "Honest scoring — no fluff",
      "Structured, export-ready output",
      "Works on any niche or idea",
      "Unlimited queries",
      "AI-powered insights",
      "No account required",
    ],
  },
  {
    id: "stack",
    label: "HELP ME CHOOSE MY STACK",
    name: "Stack Advisor",
    desc: "Pick the right tools for your budget and timeline.",
    features: [
      "123+ tools with live pricing",
      "Budget-matched recommendations",
      "Phase-by-phase build plan",
      "Time-to-MVP estimate",
      "Common mistake warnings",
      "Tool alternatives included",
      "Founder-first perspective",
      "Covers infra, design & payments",
      "Unlimited queries",
      "No account required",
    ],
  },
];

const wallets = [
  { symbol: "BTC",  name: "Bitcoin",       color: "#F7931A", address: "bc1q9fjlxn39vs9sfurekgjd7p4qx9yzj4kulqe580",     qr: "/qr/btc.jpeg"  },
  { symbol: "ETH",  name: "Ethereum",      color: "#627EEA", address: "0x60d601C0CcF6A27f5BB00066FCAE8c7208a8Fac8",     qr: "/qr/eth.jpeg"  },
  { symbol: "SOL",  name: "Solana",        color: "#9945FF", address: "3oXApv9hQC2UUtoVKb29gLtW61SRdsT9mpfzKvM4jjgM", qr: "/qr/sol.jpeg"  },
  { symbol: "USDT", name: "Tether ERC-20", color: "#26A17B", address: "0x60d601C0CcF6A27f5BB00066FCAE8c7208a8Fac8",     qr: "/qr/usdt.jpeg" },
  { symbol: "XRP",  name: "Ripple",        color: "#00AAE4", address: "rPMvhnSuaw82TqEMPNffBVhj5yJTxZyv9Y",            qr: "/qr/xrp.jpeg"  },
];

export default function PricingPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (addr: string, sym: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(sym);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--clr-bg)", color: "var(--clr-text)" }}>
      <GlobalHeader />

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "72px 24px 48px" }}>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.04em", margin: 0, marginBottom: 12 }}>
          Everything is free.
        </h1>
        <p style={{ fontSize: "1rem", color: "var(--clr-text-3)", margin: 0 }}>
          No limits, no credit card, no catch. We&apos;re building in public.
        </p>
      </div>

      {/* Cards */}
      <div style={{
        maxWidth: 1080,
        margin: "0 auto",
        padding: "0 24px",
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
        alignItems: "start",
      }}>
        {tools.map(tool => (
          <div key={tool.id} style={{
            border: "1px solid var(--clr-border)",
            borderRadius: 16,
            padding: "28px 24px",
            background: "var(--clr-surface)",
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}>
            {/* label */}
            <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--clr-accent)", marginBottom: 12 }}>
              {tool.label}
            </div>
            {/* name */}
            <div style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>
              {tool.name}
            </div>
            {/* price */}
            <div style={{ fontSize: "3rem", fontWeight: 900, letterSpacing: "-0.06em", lineHeight: 1, marginBottom: 6 }}>
              $0
            </div>
            {/* desc */}
            <div style={{ fontSize: "0.82rem", color: "var(--clr-text-4)", marginBottom: 20, lineHeight: 1.5 }}>
              {tool.desc}
            </div>

            {/* divider */}
            <div style={{ height: 1, background: "var(--clr-border)", marginBottom: 16 }} />

            {/* feature label */}
            <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--clr-text-3)", marginBottom: 10 }}>
              Included in {tool.name}:
            </div>

            {/* features */}
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {tool.features.map(f => (
                <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ color: "var(--clr-accent)", fontSize: "0.72rem", marginTop: 2, flexShrink: 0 }}>&#10003;</span>
                  <span style={{ fontSize: "0.82rem", color: "var(--clr-text-3)", lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Donate */}
      <div style={{ maxWidth: 1080, margin: "48px auto 64px", padding: "0 24px" }}>
        <div style={{ border: "1px solid var(--clr-border)", borderRadius: 16, padding: "28px 24px" }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 4 }}>
              If Unbuilt helped you, pay it forward. &#128591;
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--clr-text-4)" }}>
              Everything is free — a small donation goes directly into server costs and API bills. No pressure.
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {wallets.map(w => (
              <div key={w.symbol} style={{
                border: "1px solid var(--clr-border)",
                borderRadius: 12,
                padding: "16px 12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: w.color, display: "inline-block", flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>{w.symbol}</span>
                  <span style={{ fontSize: "0.65rem", color: "var(--clr-text-4)" }}>{w.name}</span>
                </div>
                <img
                  src={w.qr}
                  alt={w.symbol}
                  style={{ width: 100, height: 100, borderRadius: 8, background: "#fff", display: "block" }}
                />
                <div style={{
                  fontSize: "0.62rem",
                  color: "var(--clr-text-3)",
                  wordBreak: "break-all",
                  textAlign: "center",
                  lineHeight: 1.5,
                  fontFamily: "monospace",
                  width: "100%",
                }}>
                  {w.address}
                </div>
                <button
                  onClick={() => copy(w.address, w.symbol)}
                  style={{
                    width: "100%",
                    padding: "6px 0",
                    background: copied === w.symbol ? "color-mix(in srgb,var(--clr-accent) 12%,transparent)" : "var(--clr-surface)",
                    border: "1px solid var(--clr-border)",
                    borderRadius: 8,
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    color: copied === w.symbol ? "var(--clr-accent)" : "var(--clr-text-3)",
                    transition: "all 0.15s",
                  }}
                >
                  {copied === w.symbol ? "Copied!" : "Copy"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
