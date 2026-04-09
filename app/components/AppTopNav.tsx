"use client";
import { useAuth, useUser } from "@clerk/nextjs";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

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
  const firstName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "";
  const initials = user
    ? ((user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")).toUpperCase() ||
      user.emailAddresses[0]?.emailAddress[0].toUpperCase()
    : "";

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      height: 58,
      background: "#ffffff",
      borderBottom: "1px solid #e8e8e5",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 28px",
      boxSizing: "border-box",
    }}>
      {/* Logo — unchanged */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ color: "#1a1a1a" }}>
          <rect x="0" y="0" width="6.5" height="6.5" rx="1.5"/>
          <rect x="9.5" y="0" width="6.5" height="6.5" rx="1.5"/>
          <rect x="0" y="9.5" width="6.5" height="6.5" rx="1.5"/>
          <rect x="9.5" y="9.5" width="6.5" height="6.5" rx="1.5"/>
        </svg>
        <span style={{ fontSize: "1rem", fontWeight: 600, color: "#1a1a1a", letterSpacing: "-0.01em" }}>unbuilt</span>
      </Link>

      {/* Center nav — Clerk style: dark text, medium weight */}
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        <Link href="/use-cases" style={{
          fontSize: "0.9rem", fontWeight: 500, color: "#1a1a1a",
          padding: "6px 14px", borderRadius: 8, textDecoration: "none",
          transition: "background 0.15s",
        }}
          onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f3")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >Use Cases</Link>

        <Link href="/how-it-works" style={{
          fontSize: "0.9rem", fontWeight: 500, color: "#1a1a1a",
          padding: "6px 14px", borderRadius: 8, textDecoration: "none",
        }}
          onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f3")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >How it works</Link>

        {/* Docs dropdown */}
        <div ref={docsRef} style={{ position: "relative" }}>
          <button onClick={() => { setDocsOpen(p => !p); setProductOpen(false); setUserOpen(false); }}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: "0.9rem", fontWeight: 500,
              color: docsOpen ? "#000" : "#1a1a1a",
              background: docsOpen ? "#f5f5f3" : "transparent",
              border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer",
            }}>
            Docs
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ transition: "transform 0.15s", transform: docsOpen ? "rotate(180deg)" : "none" }}>
              <polyline points="2 4.5 6 8 10 4.5"/>
            </svg>
          </button>
          {docsOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0,
              background: "#fff", border: "1px solid #e8e8e5",
              borderRadius: 12, padding: 6, minWidth: 210, zIndex: 200,
              boxShadow: "0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)",
            }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.09em", color: "#999", padding: "6px 10px 4px", textTransform: "uppercase" }}>
                LEGAL & POLICIES
              </div>
              {DOCS_ITEMS.map(item => (
                <Link key={item.href} href={item.href}
                  style={{ display: "block", padding: "7px 10px", fontSize: "0.875rem", color: "#1a1a1a", borderRadius: 8, textDecoration: "none", fontWeight: 450 }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f3")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  onClick={() => setDocsOpen(false)}>
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Product dropdown */}
        <div ref={productRef} style={{ position: "relative" }}>
          <button onClick={() => { setProductOpen(p => !p); setDocsOpen(false); setUserOpen(false); }}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: "0.9rem", fontWeight: 500,
              color: productOpen ? "#000" : "#1a1a1a",
              background: productOpen ? "#f5f5f3" : "transparent",
              border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer",
            }}>
            Product
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ transition: "transform 0.15s", transform: productOpen ? "rotate(180deg)" : "none" }}>
              <polyline points="2 4.5 6 8 10 4.5"/>
            </svg>
          </button>
          {productOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0,
              background: "#fff", border: "1px solid #e8e8e5",
              borderRadius: 12, padding: 6, minWidth: 160, zIndex: 200,
              boxShadow: "0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)",
            }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.09em", color: "#999", padding: "6px 10px 4px", textTransform: "uppercase" }}>
                PRODUCT
              </div>
              {PRODUCT_ITEMS.map(item => (
                <Link key={item.href} href={item.href}
                  style={{ display: "block", padding: "7px 10px", fontSize: "0.875rem", color: "#1a1a1a", borderRadius: 8, textDecoration: "none", fontWeight: 450 }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f3")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  onClick={() => setProductOpen(false)}>
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
            <button
              onClick={() => { setUserOpen(p => !p); setDocsOpen(false); setProductOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "5px 10px 5px 5px",
                background: userOpen ? "#f5f5f3" : "transparent",
                border: "1px solid #e8e8e5",
                borderRadius: 999, cursor: "pointer",
                transition: "background 0.15s",
              }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "#6c47ff", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", fontWeight: 600, flexShrink: 0,
              }}>{initials}</div>
              <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#1a1a1a" }}>{firstName}</span>
              <span style={{
                fontSize: "0.75rem", color: "#666",
                background: "#f0f0ee", borderRadius: 4, padding: "1px 7px", fontWeight: 500,
              }}>{credits} credits</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8"
                style={{ color: "#888", transform: userOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                <polyline points="2 4.5 6 8 10 4.5"/>
              </svg>
            </button>
            {userOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                background: "#fff", border: "1px solid #e8e8e5",
                borderRadius: 12, padding: 6, minWidth: 230, zIndex: 200,
                boxShadow: "0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)",
              }}>
                <div style={{ padding: "10px 12px 10px", borderBottom: "1px solid #f0f0ee", marginBottom: 6 }}>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1a1a1a" }}>
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#888", marginTop: 2 }}>
                    {user?.emailAddresses?.[0]?.emailAddress}
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    marginTop: 8, background: "#f5f5f3", borderRadius: 8, padding: "6px 10px",
                  }}>
                    <span style={{ fontSize: "0.8rem", color: "#666", fontWeight: 500 }}>Credits remaining</span>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1a1a1a" }}>{credits}</span>
                  </div>
                </div>
                <Link href="/reports"
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", fontSize: "0.875rem", color: "#1a1a1a", borderRadius: 8, textDecoration: "none", fontWeight: 450 }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f3")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  onClick={() => setUserOpen(false)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  My Reports
                </Link>
                <div style={{ borderTop: "1px solid #f0f0ee", margin: "6px 0" }}/>
                <button
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", fontSize: "0.875rem", color: "#dc2626", borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", width: "100%", fontWeight: 450 }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fff5f5")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  onClick={() => { setUserOpen(false); window.location.href = "/sign-in"; }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/sign-in" style={{
            fontSize: "0.875rem", fontWeight: 500,
            color: "#fff",
            background: "#1a1a1a",
            borderRadius: 8, padding: "7px 18px",
            textDecoration: "none",
            transition: "background 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = "#333")}
            onMouseLeave={e => (e.currentTarget.style.background = "#1a1a1a")}
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
