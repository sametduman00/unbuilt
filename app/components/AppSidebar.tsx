"use client";
import { useAuth, useUser, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function AppSidebar() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const pathname = usePathname();
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/credits")
      .then((r) => r.json())
      .then((d) => setCredits(d.credits ?? 0))
      .catch(() => {});
  }, [isSignedIn]);

  const isActive = (path: string) => pathname === path;

  const navItem = (href: string, label: string, dot: string, badge?: string, locked?: boolean) => (
    <Link href={href} style={{
      display: "flex", alignItems: "center", gap: 9, padding: "8px 10px",
      borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500,
      textDecoration: "none", position: "relative", transition: "background 0.1s",
      color: "var(--clr-text)",
      background: isActive(href) ? "rgba(0,0,0,0.07)" : "transparent",
    }}
      onMouseEnter={e => { if (!isActive(href)) (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.05)"; }}
      onMouseLeave={e => { if (!isActive(href)) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {isActive(href) && <span style={{ position: "absolute", left: -10, top: "50%", transform: "translateY(-50%)", width: 3, height: 18, background: dot, borderRadius: "0 3px 3px 0" }} />}
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot, flexShrink: 0, display: "inline-block" }} />
      <span style={{ flex: 1 }}>{label}</span>
      {badge && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${dot}20`, color: dot, fontWeight: 700 }}>{badge}</span>}
      {locked && !isSignedIn && <svg width="11" height="11" fill="none" viewBox="0 0 24 24" style={{ opacity: 0.35 }}><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
    </Link>
  );

  const DOCS = [
    ["/legal/terms-of-service", "Terms of Service"],
    ["/legal/privacy-policy", "Privacy Policy"],
    ["/legal/refund-policy", "Refund Policy"],
    ["/legal/cookie-policy", "Cookie Policy"],
    ["/legal/acceptable-use", "Acceptable Use"],
    ["/legal/ai-transparency", "AI Transparency"],
    ["/legal/disclaimer", "Disclaimer"],
    ["/legal/do-not-sell", "Do Not Sell My Info"],
  ] as const;

  const PRODUCT = [
    ["/how-it-works", "How it works"],
    ["/pricing", "Pricing"],
    ["/careers", "Careers"],
  ] as const;

  const Flyout = ({ label, icon, items, sectionLabel }: {
    label: string;
    icon: React.ReactNode;
    items: readonly (readonly [string, string])[];
    sectionLabel: string;
  }) => (
    <div style={{ position: "relative" }}
      onMouseEnter={e => { const f = e.currentTarget.querySelector(".flyout-panel") as HTMLElement; if (f) f.style.display = "flex"; }}
      onMouseLeave={e => { const f = e.currentTarget.querySelector(".flyout-panel") as HTMLElement; if (f) f.style.display = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", borderRadius: 8, cursor: "pointer", color: "var(--clr-text-2)", fontSize: 13, transition: "background 0.1s" }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.05)"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}
      >
        {icon}
        <span style={{ flex: 1 }}>{label}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.3, flexShrink: 0 }}><path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <div className="flyout-panel" style={{ display: "none", position: "absolute", left: "calc(100% + 8px)", bottom: 0, width: 220, background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 12, padding: 6, flexDirection: "column", gap: 1, zIndex: 200, boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--clr-text-4)", padding: "5px 8px 3px" }}>{sectionLabel}</div>
        {items.map(([href, lbl]) => (
          <Link key={href} href={href} style={{ display: "flex", alignItems: "center", padding: "7px 10px", borderRadius: 7, fontSize: 12, fontWeight: 500, color: "var(--clr-text)", textDecoration: "none", transition: "background 0.1s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.05)"}
            onMouseLeave={e => e.currentTarget.style.background = ""}
          >{lbl}</Link>
        ))}
      </div>
    </div>
  );

  return (
    <aside style={{ width: 220, minWidth: 220, background: "var(--clr-surface)", borderRight: "1px solid var(--clr-border)", display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 50 }}>

      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "18px 16px 16px", borderBottom: "1px solid var(--clr-border)", textDecoration: "none", flexShrink: 0 }}>
        <svg width="28" height="28" viewBox="0 0 19 19" fill="none">
          <path d="M2.5 5.5h14M2.5 9.5h10M2.5 13.5h6" stroke="var(--clr-accent)" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        <span style={{ fontWeight: 700, fontSize: "1.15rem", color: "var(--clr-text)", letterSpacing: "-0.025em" }}>Unbuilt</span>
      </Link>

      {/* EXPLORE */}
      <div style={{ padding: "8px 10px 4px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", color: "var(--clr-text-4)", textTransform: "uppercase", padding: "6px 8px 3px" }}>Explore</div>
        {navItem("/", "Pulse", "#a78bfa", "FREE")}
      </div>

      {/* ANALYZE */}
      <div style={{ padding: "0 10px 4px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", color: "var(--clr-text-4)", textTransform: "uppercase", padding: "8px 8px 3px" }}>Analyze</div>
        {navItem("/?tool=gap-analysis", "Gap Analysis", "#7c6fff", isSignedIn ? "1 credit" : undefined, true)}
        {navItem("/?tool=stack-advisor", "Stack Advisor", "#38bdf8", isSignedIn ? "1 credit" : undefined, true)}
      </div>

      <div style={{ flex: 1 }} />

      {/* BOTTOM */}
      <div style={{ padding: "8px 8px 10px", borderTop: "1px solid var(--clr-border)" }}>

        <Flyout label="Docs" sectionLabel="Legal & Policies" items={DOCS} icon={
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.4, flexShrink: 0 }}><path d="M3 2h7l3 3v9H3V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.3"/><path d="M5 7h6M5 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        } />

        <Flyout label="Product" sectionLabel="Product" items={PRODUCT} icon={
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.4, flexShrink: 0 }}><rect x="1.5" y="1.5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 5h6M5 8h4M5 11h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        } />

        <Link href="/reports" style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", borderRadius: 8, color: "var(--clr-text-2)", fontSize: 13, textDecoration: "none", transition: "background 0.1s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.05)"}
          onMouseLeave={e => e.currentTarget.style.background = ""}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.35, flexShrink: 0 }}><path d="M3 2h7l3 3v9H3V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.3"/></svg>
          My Reports
        </Link>

        <div style={{ height: "0.5px", background: "var(--clr-border)", margin: "4px 0" }} />

        {/* Profile */}
        {isSignedIn ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, cursor: "pointer", transition: "background 0.1s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.05)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}
          >
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--clr-accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "white" }}>
                {user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? "U"}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--clr-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.emailAddresses?.[0]?.emailAddress ?? "Account"}
              </div>
            </div>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, opacity: 0.3 }}><circle cx="6" cy="3" r="1" fill="currentColor"/><circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="6" cy="9" r="1" fill="currentColor"/></svg>
          </div>
        ) : (
          <SignInButton mode="modal">
            <button style={{ width: "100%", padding: "7px 10px", borderRadius: 8, background: "transparent", border: "1px solid var(--clr-border-2)", color: "var(--clr-text)", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
              Sign in
            </button>
          </SignInButton>
        )}

        {/* Credits */}
        {isSignedIn && credits !== null && (
          <div style={{ padding: "4px 2px" }}>
            <div style={{ background: "#f0fdf4", border: "0.5px solid #bbf7d0", borderRadius: 7, padding: "6px 10px", display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polygon points="6,1 7.5,4 11,4.7 8.5,7 9.2,11 6,9.2 2.8,11 3.5,7 1,4.7 4.5,4" fill="#16a34a"/></svg>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#15803d" }}>{credits} credits</span>
            </div>
          </div>
        )}

        {/* Buy Credits */}
        <div style={{ paddingTop: 4 }}>
          <Link href="/pricing" style={{ background: "#7c6fff", borderRadius: 8, padding: "9px", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, textDecoration: "none", transition: "opacity 0.1s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.9"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: "white" }}>Buy Credits</span>
          </Link>
        </div>

      </div>
    </aside>
  );
}
