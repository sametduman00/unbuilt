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
  const hiddenCount = items.length - freeLimit;

  return (
    <>
      {items.map((child, i) => {
        const shouldBlur = i >= freeLimit && (!checked || !isPro);
        if (!shouldBlur) return <React.Fragment key={i}>{child}</React.Fragment>;
        return (
          <div key={i} style={{ position: "relative", overflow: "hidden" }}>
            <div style={{ filter: "blur(6px)", pointerEvents: "none", userSelect: "none", opacity: 0.5 }}>
              {child}
            </div>
            {i === freeLimit && (
              <div style={{ position: "absolute", inset: 0, zIndex: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ProOverlayCard count={hiddenCount} />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

function ProOverlayCard({ count }: { count: number }) {
  return (
    <div style={{
      padding: "28px 32px",
      borderRadius: 20,
      background: "rgba(255,255,255,0.85)",
      backdropFilter: "blur(20px) saturate(180%)",
      WebkitBackdropFilter: "blur(20px) saturate(180%)",
      border: "1px solid rgba(255,255,255,0.6)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
      textAlign: "center",
      maxWidth: 320,
      width: "90%",
    }}>
      {/* Gradient accent line */}
      <div style={{
        width: 48, height: 4, borderRadius: 2,
        background: "linear-gradient(90deg, #6366f1, #a855f7, #ec4899)",
        margin: "0 auto 16px",
      }} />

      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: "linear-gradient(135deg, #f5f3ff 0%, #eef2ff 100%)",
        border: "1px solid rgba(99,102,241,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 14px",
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>

      {/* Text */}
      <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#111", marginBottom: 4, letterSpacing: "-0.02em" }}>
        +{count} more waiting for you
      </div>
      <div style={{ fontSize: "0.75rem", color: "#6b7280", lineHeight: 1.5, marginBottom: 18 }}>
        Unlock full access with Pro
      </div>

      {/* CTA Button */}
      <a href="/pricing" className="pro-gate-cta" style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        padding: "10px 24px",
        borderRadius: 12,
        backgroundImage: "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
        color: "#fff",
        textDecoration: "none",
        fontSize: "0.8125rem",
        fontWeight: 600,
        letterSpacing: "-0.01em",
        boxShadow: "0 4px 14px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2)"; }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        Go Pro
      </a>
    </div>
  );
}
