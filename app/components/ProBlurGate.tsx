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

  return (
    <>
      {items.map((child, i) => {
        const shouldBlur = i >= freeLimit && (!checked || !isPro);
        if (!shouldBlur) return <React.Fragment key={i}>{child}</React.Fragment>;
        return (
          <div key={i} style={{ position: "relative" }}>
            <div style={{ filter: "blur(6px)", pointerEvents: "none", userSelect: "none", opacity: 0.6 }}>
              {child}
            </div>
            {i === freeLimit && (
              <div style={{ position: "absolute", inset: 0, zIndex: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <a href="/pricing" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 22px",
                  borderRadius: 12,
                  background: "var(--clr-text)",
                  color: "#fff",
                  textDecoration: "none",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.15)"; }}
                >
                  See more — Go Pro
                </a>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
