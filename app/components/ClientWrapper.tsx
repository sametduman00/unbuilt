"use client";

import dynamic from "next/dynamic";

/* Hero skeleton — shown while HomeClient chunk loads */
function HeroSkeleton() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <main style={{ flex: 1, display: "flex", flexDirection: "column" as const, overflowX: "hidden" as const, padding: "0 16px", maxWidth: "100%" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" as const }}>
          <div style={{ paddingTop: "3rem", display: "flex", flexDirection: "column" as const, alignItems: "center", textAlign: "center" as const }}>
            <div style={{
              fontSize: "clamp(3rem, 6vw, 3.85rem)",
              fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.04em",
              marginBottom: "0.75rem", color: "#111",
            }}>
              Don&apos;t build what<br />
              <span style={{ background: "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" } as React.CSSProperties}>already exists.</span>
            </div>
            <div style={{ fontSize: "1.125rem", color: "var(--clr-text-3)", marginBottom: "1.5rem", lineHeight: 1.5 }}>
              Describe your idea. We&apos;ll scan 70+ live sources and tell you exactly where the gap is.
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: "2rem" }}>
              {[["70+","sources"],["~2 min","report"],["1.2k+","validated"]].map(([b,t]) => (
                <span key={b} style={{ padding: "6px 18px", background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 999, fontSize: "0.8125rem", color: "var(--clr-text-3)" }}>
                  <span style={{ fontWeight: 600, color: "var(--clr-text)" }}>{b}</span> {t}
                </span>
              ))}
            </div>
            <div style={{ background: "var(--clr-surface)", border: "1.5px solid var(--clr-border)", borderRadius: 18, width: "100%", maxWidth: 700, overflow: "hidden" }}>
              <div style={{ padding: "18px 24px 12px" }} />
              <div style={{ padding: "0 24px 12px" }}>
                <div style={{ width: "100%", minHeight: 88, background: "var(--clr-bg)", border: "1px solid var(--clr-border)", borderRadius: 12 }} />
              </div>
              <div style={{ borderTop: "1px solid var(--clr-border)", padding: "14px 24px", display: "flex", justifyContent: "flex-end" }}>
                <div style={{ background: "var(--clr-surface-2)", color: "var(--clr-text-4)", borderRadius: 10, padding: "10px 28px", fontSize: "0.9375rem", fontWeight: 600 }}>Dig →</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* HomeClient loads as async chunk — skeleton shows until ready */
const HomeClient = dynamic(() => import("./HomeClient"), {
  ssr: false,
  loading: () => <HeroSkeleton />,
});

export default function ClientWrapper() {
  return <HomeClient />;
}
