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
      {/* The last freeLimit item gracefully fades into the page so the cut-off
          doesn't feel abrupt. We only fade the very last visible item, not the
          whole row, to keep the rest of the list normal. */}
      {items.map((child, i) => {
        if (i < freeLimit) {
          const isLastVisible = !isPro && i === freeLimit - 1 && hiddenCount > 0;
          return (
            <div key={i} style={isLastVisible ? {
              maskImage: "linear-gradient(to bottom, black 0%, black 50%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 50%, transparent 100%)",
            } : undefined}>
              {child}
            </div>
          );
        }
        if (isPro) return <React.Fragment key={i}>{child}</React.Fragment>;
        return null;
      })}

      {showGate && (
        <div style={{
          marginTop: -16, // overlap the fade so the band feels continuous with the list
          position: "relative",
          background: "var(--clr-surface)",
          border: "1px solid var(--clr-border)",
          borderRadius: 12,
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--clr-text)", marginBottom: 2 }}>
              +{hiddenCount} more ideas
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--clr-text-3)" }}>
              Pro unlocks the full list, refreshed every 10 minutes.
            </div>
          </div>
          <a href="/pricing" style={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 18px",
            borderRadius: 8,
            background: "var(--clr-accent)",
            color: "#fff",
            textDecoration: "none",
            fontSize: "0.8125rem",
            fontWeight: 600,
            transition: "background 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--clr-accent-hover)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--clr-accent)"}
          >Upgrade <span style={{ opacity: 0.7 }}>→</span></a>
        </div>
      )}
    </>
  );
}
