"use client";
import GlobalHeader from "../components/GlobalHeader";
import { useState } from "react";

const tools = [
  {
    id: "pulse",
    label: "I NEED INSPIRATION",
    name: "Pulse",
    features: [
      "Product Hunt feed — updated daily",
      "App Store feed — updated daily",
      "AI breakdown per product",
      "WHAT it does · DIFF · MISS format",
      "Topic & category filters",
      "Unlimited browsing",
      "No account required",
      "Mobile-friendly layout",
      "Dark mode supported",
      "New products added automatically",
    ],
  },
  {
    id: "gap",
    label: "I HAVE AN IDEA",
    name: "Gap Analysis",
    features: [
      "Live Google search integration",
      "Live YouTube search integration",
      "Real competitor breakdown",
      "Market gap identification",
      "Honest scoring — no fluff",
      "Structured export-ready output",
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
    features: [
      "123+ tools with live pricing",
      "Budget-matched recommendations",
      "Phase-by-phase build plan",
      "Time-to-MVP estimate",
      "Common mistake warnings",
      "Tool alternatives included",
      "Founder-first perspective",
      "Unlimited queries",
      "Covers infra, design & payments",
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
    <>
      <GlobalHeader />
      <main style={{
        position: "fixed", top: 60, left: 0, right: 0, bottom: 0,
        display: "grid",
        gridTemplateRows: "1fr auto",
        padding: "14px 20px",
        gap: 10,
        background: "var(--clr-bg)",
        color: "var(--clr-text)",
        overflow: "hidden",
      }}>

        {/* ── TOOL CARDS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, minHeight: 0, overflow: "hidden" }}>
          {tools.map(tool => (
            <div key={tool.id} style={{
              border: "1px solid var(--clr-border)",
              borderRadius: 14,
              display: "grid",
              gridTemplateRows: "auto auto 1px auto",
              overflow: "hidden",
            }}>
              {/* top: label + name + price */}
              <div style={{ padding: "16px 18px 0" }}>
                <div style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--clr-accent)", marginBottom: 8 }}>
                  {tool.label}
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.02em" }}>{tool.name}</span>
                  <span style={{ fontSize: "2.8rem", fontWeight: 900, letterSpacing: "-0.06em", lineHeight: 1, color: "var(--clr-text)" }}>$0</span>
                </div>
              </div>

              {/* divider */}
              <div style={{ height: 1, background: "var(--clr-border)", margin: "12px 18px 0" }} />
              <div />

              {/* features 2-col grid */}
              <div style={{ padding: "10px 18px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 10px", alignContent: "start", overflow: "hidden" }}>
                {tool.features.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                    <span style={{ color: "var(--clr-accent)", fontSize: "0.68rem", marginTop: 1, flexShrink: 0 }}>&#10003;</span>
                    <span style={{ fontSize: "0.73rem", color: "var(--clr-text-3)", lineHeight: 1.35 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── DONATE STRIP ── */}
        <div style={{
          border: "1px solid var(--clr-border)",
          borderRadius: 12,
          padding: "10px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}>
          {/* header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>If Unbuilt helped you, pay it forward.</span>
              <span style={{ fontSize: "0.68rem", color: "var(--clr-text-4)" }}>Everything is free — donations keep servers running.</span>
            </div>
            <span style={{ fontSize: "0.68rem", color: "var(--clr-text-4)" }}>&#128591; No pressure.</span>
          </div>

          {/* wallet row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {wallets.map(w => (
              <div key={w.symbol} style={{
                display: "flex", alignItems: "center", gap: 9,
                border: "1px solid var(--clr-border)", borderRadius: 9, padding: "8px 10px",
              }}>
                <img src={w.qr} alt={w.symbol} style={{ width: 46, height: 46, borderRadius: 5, background: "#fff", flexShrink: 0, display: "block" }} />
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: w.color, display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: "0.78rem" }}>{w.symbol}</span>
                    <span style={{ fontSize: "0.6rem", color: "var(--clr-text-4)" }}>{w.name}</span>
                  </div>
                  <div style={{ fontSize: "0.57rem", color: "var(--clr-text-3)", wordBreak: "break-all", lineHeight: 1.4, fontFamily: "monospace" }}>{w.address}</div>
                  <button onClick={() => copy(w.address, w.symbol)} style={{
                    padding: "2px 0", width: "100%",
                    background: copied === w.symbol ? "color-mix(in srgb,var(--clr-accent) 14%,transparent)" : "var(--clr-surface)",
                    border: "1px solid var(--clr-border)", borderRadius: 5,
                    fontSize: "0.62rem", fontWeight: 600, cursor: "pointer",
                    color: copied === w.symbol ? "var(--clr-accent)" : "var(--clr-text-3)",
                  }}>
                    {copied === w.symbol ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </>
  );
}
