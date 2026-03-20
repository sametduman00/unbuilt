"use client";
import Link from "next/link";

const PACKAGES = [
  {
    slug: "starter",
    name: "Starter",
    price: "$1.99",
    credits: 5,
    perQuery: "$0.40",
    highlight: false,
    lsUrl: "#", // Lemon Squeezy checkout URL buraya gelecek
  },
  {
    slug: "popular",
    name: "Popular",
    price: "$3.99",
    credits: 10,
    perQuery: "$0.40",
    highlight: true,
    lsUrl: "#",
  },
  {
    slug: "pro",
    name: "Pro",
    price: "$8.99",
    credits: 25,
    perQuery: "$0.36",
    highlight: false,
    lsUrl: "#",
  },
];

const TOOLS = [
  {
    id: "pulse",
    label: "ALWAYS FREE",
    name: "Pulse",
    description: "Browse trending products — no credits needed, ever.",
    features: [
      "Product Hunt & App Store — daily",
      "AI breakdown: WHAT it does · DIFF · MISS",
      "Topic & category filters",
      "No account required",
      "Unlimited browsing",
      "Updated every 24 hours",
    ],
  },
  {
    id: "gap",
    label: "1 FREE QUERY",
    name: "Gap Analysis",
    description: "Find market gaps before you build. First query on us.",
    features: [
      "Live Google & YouTube search",
      "Real competitor breakdown",
      "Market gap identification",
      "Unlimited queries",
      "Structured, export-ready output",
      "Works on any niche or idea",
    ],
  },
  {
    id: "stack",
    label: "1 FREE QUERY",
    name: "Stack Advisor",
    description: "Get your full tech roadmap. First query on us.",
    features: [
      "123+ tools with live pricing",
      "Budget-matched recommendations",
      "Phase-by-phase build plan",
      "Time-to-MVP estimate",
      "Common mistake warnings",
      "Tool alternatives included",
    ],
  },
];

const WHY_BOX = {
  model: "Claude Opus 4.6",
  thinking: "Extended Thinking",
  inputCost: "$5",
  outputCost: "$25",
  costPerQuery: "~$0.45",
  yourPrice: "$0.40",
};

export default function PricingPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--clr-bg)",
        padding: "80px 24px 80px",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      {/* ── Header ── */}
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "var(--clr-accent)", textTransform: "uppercase", marginBottom: 12 }}>
          Pricing
        </p>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: "var(--clr-text)", lineHeight: 1.2, marginBottom: 16 }}>
          Start free. Pay only when you need more.
        </h1>
        <p style={{ fontSize: 16, color: "var(--clr-muted)", maxWidth: 520, margin: "0 auto" }}>
          Every account gets 2 free queries — 1 Gap Analysis + 1 Stack Advisor.
          Pulse is always free. When you need more, buy a credit pack.
        </p>
      </div>

      {/* ── Why so expensive? honest box ── */}
      <div
        style={{
          background: "var(--clr-surface)",
          border: "1px solid var(--clr-border)",
          borderRadius: 12,
          padding: "20px 24px",
          marginBottom: 48,
          display: "flex",
          gap: 24,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1, minWidth: 220 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "var(--clr-accent)", textTransform: "uppercase", marginBottom: 6 }}>
            Why does a query cost $0.40?
          </p>
          <p style={{ fontSize: 14, color: "var(--clr-muted)", lineHeight: 1.6, margin: 0 }}>
            We use <strong style={{ color: "var(--clr-text)" }}>Claude Opus 4.6 with Extended Thinking</strong> — Anthropic's most capable model with deep reasoning. Every query runs a full analysis, not a shortcut. The real cost to us is ~$0.45. You pay $0.40.
          </p>
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { label: "Model", value: "Opus 4.6" },
            { label: "Mode", value: "Extended Thinking" },
            { label: "Our cost", value: "~$0.45" },
            { label: "You pay", value: "$0.40" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "var(--clr-bg)",
                border: "1px solid var(--clr-border)",
                borderRadius: 8,
                padding: "10px 16px",
                textAlign: "center",
                minWidth: 80,
              }}
            >
              <div style={{ fontSize: 11, color: "var(--clr-muted)", marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--clr-text)" }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Credit packs ── */}
      <div style={{ marginBottom: 64 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--clr-text)", marginBottom: 24, textAlign: "center" }}>
          Credit packs
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.slug}
              style={{
                background: "var(--clr-surface)",
                border: pkg.highlight ? "2px solid var(--clr-accent)" : "1px solid var(--clr-border)",
                borderRadius: 12,
                padding: "24px 20px",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {pkg.highlight && (
                <div
                  style={{
                    position: "absolute",
                    top: -1,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--clr-accent)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 12px",
                    borderRadius: "0 0 8px 8px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Most popular
                </div>
              )}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--clr-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                  {pkg.name}
                </div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "var(--clr-text)", lineHeight: 1 }}>
                  {pkg.price}
                </div>
                <div style={{ fontSize: 13, color: "var(--clr-muted)", marginTop: 6 }}>
                  {pkg.credits} queries · {pkg.perQuery}/query
                </div>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  `${pkg.credits} queries (Gap or Stack)`,
                  "Works across all tools",
                  "No expiry",
                  "Instant delivery",
                ].map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--clr-muted)" }}>
                    <span style={{ color: "var(--clr-accent)", fontWeight: 700, marginTop: 1 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={pkg.lsUrl}
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "11px 0",
                  borderRadius: 8,
                  background: pkg.highlight ? "var(--clr-accent)" : "transparent",
                  border: pkg.highlight ? "none" : "1px solid var(--clr-border)",
                  color: pkg.highlight ? "#fff" : "var(--clr-text)",
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: "none",
                  marginTop: "auto",
                }}
              >
                Buy {pkg.name}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tool cards ── */}
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--clr-text)", marginBottom: 24, textAlign: "center" }}>
        What's included
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 64 }}>
        {TOOLS.map((tool) => (
          <div
            key={tool.id}
            style={{
              background: "var(--clr-surface)",
              border: "1px solid var(--clr-border)",
              borderRadius: 12,
              padding: "20px",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--clr-accent)", textTransform: "uppercase", marginBottom: 6 }}>
              {tool.label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--clr-text)", marginBottom: 6 }}>
              {tool.name}
            </div>
            <div style={{ fontSize: 13, color: "var(--clr-muted)", marginBottom: 16, lineHeight: 1.5 }}>
              {tool.description}
            </div>
            <div style={{ borderTop: "1px solid var(--clr-border)", paddingTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--clr-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                Included
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {tool.features.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "var(--clr-muted)" }}>
                    <span style={{ color: "var(--clr-accent)", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* ── Donate section ── */}
      <div
        style={{
          textAlign: "center",
          borderTop: "1px solid var(--clr-border)",
          paddingTop: 40,
        }}
      >
        <p style={{ fontSize: 16, fontWeight: 600, color: "var(--clr-text)", marginBottom: 8 }}>
          Unbuilt is free. Your barista isn't. Donate if we saved you time.
        </p>
        <p style={{ fontSize: 14, color: "var(--clr-muted)", marginBottom: 24 }}>
          No subscription, no ads, no paywalls on core features. We keep it open.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
          {[
            { symbol: "BTC",  name: "Bitcoin",  addr: "bc1q9fjlxn39vs9sfurekgjd7p4qx9yzj4kulqe580", color: "#F7931A", qr: "/qr/btc.jpeg" },
            { symbol: "ETH",  name: "Ethereum", addr: "0x60d601C0CcF6A27f5BB00066FCAE8c7208a8Fac8", color: "#627EEA", qr: "/qr/eth.jpeg" },
            { symbol: "SOL",  name: "Solana",   addr: "3oXApv9hQC2UUtoVKb29gLtW61SRdsT9mpfzKvM4jjgM", color: "#9945FF", qr: "/qr/sol.jpeg" },
            { symbol: "USDT", name: "Tether",   addr: "0x60d601C0CcF6A27f5BB00066FCAE8c7208a8Fac8", color: "#26A17B", qr: "/qr/usdt.jpeg" },
            { symbol: "XRP",  name: "XRP",      addr: "rPMvhnSuaw82TqEMPNffBVhj5yJTxZyv9Y", color: "#346AA9", qr: "/qr/xrp.jpeg" },
          ].map((wallet) => (
            <div
              key={wallet.symbol}
              style={{
                background: "var(--clr-surface)",
                border: "1px solid var(--clr-border)",
                borderRadius: 12,
                padding: "16px 12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: wallet.color, display: "inline-block" }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--clr-text)" }}>{wallet.symbol}</span>
                <span style={{ fontSize: 11, color: "var(--clr-muted)" }}>{wallet.name}</span>
              </div>
              <img src={wallet.qr} alt={`${wallet.symbol} QR`} style={{ width: 90, height: 90, borderRadius: 6 }} />
              <div
                style={{
                  fontSize: 9,
                  fontFamily: "monospace",
                  color: "var(--clr-muted)",
                  wordBreak: "break-all",
                  textAlign: "center",
                  lineHeight: 1.4,
                }}
              >
                {wallet.addr}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(wallet.addr)}
                style={{
                  fontSize: 11,
                  padding: "5px 12px",
                  borderRadius: 6,
                  border: "1px solid var(--clr-border)",
                  background: "transparent",
                  color: "var(--clr-muted)",
                  cursor: "pointer",
                }}
              >
                Copy
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
