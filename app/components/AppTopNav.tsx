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
  { label: "Help", href: "/help" },
  { label: "Careers", href: "/careers" },
];

function UnbuiltIcon({ size = 30 }: { size?: number }) {
  // 3x3 grid, top-right empty. cell=8, gap=4 → viewBox 32x32
  const cell = 8;
  const gap = 4;
  const r = 2.2;
  const step = cell + gap;
  const dark = "#1c1c1c";
  const gray = "#888888";
  const lgray = "#aaaaaa";

  const squares = [
    { col: 0, row: 0, fill: dark  },
    { col: 1, row: 0, fill: gray  },
    // col 2 row 0 intentionally empty
    { col: 0, row: 1, fill: gray  },
    { col: 1, row: 1, fill: gray  },
    { col: 2, row: 1, fill: lgray },
    { col: 0, row: 2, fill: dark  },
    { col: 1, row: 2, fill: gray  },
    { col: 2, row: 2, fill: dark  },
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {squares.map(({ col, row, fill }) => (
        <rect
          key={col + "-" + row}
          x={col * step}
          y={row * step}
          width={cell}
          height={cell}
          rx={r}
          fill={fill}
        />
      ))}
    </svg>
  );
}

export default function AppTopNav() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [docsOpen, setDocsOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const docsRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const docsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
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

  const dropStyle: React.CSSProperties = {
    position: "absolute", top: "calc(100% + 8px)", left: 0,
    background: "#fff", border: "1px solid #e8e8e5",
    borderRadius: 12, padding: 6, zIndex: 200,
    boxShadow: "0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)",
  };

  const dropItemStyle: React.CSSProperties = {
    display: "block", padding: "7px 12px",
    fontSize: "0.875rem", color: "#1a1a1a",
    borderRadius: 8, textDecoration: "none", fontWeight: 450,
    whiteSpace: "nowrap" as const,
  };

  const dropSectionStyle: React.CSSProperties = {
    fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.09em",
    color: "#999", padding: "6px 10px 4px", textTransform: "uppercase" as const,
  };

  const linkBtn: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 5,
    fontSize: "0.9rem", fontWeight: 500, color: "#1a1a1a",
    background: "transparent", border: "none",
    borderRadius: 8, padding: "6px 14px", cursor: "pointer",
    transition: "background 0.12s",
  };

  return (
    <>
      <div style={{ height: 70 }} />
      <nav style={{
        position: "fixed", top: 10, left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 48px)", maxWidth: 1200,
        zIndex: 100, height: 54,
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(12px)",
        border: "1px solid #e8e8e5",
        borderRadius: 14,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        boxSizing: "border-box",
      }}>

        {/* Logo — inline SVG, transparent bg */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
          <UnbuiltIcon size={30} />
          <span style={{ fontSize: "1.35rem", fontWeight: 600, color: "#1a1a1a", letterSpacing: "-0.02em" }}>
            unbuilt
          </span>
        </Link>

        {/* Center nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          <Link href="/use-cases" style={linkBtn}
            onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f3")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >Use Cases</Link>

          <Link href="/how-it-works" style={linkBtn}
            onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f3")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >How it works</Link>

          <Link href="/pricing" style={linkBtn}
            onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f3")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >Pricing</Link>
          {/* Docs — hover */}
          <div ref={docsRef} style={{ position: "relative" }}
            onMouseEnter={() => { if (docsTimer.current) clearTimeout(docsTimer.current); setDocsOpen(true); }}
            onMouseLeave={() => { docsTimer.current = setTimeout(() => setDocsOpen(false), 150); }}>
            <button style={{ ...linkBtn, background: docsOpen ? "#f5f5f3" : "transparent" }}>
              Docs
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8"
                style={{ transition: "transform 0.15s", transform: docsOpen ? "rotate(180deg)" : "none" }}>
                <polyline points="2 4.5 6 8 10 4.5"/>
              </svg>
            </button>
            {docsOpen && (
              <div style={{ ...dropStyle, minWidth: 210 }}>
                <div style={dropSectionStyle}>LEGAL & POLICIES</div>
                {DOCS_ITEMS.map(item => (
                  <Link key={item.href} href={item.href} style={dropItemStyle}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f3")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    onClick={() => setDocsOpen(false)}>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {isSignedIn ? (
            <div ref={userRef} style={{ position: "relative" }}>
              <button
                onClick={() => setUserOpen(p => !p)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "5px 10px 5px 5px",
                  background: userOpen ? "#f5f5f3" : "transparent",
                  border: "1px solid #e8e8e5", borderRadius: 999,
                  cursor: "pointer", transition: "background 0.15s",
                }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "#6c47ff", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.75rem", fontWeight: 600, flexShrink: 0,
                }}>{initials}</div>
                <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#1a1a1a" }}>{firstName}</span>
                <span style={{ fontSize: "0.75rem", color: "#666", background: "#f0f0ee", borderRadius: 4, padding: "1px 7px", fontWeight: 500 }}>
                  {credits} credits
                </span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8"
                  style={{ color: "#888", transform: userOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                  <polyline points="2 4.5 6 8 10 4.5"/>
                </svg>
              </button>
              {userOpen && (
                <div style={{ ...dropStyle, left: "auto", right: 0, minWidth: 230 }}>
                  <div style={{ padding: "10px 12px", borderBottom: "1px solid #f0f0ee", marginBottom: 6 }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1a1a1a" }}>
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#888", marginTop: 2 }}>
                      {user?.emailAddresses?.[0]?.emailAddress}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, background: "#f5f5f3", borderRadius: 8, padding: "6px 10px" }}>
                      <span style={{ fontSize: "0.8rem", color: "#666", fontWeight: 500 }}>Credits remaining</span>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1a1a1a" }}>{credits}</span>
                    </div>
                  </div>
                  <Link href="/reports" style={{ ...dropItemStyle, display: "flex", alignItems: "center", gap: 8 }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f3")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    onClick={() => setUserOpen(false)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    My Reports
                  </Link>
                  <div style={{ borderTop: "1px solid #f0f0ee", margin: "6px 0" }}/>
                  <button
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", fontSize: "0.875rem", color: "#dc2626", borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", width: "100%", fontWeight: 450 }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fff5f5")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    onClick={() => { setUserOpen(false); window.location.href = "/sign-in"; }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/sign-in" style={{
              fontSize: "0.875rem", fontWeight: 500,
              color: "#fff", background: "#1a1a1a",
              borderRadius: 8, padding: "7px 18px", textDecoration: "none",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "#333")}
              onMouseLeave={e => (e.currentTarget.style.background = "#1a1a1a")}
            >Sign in</Link>
          )}
        </div>
      </nav>
    </>
  );
}
