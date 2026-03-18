"use client";

import { useUser, useSignIn } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";

const CONSENT_KEY = "unbuilt_consent_v1";

export default function ConsentGate({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  const { signIn } = useSignIn();
  const [consentGiven, setConsentGiven] = useState(true);
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(CONSENT_KEY);
    setConsentGiven(saved === "true");
  }, []);

  const handleAccept = () => {
    if (!isSignedIn || !check1 || !check2) return;
    localStorage.setItem(CONSENT_KEY, "true");
    setConsentGiven(true);
  };

  const signInWith = async (provider: "oauth_github" | "oauth_google") => {
    if (!signIn) return;
    await signIn.authenticateWithRedirect({
      strategy: provider,
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/",
    });
  };

  const showGate = mounted && isLoaded && (!isSignedIn || !consentGiven);

  if (!mounted || !isLoaded) return <>{children}</>;
  if (!showGate) return <>{children}</>;

  const canAccept = isSignedIn && check1 && check2;

  return (
    <>
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.7)",
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

          {/* Step 1 */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--clr-text-5)", marginBottom: "0.75rem" }}>
              Step 1 — Sign in
            </div>
            {!isSignedIn ? (
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => signInWith("oauth_github")}
                  style={{
                    flex: 1, padding: "0.625rem 1rem",
                    background: "#24292e", border: "1px solid #444",
                    borderRadius: 10, color: "#fff",
                    fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    fontFamily: "inherit",
                  }}>
                  <svg width="16" height="16" viewBox="0 0 98 96" fill="white">
                    <path d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"/>
                  </svg>
                  GitHub
                </button>
                <button
                  onClick={() => signInWith("oauth_google")}
                  style={{
                    flex: 1, padding: "0.625rem 1rem",
                    background: "#fff", border: "1px solid #dadce0",
                    borderRadius: 10, color: "#3c4043",
                    fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    fontFamily: "inherit",
                  }}>
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
              </div>
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

          {/* Step 2 */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--clr-text-5)", marginBottom: "0.75rem" }}>
              Step 2 — Accept policies
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", padding: "0.875rem 1rem", borderRadius: 10, border: `1px solid ${check1 ? "var(--clr-border-3)" : "var(--clr-border)"}`, background: check1 ? "rgba(var(--clr-text-rgb),0.03)" : "transparent", transition: "all 0.15s" }}>
                <div onClick={() => setCheck1(!check1)} style={{
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
                  <Link href="/legal/terms" target="_blank" style={{ color: "var(--clr-text)", textDecoration: "underline" }}>Terms of Service</Link>,{" "}
                  <Link href="/legal/privacy" target="_blank" style={{ color: "var(--clr-text)", textDecoration: "underline" }}>Privacy Policy</Link>, and{" "}
                  <Link href="/legal/disclaimer" target="_blank" style={{ color: "var(--clr-text)", textDecoration: "underline" }}>Disclaimer</Link>
                </span>
              </label>

              <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", padding: "0.875rem 1rem", borderRadius: 10, border: `1px solid ${check2 ? "var(--clr-border-3)" : "var(--clr-border)"}`, background: check2 ? "rgba(var(--clr-text-rgb),0.03)" : "transparent", transition: "all 0.15s" }}>
                <div onClick={() => setCheck2(!check2)} style={{
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
                  <Link href="/legal/cookies" target="_blank" style={{ color: "var(--clr-text)", textDecoration: "underline" }}>Cookie Policy</Link>,{" "}
                  <Link href="/legal/acceptable-use" target="_blank" style={{ color: "var(--clr-text)", textDecoration: "underline" }}>Acceptable Use</Link>,{" "}
                  <Link href="/legal/ai-transparency" target="_blank" style={{ color: "var(--clr-text)", textDecoration: "underline" }}>AI Transparency</Link>, and{" "}
                  <Link href="/legal/do-not-sell" target="_blank" style={{ color: "var(--clr-text)", textDecoration: "underline" }}>Do Not Sell</Link>
                </span>
              </label>
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
            {!isSignedIn ? "Sign in to continue" : !check1 || !check2 ? "Accept all policies to continue" : "Enter Unbuilt →"}
          </button>
        </div>
      </div>

      <div style={{ filter: "blur(4px)", pointerEvents: "none", userSelect: "none" }}>
        {children}
      </div>
    </>
  );
}
