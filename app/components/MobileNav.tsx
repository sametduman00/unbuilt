"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const go = (path: string) => { setOpen(false); router.push(path); };

  return (
    <>
      {/* Mobile top header — logo */}
      <header className="app-mobile-header">
        <div onClick={() => router.push("/")} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
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
          <span style={{ fontWeight:600, fontSize:16, color:"var(--clr-text)", letterSpacing:"0.01em" }}>unbuilt</span>
        </div>
        <a href="/pricing" style={{ fontSize:12, fontWeight:600, color:"#7c6fff", textDecoration:"none", background:"rgba(124,111,255,0.08)", border:"0.5px solid rgba(124,111,255,0.25)", borderRadius:999, padding:"5px 12px" }}>
          Buy Credits
        </a>
      </header>

      {/* Overlay */}
      {open && (
        <div onClick={() => setOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", zIndex:200 }} />
      )}

      {/* Slide-up menu */}
      <div style={{
        position:"fixed", bottom:56, left:0, right:0,
        background:"var(--clr-surface)", borderTop:"0.5px solid var(--clr-border)",
        borderRadius:"16px 16px 0 0", padding:"16px 16px 8px",
        zIndex:201, transform: open ? "translateY(0)" : "translateY(100%)",
        transition:"transform 0.22s ease"
      }}>
        <div style={{ width:36, height:4, borderRadius:2, background:"var(--clr-border)", margin:"0 auto 16px" }} />
        {[
          { href:"/how-it-works", label:"How it works" },
          { href:"/pricing", label:"Pricing" },
          { href:"/help", label:"Help" },
          { href:"/reports", label:"My Reports" },
          { href:"/legal/terms-of-service", label:"Terms of Service" },
          { href:"/legal/privacy-policy", label:"Privacy Policy" },
        ].map(item => (
          <Link key={item.href} href={item.href} onClick={() => setOpen(false)} style={{
            display:"flex", alignItems:"center", padding:"12px 4px",
            borderBottom:"0.5px solid var(--clr-border)",
            textDecoration:"none", color:"var(--clr-text)", fontSize:14, fontWeight:500
          }}>{item.label}</Link>
        ))}
      </div>

      {/* Bottom nav bar */}
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
        <button onClick={() => setOpen(o => !o)} style={{
          display:"flex", flexDirection:"column", alignItems:"center", gap:3,
          background:"none", border:"none", cursor:"pointer",
          color:"var(--clr-text-3)", fontSize:10, fontWeight:600,
          letterSpacing:"0.04em", padding:"4px 20px", fontFamily:"inherit"
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
