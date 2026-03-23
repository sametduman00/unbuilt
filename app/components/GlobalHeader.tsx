"use client";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function GlobalHeader() {
  const { isSignedIn, isLoaded } = useUser();
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/credits")
      .then((r) => r.json())
      .then((d) => setCredits(d.credits ?? 0))
      .catch(() => {});
  }, [isSignedIn]);

  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      height: 52, display: "flex", alignItems: "center",
      background: "var(--clr-surface)",
      borderBottom: "1px solid var(--clr-border)",
    }}>
      {/* Sidebar width spacer — logo lives in the sidebar */}
      <div style={{ width: 220, minWidth: 220, flexShrink: 0, borderRight: "1px solid var(--clr-border)", height: "100%" }} />

      {/* Nav links — start right after sidebar border */}
      <nav style={{ display: "flex", alignItems: "center", gap: 24, height: "100%", padding: "0 24px" }}>
        <Link href="/how-it-works" style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--clr-text-2)", textDecoration: "none", transition: "color 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--clr-text)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--clr-text-2)"}
        >How it works</Link>
        <Link href="/pricing" style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--clr-text-2)", textDecoration: "none", transition: "color 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--clr-text)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--clr-text-2)"}
        >Pricing</Link>
        <Link href="/careers" style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--clr-text-2)", textDecoration: "none", transition: "color 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--clr-text)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--clr-text-2)"}
        >Careers</Link>
      </nav>

      {/* Right: credits + auth */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, paddingRight: 20 }}>
        {isLoaded && isSignedIn && credits !== null && (
          <Link href="/pricing" style={{ textDecoration: "none" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 20,
              border: credits === 0 ? "1px solid rgba(220,38,38,0.3)" : "1px solid var(--clr-border-2)",
              background: credits === 0 ? "rgba(220,38,38,0.05)" : "transparent",
              cursor: "pointer",
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke={credits === 0 ? "rgb(220,38,38)" : "var(--clr-accent)"}
                strokeWidth="2.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              <span style={{
                fontSize: "0.8rem", fontWeight: 600,
                color: credits === 0 ? "rgb(220,38,38)" : "var(--clr-text-2)",
              }}>
                {credits === 0 ? "Buy credits" : `${credits} credit${credits === 1 ? "" : "s"}`}
              </span>
            </div>
          </Link>
        )}

        {isLoaded && !isSignedIn && (
          <SignInButton mode="modal">
            <button style={{
              padding: "6px 16px", background: "transparent",
              color: "var(--clr-text)", border: "1px solid var(--clr-border-2)",
              borderRadius: 8, fontSize: "0.875rem", fontWeight: 500,
              cursor: "pointer", fontFamily: "inherit",
            }}>Sign in</button>
          </SignInButton>
        )}

        {isLoaded && isSignedIn && (
          <UserButton appearance={{
            elements: {
              userPreviewMainIdentifier: { color: "var(--clr-text)" },
              userPreviewSecondaryIdentifier: { color: "var(--clr-text-3)" },
              userButtonPopoverCard: { backgroundColor: "#ffffff", borderColor: "rgba(0,0,0,0.1)" },
              userButtonPopoverActionButton: { color: "var(--clr-text)" },
              userButtonPopoverActionButtonText: { color: "var(--clr-text)" },
              userButtonPopoverActionButtonIcon: { color: "var(--clr-text)" },
            }
          }} />
        )}
      </div>
    </header>
  );
}
