"use client";
import GlobalHeader from "../components/GlobalHeader";
import { useState } from "react";

const features = [
  { category: "Pulse", items: ["Product Hunt feed — daily", "App Store feed — daily", "AI analysis per product (WHAT / DIFF / MISS)", "Unlimited browsing", "Topic filters", "Search across launches"] },
  { category: "Gap Analysis", items: ["Live Google & YouTube search", "Competitor breakdown", "Market gap identification", "Brutally honest scoring", "Export-ready structured output", "Unlimited queries"] },
  { category: "Stack Advisor", items: ["Full database of 123+ tools with March 2026 pricing", "Budget-matched recommendations", "Phase-by-phase build plan", "Time-to-MVP estimate", "Common mistake warnings", "Tool alternatives per recommendation"] },
];

const wallets = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    color: "#F7931A",
    address: "bc1q9fjlxn39vs9sfurekgjd7p4qx9yzj4kulqe580",
    qrUrl: "/qr/btc.png",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    color: "#627EEA",
    address: "0x60d601C0CcF6A27f5BB00066FCAE8c7208a8Fac8",
    qrUrl: "/qr/eth.png",
  },
  {
    symbol: "SOL",
    name: "Solana",
    color: "#9945FF",
    address: "3oXApv9hQC2UUtoVKb29gLtW61SRdsT9mpfzKvM4jjgM",
    qrUrl: "/qr/sol.png",
  },
  {
    symbol: "USDT",
    name: "Tether (ERC-20)",
    color: "#26A17B",
    address: "0x60d601C0CcF6A27f5BB00066FCAE8c7208a8Fac8",
    qrUrl: "/qr/usdt.png",
  },
  {
    symbol: "XRP",
    name: "Ripple",
    color: "#00AAE4",
    address: "rPMvhnSuaw82TqEMPNffBVhj5yJTxZyv9Y",
    qrUrl: "/qr/xrp.png",
  },
];

export default function PricingPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (address: string, symbol: string) => {
    navigator.clipboard.writeText(address);
    setCopied(symbol);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--clr-bg)", color: "var(--clr-text)" }}>
      <GlobalHeader />

      {/* Hero */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "140px 2rem 80px", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: "0.75rem", fontWeight: 600,
          letterSpacing: "0.1em", textTransform: "uppercase",
          color: "var(--clr-accent)",
          background: "color-mix(in srgb, var(--clr-accent) 10%, transparent)",
          padding: "0.3rem 0.875rem", borderRadius: 20, marginBottom: 32,
        }}>
          Pricing
        </div>

        <div style={{
          fontSize: "clamp(5rem, 14vw, 9rem)",
          fontWeight: 900,
          letterSpacing: "-0.06em",
          lineHeight: 0.9,
          color: "var(--clr-text)",
          marginBottom: 28,
        }}>
          $0
        </div>

        <p style={{
          fontSize: "1.25rem", fontWeight: 600,
          color: "var(--clr-text-2)", marginBottom: 16, letterSpacing: "-0.02em",
        }}>
          Every founder deserves honest data.
        </p>
        <p style={{
          fontSize: "1rem", color: "var(--clr-text-3)",
          lineHeight: 1.75, maxWidth: 500, margin: "0 auto 40px",
        }}>
          We're building in public. While we grow, everything is free —
          no limits, no catch, no credit card. Use Unbuilt as much as you want.
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {["Unlimited queries", "All 3 tools", "No account required for Pulse", "No rate limits"].map(tag => (
            <span key={tag} style={{
              padding: "0.375rem 1rem",
              border: "1px solid var(--clr-border)",
              borderRadius: 20, fontSize: "0.875rem",
              color: "var(--clr-text-3)", background: "var(--clr-surface)",
            }}>{tag}</span>
          ))}
        </div>
      </section>

      {/* Feature table */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "0 2rem 100px" }}>
        <div style={{ borderTop: "1px solid var(--clr-border)" }}>
          {features.map((f) => (
            <div key={f.category} style={{
              display: "grid",
              gridTemplateColumns: "200px 1fr",
              borderBottom: "1px solid var(--clr-border)",
            }}>
              <div style={{
                padding: "28px 24px 28px 0",
                borderRight: "1px solid var(--clr-border)",
              }}>
                <span style={{
                  fontSize: "0.75rem", fontWeight: 700,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  color: "var(--clr-accent)",
                }}>
                  {f.category}
                </span>
              </div>
              <div style={{ padding: "28px 0 28px 32px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {f.items.map(item => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ color: "var(--clr-accent)", fontSize: "0.875rem", flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: "0.9rem", color: "var(--clr-text-3)" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Donate section */}
      <section style={{
        borderTop: "1px solid var(--clr-border)",
        padding: "80px 2rem 120px",
      }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center", marginBottom: 64 }}>
          <h2 style={{
            fontSize: "1.75rem", fontWeight: 800,
            letterSpacing: "-0.04em", marginBottom: 16,
          }}>
            If Unbuilt helped you, pay it forward.
          </h2>
          <p style={{
            color: "var(--clr-text-3)", lineHeight: 1.75,
            fontSize: "0.9375rem", maxWidth: 500, margin: "0 auto",
          }}>
            We keep this free because we believe founders deserve better tools.
            If we saved you time, helped you avoid a bad idea, or pointed you
            toward the right stack — a small donation goes directly into
            server costs, API bills, and coffee.
          </p>
        </div>

        {/* Wallet grid */}
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 24,
        }}>
          {wallets.map((w) => (
            <div key={w.symbol} style={{
              border: "1px solid var(--clr-border)",
              borderRadius: 16,
              padding: "28px 20px 24px",
              background: "var(--clr-surface)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
            }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: w.color, display: "inline-block", flexShrink: 0,
                }} />
                <span style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{w.symbol}</span>
                <span style={{ fontSize: "0.8rem", color: "var(--clr-text-4)" }}>{w.name}</span>
              </div>

              {/* QR placeholder — gerçek QR kodları /public/qr/ klasörüne eklenecek */}
              <div style={{
                width: 140, height: 140,
                background: "#fff",
                borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", color: "#999",
                border: "1px solid #eee",
                padding: 8,
                flexShrink: 0,
              }}>
                <svg width="120" height="120" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <rect width="100" height="100" fill="white"/>
                  {/* QR corner squares */}
                  <rect x="5" y="5" width="30" height="30" fill="none" stroke="black" strokeWidth="3"/>
                  <rect x="10" y="10" width="20" height="20" fill="black"/>
                  <rect x="65" y="5" width="30" height="30" fill="none" stroke="black" strokeWidth="3"/>
                  <rect x="70" y="10" width="20" height="20" fill="black"/>
                  <rect x="5" y="65" width="30" height="30" fill="none" stroke="black" strokeWidth="3"/>
                  <rect x="10" y="70" width="20" height="20" fill="black"/>
                  {/* Symbol */}
                  <text x="50" y="58" textAnchor="middle" fontSize="14" fontWeight="bold" fill={w.color}>{w.symbol}</text>
                </svg>
              </div>

              {/* Address */}
              <div style={{
                fontSize: "0.65rem",
                color: "var(--clr-text-4)",
                wordBreak: "break-all",
                textAlign: "center",
                lineHeight: 1.5,
                fontFamily: "monospace",
                padding: "0 4px",
              }}>
                {w.address}
              </div>

              {/* Copy button */}
              <button
                onClick={() => handleCopy(w.address, w.symbol)}
                style={{
                  width: "100%",
                  padding: "0.45rem",
                  background: copied === w.symbol
                    ? "color-mix(in srgb, var(--clr-accent) 15%, transparent)"
                    : "var(--clr-bg)",
                  border: "1px solid var(--clr-border)",
                  borderRadius: 8,
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  color: copied === w.symbol ? "var(--clr-accent)" : "var(--clr-text-3)",
                  transition: "all 0.15s",
                }}
              >
                {copied === w.symbol ? "Copied!" : "Copy address"}
              </button>
            </div>
          ))}
        </div>

        <p style={{
          textAlign: "center",
          marginTop: 40,
          fontSize: "0.8125rem",
          color: "var(--clr-text-4)",
        }}>
          No pressure. Seriously. We just wanted to give you the option. 🙏
        </p>
      </section>
    </div>
  );
}
