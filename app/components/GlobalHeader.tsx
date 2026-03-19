"use client";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function GlobalHeader() {
  const { isSignedIn, isLoaded } = useUser();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const dark = saved ? saved === "dark" : true;
    setIsDark(dark);
    document.documentElement.classList.toggle("light", !dark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("light", !next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <div style={{
      position: "fixed",
      top: 12,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      height: 42,
      background: "var(--clr-bg)",
      border: "1px solid var(--clr-border)",
      borderRadius: 12,
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
      overflow: "hidden",
      whiteSpace: "nowrap" as const,
    }}>

      {/* Logo bölümü */}
      <Link href="/" style={{
        display: "flex", alignItems: "center", gap: 7,
        textDecoration: "none",
        padding: "0 14px 0 16px",
        height: "100%",
      }}>
        <svg width="18" height="18" viewBox="0 0 19 19" fill="none">
          <path d="M2.5 5.5h14M2.5 9.5h10M2.5 13.5h6" stroke="var(--clr-accent)" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--clr-text)", letterSpacing: "-0.03em" }}>
          Unbuilt
        </span>
      </Link>

      {/* Dikey ayırıcı */}
      <div style={{ width: 1, height: 20, background: "var(--clr-border)", flexShrink: 0 }} />

      {/* Nav linkleri */}
      <nav style={{ display: "flex", alignItems: "center", height: "100%" }}>
        <Link href="/how-it-works" style={{
          fontSize: "0.8125rem", fontWeight: 500,
          color: "var(--clr-text-3)", textDecoration: "none",
          padding: "0 14px", height: "100%",
          display: "flex", alignItems: "center",
          transition: "color 0.15s, background 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--clr-text)"; e.currentTarget.style.background = "var(--clr-surface)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--clr-text-3)"; e.currentTarget.style.background = "transparent"; }}>
          How it works
        </Link>
        <Link href="/pulse" style={{
          fontSize: "0.8125rem", fontWeight: 500,
          color: "var(--clr-text-3)", textDecoration: "none",
          padding: "0 14px", height: "100%",
          display: "flex", alignItems: "center",
          transition: "color 0.15s, background 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--clr-text)"; e.currentTarget.style.background = "var(--clr-surface)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--clr-text-3)"; e.currentTarget.style.background = "transparent"; }}>
          Pulse
        </Link>
      </nav>

      {/* Dikey ayırıcı */}
      <div style={{ width: 1, height: 20, background: "var(--clr-border)", flexShrink: 0 }} />

      {/* Sağ: tema + auth */}
      <div style={{ display: "flex", alignItems: "center", height: "100%", padding: "0 8px", gap: 6 }}>
        <button onClick={toggleTheme} style={{
          background: "transparent", border: "none",
          borderRadius: 7, width: 28, height: 28,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--clr-text-3)",
        }}>
          {isDark
            ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          }
        </button>

        {isLoaded && !isSignedIn && (
          <SignInButton mode="modal">
            <button style={{
              padding: "0.3rem 0.875rem",
              background: "var(--clr-text)", color: "var(--clr-bg)",
              border: "none", borderRadius: 7,
              fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer",
            }}>
              Sign in
            </button>
          </SignInButton>
        )}
        {isLoaded && isSignedIn && <UserButton />}
      </div>
    </div>
  );
}
