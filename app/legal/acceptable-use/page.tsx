const S = ({ children }: { children: React.ReactNode }) => (
  <section style={{ marginBottom: "2.5rem" }}>{children}</section>
);
const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontSize: 20, fontWeight: 600, color: "#fff", marginBottom: "0.75rem", letterSpacing: "-0.01em" }}>{children}</h2>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ color: "#bbb", marginBottom: "0.75rem" }}>{children}</p>
);
const UL = ({ children }: { children: React.ReactNode }) => (
  <ul style={{ color: "#bbb", paddingLeft: "1.25rem", marginBottom: "0.75rem", listStyleType: "disc" }}>{children}</ul>
);
const LI = ({ children }: { children: React.ReactNode }) => (
  <li style={{ marginBottom: "0.35rem" }}>{children}</li>
);

export default function AcceptableUsePage() {
  return (
    <>
      <S>
        <P>
          This Acceptable Use Policy outlines the rules and guidelines for using Unbuilt. By using the service, you agree to comply with this policy. Violations may result in suspension or termination of your account.
        </P>
      </S>

      <S>
        <H2>1. Permitted Use</H2>
        <P>Unbuilt is designed for legitimate market research and business intelligence purposes. You may use the service to:</P>
        <UL>
          <LI>Research market opportunities and competitive landscapes</LI>
          <LI>Analyze trends and identify gaps in specific industries</LI>
          <LI>Inform your own product development and business strategy</LI>
          <LI>Generate insights for internal planning and decision-making</LI>
        </UL>
      </S>

      <S>
        <H2>2. Prohibited Activities</H2>
        <P>You must not use Unbuilt to:</P>
        <UL>
          <LI><strong style={{ color: "#ddd" }}>Scrape or harvest data</strong> — Use automated tools, bots, crawlers, or scripts to extract data from the service at scale</LI>
          <LI><strong style={{ color: "#ddd" }}>Overload the service</strong> — Send excessive requests intended to degrade performance or availability for other users</LI>
          <LI><strong style={{ color: "#ddd" }}>Circumvent access controls</strong> — Bypass rate limits, authentication, or any security measures</LI>
          <LI><strong style={{ color: "#ddd" }}>Reverse engineer</strong> — Attempt to decompile, disassemble, or extract the source code or underlying algorithms</LI>
          <LI><strong style={{ color: "#ddd" }}>Resell or redistribute</strong> — Package and resell analysis results as a competing data product or service</LI>
          <LI><strong style={{ color: "#ddd" }}>Generate harmful content</strong> — Use the service to produce content that is illegal, defamatory, or violates third-party rights</LI>
          <LI><strong style={{ color: "#ddd" }}>Misrepresent AI output</strong> — Present AI-generated analysis as human-written professional advice (financial, legal, medical)</LI>
        </UL>
      </S>

      <S>
        <H2>3. Rate Limits</H2>
        <P>
          To ensure fair access for all users, Unbuilt enforces rate limits on API requests. Programmatic access beyond normal browser-based usage is not permitted without prior written authorization. If you need higher volume access, contact us to discuss enterprise options.
        </P>
      </S>

      <S>
        <H2>4. Account Responsibility</H2>
        <P>
          You are responsible for all activity under your account. Do not share your credentials with unauthorized parties. If you suspect unauthorized access, notify us immediately at{" "}
          <a href="mailto:builder@unbuilt.me" style={{ color: "#888", textDecoration: "underline", textUnderlineOffset: 3 }}>builder@unbuilt.me</a>.
        </P>
      </S>

      <S>
        <H2>5. Reporting Violations</H2>
        <P>
          If you become aware of any misuse of the service, please report it to{" "}
          <a href="mailto:builder@unbuilt.me" style={{ color: "#888", textDecoration: "underline", textUnderlineOffset: 3 }}>builder@unbuilt.me</a>.
          We investigate all reports and take appropriate action.
        </P>
      </S>

      <S>
        <H2>6. Enforcement</H2>
        <P>
          We reserve the right to suspend or terminate accounts that violate this policy, with or without prior notice. In cases of severe or repeated violations, we may pursue legal remedies.
        </P>
      </S>

      <S>
        <H2>7. Contact</H2>
        <P>
          Questions about this policy? Contact us at{" "}
          <a href="mailto:builder@unbuilt.me" style={{ color: "#888", textDecoration: "underline", textUnderlineOffset: 3 }}>builder@unbuilt.me</a>.
        </P>
      </S>
    </>
  );
}
