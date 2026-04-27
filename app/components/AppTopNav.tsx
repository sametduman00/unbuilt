"use client";
import { useAuth, useUser, useClerk } from "@clerk/nextjs";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, Rocket, Layers, Lightbulb } from "lucide-react";

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
  const [plan, setPlan] = useState<{ plan: string; totalAnalyses: number; isPro: boolean; tier: "free" | "pro" | "pro+" } | null>(null);
  const { signOut } = useClerk();
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

  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/user/plan")
      .then(async (r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return; // API failed — keep whatever badge we had
        const isPro = d.isPro ?? false;
        const monthly = d.monthlyAnalyses ?? 0;
        const tier = !isPro ? "free" as const : monthly > 10 ? "pro+" as const : "pro" as const;
        setPlan({ plan: d.plan ?? "free", totalAnalyses: d.totalAnalyses ?? 0, isPro, tier });
      })
      .catch(() => {});
  }, [isSignedIn]);

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

  const pill: React.CSSProperties = {
    background: "rgba(255,255,255,0.97)",
    backdropFilter: "blur(12px)",
    border: "1px solid #e8e8e5",
    borderRadius: 999,
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    display: "flex",
    alignItems: "center",
    height: 44,
    transition: "box-shadow 0.15s, border-color 0.15s",
  };

  const toolPill: React.CSSProperties = {
    ...pill,
    padding: "0 18px",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#1a1a1a",
    textDecoration: "none",
    cursor: "pointer",
    gap: 6,
  };

  return (
    <nav className="app-desktop-nav" style={{
      position: "fixed",
      top: 10,
      left: "50%",
      transform: "translateX(-50%)",
      width: "calc(100% - 48px)",
      maxWidth: 1200,
      zIndex: 1000,
      display: "grid",
      gridTemplateColumns: "1fr auto 1fr",
      alignItems: "center",
      gap: 8,
      boxSizing: "border-box",
    }}>

        {/* 1 — Logo pill (left-aligned) */}
        <div style={{ justifySelf: "start" }}>
        <Link href="/" onClick={(e) => { e.preventDefault(); window.location.href = "/"; }} style={{ ...pill, gap: 8, textDecoration: "none", flexShrink: 0, padding: "0 24px" }}>
          <UnbuiltIcon size={22} />
          <span style={{ fontSize: "1.38rem", fontWeight: 600, color: "#1a1a1a", letterSpacing: "-0.02em" }}>
            unbuilt
          </span>
        </Link>
        </div>

        {/* Center — tools (always centered) */}
        <div style={{ display: "flex", gap: 8, justifySelf: "center" }}>
        {/* 2 — Dig my Idea pill */}
        <Link href="/?tab=dig" style={toolPill}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#ccc"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8e8e5"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"; }}
        >
          <Search size={15} color="#3b82f6" strokeWidth={2.5} />
          Dig my Idea
        </Link>

        {/* 3 — Launches pill */}
        <Link href="/launches" style={toolPill}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#ccc"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8e8e5"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"; }}
        >
          <Rocket size={15} color="#ef4444" strokeWidth={2.5} />
          Launches
        </Link>

        {/* 4 — Get my Stack pill */}
        <Link href="/?tab=stack" style={toolPill}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#ccc"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8e8e5"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"; }}
        >
          <Layers size={15} color="#8b5cf6" strokeWidth={2.5} />
          Get my Stack
        </Link>

        {/* 5 — Startup Ideas pill */}
        <Link href="/startup-ideas" style={toolPill}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#ccc"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8e8e5"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"; }}
        >
          <Lightbulb size={15} color="#f59e0b" strokeWidth={2.5} />
          Startup Ideas
        </Link>
        </div>

        {/* 5 — User pill (right-aligned) */}
        <div style={{ justifySelf: "end", flexShrink: 0 }}>
          {isSignedIn ? (
            <div ref={userRef} style={{ position: "relative" }}>
              <button
                onClick={() => setUserOpen(p => !p)}
                style={{
                  ...pill,
                  gap: 8,
                  padding: "0 10px 0 5px",
                  background: userOpen ? "#f9f9f8" : "rgba(255,255,255,0.97)",
                  cursor: "pointer",
                }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "#6c47ff", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.75rem", fontWeight: 600, flexShrink: 0, marginLeft: 3,
                }}>{initials}</div>
                <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#1a1a1a" }}>{firstName}</span>
                <span style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.04em", color: plan?.isPro ? "#6366f1" : "#666", background: plan?.isPro ? "rgba(99,102,241,0.08)" : "#f0f0ee", borderRadius: 4, padding: "2px 7px" }}>
                  {plan?.tier === "pro+" ? "PRO+" : plan?.tier === "pro" ? "PRO" : "FREE"}
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
                      <span style={{ fontSize: "0.8rem", color: "#666", fontWeight: 500 }}>Analyses remaining</span>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1a1a1a" }}>{plan?.totalAnalyses ?? 0}</span>
                    </div>
                  </div>
                  {plan?.tier === "pro+" ? (
                    <Link href="/pricing#addons" style={{ ...dropItemStyle, display: "flex", alignItems: "center", gap: 8, color: "#6366f1" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f3")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      onClick={() => setUserOpen(false)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
                      </svg>
                      Buy extra analyses
                    </Link>
                  ) : (
                    <Link href="/pricing" style={{ ...dropItemStyle, display: "flex", alignItems: "center", gap: 8, color: "#6366f1", fontWeight: 600 }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f0edff")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      onClick={() => setUserOpen(false)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                      </svg>
                      Upgrade plan
                    </Link>
                  )}
                  <Link href="/reports" style={{ ...dropItemStyle, display: "flex", alignItems: "center", gap: 8 }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f3")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    onClick={() => setUserOpen(false)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    My Reports
                    {!plan?.isPro && <span style={{ fontSize: "0.5625rem", fontWeight: 700, color: "#6366f1", background: "rgba(99,102,241,0.1)", padding: "1px 6px", borderRadius: 4, letterSpacing: "0.04em" }}>PRO</span>}
                  </Link>
                  {plan?.isPro && (
                    <Link href="/pricing#manage" style={{ ...dropItemStyle, display: "flex", alignItems: "center", gap: 8, color: "var(--clr-text-4)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f3")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      onClick={() => setUserOpen(false)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                      </svg>
                      Manage plan
                    </Link>
                  )}
                  <div style={{ borderTop: "1px solid #f0f0ee", margin: "6px 0" }}/>
                  <button
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", fontSize: "0.875rem", color: "#dc2626", borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", width: "100%", fontWeight: 450 }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fff5f5")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    onClick={() => { setUserOpen(false); signOut({ redirectUrl: "/" }); }}>
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
              ...pill,
              padding: "0 18px",
              fontSize: "0.875rem", fontWeight: 500,
              color: "#fff", background: "#1a1a1a",
              border: "1px solid #1a1a1a",
              textDecoration: "none",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "#333"; e.currentTarget.style.borderColor = "#333"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#1a1a1a"; e.currentTarget.style.borderColor = "#1a1a1a"; }}
            >Sign in</Link>
          )}
        </div>
      </nav>
  );
}
