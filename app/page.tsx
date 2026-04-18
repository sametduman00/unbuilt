"use client";

import dynamic from "next/dynamic";

/*
 * ── LCP Performance Optimization ──────────────────────────────────────────────
 *
 * Problem:  The original page.tsx was a 348KB "use client" monolith (4813 lines).
 *           Everything — result renderers, landing sections, react-markdown,
 *           PDF generation — was in one file. Browser had to download, parse,
 *           and execute ALL of it before rendering → LCP 5928ms.
 *
 * Solution: This file is a ~2KB thin shell. It renders a static hero skeleton
 *           (the LCP element) and lazy-loads the full interactive HomeClient
 *           as a separate JS chunk via next/dynamic.
 *
 * How it works:
 *   1. Server SSR's this tiny component → hero skeleton HTML
 *   2. Browser paints hero immediately (fast FCP + LCP)
 *   3. HomeClient chunk downloads in background (separate bundle)
 *   4. Once loaded, full interactive page appears
 *
 * Bundle impact: Initial JS drops from ~348KB to ~2KB.
 *                HomeClient loads as a separate async chunk.
 * ──────────────────────────────────────────────────────────────────────────────
 */

/* Hero skeleton — matches the default landing state exactly to avoid CLS */
function HeroFallback() {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", overflowX: "hidden", padding: "0 16px", maxWidth: "100%" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div className="hero-skeleton-center">

            {/* ── LCP element: hero headline ── */}
            <div style={{
              fontSize: "clamp(2.75rem, 5.5vw, 3.5rem)",
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-0.035em",
              marginBottom: "0.75rem",
              color: "var(--clr-text)",
            }}>
              Don&apos;t build what<br />
              <em style={{ fontStyle: "italic", fontWeight: 600 }}>already exists.</em>
            </div>

            {/* Subtitle */}
            <div style={{
              fontSize: "1.125rem",
              color: "var(--clr-text-3)",
              marginBottom: "1.5rem",
              lineHeight: 1.5,
            }}>
              Describe your idea. We&apos;ll scan 70+ live sources and tell you exactly where the gap is.
            </div>

            {/* Metric pills */}
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: "2rem" }}>
              {[
                { bold: "70+", text: "sources" },
                { bold: "~2 min", text: "report" },
                { bold: "1.2k+", text: "validated" },
              ].map(p => (
                <div key={p.bold} style={{
                  padding: "6px 18px",
                  background: "var(--clr-surface)",
                  border: "1px solid var(--clr-border)",
                  borderRadius: 999,
                  fontSize: "0.8125rem",
                  color: "var(--clr-text-3)",
                }}>
                  <span style={{ fontWeight: 600, color: "var(--clr-text)" }}>{p.bold}</span> {p.text}
                </div>
              ))}
            </div>

            {/* Input card skeleton */}
            <div style={{
              background: "var(--clr-surface)",
              border: "1.5px solid var(--clr-border)",
              borderRadius: 18,
              width: "100%",
              maxWidth: 700,
              overflow: "hidden",
            }}>
              {/* Tab row */}
              <div style={{ display: "flex", alignItems: "center", padding: "18px 24px 12px", gap: 6 }}>
                <div style={{
                  padding: "8px 20px", borderRadius: 9, fontSize: "0.9375rem",
                  fontWeight: 500, background: "var(--clr-text)", color: "#fff",
                }}>Dig my idea</div>
                <span style={{ fontSize: "0.75rem", color: "var(--clr-text-4)" }}>or</span>
                <div style={{
                  padding: "8px 20px", borderRadius: 9, fontSize: "0.9375rem",
                  fontWeight: 500, background: "var(--clr-surface-2)", color: "var(--clr-text-3)",
                }}>Get my stack</div>
              </div>
              {/* Textarea placeholder */}
              <div style={{ padding: "0 24px 12px" }}>
                <div style={{
                  width: "100%", minHeight: 88,
                  background: "var(--clr-bg)", border: "1px solid var(--clr-border)",
                  borderRadius: 12,
                }} />
              </div>
              {/* Bottom bar */}
              <div style={{
                borderTop: "1px solid var(--clr-border)",
                padding: "14px 24px",
                display: "flex",
                justifyContent: "flex-end",
              }}>
                <div style={{
                  background: "var(--clr-surface-2)", color: "var(--clr-text-4)",
                  borderRadius: 10, padding: "10px 28px",
                  fontSize: "0.9375rem", fontWeight: 600,
                }}>Dig →</div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Dynamic import: HomeClient loads as a separate JS chunk ── */
const HomeClient = dynamic(
  () => import("./components/HomeClient"),
  {
    ssr: false,
    loading: () => <HeroFallback />,
  }
);

export default function Home() {
  return <HomeClient />;
}
