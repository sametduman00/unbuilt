"use client";
import GlobalHeader from "../components/GlobalHeader";
import { useState } from "react";

const tools = [
  {
    id: "pulse",
    name: "Pulse",
    label: "I NEED INSPIRATION",
    tagline: "Trending products, analyzed",
    features: [
      "Product Hunt feed — updated daily",
      "App Store feed — updated daily",
      "AI breakdown per product (WHAT / DIFF / MISS)",
      "Topic & category filters",
      "Unlimited browsing",
      "No account required",
    ],
  },
  {
    id: "gap",
    name: "Gap Analysis",
    label: "I HAVE AN IDEA",
    tagline: "Find the gaps before you build",
    features: [
      "Live Google & YouTube search",
      "Real competitor breakdown",
      "Market gap identification",
      "Honest scoring — no fluff",
      "Structured, export-ready output",
      "Unlimited queries",
    ],
  },
  {
    id: "stack",
    name: "Stack Advisor",
    label: "HELP ME CHOOSE MY STACK",
    tagline: "Build fast, cheap, and right",
    features: [
      "123+ tools with live pricing",
      "Budget-matched recommendations",
      "Phase-by-phase build plan",
      "Time-to-MVP estimate",
      "Common mistake warnings",
      "Unlimited queries",
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

  const copy = (address: string, symbol: string) => {
    navigator.clipboard.writeText(address);
    setCopied(symbol);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--clr-bg)", color: "var(--clr-text)" }}>
      <GlobalHeader />

      {/* Tool pricing — 3 col */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 2rem 80px" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          border: "1px solid var(--clr-border)", borderRadius: 16, overflow: "hidden",
        }}>
          {tools.map((tool, i) => (
            <div key={tool.id} style={{
              borderRight: i < 2 ? "1px solid var(--clr-border)" : "none",
              display: "flex", flexDirection: "column",
            }}>
              <div style={{ padding: "28px 28px 20px", borderBottom: "1px solid var(--clr-border)" }}>
                <div style={{
                  fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "var(--clr-accent)", marginBottom: 8,
                }}>{tool.label}</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--clr-text)", marginBottom: 4 }}>{tool.name}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--clr-text-4)" }}>{tool.tagline}</div>
              </div>
              <div style={{ padding: "20px 28px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                {tool.features.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                    <span style={{ color: "var(--clr-accent)", fontSize: "0.8rem", marginTop: 2, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: "0.875rem", color: "var(--clr-text-3)", lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: "24px 28px", borderTop: "1px solid var(--clr-border)", textAlign: "center" }}>
                <div style={{ fontSize: "3.5rem", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1, color: "var(--clr-text)" }}>$0</div>
                <div style={{ fontSize: "0.8rem", color: "var(--clr-text-4)", marginTop: 4 }}>/ month, forever</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Donate */}
      <section style={{ borderTop: "1px solid var(--clr-border)", padding: "60px 2rem 100px" }}>
        <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 12 }}>
            If Unbuilt helped you, pay it forward.
          </h2>
          <p style={{ color: "var(--clr-text-3)", lineHeight: 1.7, fontSize: "0.9rem" }}>
            Everything is free. If we saved you time or helped you avoid a bad idea,
            a small donation goes directly into server costs and API bills.
          </p>
        </div>

        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
          border: "1px solid var(--clr-border)", borderRadius: 16, overflow: "hidden",
        }}>
          {wallets.map((w, i) => (
            <div key={w.symbol} style={{
              borderRight: i < 4 ? "1px solid var(--clr-border)" : "none",
              padding: "28px 16px 24px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: w.color, flexShrink: 0, display: "inline-block" }} />
                <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>{w.symbol}</span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--clr-text-4)" }}>{w.name}</div>
              <img src={w.qr} alt={w.symbol} style={{ width: 130, height: 130, borderRadius: 6, display: "block", background: "#fff" }} />
              <div style={{
                fontSize: "0.55rem", color: "var(--clr-text-4)", wordBreak: "break-all",
                textAlign: "center", lineHeight: 1.6, fontFamily: "monospace",
              }}>{w.address}</div>
              <button onClick={() => copy(w.address, w.symbol)} style={{
                width: "100%", padding: "0.375rem",
                background: copied === w.symbol ? "color-mix(in srgb, var(--clr-accent) 15%, transparent)" : "var(--clr-surface)",
                border: "1px solid var(--clr-border)", borderRadius: 8,
                fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                color: copied === w.symbol ? "var(--clr-accent)" : "var(--clr-text-3)",
                transition: "all 0.15s",
              }}>
                {copied === w.symbol ? "Copied!" : "Copy"}
              </button>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", marginTop: 24, fontSize: "0.8rem", color: "var(--clr-text-4)" }}>
          🙏 No pressure. Every satoshi helps.
        </p>
      </section>
    </div>
  );
}
