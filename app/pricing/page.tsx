"use client";
import { useUser, SignInButton, useClerk } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import Script from "next/script";

const PLANS = [
  {
    slug: "pro",
    name: "Pro",
    price: "$9.99",
    period: "/mo",
    analyses: 10,
    paddlePriceId: "pri_01kppbg9wpd5xn5mx0wem71msn",
    highlight: true,
    badge: "MOST POPULAR" as string | null,
    hook: "Perfect for solo makers",
    hookSub: "10 full analyses per month. Enough to validate ideas end-to-end.",
  },
  {
    slug: "pro-plus",
    name: "Pro+",
    price: "$19.99",
    period: "/mo",
    analyses: 25,
    paddlePriceId: "pri_01kppbkmgk5a6nthnt1132zh85",
    highlight: false,
    badge: null as string | null,
    hook: "Building seriously?",
    hookSub: "25 analyses per month. Research multiple ideas, compare markets.",
  },
];

const ADDONS = [
  { slug: "addon-5", name: "5 extra analyses", price: "$4.99", analyses: 5, paddlePriceId: "pri_01km8znr6vfjy12bhkrgxcqky8" },
  { slug: "addon-10", name: "10 extra analyses", price: "$8.99", analyses: 10, paddlePriceId: "pri_01km8zvgagyf8qaxhe8ds1cmh3" },
  { slug: "addon-25", name: "25 extra analyses", price: "$19.99", analyses: 25, paddlePriceId: "pri_01km8ztv9kx85hwtzepp4b1enf" },
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
  const [copied, setCopied] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/user/plan").then(r => r.json()).then(d => setIsPro(d.isPro ?? false)).catch(() => {});
  }, [isSignedIn]);

  const [paddleReady, setPaddleReady] = useState(false);

  // After checkout completes, wait for webhook to process then reload
  const pollAndReload = useCallback(() => {
    let attempts = 0;
    const poll = () => {
      attempts++;
      fetch("/api/user/plan").then(r => r.json()).then(d => {
        if (d.isPro) {
          window.location.reload();
        } else if (attempts < 8) {
          setTimeout(poll, 2000);
        } else {
          window.location.reload(); // fallback
        }
      }).catch(() => { if (attempts < 8) setTimeout(poll, 2000); });
    };
    setTimeout(poll, 2000);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = document.querySelector('script[src*="paddle.com"]');
    if (existing) { if ((window as any).Paddle) setPaddleReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = () => {
      if (!(window as any).Paddle) return;
      (window as any).Paddle.Initialize({
        token: "live_52661022360279de7c131bad447",
        eventCallback: (ev: any) => {
          if (ev.name === "checkout.completed") {
            if (typeof (window as any).fbq === "function") {
              (window as any).fbq("track", "Purchase", { value: ev.data?.totals?.total ? parseFloat(ev.data.totals.total) : 0, currency: ev.data?.currencyCode || "USD" });
            }
            // Poll plan until Pro confirmed, then reload page
            pollAndReload();
          }
          if (ev.name === "checkout.closed" || ev.name === "checkout.completed") {
            document.body.style.overflow = "";
          }
        },
      });
      setPaddleReady(true);
    };
    document.head.appendChild(script);
  }, [pollAndReload]);



  const handleBuy = (paddlePriceId: string, slug: string) => {
    if (!isSignedIn) { openSignIn(); return; }
    if (!paddleReady || !(window as any).Paddle) {
      alert("Checkout is loading, please try again in a moment.");
      return;
    }
    (window as any).Paddle.Checkout.open({
      items: [{ priceId: paddlePriceId, quantity: 1 }],
      customData: { user_id: user?.id ?? "", package_slug: slug },
    });
    if (typeof (window as any).fbq === "function") {
      (window as any).fbq("track", "InitiateCheckout", { content_name: slug, value: paddlePriceId });
    }
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

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <p style={{ ...s.label, color: "var(--clr-text-4)", marginBottom: 14 }}>Pricing</p>
        <h1 style={{ fontSize: "1.625rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15, margin: "0 0 14px" }}>
          Free gets the answer.<br />
          <span style={{ color: "var(--clr-text-3)", fontWeight: 400, fontStyle: "italic" }}>Pro gets the full picture.</span>
        </h1>
        <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--clr-text-3)", margin: "0 auto", maxWidth: 460 }}>
          Try every feature for free with limited depth. Upgrade to Pro for full reports, all data, and saved history.
        </p>
      </div>

      {/* Free vs Pro vs Pro+ comparison */}
      <div style={{ marginBottom: 16 }}>
        <div className="pricing-packs-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          {/* FREE column */}
          <div style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 14, padding: "24px 20px 20px", display: "flex", flexDirection: "column" }}>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--clr-text)", letterSpacing: "-0.02em" }}>Free</div>
              <div style={{ fontSize: "0.7rem", color: "var(--clr-text-4)", marginTop: 4 }}>No credit card required</div>
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--clr-text)", letterSpacing: "-0.03em", marginBottom: 18 }}>$0</div>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
              {[
                { text: "Limited Dig — score + verdict", ok: true },
                { text: "Limited Stack — Phase 0", ok: true },
                { text: "3 Launches visible", ok: true },
                { text: "3 Startup Ideas visible", ok: true },
                { text: "Up to 5 analyses/day", ok: true },
                { text: "Full reports (10 tabs)", ok: false },
                { text: "PDF export", ok: false },
                { text: "Saved history", ok: false },
              ].map((f) => (
                <li key={f.text} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: "0.725rem", color: f.ok ? "var(--clr-text-3)" : "var(--clr-text-5)" }}>
                  <span style={{ flexShrink: 0, marginTop: 1, fontSize: 10 }}>{f.ok ? "✓" : "—"}</span>
                  <span style={{ textDecoration: f.ok ? "none" : "line-through" }}>{f.text}</span>
                </li>
              ))}
            </ul>
            <a href="/" style={{ display: "block", width: "100%", padding: "10px 0", borderRadius: 9, textAlign: "center", fontSize: "0.8rem", fontWeight: 700, border: "1px solid var(--clr-border)", color: "var(--clr-text)", textDecoration: "none", boxSizing: "border-box", marginTop: "auto" }}>
              Start free →
            </a>
          </div>

          {/* PRO column */}
          <div style={{ background: "var(--clr-surface)", border: "2px solid #6366f1", borderRadius: 14, padding: "24px 20px 20px", position: "relative", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)", background: "#6366f1", color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 10px", borderRadius: "0 0 8px 8px", letterSpacing: "0.08em" }}>
              RECOMMENDED
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "#6366f1", letterSpacing: "-0.02em" }}>Pro</div>
              <div style={{ fontSize: "0.7rem", color: "var(--clr-text-4)", marginTop: 4 }}>10 full analyses / month</div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 18 }}>
              <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--clr-text)", letterSpacing: "-0.03em" }}>$9.99</span>
              <span style={{ fontSize: "0.75rem", color: "var(--clr-text-4)" }}>/mo</span>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
              {[
                "Full Dig — all 10 tabs, live data",
                "Full Stack — all phases + Vibe Guides",
                "All Launches + Startup Ideas",
                "10 analyses included / month",
                "PDF export",
                "Saved report history",
                "Priority support",
              ].map((f) => (
                <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: "0.725rem", color: "var(--clr-text-2)" }}>
                  <span style={{ color: "#6366f1", flexShrink: 0, fontWeight: 800, marginTop: 1, fontSize: 10 }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <button onClick={() => handleBuy(PLANS[0].paddlePriceId, PLANS[0].slug)} style={{ display: "block", width: "100%", padding: "10px 0", borderRadius: 9, fontFamily: "inherit", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", background: "#6366f1", border: "none", color: "#fff", marginTop: "auto" }}>
              {isSignedIn ? "Go Pro — $9.99/mo" : "Sign in to subscribe"}
            </button>
          </div>

          {/* PRO+ column */}
          <div style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 14, padding: "24px 20px 20px", display: "flex", flexDirection: "column" }}>
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--clr-text)", letterSpacing: "-0.02em" }}>Pro+</span>
                <span style={{ fontSize: 8, fontWeight: 800, color: "#6366f1", letterSpacing: ".06em", padding: "2px 6px", borderRadius: 4, background: "rgba(99,102,241,0.08)" }}>SAVE 20%</span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--clr-text-4)", marginTop: 4 }}>25 full analyses / month</div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 18 }}>
              <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--clr-text)", letterSpacing: "-0.03em" }}>$19.99</span>
              <span style={{ fontSize: "0.75rem", color: "var(--clr-text-4)" }}>/mo</span>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
              {[
                "Everything in Pro",
                "25 analyses included / month",
                "Best for multiple ideas",
                "Compare markets side by side",
                "Research + build in one cycle",
              ].map((f) => (
                <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: "0.725rem", color: "var(--clr-text-2)" }}>
                  <span style={{ color: "var(--clr-text-5)", flexShrink: 0, fontWeight: 800, marginTop: 1, fontSize: 10 }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <button onClick={() => handleBuy(PLANS[1].paddlePriceId, PLANS[1].slug)} style={{ display: "block", width: "100%", padding: "10px 0", borderRadius: 9, fontFamily: "inherit", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", background: "transparent", border: "1px solid var(--clr-border)", color: "var(--clr-text)", marginTop: "auto" }}>
              {isSignedIn ? "Get Pro+ — $19.99/mo" : "Sign in to subscribe"}
            </button>
          </div>
        </div>

        {/* Trust badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14, flexWrap: "wrap" as const }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--clr-text-4)" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span style={{ fontSize: "0.75rem", color: "var(--clr-text-4)" }}>Secure checkout via Paddle</span>
          <span style={{ color: "var(--clr-text-5)", fontSize: "0.75rem" }}>·</span>
          <span style={{ fontSize: "0.75rem", color: "var(--clr-text-4)" }}>Cancel anytime</span>
          <span style={{ color: "var(--clr-text-5)", fontSize: "0.75rem" }}>·</span>
          <span style={{ fontSize: "0.75rem", color: "var(--clr-text-4)" }}>Unused analyses do not carry over</span>
        </div>
      </div>

      {/* Need more analyses? */}
      <div style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 14, padding: "20px 24px", marginBottom: 32 }}>
        <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--clr-text)", marginBottom: 4 }}>Need more analyses?</p>
        <p style={{ fontSize: "0.775rem", color: "var(--clr-text-3)", margin: "0 0 14px" }}>Pro users can buy extra analyses anytime. Extra analyses never expire and are consumed after monthly ones.</p>
        {isPro ? (
          <div style={{ display: "flex", gap: 10 }}>
            {ADDONS.map(a => (
              <button key={a.slug} onClick={() => handleBuy(a.paddlePriceId, a.slug)} style={{ flex: 1, padding: "10px 0", borderRadius: 9, fontFamily: "inherit", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", background: "transparent", border: "1px solid var(--clr-border)", color: "var(--clr-text)" }}>
                {a.analyses} analyses — {a.price}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ padding: "12px 16px", borderRadius: 9, background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.12)", textAlign: "center" }}>
            <span style={{ fontSize: "0.775rem", color: "#6366f1", fontWeight: 600 }}>Subscribe to Pro or Pro+ first to buy extra packs</span>
          </div>
        )}
      </div>

      {/* How it works */}
      <div style={{ marginBottom: 48 }}>
        <p style={{ ...s.label, textAlign: "center", marginBottom: 20 }}>Each Dig or Stack analysis uses 1 of your monthly analyses</p>
        <div className="pricing-credits-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          {[
            { name: "Launches", badge: "FREE", badgeColor: "#ef4444", iconColor: "#ef4444", iconPath: "pulse",
              desc: "Live feed of today's launches with AI analysis. Free for all — 3 visible, all with Pro.",
              items: ["AI analysis per product","Product Hunt + App Store","Topic filters","'Dig my angle' shortcut"] },
            { name: "Dig", badge: "1 ANALYSIS", badgeColor: "#6366f1", iconColor: "#6366f1", iconPath: "dig",
              desc: "Full market intelligence report — 70+ live sources, 10 sections.",
              items: ["Market score 0–100","Competitors from both stores","Pain points from Reddit / X / YouTube","TAM / SAM / SOM + financial model","Validation checklist + PDF export"] },
            { name: "Stack", badge: "1 ANALYSIS", badgeColor: "#38bdf8", iconColor: "#38bdf8", iconPath: "stack",
              desc: "Phased build plan with exact tools, pricing, and setup instructions.",
              items: ["4 phases: Validate → Scale","Tool cards with real pricing","Vibe Guide: copy-paste prompts","Mistake warnings + upgrade triggers"] },
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

      {/* Support the project */}
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

      {/* Footer */}
      <div style={{ borderTop: "1px solid var(--clr-border)", paddingTop: 36, marginTop: 48 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" as const, color: "var(--clr-text-5)", marginBottom: 14 }}>Secure payment</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap" as const }}>
            <a href="https://www.paddle.com" target="_blank" rel="noopener noreferrer" style={{ height: 36, padding: "0 14px", borderRadius: 7, border: "1px solid var(--clr-border)", background: "#fff", display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#0C1F3D"/><path d="M9 8h7.5c3.5 0 6 2.2 6 5.5s-2.5 5.5-6 5.5H12v5H9V8zm3 8.5h4.5c1.8 0 3-1 3-3s-1.2-3-3-3H12v6z" fill="#fff"/></svg>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0C1F3D", fontFamily: "inherit" }}>Paddle</span>
            </a>
            <div style={{ height: 36, padding: "0 14px", borderRadius: 7, border: "1px solid var(--clr-border)", background: "#fff", display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "#1A1F71", fontStyle: "italic", letterSpacing: "0.04em", fontFamily: "Georgia, serif" }}>VISA</span>
            </div>
            <div style={{ height: 36, padding: "0 14px", borderRadius: 7, border: "1px solid var(--clr-border)", background: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ position: "relative", width: 34, height: 22, display: "flex", alignItems: "center" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#EB001B", position: "absolute", left: 0 }} />
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#F79E1B", position: "absolute", left: 12, opacity: 0.9 }} />
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#333", fontFamily: "inherit" }}>Mastercard</span>
            </div>
            <div style={{ height: 36, padding: "0 14px", borderRadius: 7, border: "none", background: "#016FD0", display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#fff", letterSpacing: "0.06em", fontFamily: "inherit" }}>AMEX</span>
            </div>
            <div style={{ height: 36, padding: "0 14px", borderRadius: 7, border: "1px solid #bbf7d0", background: "#f0fdf4", display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="12" height="14" viewBox="0 0 12 14" fill="none"><path d="M6 0.5L1 2.5v4C1 9.5 3.2 12.3 6 13.2 8.8 12.3 11 9.5 11 6.5v-4L6 0.5z" fill="#16a34a" opacity=".25" stroke="#16a34a" strokeWidth="1"/><path d="M4 7l1.5 1.5L8 5.5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#16a34a", fontFamily: "inherit" }}>SSL Secured</span>
            </div>
          </div>
        </div>
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
            <a key={href} href={href} style={{ display: "block", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--clr-border)", background: "var(--clr-surface)", fontSize: "0.75rem", color: "var(--clr-text-3)", textDecoration: "none", textAlign: "center" as const, fontWeight: 500 }}>
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
