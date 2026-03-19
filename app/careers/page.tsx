"use client";
import GlobalHeader from "../components/GlobalHeader";

const roles = [
  {
    id: 1,
    title: "Full-Stack Engineer",
    team: "Engineering",
    location: "Remote",
    type: "Full-time",
    description: "Build the core product — data pipelines, AI integrations, and the interfaces founders use every day. You'll own features end to end.",
  },
  {
    id: 2,
    title: "AI / Prompt Engineer",
    team: "AI",
    location: "Remote",
    type: "Full-time",
    description: "Design and tune the prompts that power Gap Analysis, Stack Advisor, and Pulse. You'll work directly with Claude and live web data.",
  },
  {
    id: 3,
    title: "Growth Marketer",
    team: "Growth",
    location: "Remote",
    type: "Full-time",
    description: "Own our acquisition from zero. SEO, content, community, distribution — whatever works. We care about traction, not playbooks.",
  },
  {
    id: 4,
    title: "Product Designer",
    team: "Design",
    location: "Remote",
    type: "Full-time",
    description: "Make complex AI outputs feel simple and trustworthy. You'll shape how founders interact with market intelligence for the first time.",
  },
  {
    id: 5,
    title: "Data Engineer",
    team: "Data",
    location: "Remote",
    type: "Full-time",
    description: "Build and maintain the pipelines that crawl Product Hunt, App Store, GitHub, and the live web. Fresh data is our edge — you guard it.",
  },
];

const values = [
  { icon: "⚡", title: "Ship fast, learn faster", desc: "We deploy daily. Perfect is the enemy of live. We'd rather get something in front of users tomorrow than polish it for a month." },
  { icon: "🎯", title: "Obsess over founders", desc: "Every feature we build starts with a founder's frustration. We talk to users constantly and build what they actually need." },
  { icon: "🔍", title: "Truth over comfort", desc: "We built Unbuilt because too many tools tell founders what they want to hear. We hold ourselves to the same standard internally." },
  { icon: "🌍", title: "Async-first, globally distributed", desc: "We don't care where you are. We care what you build. Overlap with at least one team member is enough." },
];

export default function CareersPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--clr-bg)", color: "var(--clr-text)" }}>
      <GlobalHeader />

      {/* Hero */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "140px 2rem 80px", textAlign: "center" }}>
        <div style={{
          display: "inline-block", fontSize: "0.75rem", fontWeight: 600,
          letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--clr-accent)",
          background: "color-mix(in srgb, var(--clr-accent) 10%, transparent)",
          padding: "0.3rem 0.875rem", borderRadius: 20, marginBottom: 28,
        }}>
          We're hiring
        </div>
        <h1 style={{
          fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 800,
          letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: 24,
        }}>
          Help founders stop building<br />
          <span style={{ color: "var(--clr-accent)" }}>the wrong thing.</span>
        </h1>
        <p style={{ fontSize: "1.125rem", color: "var(--clr-text-3)", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 40px" }}>
          Unbuilt is a small, fast-moving team building AI-powered market intelligence for founders.
          We're early, scrappy, and looking for people who'd rather own a problem than manage a ticket.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {["100% Remote", "Early-stage", "Real equity", "Async culture"].map(tag => (
            <span key={tag} style={{
              padding: "0.4rem 1rem", border: "1px solid var(--clr-border)",
              borderRadius: 20, fontSize: "0.875rem", color: "var(--clr-text-3)",
            }}>{tag}</span>
          ))}
        </div>
      </section>

      {/* Values */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2rem 100px" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 48, textAlign: "center" }}>
          How we work
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          {values.map(v => (
            <div key={v.title} style={{
              padding: "28px 24px", border: "1px solid var(--clr-border)",
              borderRadius: 16, background: "var(--clr-surface)",
            }}>
              <div style={{ fontSize: "1.75rem", marginBottom: 14 }}>{v.icon}</div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 8 }}>{v.title}</h3>
              <p style={{ fontSize: "0.875rem", color: "var(--clr-text-3)", lineHeight: 1.65, margin: 0 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Open Roles */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "0 2rem 120px" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 12 }}>
          Open roles
        </h2>
        <p style={{ color: "var(--clr-text-3)", marginBottom: 40, fontSize: "0.9375rem" }}>
          All roles are fully remote. We hire based on work, not credentials.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {roles.map(role => (
            <div key={role.id} style={{
              padding: "28px 32px", border: "1px solid var(--clr-border)",
              borderRadius: 16, background: "var(--clr-surface)",
              display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em",
                    textTransform: "uppercase", color: "var(--clr-accent)",
                    background: "color-mix(in srgb, var(--clr-accent) 10%, transparent)",
                    padding: "0.2rem 0.6rem", borderRadius: 6,
                  }}>{role.team}</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--clr-text-4)" }}>
                    {role.location} · {role.type}
                  </span>
                </div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: 8 }}>{role.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "var(--clr-text-3)", lineHeight: 1.65, margin: 0 }}>
                  {role.description}
                </p>
              </div>
              <a
                href={`mailto:builder@unbuilt.me?subject=Application: ${encodeURIComponent(role.title)}&body=Hi Unbuilt team,%0D%0A%0D%0AI'd like to apply for the ${encodeURIComponent(role.title)} role.%0D%0A%0D%0A[Tell us about yourself]`}
                style={{
                  flexShrink: 0, alignSelf: "center",
                  padding: "0.5rem 1.25rem",
                  background: "var(--clr-text)", color: "var(--clr-bg)",
                  borderRadius: 10, fontSize: "0.875rem",
                  fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap",
                }}
              >
                Apply →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ textAlign: "center", padding: "80px 2rem 120px", borderTop: "1px solid var(--clr-border)" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 16 }}>
          Don't see your role?
        </h2>
        <p style={{ color: "var(--clr-text-3)", maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.65, fontSize: "0.9375rem" }}>
          If you believe in what we're building and think you can help, just reach out.
          We make room for exceptional people.
        </p>
        <a
          href="mailto:builder@unbuilt.me?subject=General Application&body=Hi Unbuilt team,%0D%0A%0D%0AI'd love to be part of what you're building.%0D%0A%0D%0A[Introduce yourself]"
          style={{
            display: "inline-block", padding: "0.75rem 2rem",
            background: "var(--clr-accent)", color: "#fff",
            borderRadius: 12, fontSize: "1rem", fontWeight: 600, textDecoration: "none",
          }}
        >
          builder@unbuilt.me
        </a>
      </section>
    </div>
  );
}
