"use client";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function GlobalHeader() {
  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      height: 52, display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 1.5rem",
      background: "var(--clr-bg)",
      borderBottom: "1px solid var(--clr-border)",
      backdropFilter: "blur(12px)",
    }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
        <svg width="20" height="20" viewBox="0 0 19 19" fill="none">
          <path d="M2.5 5.5h14M2.5 9.5h10M2.5 13.5h6" stroke="var(--clr-accent)" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--clr-text)", letterSpacing: "-0.02em" }}>Unbuilt</span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <SignedOut>
          <SignInButton mode="modal">
            <button style={{
              padding: "0.375rem 1rem",
              background: "var(--clr-text)",
              color: "var(--clr-bg)",
              border: "none", borderRadius: 8,
              fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
            }}>Sign in</button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                userButtonPopoverActionButton__manageAccount: { display: "none" },
              }
            }}
          />
        </SignedIn>
      </div>
    </header>
  );
}
