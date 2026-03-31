const S = ({ children }: { children: React.ReactNode }) => (
  <section style={{ marginBottom: "2.5rem" }}>{children}</section>
);
const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--clr-text)", marginBottom: "0.75rem", letterSpacing: "-0.01em" }}>{children}</h2>
);
const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--clr-text)", marginBottom: "0.5rem" }}>{children}</h3>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ color: "var(--clr-text)", marginBottom: "0.75rem" }}>{children}</p>
);
const UL = ({ children }: { children: React.ReactNode }) => (
  <ul style={{ paddingLeft: "1.5rem", marginBottom: "0.75rem", color: "var(--clr-text)", lineHeight: 1.8 }}>{children}</ul>
);
const LI = ({ children }: { children: React.ReactNode }) => <li>{children}</li>;
const B = ({ children }: { children: React.ReactNode }) => <strong style={{ fontWeight: 600 }}>{children}</strong>;
const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} style={{ color: "var(--clr-accent)", textDecoration: "underline" }}>{children}</a>
);

export default function RefundPage() {
  return (
    <>
      <S>
        <H2>1. General</H2>
        <P>This Service provides digital, non-tangible services delivered instantly.</P>
        <P>All purchases are final unless otherwise stated below.</P>
      </S>
      <S>
        <H2>2. Credit-Based Purchases</H2>
        <P>Credits are digital units used to access the Service.</P>
        <UL>
          <LI>Credits are consumed upon use</LI>
          <LI>Credits have no monetary value outside the Service</LI>
        </UL>
        <H3>Used Credits</H3>
        <P>Used credits are <B>non-refundable under all circumstances</B>.</P>
      </S>
      <S>
        <H2>3. Unused Credits</H2>
        <P>At our discretion, refunds may be considered if:</P>
        <UL>
          <LI>credits have not been used</LI>
          <LI>a request is made within a reasonable time</LI>
        </UL>
        <P>We reserve the right to deny refund requests.</P>
      </S>
      <S>
        <H2>4. EU Customers (Digital Content Rule)</H2>
        <P>If you are located in the European Union:</P>
        <UL>
          <LI>You agree to immediate delivery of digital content</LI>
          <LI>You acknowledge that you lose your right of withdrawal once the Service is used</LI>
        </UL>
      </S>
      <S>
        <H2>5. Technical Issues</H2>
        <P>Refunds may be granted if:</P>
        <UL>
          <LI>the Service fails to function as intended</LI>
          <LI>credits are consumed due to a verified system error</LI>
        </UL>
        <P>Each case is reviewed individually.</P>
      </S>
      <S>
        <H2>6. Abuse & Violations</H2>
        <P>No refunds will be issued if:</P>
        <UL>
          <LI>the Service is used abusively</LI>
          <LI>Terms of Service are violated</LI>
          <LI>fraud or manipulation is detected</LI>
        </UL>
      </S>
      <S>
        <H2>7. Payment Processing</H2>
        <P>All payments are handled by our Merchant of Record (MoR):</P>
        <UL><LI>Paddle / Lemon Squeezy</LI></UL>
        <P>Refunds and disputes may also be handled directly by the MoR according to their policies.</P>
      </S>
      <S>
        <H2>8. Chargebacks</H2>
        <P>If a chargeback is initiated:</P>
        <UL>
          <LI>your account may be suspended</LI>
          <LI>access to the Service may be revoked</LI>
        </UL>
      </S>
      <S>
        <H2>9. Contact</H2>
        <P>For refund requests: <A href="mailto:builder@unbuilt.me">builder@unbuilt.me</A></P>
      </S>
    </>
  );
}