/**
 * HomeSeoContent — server-rendered content block that lives below the
 * interactive hero on the homepage.
 *
 * Why it exists:
 *   - The hero (HomeClient) ships as a client component with ssr:false,
 *     so crawlers see almost no text in the served HTML (~2% text/HTML
 *     ratio before this component existed). Okara, Google, and every
 *     site auditor flag this.
 *   - This block is server-rendered, so it appears in the raw HTML
 *     response. Real prose, no hidden offscreen tricks — users who
 *     scroll past the hero see the same thing the crawler sees. That's
 *     the only kind of SEO content Google trusts in 2026.
 *   - It also gives us a proper heading hierarchy (H2/H3) on the home-
 *     page. Before this, the page had exactly one H1 and zero H2s in
 *     the SSR output.
 *
 * What it contains:
 *   - A "How Unbuilt works" three-card explanation of Launches, Dig,
 *     Stack — written for Curious Outsiders (Bible v5 audience #2),
 *     not technical jargon.
 *   - "Who it's for" use cases.
 *   - FAQ section (great for search snippets / FAQ rich results).
 *
 * Layout note: the hero already has paddingTop in app/layout.tsx
 * (`.app-content-wrapper` style="paddingTop: 72px"). This component
 * sits naturally in the document flow underneath it.
 */
export default function HomeSeoContent() {
  return (
    <section
      style={{
        maxWidth: 920,
        margin: "0 auto",
        padding: "80px 20px 100px",
        fontFamily: "var(--font-figtree), 'Figtree', -apple-system, sans-serif",
        color: "var(--clr-text)",
      }}
      aria-label="What Unbuilt does"
    >
      {/* ─── How it works ─── */}
      <h2
        style={{
          fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          margin: "0 0 12px",
          fontFamily: "var(--font-syne), 'Syne', sans-serif",
        }}
      >
        How Unbuilt works
      </h2>
      <p
        style={{
          fontSize: "1rem",
          lineHeight: 1.65,
          color: "var(--clr-text-2)",
          margin: "0 0 32px",
          maxWidth: 640,
        }}
      >
        Most builders waste months on ideas that already exist or pick the wrong stack and rebuild from scratch. Unbuilt fixes both problems with three connected products you can use in any order.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
          marginBottom: 56,
        }}
      >
        <article
          style={{
            background: "var(--clr-surface)",
            border: "1px solid var(--clr-border)",
            borderRadius: 14,
            padding: "20px 22px",
          }}
        >
          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: 700,
              margin: "0 0 8px",
              fontFamily: "var(--font-syne), 'Syne', sans-serif",
            }}
          >
            Launches — what shipped today
          </h3>
          <p style={{ fontSize: "0.9375rem", lineHeight: 1.6, color: "var(--clr-text-2)", margin: 0 }}>
            A live feed of every new app from Product Hunt and the App Store, refreshed every ten minutes. See what people are building right now, what categories are heating up, and how each one positions itself. Free to browse — no signup, no paywall on the basics.
          </p>
        </article>

        <article
          style={{
            background: "var(--clr-surface)",
            border: "1px solid var(--clr-border)",
            borderRadius: 14,
            padding: "20px 22px",
          }}
        >
          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: 700,
              margin: "0 0 8px",
              fontFamily: "var(--font-syne), 'Syne', sans-serif",
            }}
          >
            Dig — validate before you build
          </h3>
          <p style={{ fontSize: "0.9375rem", lineHeight: 1.6, color: "var(--clr-text-2)", margin: 0 }}>
            Describe your idea in one sentence. Dig scans 70+ live sources — Product Hunt, GitHub, Reddit, App Store, Hacker News, indie communities — and returns a real market gap analysis in about two minutes. Competitors, what they&apos;re missing, where the actual opportunity is, and a verdict.
          </p>
        </article>

        <article
          style={{
            background: "var(--clr-surface)",
            border: "1px solid var(--clr-border)",
            borderRadius: 14,
            padding: "20px 22px",
          }}
        >
          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: 700,
              margin: "0 0 8px",
              fontFamily: "var(--font-syne), 'Syne', sans-serif",
            }}
          >
            Stack — the right tools for your idea
          </h3>
          <p style={{ fontSize: "0.9375rem", lineHeight: 1.6, color: "var(--clr-text-2)", margin: 0 }}>
            Pick from 700+ tools without guessing. Stack asks three questions about your budget, technical level, and target platform, then returns a phased build plan: which AI builder to use (Lovable, Bolt, Base44, Cursor), database, auth, payments, deployment — with exact monthly costs.
          </p>
        </article>
      </div>

      {/* ─── Who it's for ─── */}
      <h2
        style={{
          fontSize: "clamp(1.5rem, 3.5vw, 2rem)",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          margin: "0 0 12px",
          fontFamily: "var(--font-syne), 'Syne', sans-serif",
        }}
      >
        Who Unbuilt is for
      </h2>
      <p
        style={{
          fontSize: "1rem",
          lineHeight: 1.65,
          color: "var(--clr-text-2)",
          margin: "0 0 24px",
          maxWidth: 640,
        }}
      >
        You don&apos;t need to know how to code. You need to know how to make the right decision before you start.
      </p>

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: "0 0 56px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12,
        }}
      >
        {[
          ["Vibe coders & no-code founders", "Building with Lovable, Bolt, Base44, Cursor or Claude Code, looking for the next thing to ship."],
          ["Indie hackers & solo developers", "One bad launch costs three months. Dig in five minutes is cheaper than a wasted weekend."],
          ["First-time builders", "You have an idea but no clue where to start. Stack tells you which tools to learn, in what order."],
          ["Product teams & scouts", "Daily competitive recon — who launched what, who&apos;s losing momentum, what&apos;s suddenly hot."],
        ].map(([title, body]) => (
          <li
            key={title}
            style={{
              padding: "14px 16px",
              background: "var(--clr-surface)",
              border: "1px solid var(--clr-border)",
              borderRadius: 12,
            }}
          >
            <div
              style={{
                fontSize: "0.9375rem",
                fontWeight: 700,
                marginBottom: 4,
                color: "var(--clr-text)",
              }}
            >
              {title}
            </div>
            <div style={{ fontSize: "0.875rem", lineHeight: 1.55, color: "var(--clr-text-3)" }}>
              {body}
            </div>
          </li>
        ))}
      </ul>

      {/* ─── FAQ ─── */}
      <h2
        style={{
          fontSize: "clamp(1.5rem, 3.5vw, 2rem)",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          margin: "0 0 24px",
          fontFamily: "var(--font-syne), 'Syne', sans-serif",
        }}
      >
        Frequently asked questions
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {[
          {
            q: "Is Unbuilt free?",
            a: "Browsing Launches is free with no signup. You also get one free Dig analysis and one free Stack recommendation per day to try the product. Pro plans unlock unlimited analyses, deeper market signals, and the full daily feed.",
          },
          {
            q: "How is Dig different from asking ChatGPT?",
            a: "ChatGPT answers from training data that&apos;s already months old and frequently hallucinates competitors that don&apos;t exist. Dig pulls live data from 70+ sources at the moment you ask — Product Hunt today, GitHub commits this week, App Store releases this hour — so the gap analysis reflects the market right now, not the market a year ago.",
          },
          {
            q: "How does Stack pick from 700+ tools?",
            a: "Stack matches your idea, budget, and technical level to a curated decision tree. We test the recommendations ourselves — the tools that show up are the ones we actually use to ship products, ranked by cost, learning curve, and how well they fit your specific use case rather than generic popularity.",
          },
          {
            q: "Do I need to know how to code?",
            a: "No. Stack defaults to no-code builders like Lovable and Bolt for non-technical founders. If you select a higher technical level, it switches to Cursor, Claude Code and developer-focused infrastructure. The same product serves both audiences.",
          },
          {
            q: "Where does the data come from?",
            a: "Product Hunt API for daily launches, App Store and Google Play for mobile releases, GitHub for repository signals, public Reddit and Hacker News, indie founder communities, and a handful of paid market intelligence APIs. We refresh the live feed every ten minutes.",
          },
          {
            q: "Can I use Unbuilt for client work or competitive research?",
            a: "Yes. Many users run Dig on their own niche to map competitors before pitching, or use Stack to scope tooling for client builds. Pro plans support unlimited analyses for this kind of use.",
          },
        ].map(({ q, a }, i) => (
          <details
            key={i}
            style={{
              background: "var(--clr-surface)",
              border: "1px solid var(--clr-border)",
              borderRadius: 12,
              padding: "14px 18px",
            }}
          >
            <summary
              style={{
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: "var(--clr-text)",
                cursor: "pointer",
                listStyle: "none",
              }}
            >
              {q}
            </summary>
            <p
              style={{
                fontSize: "0.9375rem",
                lineHeight: 1.6,
                color: "var(--clr-text-2)",
                margin: "10px 0 0",
              }}
            >
              {a}
            </p>
          </details>
        ))}
      </div>

      {/* ─── Closing pitch ─── */}
      <div
        style={{
          marginTop: 56,
          padding: "28px 24px",
          background: "var(--clr-surface)",
          border: "1px solid var(--clr-border)",
          borderRadius: 16,
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(1.375rem, 3vw, 1.75rem)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            margin: "0 0 8px",
            fontFamily: "var(--font-syne), 'Syne', sans-serif",
          }}
        >
          You don&apos;t need to code. You need to know how.
        </h2>
        <p
          style={{
            fontSize: "1rem",
            lineHeight: 1.6,
            color: "var(--clr-text-2)",
            margin: "0 auto",
            maxWidth: 540,
          }}
        >
          Validate the idea, pick the right stack, ship the right thing. The first decision is the one that matters most — Unbuilt makes it the easy one.
        </p>
      </div>
    </section>
  );
}
