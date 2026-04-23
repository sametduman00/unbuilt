"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export default function ProBlurGate({ children, freeLimit = 3 }: { children: React.ReactNode; freeLimit?: number }) {
  const { isSignedIn } = useUser();
  const [isPro, setIsPro] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isSignedIn) { setChecked(true); return; }
    fetch("/api/user/plan").then(r => r.json()).then(d => { setIsPro(d.isPro ?? false); setChecked(true); }).catch(() => setChecked(true));
  }, [isSignedIn]);

  const items = React.Children.toArray(children);
  const totalCount = items.length;
  const showAll = !checked || isPro;
  const visibleItems = showAll ? items : items.slice(0, freeLimit);
  const hiddenCount = totalCount - freeLimit;

  return (
    <>
      {visibleItems.map((child, i) => (
        <React.Fragment key={i}>{child}</React.Fragment>
      ))}
      {!showAll && hiddenCount > 0 && (
        <div style={{
          marginTop: 12,
          padding: "24px 28px",
          borderRadius: 14,
          border: "1px solid var(--clr-border)",
          background: "var(--clr-surface)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}>
          <div>
            <div style={{ fontSize: "0.9375rem", fontWeight: 650, color: "var(--clr-text)", marginBottom: 4 }}>
              +{hiddenCount} more ideas
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--clr-text-3)" }}>
              Upgrade to Pro to browse the full list.
            </div>
          </div>
          <a href="/pricing" style={{
            flexShrink: 0,
            padding: "8px 20px",
            borderRadius: 10,
            background: "var(--clr-text)",
            color: "#fff",
            textDecoration: "none",
            fontSize: "0.8125rem",
            fontWeight: 600,
            transition: "opacity 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >See all →</a>
        </div>
      )}
    </>
  );
}
