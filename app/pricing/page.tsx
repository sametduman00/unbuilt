"use client";
import { useUser, SignInButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";

const PACKAGES = [
  {
    slug: "starter",
    name: "Starter",
    price: "$4.99",
    credits: 5,
    perCredit: "$1.00",
    paddlePriceId: "pri_01km8znr6vfjy12bhkrgxcqky8",
    highlight: false,
    badge: null as string | null,
    hook: "Try it out",
    hookSub: "Run 5 full analyses. Find one gap, save months.",
    perks: ["5 Dig or Stack reports","Credits never expire","Instant delivery","Full 10-section Dig reports","Full 4-phase Stack plans"],
  },
  {
    slug: "popular",
    name: "Popular",
    price: "$8.99",
    credits: 10,
    perCredit: "$0.90",
    paddlePriceId: "pri_01km8zvgagyf8qaxhe8ds1cmh3",
    highlight: true,
    badge: "BEST VALUE" as string | null,
    hook: "Most founders pick this",
    hookSub: "10 reports. Enough to validate an idea end-to-end.",
    perks: ["10 Dig or Stack reports","Credits never expire","Instant delivery","Full 10-section Dig reports","Full 4-phase Stack plans"],
  },
  {
    slug: "pro",
    name: "Pro",
    price: "$19.99",
    credits: 25,
    perCredit: "$0.80",
    paddlePriceId: "pri_01km8ztv9kx85hwtzepp4b1enf",
    highlight: false,
    badge: null as string | null,
    hook: "Building seriously?",
    hookSub: "25 reports. Research multiple ideas, compare markets.",
    perks: ["25 Dig or Stack reports","Credits never expire","Instant delivery","Full 10-section Dig reports","Full 4-phase Stack plans"],
  },
];

const WALLETS = [
  { symbol: "BTC",  name: "Bitcoin",  addr: "bc1q9fjlxn39vs9sfurekgjd7p4qx9yzj4kulqe580",         color: "#F7931A", qr: "/qr/btc.jpeg"  },
  { symbol: "ETH",  name: "Ethereum", addr: "0x60d601C0CcF6A27f5BB00066FCAE8c7208a8Fac8",          color: "#627EEA", qr: "/qr/eth.jpeg"  },
  { symbol: "SOL",  name: "Solana",   addr: "3oXApv9hQC2UUtoVKb29gLtW61SRdsT9mpfzKvM4jjgM",       color: "#9945FF", qr: "/qr/sol.jpeg"  },
  { symbol: "USDT", name: "Tether",   addr: "0x60d601C0CcF6A27f5BB00066FCAE8c7208a8Fac8",          color: "#26A17B", qr: "/qr/usdt.jpeg" },
  { symbol: "XRP",  name: "XRP",      addr: "rPMvhnSuaw82TqEMPNffBVhj5yJTxZyv9Y",                  color: "#346AA9", qr: "/qr/xrp.jpeg"  },
];

export default function PricingPage() {
  const { isSignedIn, user } = useUser();
  const [paddleReady, setPaddleReady] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.onload = () => {
      if (!(window as any).Paddle) return;
      (window as any).Paddle.Initialize({ token: "live_52661022360279de7c131bad447" });
      setPaddleReady(true);
    };
    document.head.appendChild(script);
  }, []);

  const handleBuy = (pkg: typeof PACKAGES[0]) => {
    if (!isSignedIn || !paddleReady || !(window as any).Paddle) return;
    (window as any).Paddle.Checkout.open({
      items: [{ priceId: pkg.paddlePriceId, quantity: 1 }],
      customData: { user_id: user?.id ?? "", package_slug: pkg.slug },
    });
  };

  const copyAddr = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    setTimeout(() => setCopied(null), 2000);
  };

  const s = {
    label: { fontSize: 11, fontWeight: 800, letterSpacing: "0.08em" as const, textTransform: "uppercase" as const, color: "var(--clr-text-5)", marginBottom: 10 } as React.CSSProperties,
    muted: { fontSize: "0.775rem", color: "var(--clr-text-3)", lineHeight: 1.6 } as React.CSSProperties,
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--clr-bg)", padding: "32px 24px 80px", maxWidth: 860, margin: "0 auto" }}>

      {/* ── Header ── */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <p style={{ ...s.label, color: "var(--clr-text-4)", marginBottom: 14 }}>Pricing</p>
        <h1 style={{ fontSize: "1.625rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15, margin: "0 0 14px" }}>
          Pulse is free.<br />
          <span style={{ color: "var(--clr-text-3)", fontWeight: 400, fontStyle: "italic" }}>Dig and Stack cost 1 credit each.</span>
        </h1>
        <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--clr-text-2)", margin: "0 auto", whiteSpace: "nowrap" as const }}>
          No subscription · No monthly fee · Credits never expire · Buy when you need, use when you want.
        </p>
      </div>

      {/* ── Credit packs ── */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {PACKAGES.map((pkg) => (
            <div key={pkg.slug} style={{
              background: "var(--clr-surface)",
              border: pkg.highlight ? "2px solid #7c6fff" : "1px solid var(--clr-border)",
              borderRadius: 14,
              padding: "24px 20px 20px",
              position: "relative",
              display: "flex",
              flexDirection: "column",
            }}>
              {pkg.badge && (
                <div style={{ position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)", background: "#7c6fff", color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 12px", borderRadius: "0 0 8px 8px", letterSpacing: "0.08em" }}>
                  {pkg.badge}
                </div>
              )}
              {/* Hook */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: pkg.highlight ? "#7c6fff" : "var(--clr-text-4)", marginBottom: 2 }}>{pkg.hook}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--clr-text-4)", lineHeight: 1.45 }}>{pkg.hookSub}</div>
              </div>
              {/* Price */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--clr-text)", letterSpacing: "-0.03em", lineHeight: 1 }}>{pkg.price}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--clr-text-4)", marginTop: 4 }}>{pkg.credits} credits · {pkg.perCredit} each</div>
              </div>
              {/* Perks */}
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                {pkg.perks.map((p) => (
                  <li key={p} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: "0.75rem", color: "var(--clr-text-3)" }}>
                    <span style={{ color: pkg.highlight ? "#7c6fff" : "var(--clr-text-5)", fontWeight: 800, flexShrink: 0, marginTop: 1 }}>✓</span>{p}
                  </li>
                ))}
              </ul>
              {/* CTA */}
              {isSignedIn ? (
                <button onClick={() => handleBuy(pkg)} style={{ display: "block", width: "100%", padding: "11px 0", borderRadius: 9, fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 700, cursor: "pointer", background: pkg.highlight ? "#7c6fff" : "transparent", border: pkg.highlight ? "none" : "1px solid var(--clr-border)", color: pkg.highlight ? "#fff" : "var(--clr-text)" }}>
                  Buy {pkg.credits} credits
                </button>
              ) : (
                <SignInButton mode="modal">
                  <button style={{ display: "block", width: "100%", padding: "11px 0", borderRadius: 9, fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 700, cursor: "pointer", background: pkg.highlight ? "#7c6fff" : "transparent", border: pkg.highlight ? "none" : "1px solid var(--clr-border)", color: pkg.highlight ? "#fff" : "var(--clr-text)" }}>
                    Sign in to buy
                  </button>
                </SignInButton>
              )}
            </div>
          ))}
        </div>
        {/* Trust badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14, flexWrap: "wrap" as const }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--clr-text-4)" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span style={{ fontSize: "0.75rem", color: "var(--clr-text-4)" }}>Secure checkout via</span>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#e67e22" }}>🍋 Lemon Squeezy</span>
          <span style={{ color: "var(--clr-text-5)", fontSize: "0.75rem" }}>·</span>
          <span style={{ fontSize: "0.75rem", color: "var(--clr-text-4)" }}>Credits never expire</span>
          <span style={{ color: "var(--clr-text-5)", fontSize: "0.75rem" }}>·</span>
          <span style={{ fontSize: "0.75rem", color: "var(--clr-text-4)" }}>Instant delivery</span>
        </div>
      </div>

      {/* ── Why the price ── */}
      <div style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 14, padding: "20px 24px", marginBottom: 32 }}>
        <p style={{ fontSize: "0.9375rem", fontWeight: 800, letterSpacing: "-0.01em", color: "var(--clr-text)", textAlign: "center", marginBottom: 16 }}>Why does a credit cost $0.80–$1.00?</p>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" as const, alignItems: "stretch" }}>
          {/* Left */}
          <div style={{ flex: 1, minWidth: 220, display: "flex", flexDirection: "column" as const, gap: 12 }}>
            <p style={{ ...s.muted, margin: 0 }}>
              Every query runs on <strong style={{ color: "var(--clr-text)" }}>Claude Opus 4.6 with Extended Thinking</strong> — Anthropic's most capable model. No cheaper shortcuts, no batching, no caching tricks.
            </p>
            <p style={{ ...s.muted, margin: 0 }}>
              Don't take our word for it — verify the numbers yourself with{" "}
              <a href="https://www.anthropic.com/pricing" target="_blank" rel="noopener noreferrer" style={{ color: "var(--clr-text)", fontWeight: 600 }}>
                Anthropic's official pricing ↗
              </a>
            </p>
            <div style={{ marginTop: "auto", paddingTop: 8, borderTop: "1px solid var(--clr-border)", display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--clr-text-4)" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span style={{ fontSize: "0.75rem", color: "var(--clr-text-4)" }}>We show our math. You check it. That's the deal.</span>
            </div>
          </div>
          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ background: "var(--clr-bg)", border: "1px solid var(--clr-border)", borderRadius: 10, padding: "14px 18px", minWidth: 250 }}>
            <p style={{ ...s.label, marginBottom: 10 }}>Cost per query</p>
            {[
              ["~20,000 input tokens", "× $15/1M", "= $0.30"],
              ["~5,000 output tokens", "× $75/1M", "= $0.375"],
            ].map(([a, b, c]) => (
              <div key={a} style={{ display: "flex", gap: 6, fontSize: "0.75rem", fontFamily: "monospace", marginBottom: 4 }}>
                <span style={{ color: "var(--clr-text-3)", flex: 1 }}>{a}</span>
                <span style={{ color: "var(--clr-text-4)" }}>{b}</span>
                <span style={{ color: "var(--clr-text)", fontWeight: 700, minWidth: 52, textAlign: "right" as const }}>{c}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid var(--clr-border)", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontFamily: "monospace" }}>
              <span style={{ color: "var(--clr-text-3)" }}>Our total cost</span>
              <span style={{ color: "var(--clr-text)", fontWeight: 800 }}>~$0.675</span>
            </div>
            <p style={{ fontSize: 10, color: "var(--clr-text-5)", margin: "6px 0 0", fontStyle: "italic" }}>
              The rest: hosting, search APIs, infrastructure.
            </p>
          </div>
          </div>
        </div>
      </div>

      {/* ── What 1 credit gets you ── */}
      <div style={{ marginTop: 36, marginBottom: 48 }}>
        <p style={{ ...s.label, textAlign: "center", marginBottom: 20 }}>What 1 credit gets you</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          {[
            { name: "Pulse", badge: "FREE", badgeColor: "#ef4444", iconColor: "#ef4444", iconPath: "pulse",
              desc: "Live feed of today's launches with AI analysis of what each product is missing.",
              items: ["WHAT · DIFF · MISS per product","Product Hunt + App Store","Topic filters","'Dig my angle' shortcut","Updated daily"] },
            { name: "Dig", badge: "1 CREDIT", badgeColor: "#7c6fff", iconColor: "#7c6fff", iconPath: "dig",
              desc: "Full market intelligence report on your idea — 70+ live sources, 10 sections.",
              items: ["Market score 0–100","Real competitor apps (both stores)","Pain points from Reddit / X / YouTube","TAM / SAM / SOM sizing","Validation checklist + financial model","PDF export"] },
            { name: "Stack", badge: "1 CREDIT", badgeColor: "#38bdf8", iconColor: "#38bdf8", iconPath: "stack",
              desc: "Phased build plan with exact tools, pricing, and step-by-step setup instructions.",
              items: ["4 phases: Validate → MVP → Growth → Scale","Tool cards with real pricing","Vibe Guide: copy-paste prompts","Mistake warnings","Upgrade triggers","PDF export"] },
          ].map((t) => (
            <div key={t.name} style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 12, padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: `${t.iconColor}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {t.iconPath === "pulse" && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={t.iconColor} strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
                  {t.iconPath === "dig"   && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={t.iconColor} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>}
                  {t.iconPath === "stack" && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={t.iconColor} strokeWidth="2" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>}
                </div>
                <div>
                  <div style={{ fontSize: "0.8125rem", fontWeight: 700 }}>{t.name}</div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: t.badgeColor, letterSpacing: ".06em" }}>{t.badge}</div>
                </div>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--clr-text-3)", lineHeight: 1.5, margin: "0 0 10px" }}>{t.desc}</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                {t.items.map((f) => (
                  <li key={f} style={{ fontSize: "0.7rem", color: "var(--clr-text-4)", display: "flex", gap: 5 }}>
                    <span style={{ color: t.iconColor, flexShrink: 0 }}>→</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Donate ── */}
      <div style={{ borderTop: "1px solid var(--clr-border)", paddingTop: 48 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--clr-text)", margin: "0 0 6px" }}>Support the project</p>
          <p style={{ ...s.muted, maxWidth: 380, margin: "0 auto" }}>
            If Unbuilt saved you time or money, a crypto tip goes directly to keeping it running. No pressure, genuinely appreciated.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
          {WALLETS.map((w) => (
            <div key={w.symbol} style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 12, padding: "14px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: w.color, display: "inline-block", flexShrink: 0 }} />
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--clr-text)" }}>{w.symbol}</span>
                <span style={{ fontSize: 10, color: "var(--clr-text-4)" }}>{w.name}</span>
              </div>
              <img src={w.qr} alt={`${w.symbol} QR`} style={{ width: 88, height: 88, borderRadius: 6 }} />
              <div style={{ fontSize: 8, fontFamily: "monospace", color: "var(--clr-text-5)", wordBreak: "break-all" as const, textAlign: "center" as const, lineHeight: 1.4 }}>
                {w.addr}
              </div>
              <button onClick={() => copyAddr(w.addr)} style={{ fontSize: 11, padding: "4px 12px", borderRadius: 5, border: "1px solid var(--clr-border)", background: "transparent", color: copied === w.addr ? "var(--clr-text)" : "var(--clr-text-4)", cursor: "pointer", fontFamily: "inherit", fontWeight: copied === w.addr ? 700 : 400 }}>
                {copied === w.addr ? "Copied ✓" : "Copy"}
              </button>
            </div>
          ))}
        </div>
      </div>


      {/* ── Footer ── */}
      <div style={{ borderTop: "1px solid var(--clr-border)", paddingTop: 36, marginTop: 48 }}>

        {/* Payment logos */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" as const, color: "var(--clr-text-5)", marginBottom: 14 }}>Secure payment</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" as const }}>
            {/* Lemon Squeezy */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "1px solid var(--clr-border)", background: "var(--clr-surface)" }}>
              <span style={{ fontSize: 16 }}>🍋</span>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#e67e22" }}>Lemon Squeezy</span>
            </div>
            {/* Visa */}
            <div style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--clr-border)", background: "var(--clr-surface)", display: "flex", alignItems: "center" }}>
              <svg height="20" viewBox="0 0 72 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M32.2 0L27.9 24H22.8L27.1 0H32.2Z" fill="#1A1F71"/>
                <path d="M52.6 0.4C51.5 0 49.8-0.1 47.8 0C42.4 0 38.5 2.8 38.5 6.8C38.4 9.8 41.2 11.4 43.3 12.4C45.4 13.4 46.1 14 46.1 14.9C46.1 16.2 44.4 16.8 42.8 16.8C40.6 16.8 39.4 16.5 37.6 15.7L36.9 15.4L36.1 20.1C37.4 20.7 39.7 21.2 42.1 21.2C47.9 21.2 51.7 18.4 51.7 14.1C51.7 11.7 50.2 9.9 47 8.4C45.1 7.5 43.9 6.8 43.9 5.9C43.9 5.1 44.8 4.2 46.9 4.2C48.6 4.2 49.9 4.5 50.9 4.9L51.4 5.1L52.6 0.4Z" fill="#1A1F71"/>
                <path d="M62 0H57.9C56.7 0 55.8 0.3 55.3 1.6L47 24H52.8L54 20.5H61L61.7 24H66.9L62 0ZM55.5 16.5C55.8 15.6 57.8 10.1 57.8 10.1C57.8 10.1 58.3 8.7 58.6 7.8L59 10C59 10 60 15.2 60.2 16.5H55.5Z" fill="#1A1F71"/>
                <path d="M22.1 0L16.7 16.4L16.1 13.5C15 10.2 11.9 6.6 8.5 4.8L13.5 24H19.3L28.1 0H22.1Z" fill="#1A1F71"/>
                <path d="M11.6 0H2.6L2.5 0.4C9.6 2.2 14.3 6.4 16.1 13.5L14.2 1.7C13.9 0.3 13 0 11.6 0Z" fill="#F9A533"/>
              </svg>
            </div>
            {/* Mastercard */}
            <div style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--clr-border)", background: "var(--clr-surface)", display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#EB001B" }} />
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#F79E1B", marginLeft: -8 }} />
            </div>
            {/* PayPal */}
            <div style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--clr-border)", background: "var(--clr-surface)", display: "flex", alignItems: "center" }}>
              <svg height="18" viewBox="0 0 101 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.237 2.6H5.737C5.237 2.6 4.837 2.9 4.737 3.4L2.137 19.5C2.037 19.9 2.337 20.2 2.737 20.2H5.937C6.437 20.2 6.837 19.9 6.937 19.4L7.637 15C7.737 14.5 8.137 14.2 8.637 14.2H10.737C15.037 14.2 17.537 12.1 18.237 7.9C18.537 6.1 18.237 4.7 17.337 3.7C16.337 2.7 14.537 2.6 12.237 2.6Z" fill="#253D80"/>
                <path d="M18.237 7.9C17.537 12.1 15.037 14.2 10.737 14.2H8.637C8.137 14.2 7.737 14.5 7.637 15L6.637 21.2L6.337 23C6.237 23.4 6.537 23.7 6.937 23.7H9.737C10.237 23.7 10.537 23.4 10.637 23L11.237 19.3C11.337 18.8 11.737 18.5 12.237 18.5H13.937C17.737 18.5 19.937 16.7 20.537 13C20.837 11.5 20.637 10.2 19.937 9.3C19.437 8.7 18.937 8.2 18.237 7.9Z" fill="#179BD7"/>
              </svg>
            </div>
            {/* Amex */}
            <div style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--clr-border)", background: "#016FD0", display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#fff", letterSpacing: ".04em" }}>AMEX</span>
            </div>
            {/* SSL badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 8, border: "1px solid var(--clr-border)", background: "var(--clr-surface)" }}>
              <svg width="12" height="14" viewBox="0 0 24 28" fill="none"><path d="M12 1L2 5.5v7C2 18.5 6.5 23.7 12 25.5 17.5 23.7 22 18.5 22 12.5v-7L12 1z" fill="#22c55e" opacity=".2" stroke="#22c55e" strokeWidth="1.5"/><path d="M8 14l3 3 5-6" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#22c55e" }}>SSL Secured</span>
            </div>
          </div>
        </div>

        {/* Legal docs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            ["/legal/terms-of-service", "Terms of Service"],
            ["/legal/privacy-policy", "Privacy Policy"],
            ["/legal/refund-policy", "Refund Policy"],
            ["/legal/cookie-policy", "Cookie Policy"],
            ["/legal/acceptable-use", "Acceptable Use"],
            ["/legal/ai-transparency", "AI Transparency"],
            ["/legal/disclaimer", "Disclaimer"],
            ["/legal/do-not-sell", "Do Not Sell My Info"],
          ].map(([href, label]) => (
            <a key={href} href={href} style={{ display: "block", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--clr-border)", background: "var(--clr-surface)", fontSize: "0.75rem", color: "var(--clr-text-3)", textDecoration: "none", textAlign: "center" as const, fontWeight: 500, transition: "color 0.1s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--clr-text)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--clr-text-3)")}
            >
              {label}
            </a>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: "0.7rem", color: "var(--clr-text-5)", marginTop: 16 }}>
          © {new Date().getFullYear()} Unbuilt. All rights reserved.
        </p>
      </div>
    </main>
  );
}
