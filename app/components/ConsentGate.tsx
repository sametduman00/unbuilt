"use client";

import { useUser, SignInButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";

const CONSENT_KEY = "unbuilt_consent_v1";

export default function ConsentGate({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  // null = unknown (loading), false = not given, true = given
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(CONSENT_KEY);
    setConsentGiven(saved === "true");
  }, []);

  const handleAccept = () => {
    if (!isSignedIn || !check1 || !check2) return;
    localStorage.setItem(CONSENT_KEY, "true");
    setConsentGiven(true);
  };

  // While Clerk or consent state is loading, render nothing (avoids flash)
  if (!isLoaded || consentGiven === null) return null;

  // Fully authenticated and consent given → show the app
  if (isSignedIn && consentGiven) return <>{children}</>;

  const canAccept = isSignedIn && check1 && check2;

  return (
    <>
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}>
        <div style={{
          background: "var(--clr-surface)",
          border: "1px solid var(--clr-border-2)",
          borderRadius: 20,
          padding: "2.5rem 2rem",
          maxWidth: 460,
          width: "100%",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.75rem" }}>
            <svg width="24" height="24" viewBox="0 0 19 19" fill="none">
              <path d="M2.5 5.5h14M2.5 9.5h10M2.5 13.5h6" stroke="var(--clr-accent)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{ fontWeight: 700, fontSize: "1.125rem", color: "var(--clr-text)", letterSpacing: "-0.02em" }}>Unbuilt</span>
          </div>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--clr-text)", marginBottom: "0.5rem", letterSpacing: "-0.03em" }}>
            Before you dive in
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--clr-text-3)", lineHeight: 1.6, marginBottom: "2rem" }}>
            Sign in and accept our policies to access Unbuilt.
          </p>

          {/* Step 1 — Sign in */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--clr-text-5)", marginBottom: "0.75rem" }}>
              Step 1 — Sign in
            </div>
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button style={{
                  width: "100%", padding: "0.75rem 1rem",
                  background: "var(--clr-text)", color: "var(--clr-bg)",
                  border: "none", borderRadius: 10,
                  fontSize: "0.9375rem", fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  fontFamily: "inherit", letterSpacing: "-0.01em",
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  Sign in to continue
                </button>
              </SignInButton>
            ) : (
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "0.75rem 1rem",
                background: "rgba(var(--clr-text-rgb),0.04)",
                border: "1px solid var(--clr-border-3)",
                borderRadius: 10,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--clr-text)" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: "0.875rem", color: "var(--clr-text)", fontWeight: 600 }}>Signed in ✓</span>
              </div>
            )}
          </div>

          {/* Step 2 — Policies */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--clr-text-5)", marginBottom: "0.75rem" }}>
              Step 2 — Accept policies
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

              {/* Checkbox 1 */}
              <div
                onClick={() => setCheck1(!check1)}
                style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", padding: "0.875rem 1rem", borderRadius: 10, border: `1px solid ${check1 ? "var(--clr-border-3)" : "var(--clr-border)"}`, background: check1 ? "rgba(var(--clr-text-rgb),0.03)" : "transparent", transition: "all 0.15s" }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                  border: `1.5px solid ${check1 ? "var(--clr-text)" : "var(--clr-border-3)"}`,
                  background: check1 ? "var(--clr-text)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}>
                  {check1 && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="var(--clr-bg)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", lineHeight: 1.55 }}>
                  I agree to the{" "}
                  <Link href="/legal/terms" target="_blank" onClick={e => e.stopPropagation()} style={{ color: "var(--clr-text)", textDecoration: "underline" }}>Terms of Service</Link>,{" "}
                  <Link href="/legal/privacy" target="_blank" onClick={e => e.stopPropagation()} style={{ color: "var(--clr-text)", textDecoration: "underline" }}>Privacy Policy</Link>, and{" "}
                  <Link href="/legal/disclaimer" target="_blank" onClick={e => e.stopPropagation()} style={{ color: "var(--clr-text)", textDecoration: "underline" }}>Disclaimer</Link>
                </span>
              </div>

              {/* Checkbox 2 */}
              <div
                onClick={() => setCheck2(!check2)}
                style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", padding: "0.875rem 1rem", borderRadius: 10, border: `1px solid ${check2 ? "var(--clr-border-3)" : "var(--clr-border)"}`, background: check2 ? "rgba(var(--clr-text-rgb),0.03)" : "transparent", transition: "all 0.15s" }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                  border: `1.5px solid ${check2 ? "var(--clr-text)" : "var(--clr-border-3)"}`,
                  background: check2 ? "var(--clr-text)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}>
                  {check2 && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="var(--clr-bg)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)", lineHeight: 1.55 }}>
                  I agree to the{" "}
                  <Link href="/legal/cookies" target="_blank" onClick={e => e.stopPropagation()} style={{ color: "var(--clr-text)", textDecoration: "underline" }}>Cookie Policy</Link>,{" "}
                  <Link href="/legal/acceptable-use" target="_blank" onClick={e => e.stopPropagation()} style={{ color: "var(--clr-text)", textDecoration: "underline" }}>Acceptable Use</Link>,{" "}
                  <Link href="/legal/ai-transparency" target="_blank" onClick={e => e.stopPropagation()} style={{ color: "var(--clr-text)", textDecoration: "underline" }}>AI Transparency</Link>, and{" "}
                  <Link href="/legal/do-not-sell" target="_blank" onClick={e => e.stopPropagation()} style={{ color: "var(--clr-text)", textDecoration: "underline" }}>Do Not Sell</Link>
                </span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleAccept}
            disabled={!canAccept}
            style={{
              width: "100%", padding: "0.75rem",
              background: canAccept ? "var(--clr-text)" : "var(--clr-border-2)",
              color: canAccept ? "var(--clr-bg)" : "var(--clr-text-6)",
              border: "none", borderRadius: 12,
              fontSize: "0.9375rem", fontWeight: 700,
              cursor: canAccept ? "pointer" : "not-allowed",
              letterSpacing: "-0.01em", fontFamily: "inherit",
              transition: "all 0.2s",
            }}
          >
            {!isSignedIn ? "Sign in first to continue" : !check1 || !check2 ? "Accept all policies to continue" : "Enter Unbuilt →"}
          </button>
        </div>
      </div>

      {/* Blurred background content */}
      <div style={{ filter: "blur(4px)", pointerEvents: "none", userSelect: "none" }}>
        {children}
      </div>
    </>
  );
}
