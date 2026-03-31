const S = ({ children }: { children: React.ReactNode }) => (
  <section style={{ marginBottom: "2.5rem" }}>{children}</section>
);
const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--clr-text)", marginBottom: "0.75rem", letterSpacing: "-0.01em" }}>{children}</h2>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ color: "var(--clr-text)", marginBottom: "0.75rem" }}>{children}</p>
);
const UL = ({ children }: { children: React.ReactNode }) => (
  <ul style={{ paddingLeft: "1.5rem", marginBottom: "0.75rem", color: "var(--clr-text)", lineHeight: 1.8 }}>{children}</ul>
);
const LI = ({ children }: { children: React.ReactNode }) => <li>{children}</li>;

export default function AcceptableUsePage() {
  return (
    <>
      <S>
        <P>You agree to use the Service responsibly.</P>
        <P>You may NOT:</P>
      </S>
      <S>
        <H2>1. Abuse the Credit System</H2>
        <UL>
          <LI>attempt to obtain credits without payment</LI>
          <LI>create multiple accounts to bypass limits</LI>
          <LI>exploit billing, pricing, or credit logic</LI>
        </UL>
      </S>
      <S>
        <H2>2. Abuse AI Systems</H2>
        <UL>
          <LI>attempt prompt injection or manipulation</LI>
          <LI>attempt to extract system prompts or internal logic</LI>
          <LI>attempt to bypass safeguards or restrictions</LI>
        </UL>
      </S>
      <S>
        <H2>3. Automate or Scrape</H2>
        <UL>
          <LI>use bots, scripts, or automated tools</LI>
          <LI>perform excessive or abusive requests</LI>
          <LI>scrape or extract data at scale</LI>
        </UL>
      </S>
      <S>
        <H2>4. Disrupt the Service</H2>
        <UL>
          <LI>overload systems or infrastructure</LI>
          <LI>attempt to degrade performance</LI>
          <LI>interfere with other users</LI>
        </UL>
      </S>
      <S>
        <H2>5. Violate Security</H2>
        <UL>
          <LI>attempt unauthorized access</LI>
          <LI>probe, scan, or exploit vulnerabilities</LI>
          <LI>bypass rate limits or protections</LI>
        </UL>
      </S>
      <S>
        <H2>6. Illegal or Harmful Use</H2>
        <UL>
          <LI>use the Service for fraud, scams, or illegal activity</LI>
          <LI>generate harmful, misleading, or abusive content</LI>
        </UL>
      </S>
      <S>
        <H2>7. Enforcement</H2>
        <P>We may, at our sole discretion:</P>
        <UL>
          <LI>suspend or terminate accounts</LI>
          <LI>revoke credits</LI>
          <LI>block access without notice</LI>
        </UL>
        <P>Any attempt to violate these rules is considered a violation.</P>
      </S>
    </>
  );
}