import GlobalHeader from "../components/GlobalHeader";

const roles = [
  {
    id: 1,
    title: "Full-Stack Engineer",
    team: "Engineering",
    location: "Remote",
    type: "Full-time",
    tag: "Most urgent",
    description: "You'll build across the entire stack — Next.js on the front, Supabase and edge functions on the back. We move fast: features ship in days, not sprints. You'll own the Gap Analysis and Stack Advisor pipelines end to end, including the streaming AI responses, caching layer, and the UI that makes complex data feel simple. Ideal if you've built production apps before and hate waiting for approvals.",
    stack: "Next.js · Supabase · TypeScript · Vercel · Anthropic API",
  },
  {
    id: 2,
    title: "AI / Prompt Engineer",
    team: "AI",
    location: "Remote",
    type: "Full-time",
    tag: null,
    description: "Our output quality is our product. You'll design, test, and continuously improve the prompts behind every tool — from how we extract competitor gaps to how Stack Advisor reasons about budgets. You'll work directly with Claude, run structured evals, and own a feedback loop between user results and prompt updates. Experience with LLM evals or red-teaming is a big plus.",
    stack: "Anthropic Claude · prompt evals · TypeScript · Supabase",
  },
  {
    id: 3,
    title: "Growth Engineer",
    team: "Growth",
    location: "Remote",
    type: "Full-time",
    tag: null,
    description: "Half marketer, half builder. You'll own acquisition from zero — SEO infrastructure, programmatic landing pages, viral loops, and whatever else actually moves the needle. We don't want someone who manages agencies or writes briefs. We want someone who ships experiments on Monday and reads the data on Friday. Strong writing and curiosity about distribution is more important than credentials.",
    stack: "Next.js · SEO tooling · analytics · copywriting",
  },
  {
    id: 4,
    title: "Product Designer",
    team: "Design",
    location: "Remote",
    type: "Full-time",
    tag: null,
    description: "AI output is only useful if people understand it. You'll shape how founders read a Gap Analysis report, how they explore Stack Advisor recommendations, and how the Pulse feed feels as a daily habit. This is dense information design — the challenge is making structured data feel like a conversation. You'll work in Figma but ship directly into code with the eng team.",
    stack: "Figma · React · design systems · information design",
  },
  {
    id: 5,
    title: "Data Engineer",
    team: "Data",
    location: "Remote",
    type: "Full-time",
    tag: null,
    description: "Fresh data is our edge over every other AI tool. You'll build and maintain the pipelines that pull from Product Hunt, App Store, Google Play, GitHub Trending, and Hacker News every day. You'll handle deduplication, normalization, and the storage layer that makes sub-second queries possible at scale. Experience with scheduled jobs, webhooks, and Postgres is required.",
    stack: "Supabase · PostgreSQL · cron pipelines · Vercel Edge",
  },
];

const perks = [
  { label: "Salary", value: "Competitive, benchmarked against top-tier startups" },
  { label: "Equity", value: "Meaningful early-stage options — you're building this" },
  { label: "Schedule", value: "Fully async. We don't track hours, we track output" },
  { label: "Location", value: "Work from anywhere. We don't care about time zones" },
  { label: "Tools", value: "Whatever you need: hardware, software, subscriptions" },
  { label: "Growth", value: "Direct access to founders. No middle management" },
];

export default function CareersPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--clr-bg)", color: "var(--clr-text)" }}>
      <GlobalHeader />

      {/* Hero */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "140px 2rem 80px", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: "0.75rem", fontWeight: 600,
          letterSpacing: "0.1em", textTransform: "uppercase",
          color: "var(--clr-accent)",
          background: "color-mix(in srgb, var(--clr-accent) 10%, transparent)",
          padding: "0.3rem 0.875rem", borderRadius: 20, marginBottom: 32,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--clr-accent)", display: "inline-block" }} />
          We're hiring
        </div>
        <h1 style={{
          fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
          fontWeight: 800, letterSpacing: "-0.04em",
          lineHeight: 1.05, marginBottom: 28, color: "var(--clr-text)",
        }}>
          Help founders stop building<br />
          <span style={{ color: "var(--clr-accent)" }}>the wrong thing.</span>
        </h1>
        <p style={{
          fontSize: "1.0625rem", color: "var(--clr-text-3)",
          lineHeight: 1.75, maxWidth: 520, margin: "0 auto 44px",
        }}>
          We're a small team building AI-powered market intelligence.<br />
          We're looking for people who'd rather own a problem than manage a ticket.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {["100% Remote", "Early-stage equity", "Async culture", "Direct impact"].map(tag => (
            <span key={tag} style={{
              padding: "0.375rem 1rem",
              border: "1px solid var(--clr-border)",
              borderRadius: 20, fontSize: "0.875rem",
              color: "var(--clr-text-3)", background: "var(--clr-surface)",
            }}>{tag}</span>
          ))}
        </div>
      </section>

      {/* Perks — simple grid, no boxes */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "0 2rem 100px" }}>
        <h2 style={{
          fontSize: "1.5rem", fontWeight: 700,
          letterSpacing: "-0.03em", marginBottom: 40,
          color: "var(--clr-text-2)",
        }}>What we offer</h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderTop: "1px solid var(--clr-border)",
          borderLeft: "1px solid var(--clr-border)",
        }}>
          {perks.map((p) => (
            <div key={p.label} style={{
              padding: "28px 32px",
              borderBottom: "1px solid var(--clr-border)",
              borderRight: "1px solid var(--clr-border)",
            }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--clr-accent)", marginBottom: 8 }}>
                {p.label}
              </div>
              <div style={{ fontSize: "0.9375rem", color: "var(--clr-text-3)", lineHeight: 1.6 }}>
                {p.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Open Roles */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "0 2rem 120px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 10, color: "var(--clr-text-2)" }}>
          Open roles
        </h2>
        <p style={{ color: "var(--clr-text-4)", marginBottom: 40, fontSize: "0.9rem" }}>
          All roles are fully remote. We hire based on work, not CVs.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 0, borderTop: "1px solid var(--clr-border)" }}>
          {roles.map((role) => (
            <div key={role.id} style={{
              padding: "36px 0",
              borderBottom: "1px solid var(--clr-border)",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, marginBottom: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: "0.7rem", fontWeight: 700,
                      letterSpacing: "0.08em", textTransform: "uppercase",
                      color: "var(--clr-accent)",
                      background: "color-mix(in srgb, var(--clr-accent) 10%, transparent)",
                      padding: "0.2rem 0.6rem", borderRadius: 6,
                    }}>{role.team}</span>
                    {role.tag && (
                      <span style={{
                        fontSize: "0.7rem", fontWeight: 600,
                        letterSpacing: "0.05em",
                        color: "var(--clr-text-4)",
                        border: "1px solid var(--clr-border)",
                        padding: "0.2rem 0.6rem", borderRadius: 6,
                      }}>{role.tag}</span>
                    )}
                    <span style={{ fontSize: "0.8rem", color: "var(--clr-text-4)" }}>
                      {role.location} · {role.type}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--clr-text)", margin: 0 }}>
                    {role.title}
                  </h3>
                </div>
                <a
                  href={`mailto:builder@unbuilt.me?subject=Application: ${encodeURIComponent(role.title)}&body=Hi Unbuilt team,%0D%0A%0D%0AI'd like to apply for the ${encodeURIComponent(role.title)} role.%0D%0A%0D%0AAbout me:%0D%0A[Who you are and what you've built]%0D%0A%0D%0AWhy this role:%0D%0A[What excites you about this specific problem]%0D%0A%0D%0ALinks:%0D%0A[GitHub, portfolio, LinkedIn, or anything relevant]`}
                  style={{
                    flexShrink: 0,
                    padding: "0.5rem 1.25rem",
                    background: "var(--clr-text)", color: "var(--clr-bg)",
                    borderRadius: 10, fontSize: "0.875rem",
                    fontWeight: 600, textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  Apply →
                </a>
              </div>
              <p style={{ fontSize: "0.9375rem", color: "var(--clr-text-3)", lineHeight: 1.75, marginBottom: 14 }}>
                {role.description}
              </p>
              <div style={{ fontSize: "0.8rem", color: "var(--clr-text-4)", fontFamily: "monospace" }}>
                {role.stack}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{
        textAlign: "center",
        padding: "80px 2rem 120px",
        borderTop: "1px solid var(--clr-border)",
      }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 14 }}>
          Don't see your role?
        </h2>
        <p style={{
          color: "var(--clr-text-3)", maxWidth: 440, margin: "0 auto 32px",
          lineHeight: 1.7, fontSize: "0.9375rem",
        }}>
          If you believe in what we're building and think you can contribute,<br />just reach out. We make room for exceptional people.
        </p>
        <a
          href="mailto:builder@unbuilt.me?subject=General Application&body=Hi Unbuilt team,%0D%0A%0D%0AI'd love to be part of what you're building.%0D%0A%0D%0A[Tell us about yourself]"
          style={{
            display: "inline-block",
            padding: "0.75rem 2rem",
            background: "var(--clr-text)", color: "var(--clr-bg)",
            borderRadius: 12, fontSize: "1rem",
            fontWeight: 600, textDecoration: "none",
          }}
        >
          builder@unbuilt.me
        </a>
      </section>
    </div>
  );
}
