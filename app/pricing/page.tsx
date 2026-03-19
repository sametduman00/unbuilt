"use client";
import GlobalHeader from "../components/GlobalHeader";
import { useState } from "react";

const tools = [
  {
    id: "pulse",
    name: "Pulse",
    label: "I NEED INSPIRATION",
    desc: "Trending products, analyzed daily.",
    features: ["Product Hunt & App Store feed", "AI: WHAT it does · DIFF · MISS", "Topic & category filters", "No account required"],
  },
  {
    id: "gap",
    name: "Gap Analysis",
    label: "I HAVE AN IDEA",
    desc: "Find the gaps before you build.",
    features: ["Live Google & YouTube search", "Real competitor breakdown", "Market gap identification", "Honest scoring — no fluff"],
  },
  {
    id: "stack",
    name: "Stack Advisor",
    label: "HELP ME CHOOSE MY STACK",
    desc: "Build fast, cheap, and right.",
    features: ["123+ tools with live pricing", "Budget-matched recommendations", "Phase-by-phase build plan", "Time-to-MVP estimate"],
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
        display: "flex", flexDirection: "column",
        padding: "16px 24px 16px", gap: 12,
        background: "var(--clr-bg)", color: "var(--clr-text)",
        overflow: "hidden",
      }}>

        {/* ── TOOLS ROW (80%) ── */}
        <div style={{ flex: 4, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, minHeight: 0 }}>
          {tools.map(tool => (
            <div key={tool.id} style={{
              border: "1px solid var(--clr-border)",
              borderRadius: 14,
              padding: "20px 22px",
              display: "flex", flexDirection: "column", gap: 0,
              overflow: "hidden",
            }}>
              {/* label */}
              <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--clr-accent)", marginBottom: 10 }}>
                {tool.label}
              </div>
              {/* name + $0 on same line */}
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{tool.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--clr-text-4)", marginTop: 3 }}>{tool.desc}</div>
                </div>
                <div style={{ fontSize: "3.2rem", fontWeight: 900, letterSpacing: "-0.06em", lineHeight: 1, flexShrink: 0 }}>$0</div>
              </div>
              {/* divider */}
              <div style={{ borderTop: "1px solid var(--clr-border)", margin: "10px 0" }} />
              {/* features */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {tool.features.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "var(--clr-accent)", fontSize: "0.72rem", flexShrink: 0 }}>&#10003;</span>
                    <span style={{ fontSize: "0.82rem", color: "var(--clr-text-3)", lineHeight: 1.3 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── DONATE ROW (20%) ── */}
        <div style={{
          flex: 1,
          border: "1px solid var(--clr-border)",
          borderRadius: 14,
          padding: "12px 16px",
          display: "flex", flexDirection: "column", gap: 8,
          minHeight: 0, overflow: "hidden",
        }}>
          {/* header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700 }}>If Unbuilt helped you, pay it forward.</span>
              <span style={{ fontSize: "0.7rem", color: "var(--clr-text-4)" }}>Donations cover server &amp; API costs.</span>
            </div>
            <span style={{ fontSize: "0.7rem", color: "var(--clr-text-4)" }}>&#128591; No pressure.</span>
          </div>

          {/* wallets */}
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, minHeight: 0, overflow: "hidden" }}>
            {wallets.map(w => (
              <div key={w.symbol} style={{
                display: "flex", alignItems: "center", gap: 10,
                border: "1px solid var(--clr-border)", borderRadius: 10,
                padding: "8px 10px", overflow: "hidden",
              }}>
                {/* QR */}
                <img src={w.qr} alt={w.symbol} style={{ width: 48, height: 48, borderRadius: 5, background: "#fff", flexShrink: 0 }} />
                {/* info */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: w.color, display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: "0.8rem" }}>{w.symbol}</span>
                    <span style={{ fontSize: "0.6rem", color: "var(--clr-text-4)" }}>{w.name}</span>
                  </div>
                  <div style={{ fontSize: "0.58rem", color: "var(--clr-text-3)", wordBreak: "break-all", lineHeight: 1.35, fontFamily: "monospace" }}>
                    {w.address}
                  </div>
                  <button
                    onClick={() => copy(w.address, w.symbol)}
                    style={{
                      padding: "2px 0", width: "100%",
                      background: copied === w.symbol ? "color-mix(in srgb,var(--clr-accent) 14%,transparent)" : "var(--clr-surface)",
                      border: "1px solid var(--clr-border)", borderRadius: 5,
                      fontSize: "0.65rem", fontWeight: 600, cursor: "pointer",
                      color: copied === w.symbol ? "var(--clr-accent)" : "var(--clr-text-3)",
                    }}
                  >
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
