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
      "Product Hunt & App Store — daily",
      "AI breakdown: WHAT it does · DIFF · MISS",
      "Topic & category filters",
      "No account required",
    ],
  },
  {
    id: "gap",
    label: "I HAVE AN IDEA",
    name: "Gap Analysis",
    desc: "Find the gaps in the market before you build.",
    features: [
      "Live Google & YouTube search",
      "Real competitor breakdown",
      "Market gap identification",
      "Unlimited queries",
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

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 24px 48px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, alignItems: "start" }}>
          {tools.map(tool => (
            <div key={tool.id} style={{
              border: "1px solid var(--clr-border)",
              borderRadius: 16,
              padding: "24px 22px",
              background: "var(--clr-surface)",
            }}>
              <div style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--clr-accent)", marginBottom: 10 }}>
                {tool.label}
              </div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 2 }}>{tool.name}</div>
              <div style={{ fontSize: "2.8rem", fontWeight: 900, letterSpacing: "-0.06em", lineHeight: 1, marginBottom: 6 }}>$0</div>
              <div style={{ fontSize: "0.8rem", color: "var(--clr-text-4)", marginBottom: 18, lineHeight: 1.5 }}>{tool.desc}</div>
              <div style={{ height: 1, background: "var(--clr-border)", marginBottom: 16 }} />
              <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--clr-text-3)", marginBottom: 10 }}>Included:</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {tool.features.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ color: "var(--clr-accent)", fontSize: "0.7rem", marginTop: 2, flexShrink: 0 }}>&#10003;</span>
                    <span style={{ fontSize: "0.82rem", color: "var(--clr-text-3)", lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Donate */}
        <div style={{ border: "1px solid var(--clr-border)", borderRadius: 16, padding: "22px 22px" }}>
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: "0.95rem", fontWeight: 700 }}>If Unbuilt helped you, pay it forward.</span>
            <span style={{ fontSize: "0.78rem", color: "var(--clr-text-4)", marginLeft: 10 }}>Donations cover server & API costs. No pressure. &#128591;</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {wallets.map(w => (
              <div key={w.symbol} style={{ border: "1px solid var(--clr-border)", borderRadius: 12, padding: "14px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 9 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: w.color, display: "inline-block", flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, fontSize: "0.82rem" }}>{w.symbol}</span>
                  <span style={{ fontSize: "0.62rem", color: "var(--clr-text-4)" }}>{w.name}</span>
                </div>
                <img src={w.qr} alt={w.symbol} style={{ width: 90, height: 90, borderRadius: 7, background: "#fff", display: "block" }} />
                <div style={{ fontSize: "0.6rem", color: "var(--clr-text-3)", wordBreak: "break-all", textAlign: "center", lineHeight: 1.5, fontFamily: "monospace", width: "100%" }}>{w.address}</div>
                <button onClick={() => copy(w.address, w.symbol)} style={{
                  width: "100%", padding: "5px 0",
                  background: copied === w.symbol ? "color-mix(in srgb,var(--clr-accent) 12%,transparent)" : "var(--clr-surface)",
                  border: "1px solid var(--clr-border)", borderRadius: 8,
                  fontSize: "0.7rem", fontWeight: 600, cursor: "pointer",
                  color: copied === w.symbol ? "var(--clr-accent)" : "var(--clr-text-3)",
                }}>
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
