"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

/**
 * Renders only `freeLimit` items + a paywall card for free users.
 * Pro users see the full list.
 *
 * Cache key strategy:
 * - We store the Pro flag under a per-user key: `unbuilt_isPro:<userId>`.
 *   This means: when User A signs out and User B signs in, the gate cannot
 *   read User A's cached Pro flag and briefly leak Pro content. SSR renders
 *   with no userId → defaults to free. Hydration reads the user-specific
 *   cache once Clerk has loaded, so a returning Pro user gets the full list
 *   on the first interactive paint with no flicker.
 *
 * FOUC behavior:
 * - Until Clerk is loaded, we render the free view. Free users see the gate
 *   immediately and never flash. Pro users may briefly see the gate for
 *   one paint while Clerk hydrates (typically < 50ms) before the cached
 *   flag flips them to the full list. That tradeoff is intentional —
 *   the alternative (showing the full list and then collapsing it) is
 *   the bug we're fixing, because it leaks Pro content to free users.
 */

function readProCache(userId: string | null | undefined): boolean {
  if (typeof window === "undefined" || !userId) return false;
  try { return localStorage.getItem(`unbuilt_isPro:${userId}`) === "true"; } catch { return false; }
}
function writeProCache(userId: string, isPro: boolean) {
  try { localStorage.setItem(`unbuilt_isPro:${userId}`, String(isPro)); } catch {}
}
function clearLegacyCache() {
  // The pre-fix cache was a single shared key. Drop it so it can't leak.
  try { localStorage.removeItem("unbuilt_isPro"); } catch {}
}

export default function ProBlurGate({ children, freeLimit = 3, totalCount }: { children: React.ReactNode; freeLimit?: number; totalCount?: number }) {
  const { isSignedIn, isLoaded, user } = useUser();
  const userId = user?.id ?? null;

  const [isPro, setIsPro] = useState<boolean>(false);

  // Hydrate from the per-user cache as soon as Clerk gives us the userId.
  // useState's initializer can't see Clerk state, so we do it in an effect
  // that runs synchronously on mount once userId is known.
  useEffect(() => {
    clearLegacyCache();
    if (!isLoaded) return;
    if (!isSignedIn || !userId) {
      setIsPro(false);
      return;
    }
    setIsPro(readProCache(userId));
  }, [isLoaded, isSignedIn, userId]);

  // Verify against the server when Clerk is ready, then update cache.
  // If the API fails (5xx / network), KEEP the cached Pro state — never demote
  // a Pro user to free because of a transient Supabase outage.
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !userId) return;
    fetch("/api/user/plan")
      .then(async r => (r.ok ? r.json() : null))
      .then(d => {
        if (!d) return; // API failed — trust whatever we already have
        const pro = d.isPro ?? false;
        setIsPro(pro);
        writeProCache(userId, pro);
      })
      .catch(() => {});
  }, [isSignedIn, isLoaded, userId]);

  const items = React.Children.toArray(children);
  const hiddenCount = (totalCount ?? items.length) - freeLimit;
  const showGate = !isPro && hiddenCount > 0;

  return (
    <>
      {items.map((child, i) => {
        if (i < freeLimit) return <React.Fragment key={i}>{child}</React.Fragment>;
        if (isPro) return <React.Fragment key={i}>{child}</React.Fragment>;
        return null;
      })}

      {showGate && (
        <div style={{
          margin: "12px 0",
          padding: "36px 32px",
          borderRadius: 20,
          background: "linear-gradient(135deg, #f5f3ff 0%, #eef2ff 50%, #fdf2f8 100%)",
          border: "1px solid #e9e5ff",
          textAlign: "center",
        }}>
          <div style={{
            width: 48, height: 4, borderRadius: 2,
            background: "linear-gradient(90deg, #6366f1, #a855f7, #ec4899)",
            margin: "0 auto 20px",
          }} />

          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: "#fff",
            boxShadow: "0 2px 12px rgba(99,102,241,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>

          <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "#111", marginBottom: 6, letterSpacing: "-0.02em" }}>
            +{hiddenCount} more ideas waiting for you
          </div>
          <div style={{ fontSize: "0.8125rem", color: "#6b7280", lineHeight: 1.5, marginBottom: 24, maxWidth: 320, margin: "0 auto 24px" }}>
            Upgrade to Pro and unlock the full list —<br/>updated every 10 minutes.
          </div>

          <a href="/pricing" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "12px 28px",
            borderRadius: 12,
            backgroundImage: "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
            color: "#fff",
            textDecoration: "none",
            fontSize: "0.875rem",
            fontWeight: 600,
            boxShadow: "0 4px 16px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.2)"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            Go Pro
          </a>
        </div>
      )}
    </>
  );
}
