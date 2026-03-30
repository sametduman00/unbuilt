"use client";
import { useRouter } from "next/navigation";

export default function MobileNav() {
  const router = useRouter();
  return (
    <>
      {/* Mobile top header */}
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
          <span style={{ fontWeight:600, fontSize:16, color:"var(--clr-text)" }}>unbuilt</span>
        </div>
        <a href="/pricing" style={{ fontSize:12, fontWeight:600, color:"#7c6fff", textDecoration:"none", background:"rgba(124,111,255,0.08)", border:"0.5px solid rgba(124,111,255,0.25)", borderRadius:999, padding:"5px 12px" }}>
          Buy Credits
        </a>
      </header>

      {/* Bottom nav */}
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
        <a href="/how-it-works">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>Help</span>
        </a>
      </nav>
    </>
  );
}
