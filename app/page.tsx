import ClientWrapper from "./components/ClientWrapper";

/* Static generation — served from Vercel edge CDN, zero cold start */
export const dynamic = "force-static";

/*
 * ── Server Component — Zero JS for LCP ───────────────────────────────────────
 *
 * This is a SERVER component. The hero renders as pure static HTML.
 * The browser paints it immediately from the HTML response — no JavaScript
 * download, parse, or execution needed. This eliminates the "Element render
 * delay" that was 740ms when page.tsx was "use client".
 *
 * ClientWrapper is a tiny "use client" component that dynamically imports
 * HomeClient. When HomeClient loads, it replaces the static hero with
 * the full interactive page.
 * ──────────────────────────────────────────────────────────────────────────────
 */

/* Static hero — server-rendered as HTML, zero JS cost */
function StaticHero() {
  return (
    <div id="static-hero" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <main style={{ flex: 1, display: "flex", flexDirection: "column" as const, overflowY: "auto" as const, overflowX: "hidden" as const, padding: "0 16px", maxWidth: "100%" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" as const }}>
          <div style={{ paddingTop: "3rem", display: "flex", flexDirection: "column" as const, alignItems: "center", textAlign: "center" as const }}>

            {/* LCP element — renders from HTML, no JS wait */}
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
              <span style={{ padding: "6px 18px", background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 999, fontSize: "0.8125rem", color: "var(--clr-text-3)" }}>
                <span style={{ fontWeight: 600, color: "var(--clr-text)" }}>70+</span> sources
              </span>
              <span style={{ padding: "6px 18px", background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 999, fontSize: "0.8125rem", color: "var(--clr-text-3)" }}>
                <span style={{ fontWeight: 600, color: "var(--clr-text)" }}>~2 min</span> report
              </span>
              <span style={{ padding: "6px 18px", background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 999, fontSize: "0.8125rem", color: "var(--clr-text-3)" }}>
                <span style={{ fontWeight: 600, color: "var(--clr-text)" }}>1.2k+</span> validated
              </span>
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
              <div style={{ display: "flex", alignItems: "center", padding: "18px 24px 12px", gap: 6 }}>
                <div style={{ padding: "8px 20px", borderRadius: 9, fontSize: "0.9375rem", fontWeight: 500, background: "var(--clr-text)", color: "#fff" }}>Dig my idea</div>
                <span style={{ fontSize: "0.75rem", color: "var(--clr-text-4)" }}>or</span>
                <div style={{ padding: "8px 20px", borderRadius: 9, fontSize: "0.9375rem", fontWeight: 500, background: "var(--clr-surface-2)", color: "var(--clr-text-3)" }}>Get my stack</div>
              </div>
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

export default function Home() {
  return (
    <>
      <StaticHero />
      <ClientWrapper />
    </>
  );
}
