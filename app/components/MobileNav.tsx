"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

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

const S: React.CSSProperties = {
  display:"flex", alignItems:"center", gap:12,
  padding:"12px 20px", textDecoration:"none",
  color:"var(--clr-text)", fontSize:15, fontWeight:500,
};

const SUB: React.CSSProperties = {
  display:"flex", alignItems:"center", gap:12,
  padding:"10px 20px 10px 44px", textDecoration:"none",
  color:"var(--clr-text-2)", fontSize:14, fontWeight:400,
};

export default function MobileNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const close = () => { setMenuOpen(false); setExpanded(null); };
  const toggle = (key: string) => setExpanded(e => e === key ? null : key);

  return (
    <>
      {/* Top header */}
      <header className="app-mobile-header">
        <div onClick={() => { close(); router.push("/"); }}
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
        <button onClick={() => { setMenuOpen(o => !o); setExpanded(null); }}
          style={{ background:"none", border:"none", cursor:"pointer", padding:6, color:"var(--clr-text)", display:"flex" }}>
          {menuOpen
            ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          }
        </button>
      </header>

      {/* Menu */}
      {menuOpen && (
        <>
          <div onClick={close} style={{ position:"fixed", inset:0, top:52, zIndex:98, background:"rgba(0,0,0,0.15)" }} />
          <div style={{ position:"fixed", top:52, left:0, right:0, background:"var(--clr-surface)", borderBottom:"1px solid var(--clr-border)", zIndex:99, overflowY:"auto", maxHeight:"calc(100vh - 108px)" }}>

            {/* Account */}
            {isSignedIn
              ? <Link href="/reports" onClick={close} style={S}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  My Reports
                </Link>
              : <Link href="/sign-in" onClick={close} style={S}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                  Sign in
                </Link>
            }

            <div style={{ height:1, background:"var(--clr-border)", margin:"0 16px" }} />

            {/* Product — accordion */}
            <button onClick={() => toggle("product")} style={{ ...S, width:"100%", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", justifyContent:"space-between" }}>
              <span style={{ display:"flex", alignItems:"center", gap:12 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Product
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: expanded==="product"?"rotate(180deg)":"none", transition:"transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {expanded === "product" && PRODUCT.map(([href, label]) => (
              <Link key={href} href={href} onClick={close} style={SUB}>{label}</Link>
            ))}

            <div style={{ height:1, background:"var(--clr-border)", margin:"0 16px" }} />

            {/* Docs — accordion */}
            <button onClick={() => toggle("docs")} style={{ ...S, width:"100%", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", justifyContent:"space-between" }}>
              <span style={{ display:"flex", alignItems:"center", gap:12 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Docs
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: expanded==="docs"?"rotate(180deg)":"none", transition:"transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {expanded === "docs" && DOCS.map(([href, label]) => (
              <Link key={href} href={href} onClick={close} style={SUB}>{label}</Link>
            ))}

          </div>
        </>
      )}

      {/* Bottom nav — 3 items only */}
      <nav className="app-mobile-nav">
        <a href="/">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          <span>Pulse</span>
        </a>
        <a href="/?tool=gap-analysis">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <span>Dig</span>
        </a>
        <a href="/?tool=stack-advisor">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          <span>Stack</span>
        </a>
      </nav>
    </>
  );
}
