"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export default function ProBlurGate({ children, index, freeLimit = 3 }: { children: React.ReactNode; index: number; freeLimit?: number }) {
  const { isSignedIn } = useUser();
  const [isPro, setIsPro] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isSignedIn) { setChecked(true); return; }
    fetch("/api/user/plan").then(r => r.json()).then(d => { setIsPro(d.isPro ?? false); setChecked(true); }).catch(() => setChecked(true));
  }, [isSignedIn]);

  // Don't blur until we've checked (avoid flash)
  if (!checked) return <>{children}</>;
  if (isPro || index < freeLimit) return <>{children}</>;

  return (
    <div style={{ position: "relative" }}>
      <div style={{ filter: "blur(6px)", pointerEvents: "none", userSelect: "none", opacity: 0.6 }}>
        {children}
      </div>
      {index === freeLimit && (
        <div style={{ position: "absolute", inset: 0, zIndex: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <a href="/pricing" style={{ padding: "10px 24px", borderRadius: 10, background: "#6366f1", color: "#fff", textDecoration: "none", fontSize: "0.85rem", fontWeight: 700, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
            Unlock all — Go Pro →
          </a>
        </div>
      )}
    </div>
  );
}
