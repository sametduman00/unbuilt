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

  const navStyle: React.CSSProperties = {
    fontSize: "0.8rem",
    fontWeight: 500,
    color: "var(--clr-text)",
    textDecoration: "none",
    transition: "opacity 0.15s",
  };

  return (
    <header style={{
      position: "fixed",
      top: 0, left: 0, right: 0,
      zIndex: 100,
      height: 60,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 2.5rem",
      background: "var(--clr-bg)",
      borderBottom: "1px solid var(--clr-border)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
    }}>

      {/* Sol: Logo + divider + nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, height: "100%" }}>

        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", paddingRight: 24 }}>
          <svg width="26" height="26" viewBox="0 0 19 19" fill="none">
            <path d="M2.5 5.5h14M2.5 9.5h10M2.5 13.5h6" stroke="var(--clr-accent)" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: "1.13rem", color: "var(--clr-text)", letterSpacing: "-0.03em" }}>
            Unbuilt
          </span>
        </Link>

        {/* Dikey çizgi */}
        <div style={{ width: 1, height: 22, background: "var(--clr-border)", marginRight: 24, flexShrink: 0 }} />

        <nav style={{ display: "flex", alignItems: "center", gap: 28, height: "100%" }}>
          <Link href="/how-it-works" style={navStyle}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.6")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
            How it works
          </Link>
          <Link href="/careers" style={navStyle}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.6")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
            Careers
          </Link>
        </nav>
      </div>

      {/* Sağ: tema + auth */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={toggleTheme} style={{
          background: "transparent",
          border: "1px solid var(--clr-border)",
          borderRadius: 10, width: 40, height: 40,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--clr-text-3)",
        }}>
          {isDark
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          }
        </button>

        {isLoaded && !isSignedIn && (
          <SignInButton mode="modal">
            <button style={{
              padding: "0.44rem 1.25rem",
              background: "var(--clr-text)", color: "var(--clr-bg)",
              border: "none", borderRadius: 10,
              fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
            }}>
              Sign in
            </button>
          </SignInButton>
        )}
        {isLoaded && isSignedIn && <UserButton />}
      </div>
    </header>
  );
}
