"use client";
import { useAuth, useUser, useClerk, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

function AppSidebarInner() {
  const { isSignedIn, userId } = useAuth();
  const { signOut } = useClerk();
  const { user } = useUser();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [credits, setCredits] = useState<number | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/credits")
      .then((r) => r.json())
      .then((d) => setCredits(d.credits ?? 0))
      .catch(() => {});
  }, [isSignedIn]);

  const activeTool = pathname === "/" ? (searchParams.get("tool") ?? "pulse") : null;
  const isToolActive = (tool: string) => activeTool === tool;

  const handleToolClick = (tool: string) => {
    if (tool === "pulse") router.push("/");
    else router.push(`/?tool=${tool}`);
  };

  const TOOL_ICONS: Record<string, React.ReactNode> = {
    pulse: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    "gap-analysis": (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
    "stack-advisor": (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
  };

  const ToolItem = ({ tool, label, dot, badge, locked }: {
    tool: string; label: string; dot: string; badge?: string; locked?: boolean;
  }) => {
    const active = isToolActive(tool);
    const icon = TOOL_ICONS[tool];
    return (
      <div
        onClick={() => { if (locked && !isSignedIn) return; handleToolClick(tool); }}
        style={{
          display: "flex", alignItems: "center", gap: 9, padding: "8px 10px",
          borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500,
          position: "relative", transition: "background 0.1s",
          color: "var(--clr-text)",
          background: active ? "rgba(0,0,0,0.07)" : "transparent",
          userSelect: "none" as const,
        }}
        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.05)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = active ? "rgba(0,0,0,0.07)" : "transparent"; }}
      >
        {active && <span style={{ position: "absolute", left: -10, top: "50%", transform: "translateY(-50%)", width: 3, height: 18, background: dot, borderRadius: "0 3px 3px 0" }} />}
        <span style={{ width: 22, height: 22, borderRadius: 6, background: "var(--clr-surface-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--clr-text-4)" }}>
          {icon}
        </span>
        <span style={{ flex: 1 }}>{label}</span>
        {badge && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "var(--clr-surface-2)", color: "var(--clr-text-4)", fontWeight: 700 }}>{badge}</span>}
        {locked && !isSignedIn && (
          <svg width="11" height="11" fill="none" viewBox="0 0 24 24" style={{ opacity: 0.35 }}>
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
      </div>
    );
  };

  const DOCS: readonly (readonly [string, string])[] = [
    ["/legal/terms-of-service", "Terms of Service"],
    ["/legal/privacy-policy", "Privacy Policy"],
    ["/legal/refund-policy", "Refund Policy"],
    ["/legal/cookie-policy", "Cookie Policy"],
    ["/legal/acceptable-use", "Acceptable Use"],
    ["/legal/ai-transparency", "AI Transparency"],
    ["/legal/disclaimer", "Disclaimer"],
    ["/legal/do-not-sell", "Do Not Sell My Info"],
  ];

  const PRODUCT: readonly (readonly [string, string])[] = [
    ["/how-it-works", "How it works"],
    ["/pricing", "Pricing"],
    ["/help", "Help"],
    ["/careers", "Careers"],
  ];

  const Flyout = ({ label, icon, items, sectionLabel }: {
    label: string; icon: React.ReactNode;
    items: readonly (readonly [string, string])[]; sectionLabel: string;
  }) => (
    <div
      style={{ position: "relative" }}
      onMouseEnter={e => {
        const f = e.currentTarget.querySelector(".flyout-panel") as HTMLElement;
        if (f) { clearTimeout((e.currentTarget as any)._t); f.style.display = "flex"; }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as any;
        el._t = setTimeout(() => {
          const f = el.querySelector(".flyout-panel") as HTMLElement;
          if (f) f.style.display = "none";
        }, 150);
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", borderRadius: 8, cursor: "pointer", color: "var(--clr-text-2)", fontSize: 13, transition: "background 0.1s" }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.05)"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}
      >
        {icon}
        <span style={{ flex: 1 }}>{label}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.3, flexShrink: 0 }}>
          <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div
        className="flyout-panel"
        style={{ display: "none", position: "absolute", left: "calc(100% + 4px)", bottom: 0, width: 220, background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 12, padding: 6, flexDirection: "column", gap: 1, zIndex: 200, boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}
      >
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: "var(--clr-text-4)", padding: "5px 8px 3px" }}>{sectionLabel}</div>
        {items.map(([href, lbl]) => (
          <Link
            key={href} href={href}
            style={{ display: "flex", alignItems: "center", padding: "7px 10px", borderRadius: 7, fontSize: 12, fontWeight: 500, color: "var(--clr-text)", textDecoration: "none", transition: "background 0.1s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.05)"}
            onMouseLeave={e => e.currentTarget.style.background = ""}
          >{lbl}</Link>
        ))}
      </div>
    </div>
  );

  return (
    <aside className="app-sidebar-el" style={{ width: 220, minWidth: 220, background: "var(--clr-surface)", borderRight: "1px solid var(--clr-border)", display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 50 }}>

      <a href="/" style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-start", gap: "10px", padding: "20px 20px 18px 20px", borderBottom: "1px solid var(--clr-border)", cursor: "pointer", flexShrink: 0, textDecoration: "none" }}>
        <svg width="24" height="24" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2"  y="2"  width="15" height="15" rx="3.5" fill="#222"/>
          <rect x="21" y="2"  width="15" height="15" rx="3.5" fill="#777"/>
          <rect x="2"  y="21" width="15" height="15" rx="3.5" fill="#777"/>
          <rect x="21" y="21" width="15" height="15" rx="3.5" fill="#777"/>
          <rect x="40" y="21" width="15" height="15" rx="3.5" fill="#777"/>
          <rect x="2"  y="40" width="15" height="15" rx="3.5" fill="#222"/>
          <rect x="21" y="40" width="15" height="15" rx="3.5" fill="#777"/>
          <rect x="40" y="40" width="15" height="15" rx="3.5" fill="#222"/>
        </svg>
        <span style={{ fontWeight: 500, fontSize: "22px", color: "var(--clr-text)", letterSpacing: "0.01em", lineHeight: 1, fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>unbuilt</span>
      </a>

      <div style={{ padding: "8px 10px 4px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", color: "var(--clr-text-4)", textTransform: "uppercase" as const, padding: "6px 8px 3px" }}>Explore</div>
        <ToolItem tool="pulse" label="Pulse" dot="#ef4444" badge="FREE" />
      </div>

      <div style={{ padding: "0 10px 4px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", color: "var(--clr-text-4)", textTransform: "uppercase" as const, padding: "8px 8px 3px" }}>Analyze</div>
        <ToolItem tool="gap-analysis" label="Dig" dot="#7c6fff" badge={isSignedIn ? "1 credit" : undefined} />
        <ToolItem tool="stack-advisor" label="Stack" dot="#38bdf8" badge={isSignedIn ? "1 credit" : undefined} />
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ padding: "8px 8px 10px", borderTop: "1px solid var(--clr-border)" }}>

        <Flyout label="Docs" sectionLabel="Legal & Policies" items={DOCS} icon={
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.4, flexShrink: 0 }}>
            <path d="M3 2h7l3 3v9H3V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            <path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M5 7h6M5 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        } />

        <Flyout label="Product" sectionLabel="Product" items={PRODUCT} icon={
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.4, flexShrink: 0 }}>
            <rect x="1.5" y="1.5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M5 5h6M5 8h4M5 11h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        } />
        {isSignedIn && (
        <Link
          href="/reports"
          style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", borderRadius: 8, color: "var(--clr-text-2)", fontSize: 13, textDecoration: "none", transition: "background 0.1s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.05)"}
          onMouseLeave={e => e.currentTarget.style.background = ""}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.35, flexShrink: 0 }}>
            <path d="M3 2h7l3 3v9H3V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            <path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.3"/>
          </svg>
          My Reports
        </Link>
        )}

        <div style={{ height: "0.5px", background: "var(--clr-border)", margin: "4px 0" }} />

        {isSignedIn ? (
          <div style={{ position: "relative" }}>
            <div
              onClick={() => setProfileOpen(o => !o)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, cursor: "pointer", transition: "background 0.1s", background: profileOpen ? "rgba(0,0,0,0.05)" : "" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.05)"}
              onMouseLeave={e => { if (!profileOpen) (e.currentTarget as HTMLElement).style.background = ""; }}
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
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, opacity: 0.3, transition: "transform 0.15s", transform: profileOpen ? "rotate(180deg)" : "none" }}>
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {profileOpen && (
              <div style={{ position: "absolute", left: "calc(100% + 8px)", bottom: 0, width: 220, background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 12, padding: 8, zIndex: 200, boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}>
                <div style={{ padding: "6px 10px 10px", borderBottom: "1px solid var(--clr-border)", marginBottom: 6 }}>
                  <div style={{ fontSize: 11, color: "var(--clr-text-4)", marginBottom: 2 }}>Signed in as</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--clr-text)", wordBreak: "break-all" as const }}>{user?.emailAddresses?.[0]?.emailAddress}</div>
                </div>
                <div
                  onClick={() => { setProfileOpen(false); signOut({ redirectUrl: "/" }); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, cursor: "pointer", color: "var(--clr-text-2)", fontSize: 13, transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.05)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.5, flexShrink: 0 }}>
                    <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Sign out
                </div>
              </div>
            )}
          </div>
        ) : (
          <SignInButton mode="modal">
            <button style={{ width: "100%", padding: "7px 10px", borderRadius: 8, background: "transparent", border: "1px solid var(--clr-border-2)", color: "var(--clr-text)", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
              Sign in
            </button>
          </SignInButton>
        )}

        {isSignedIn && credits !== null && (
          <div style={{ padding: "4px 2px" }}>
            <div style={{ background: "#f0fdf4", border: "0.5px solid #bbf7d0", borderRadius: 7, padding: "6px 10px", display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <polygon points="6,1 7.5,4 11,4.7 8.5,7 9.2,11 6,9.2 2.8,11 3.5,7 1,4.7 4.5,4" fill="#16a34a"/>
              </svg>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#15803d" }}>{credits} credits</span>
            </div>
          </div>
        )}

        <div style={{ paddingTop: 4 }}>
          {isSignedIn ? (
          <Link
            href="/pricing"
            style={{ background: "#7c6fff", borderRadius: 8, padding: "9px", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, textDecoration: "none", transition: "opacity 0.1s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.9"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: "white" }}>Buy Credits</span>
          </Link>
          ) : (
          <SignInButton mode="modal">
            <button style={{ width: "100%", background: "#7c6fff", borderRadius: 8, padding: "9px", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, border: "none", cursor: "pointer", fontFamily: "inherit", transition: "opacity 0.1s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.9"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v10M1 6h10" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: "white" }}>Buy Credits</span>
            </button>
          </SignInButton>
          )}
        </div>

      </div>
    </aside>
  );
}

export default function AppSidebar() {
  return (
    <Suspense>
      <AppSidebarInner />
    </Suspense>
  );
}
