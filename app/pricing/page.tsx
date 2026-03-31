"use client";
import { useUser, SignInButton, useClerk } from "@clerk/nextjs";
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
  const { openSignIn } = useClerk();
  const [paddleReady, setPaddleReady] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.onload = () => {
      if (!(window as any).Paddle) return;
      (window as any).Paddle.Initialize({
        token: "live_52661022360279de7c131bad447",
        eventCallback: (ev: any) => {
          if (ev.name === "checkout.closed") { document.body.style.overflow = ""; }
        },
      });
      setPaddleReady(true);
    };
    document.head.appendChild(script);
  }, []);

  const handleBuy = (pkg: typeof PACKAGES[0]) => {
    if (!isSignedIn) { openSignIn(); return; }
    if (!(window as any).Paddle) return;
    window.scrollTo({ top: 0, behavior: "instant" });
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
    <main className="pricing-main" style={{ minHeight: "100vh", background: "var(--clr-bg)", padding: "32px 24px 80px", maxWidth: 860, margin: "0 auto" }}>

      {/* ── Header ── */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <p style={{ ...s.label, color: "var(--clr-text-4)", marginBottom: 14 }}>Pricing</p>
        <h1 style={{ fontSize: "1.625rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15, margin: "0 0 14px" }}>
          Pulse is free.<br />
          <span style={{ color: "var(--clr-text-3)", fontWeight: 400, fontStyle: "italic" }}>Dig and Stack cost 1 credit each.</span>
        </h1>
        <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--clr-text-2)", margin: "0 auto", whiteSpace: "normal" as const }}>
          No subscription · No monthly fee · Credits never expire · Buy when you need, use when you want.
        </p>
      </div>

      {/* ── Credit packs ── */}
      <div style={{ marginBottom: 10 }}>
        <div className="pricing-packs-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
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
              <button onClick={() => handleBuy(pkg)} style={{ display: "block", width: "100%", padding: "11px 0", borderRadius: 9, fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 700, cursor: "pointer", background: pkg.highlight ? "#7c6fff" : "transparent", border: pkg.highlight ? "none" : "1px solid var(--clr-border)", color: pkg.highlight ? "#fff" : "var(--clr-text)" }}>
                {isSignedIn ? `Buy ${pkg.credits} credits` : "Sign in to buy"}
              </button>
            </div>
          ))}
        </div>
        {/* Trust badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14, flexWrap: "wrap" as const }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--clr-text-4)" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span style={{ fontSize: "0.75rem", color: "var(--clr-text-4)" }}>Secure checkout via</span>
          <a href="https://www.paddle.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0C1F3D", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="13" height="13" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#0C1F3D"/><path d="M9 8h7.5c3.5 0 6 2.2 6 5.5s-2.5 5.5-6 5.5H12v5H9V8zm3 8.5h4.5c1.8 0 3-1 3-3s-1.2-3-3-3H12v6z" fill="#fff"/></svg>
            Paddle
          </a>
          <span style={{ color: "var(--clr-text-5)", fontSize: "0.75rem" }}>·</span>
          <span style={{ fontSize: "0.75rem", color: "var(--clr-text-4)" }}>Credits never expire</span>
          <span style={{ color: "var(--clr-text-5)", fontSize: "0.75rem" }}>·</span>
          <span style={{ fontSize: "0.75rem", color: "var(--clr-text-4)" }}>Instant delivery</span>
        </div>
      </div>

      {/* ── Why the price ── */}
      <div style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 14, padding: "20px 24px", marginBottom: 32 }}>
        <p style={{ fontSize: "0.9375rem", fontWeight: 800, letterSpacing: "-0.01em", color: "var(--clr-text)", textAlign: "center", marginBottom: 16 }}>Why does a credit cost $0.80–$1.00?</p>
        <div className="pricing-why-flex" style={{ display: "flex", gap: 24, flexWrap: "wrap" as const, alignItems: "stretch" }}>
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
        <div className="pricing-credits-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
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
        <div className="pricing-wallets-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap" as const }}>
            {/* Paddle */}
            <a href="https://www.paddle.com" target="_blank" rel="noopener noreferrer" style={{ height: 36, padding: "0 14px", borderRadius: 7, border: "1px solid var(--clr-border)", background: "#fff", display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#0C1F3D"/><path d="M9 8h7.5c3.5 0 6 2.2 6 5.5s-2.5 5.5-6 5.5H12v5H9V8zm3 8.5h4.5c1.8 0 3-1 3-3s-1.2-3-3-3H12v6z" fill="#fff"/></svg>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0C1F3D", fontFamily: "inherit" }}>Paddle</span>
            </a>
            {/* Visa */}
            <div style={{ height: 36, padding: "0 14px", borderRadius: 7, border: "1px solid var(--clr-border)", background: "#fff", display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "#1A1F71", fontStyle: "italic", letterSpacing: "0.04em", fontFamily: "Georgia, serif" }}>VISA</span>
            </div>
            {/* Mastercard */}
            <div style={{ height: 36, padding: "0 14px", borderRadius: 7, border: "1px solid var(--clr-border)", background: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ position: "relative", width: 34, height: 22, display: "flex", alignItems: "center" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#EB001B", position: "absolute", left: 0 }} />
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#F79E1B", position: "absolute", left: 12, opacity: 0.9 }} />
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#333", fontFamily: "inherit" }}>Mastercard</span>
            </div>
            {/* PayPal */}
            <div style={{ height: 36, padding: "0 14px", borderRadius: 7, border: "1px solid var(--clr-border)", background: "#fff", display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 800, fontFamily: "inherit" }}>
                <span style={{ color: "#003087" }}>Pay</span><span style={{ color: "#009CDE" }}>Pal</span>
              </span>
            </div>
            {/* Amex */}
            <div style={{ height: 36, padding: "0 14px", borderRadius: 7, border: "none", background: "#016FD0", display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#fff", letterSpacing: "0.06em", fontFamily: "inherit" }}>AMEX</span>
            </div>
            {/* SSL */}
            <div style={{ height: 36, padding: "0 14px", borderRadius: 7, border: "1px solid #bbf7d0", background: "#f0fdf4", display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="12" height="14" viewBox="0 0 12 14" fill="none"><path d="M6 0.5L1 2.5v4C1 9.5 3.2 12.3 6 13.2 8.8 12.3 11 9.5 11 6.5v-4L6 0.5z" fill="#16a34a" opacity=".25" stroke="#16a34a" strokeWidth="1"/><path d="M4 7l1.5 1.5L8 5.5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#16a34a", fontFamily: "inherit" }}>SSL Secured</span>
            </div>
          </div>
        </div>

        {/* Legal docs */}
        <div className="pricing-legal-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
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
