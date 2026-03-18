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
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      height: 52, display: "flex", alignItems: "center",
      justifyContent: "space-between", padding: "0 2rem",
      background: "var(--clr-bg)", borderBottom: "1px solid var(--clr-border)",
      backdropFilter: "blur(12px)",
    }}>
      {/* Logo + How it works */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, paddingLeft: "3rem" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
          <svg width="26" height="26" viewBox="0 0 19 19" fill="none">
            <path d="M2.5 5.5h14M2.5 9.5h10M2.5 13.5h6" stroke="var(--clr-accent)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: "1.125rem", color: "var(--clr-text)", letterSpacing: "-0.02em" }}>Unbuilt</span>
        </Link>

        <Link href="/how-it-works" style={{
          fontSize: "0.8125rem", fontWeight: 500,
          color: "var(--clr-text-3)", textDecoration: "none",
          padding: "0.375rem 0.625rem", borderRadius: 8,
          transition: "color 0.15s",
        }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--clr-text)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--clr-text-3)")}
        >
          How it works
        </Link>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Dark/Light toggle */}
        <button onClick={toggleTheme} style={{
          background: "var(--clr-surface)", border: "1px solid var(--clr-border)",
          borderRadius: 8, padding: "0.375rem 0.625rem", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 5,
          fontSize: "0.8125rem", color: "var(--clr-text-3)",
        }}>
          {isDark
            ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          }
          {isDark ? "Light" : "Dark"}
        </button>

        {/* Auth */}
        {isLoaded && !isSignedIn && (
          <SignInButton mode="modal">
            <button style={{
              padding: "0.375rem 1rem", background: "var(--clr-text)",
              color: "var(--clr-bg)", border: "none", borderRadius: 8,
              fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
            }}>Sign in</button>
          </SignInButton>
        )}
        {isLoaded && isSignedIn && <UserButton />}
      </div>
    </header>
  );
}
