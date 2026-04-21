"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useUser, SignInButton, useClerk } from "@clerk/nextjs";

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
  ["/help", "Help"],
  ["/careers", "Careers"],
] as const;

const ROW: React.CSSProperties = {
  display:"flex", alignItems:"center", gap:12,
  padding:"12px 20px", textDecoration:"none",
  color:"var(--clr-text)", fontSize:15, fontWeight:500,
};
const SUB: React.CSSProperties = {
  display:"flex", alignItems:"center",
  padding:"10px 20px 10px 44px", textDecoration:"none",
  color:"var(--clr-text-2)", fontSize:14,
};
const DIV = <div style={{ height:1, background:"var(--clr-border)", margin:"2px 16px" }} />;

export default function MobileNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState<string|null>(null);
  const [plan, setPlan] = useState<{ tier: "free"|"pro"|"pro+"; totalAnalyses: number } | null>(null);
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    if(!isSignedIn) { setPlan(null); return; }
    fetch("/api/user/plan").then(r=>r.json()).then(d=>{
      const isPro = d.isPro ?? false;
      const monthly = d.monthlyAnalyses ?? 0;
      const tier = !isPro ? "free" as const : monthly > 10 ? "pro+" as const : "pro" as const;
      setPlan({ tier, totalAnalyses: d.totalAnalyses ?? 0 });
    }).catch(()=>{});
  }, [isSignedIn]);

  const close = () => { setMenuOpen(false); setExpanded(null); };
  const toggle = (k: string) => setExpanded(e => e===k ? null : k);
  const chevron = (k: string) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ transform: expanded===k?"rotate(180deg)":"none", transition:"transform 0.2s", flexShrink:0 }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );

  return (
    <>
      {/* Top header */}
      <header className="app-mobile-header">
        <div onClick={() => { close(); window.location.href="/"; }}
          style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
          <svg width="20" height="20" viewBox="0 0 56 56" fill="none">
            <rect x="2"  y="2"  width="15" height="15" rx="3.5" fill="#222"/>
            <rect x="21" y="2"  width="15" height="15" rx="3.5" fill="#777"/>
            <rect x="2"  y="21" width="15" height="15" rx="3.5" fill="#777"/>
            <rect x="21" y="21" width="15" height="15" rx="3.5" fill="#777"/>
            <rect x="40" y="21" width="15" height="15" rx="3.5" fill="#777"/>
            <rect x="2"  y="40" width="15" height="15" rx="3.5" fill="#222"/>
            <rect x="21" y="40" width="15" height="15" rx="3.5" fill="#777"/>
            <rect x="40" y="40" width="15" height="15" rx="3.5" fill="#222"/>
          </svg>
          <span style={{ fontWeight:600, fontSize:16, color:"var(--clr-text)" }}>unbuilt</span>
        </div>
        <button onClick={() => { setMenuOpen(o=>!o); setExpanded(null); }}
          style={{ background:"none", border:"none", cursor:"pointer", padding:6, color:"var(--clr-text)", display:"flex" }}>
          {menuOpen
            ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          }
        </button>
      </header>

      {/* Dropdown menu */}
      {menuOpen && (
        <>
          <div onClick={close} style={{ position:"fixed", inset:0, top:52, zIndex:98, background:"rgba(0,0,0,0.15)" }} />
          <div style={{ position:"fixed", top:52, left:0, right:0, background:"var(--clr-surface)", borderBottom:"1px solid var(--clr-border)", zIndex:99, overflowY:"auto", maxHeight:"calc(100vh - 108px)" }}>

            {isSignedIn ? (
              <>
                {/* Profile */}
                <div style={{ padding:"14px 20px", display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", background:"#7c6fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span style={{ fontSize:14, fontWeight:600, color:"white" }}>
                      {user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? "U"}
                    </span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"var(--clr-text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress ?? "Account"}
                    </div>
                    <div style={{ fontSize:11, color:"var(--clr-text-3)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {user?.emailAddresses?.[0]?.emailAddress}
                    </div>
                  </div>
                </div>

                {/* Plan badge */}
                <div style={{ margin:"0 16px 10px", background: plan?.tier !== "free" ? "rgba(99,102,241,0.05)" : "#f0fdf4", border: plan?.tier !== "free" ? "0.5px solid rgba(99,102,241,0.3)" : "0.5px solid #bbf7d0", borderRadius:8, padding:"10px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:11, fontWeight:800, letterSpacing:"0.04em", color: plan?.tier !== "free" ? "#6366f1" : "#15803d" }}>
                      {plan?.tier === "pro+" ? "PRO+" : plan?.tier === "pro" ? "PRO" : "FREE"}
                    </span>
                    <span style={{ fontSize:13, fontWeight:600, color: plan?.tier !== "free" ? "#6366f1" : "#15803d" }}>
                      {plan !== null ? `${plan.totalAnalyses} analyses` : "Loading..."}
                    </span>
                  </div>
                </div>

                {DIV}

                {/* My Reports */}
                <Link href="/reports" onClick={close} style={ROW}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  My Reports
                </Link>

                {DIV}
              </>
            ) : (
              <>
                {/* Sign in */}
                <div style={{ padding:"10px 16px" }}>
                  <SignInButton mode="modal">
                    <button style={{ width:"100%", padding:"12px", borderRadius:10, background:"#7c6fff", border:"none", color:"white", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                      Sign in
                    </button>
                  </SignInButton>
                </div>
                {DIV}
              </>
            )}

            {/* Buy Credits — always visible */}
            <Link href="/pricing" onClick={close} style={{ ...ROW, background:"rgba(124,111,255,0.06)" } as React.CSSProperties}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c6fff" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              <span style={{ color:"#7c6fff", fontWeight:600 }}>Buy Credits</span>
            </Link>
            {DIV}

            {/* Launches */}
            <Link href="/launches" onClick={close} style={ROW}>
              <span style={{ display:"flex", alignItems:"center", gap:8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                Launches
              </span>

            </Link>
            <Link href="/use-cases" onClick={close} style={ROW}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z"/></svg>
              Use Cases
            </Link>
            {DIV}

            {/* Product accordion */}
            <button onClick={() => toggle("product")} style={{ ...ROW, width:"100%", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", justifyContent:"space-between" } as React.CSSProperties}>
              <span style={{ display:"flex", alignItems:"center", gap:12 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Product
              </span>
              {chevron("product")}
            </button>
            {expanded==="product" && PRODUCT.map(([href, label]) => (
              <Link key={href} href={href} onClick={close} style={SUB}>{label}</Link>
            ))}

            {DIV}

            {/* Docs accordion */}
            <button onClick={() => toggle("docs")} style={{ ...ROW, width:"100%", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", justifyContent:"space-between" } as React.CSSProperties}>
              <span style={{ display:"flex", alignItems:"center", gap:12 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Docs
              </span>
              {chevron("docs")}
            </button>
            {expanded==="docs" && DOCS.map(([href, label]) => (
              <Link key={href} href={href} onClick={close} style={SUB}>{label}</Link>
            ))}

            {DIV}

            {/* Sign out */}
            {isSignedIn && (
              <button onClick={() => { close(); signOut({ redirectUrl:"/" }); }}
                style={{ ...ROW, width:"100%", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", color:"#ef4444" } as React.CSSProperties}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign out
              </button>
            )}

            <div style={{ height:8 }} />
          </div>
        </>
      )}

      {/* Bottom nav */}
      <nav className="app-mobile-nav">
        <a href="/launches">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          <span>Launches</span>
        </a>
        <a href="/?tab=dig">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <span>Dig</span>
        </a>
        <a href="/?tab=stack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          <span>Stack</span>
        </a>
      </nav>
    </>
  );
}
