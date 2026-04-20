"use client";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function GlobalHeader() {
  const { isSignedIn, isLoaded } = useUser();
  const [plan, setPlan] = useState<{ plan: string; totalAnalyses: number; isPro: boolean; tier: "free" | "pro" | "pro+" } | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/user/plan")
      .then((r) => r.json())
      .then((d) => {
        const isPro = d.isPro ?? false;
        const monthly = d.monthlyAnalyses ?? 0;
        const tier = !isPro ? "free" as const : monthly > 10 ? "pro+" as const : "pro" as const;
        setPlan({ plan: d.plan ?? "free", totalAnalyses: d.totalAnalyses ?? 0, isPro, tier });
      })
      .catch(() => {});
  }, [isSignedIn]);

  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      height: 52, display: "flex", alignItems: "center",
      background: "var(--clr-surface)",
      borderBottom: "1px solid var(--clr-border)",
    }}>
      {/* Logo — top-left, inside the 220px sidebar zone */}
      <div style={{ width: 220, minWidth: 220, flexShrink: 0, display: "flex", alignItems: "center", padding: "0 16px" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <svg width="22" height="22" viewBox="0 0 19 19" fill="none">
            <path d="M2.5 5.5h14M2.5 9.5h10M2.5 13.5h6" stroke="var(--clr-accent)" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--clr-text)", letterSpacing: "-0.025em", fontFamily: "Figtree, sans-serif" }}>
            Unbuilt
          </span>
        </Link>
      </div>

      {/* Divider matching sidebar border */}
      <div style={{ width: 1, height: "100%", background: "var(--clr-border)", flexShrink: 0 }} />

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
        <Link href="/?tool=gap-analysis" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, background: "var(--clr-text)", color: "var(--clr-bg)", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 2l1.5 4.5H14L10 9l1.5 4.5L8 11 4.5 13.5 6 9 2 6.5h4.5L8 2z" fill="currentColor"/></svg>
          Dig my idea
        </Link>
        {isLoaded && isSignedIn && plan !== null && (
          <Link href="/pricing" style={{ textDecoration: "none" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 20,
              border: plan.isPro ? "1px solid rgba(99,102,241,0.3)" : "1px solid var(--clr-border-2)",
              background: plan.isPro ? "rgba(99,102,241,0.05)" : "transparent",
              cursor: "pointer",
            }}>
              {plan.tier === "free" ? (
                <>
                  <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--clr-text-4)", letterSpacing: "0.04em" }}>FREE</span>
                  <span style={{ width: 1, height: 12, background: "var(--clr-border-2)" }} />
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--clr-text-2)" }}>
                    {plan.totalAnalyses > 0 ? `${plan.totalAnalyses} ${plan.totalAnalyses === 1 ? "analysis" : "analyses"}` : "Upgrade"}
                  </span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "#6366f1", letterSpacing: "0.04em" }}>
                    {plan.tier === "pro+" ? "PRO+" : "PRO"}
                  </span>
                  <span style={{ width: 1, height: 12, background: "rgba(99,102,241,0.2)" }} />
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "rgb(99,102,241)" }}>
                    {plan.totalAnalyses} {plan.totalAnalyses === 1 ? "analysis" : "analyses"}
                  </span>
                </>
              )}
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
