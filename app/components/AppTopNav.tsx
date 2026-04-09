"use client";
import { useAuth, useUser, UserButton } from "@clerk/nextjs";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const DOCS_ITEMS = [
  { label: "Terms of Service", href: "/legal/terms-of-service" },
  { label: "Privacy Policy", href: "/legal/privacy-policy" },
  { label: "Refund Policy", href: "/legal/refund-policy" },
  { label: "Cookie Policy", href: "/legal/cookie-policy" },
  { label: "Acceptable Use", href: "/legal/acceptable-use" },
  { label: "AI Transparency", href: "/legal/ai-transparency" },
  { label: "Disclaimer", href: "/legal/disclaimer" },
  { label: "Do Not Sell My Info", href: "/legal/do-not-sell" },
];

const PRODUCT_ITEMS = [
  { label: "Pricing", href: "/pricing" },
  { label: "Help", href: "/help" },
  { label: "Careers", href: "/careers" },
];

export default function AppTopNav() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [docsOpen, setDocsOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const docsRef = useRef<HTMLDivElement>(null);
  const productRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (docsRef.current && !docsRef.current.contains(e.target as Node)) setDocsOpen(false);
      if (productRef.current && !productRef.current.contains(e.target as Node)) setProductOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const credits = (user?.publicMetadata?.credits as number) ?? 0;
  const initials = user ? ((user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")).toUpperCase() || user.emailAddresses[0]?.emailAddress[0].toUpperCase() : "";
  const firstName = user?.firstName || user?.emailAddresses[0]?.emailAddress.split("@")[0] || "";

  const navStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: 52,
    background: "var(--clr-surface)",
    borderBottom: "1px solid var(--clr-border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
  };

  const linkStyle: React.CSSProperties = {
    fontSize: "0.875rem",
    color: "var(--clr-text-3)",
    padding: "6px 12px",
    borderRadius: 6,
    cursor: "pointer",
    textDecoration: "none",
    whiteSpace: "nowrap",
  };

  const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: 40,
    left: 0,
    background: "var(--clr-surface)",
    border: "1px solid var(--clr-border)",
    borderRadius: 10,
    padding: 6,
    minWidth: 200,
    zIndex: 200,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  };

  const dropItemStyle: React.CSSProperties = {
    display: "block",
    padding: "7px 10px",
    fontSize: "0.8125rem",
    color: "var(--clr-text-3)",
    borderRadius: 6,
    textDecoration: "none",
    cursor: "pointer",
  };

  const dropSectionStyle: React.CSSProperties = {
    fontSize: "0.625rem",
    fontWeight: 600,
    letterSpacing: "0.08em",
    color: "var(--clr-text-4)",
    padding: "6px 10px 4px",
  };

  return (
    <nav style={navStyle}>
      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" style={{ color: "var(--clr-text)" }}>
          <rect x="0" y="0" width="6" height="6" rx="1"/>
          <rect x="8" y="0" width="6" height="6" rx="1"/>
          <rect x="0" y="8" width="6" height="6" rx="1"/>
          <rect x="8" y="8" width="6" height="6" rx="1"/>
        </svg>
        <span style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--clr-text)" }}>unbuilt</span>
      </Link>

      {/* Center nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Link href="/use-cases" style={linkStyle}>Use Cases</Link>
        <Link href="/how-it-works" style={linkStyle}>How it works</Link>

        {/* Docs dropdown */}
        <div ref={docsRef} style={{ position: "relative" }}>
          <div
            onClick={() => { setDocsOpen(p => !p); setProductOpen(false); setUserOpen(false); }}
            style={{ ...linkStyle, display: "flex", alignItems: "center", gap: 4, userSelect: "none",
              background: docsOpen ? "var(--clr-surface-2)" : "transparent",
              color: docsOpen ? "var(--clr-text)" : "var(--clr-text-3)" }}
          >
            Docs
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points={docsOpen ? "2 7 5 4 8 7" : "2 4 5 7 8 4"}/>
            </svg>
          </div>
          {docsOpen && (
            <div style={dropdownStyle}>
              <div style={dropSectionStyle}>LEGAL & POLICIES</div>
              {DOCS_ITEMS.map(item => (
                <Link key={item.href} href={item.href} style={dropItemStyle} onClick={() => setDocsOpen(false)}>
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Product dropdown */}
        <div ref={productRef} style={{ position: "relative" }}>
          <div
            onClick={() => { setProductOpen(p => !p); setDocsOpen(false); setUserOpen(false); }}
            style={{ ...linkStyle, display: "flex", alignItems: "center", gap: 4, userSelect: "none",
              background: productOpen ? "var(--clr-surface-2)" : "transparent",
              color: productOpen ? "var(--clr-text)" : "var(--clr-text-3)" }}
          >
            Product
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points={productOpen ? "2 7 5 4 8 7" : "2 4 5 7 8 4"}/>
            </svg>
          </div>
          {productOpen && (
            <div style={dropdownStyle}>
              <div style={dropSectionStyle}>PRODUCT</div>
              {PRODUCT_ITEMS.map(item => (
                <Link key={item.href} href={item.href} style={dropItemStyle} onClick={() => setProductOpen(false)}>
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {isSignedIn ? (
          <div ref={userRef} style={{ position: "relative" }}>
            <div
              onClick={() => { setUserOpen(p => !p); setDocsOpen(false); setProductOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "4px 10px 4px 4px",
                border: "1px solid var(--clr-border)",
                borderRadius: 999, cursor: "pointer",
                background: userOpen ? "var(--clr-surface-2)" : "var(--clr-surface)",
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "var(--clr-accent)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", fontWeight: 600, flexShrink: 0,
              }}>{initials}</div>
              <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--clr-text)" }}>{firstName}</span>
              <span style={{
                fontSize: "0.6875rem", color: "var(--clr-text-4)",
                background: "var(--clr-surface-2)", borderRadius: 4, padding: "1px 6px",
              }}>{credits} credits</span>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--clr-text-4)" }}>
                <polyline points={userOpen ? "2 7 5 4 8 7" : "2 4 5 7 8 4"}/>
              </svg>
            </div>
            {userOpen && (
              <div style={{ ...dropdownStyle, left: "auto", right: 0, minWidth: 220 }}>
                <div style={{ padding: "10px 10px 8px", borderBottom: "1px solid var(--clr-border)", marginBottom: 6 }}>
                  <div style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--clr-text)" }}>
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--clr-text-4)", marginTop: 2 }}>
                    {user?.emailAddresses[0]?.emailAddress}
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    marginTop: 8, background: "var(--clr-surface-2)", borderRadius: 6, padding: "6px 10px",
                  }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--clr-text-3)" }}>Credits remaining</span>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--clr-text)" }}>{credits}</span>
                  </div>
                </div>
                <Link href="/reports" style={{ ...dropItemStyle, display: "flex", alignItems: "center", gap: 8 }} onClick={() => setUserOpen(false)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  My Reports
                </Link>
                <div style={{ borderTop: "1px solid var(--clr-border)", margin: "6px 0" }} />
                <div
                  style={{ ...dropItemStyle, display: "flex", alignItems: "center", gap: 8, color: "#dc2626" }}
                  onClick={() => { setUserOpen(false); window.location.href = "/sign-in"; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sign out
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link href="/sign-in" style={{
            fontSize: "0.875rem", color: "var(--clr-text)",
            background: "transparent", border: "1px solid var(--clr-border)",
            borderRadius: 7, padding: "6px 16px", textDecoration: "none",
          }}>
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
