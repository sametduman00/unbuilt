"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export default function MobileNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isSignedIn } = useAuth();
  const router = useRouter();

  return (
    <>
      {/* Top header */}
      <header className="app-mobile-header">
        {/* Logo */}
        <div onClick={() => { setMenuOpen(false); router.push("/"); }}
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

        {/* Hamburger button */}
        <button onClick={() => setMenuOpen(o => !o)}
          style={{ background:"none", border:"none", cursor:"pointer", padding:"6px", display:"flex", alignItems:"center", justifyContent:"center", borderRadius:8, color:"var(--clr-text)" }}>
          {menuOpen
            ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          }
        </button>
      </header>

      {/* Dropdown menu */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div onClick={() => setMenuOpen(false)}
            style={{ position:"fixed", inset:0, top:52, background:"rgba(0,0,0,0.2)", zIndex:98 }} />

          {/* Menu panel */}
          <div style={{
            position:"fixed", top:52, left:0, right:0,
            background:"var(--clr-surface)",
            borderBottom:"1px solid var(--clr-border)",
            zIndex:99, padding:"8px 0"
          }}>
            {/* Sign in / Account */}
            {isSignedIn ? (
              <Link href="/reports" onClick={() => setMenuOpen(false)} style={menuItemStyle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                My Account
              </Link>
            ) : (
              <Link href="/sign-in" onClick={() => setMenuOpen(false)} style={menuItemStyle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                Sign in
              </Link>
            )}

            <div style={{ height:"0.5px", background:"var(--clr-border)", margin:"4px 16px" }} />

            {/* Product */}
            <Link href="/how-it-works" onClick={() => setMenuOpen(false)} style={menuItemStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Product
            </Link>
            <Link href="/pricing" onClick={() => setMenuOpen(false)} style={menuItemStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              Pricing
            </Link>

            <div style={{ height:"0.5px", background:"var(--clr-border)", margin:"4px 16px" }} />

            {/* Docs */}
            <Link href="/help" onClick={() => setMenuOpen(false)} style={menuItemStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Help
            </Link>
            <Link href="/legal/terms-of-service" onClick={() => setMenuOpen(false)} style={menuItemStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Docs
            </Link>

            <div style={{ height:"0.5px", background:"var(--clr-border)", margin:"4px 16px" }} />

            {/* My Reports */}
            <Link href="/reports" onClick={() => setMenuOpen(false)} style={menuItemStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              My Reports
            </Link>
          </div>
        </>
      )}

      {/* Bottom nav — Pulse / Dig / Stack only */}
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

const menuItemStyle: React.CSSProperties = {
  display:"flex", alignItems:"center", gap:12,
  padding:"13px 20px",
  textDecoration:"none", color:"var(--clr-text)",
  fontSize:15, fontWeight:500,
  transition:"background 0.1s",
};
