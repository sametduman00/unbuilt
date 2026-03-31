export default function TermsPage() {
  return (
    <>
      const S = ({ children, style, ...props }: React.HTMLAttributes<HTMLElement> & { as?: string }) => (
  <section style={{ marginBottom: "2.5rem", ...style }} {...props}>{children}</section>
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
const B = ({ children }: { children: React.ReactNode }) => <strong style={{ color: "var(--clr-text)", fontWeight: 600 }}>{children}</strong>;
const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} style={{ color: "var(--clr-accent)", textDecoration: "underline" }}>{children}</a>
);
      <S>
        <H2>1. Operator</H2>
        <P>This service ("Service") is operated by an independent developer based in Turkey ("we", "us", "our").</P>
        <P>By accessing or using unbuilt.me, you agree to these Terms.</P>
      </S>
      <S>
        <H2>2. Description of Service</H2>
        <P>unbuilt.me provides AI-powered tools that generate:</P>
        <UL>
          <LI>business idea validation</LI>
          <LI>technology stack recommendations</LI>
          <LI>product and build plans</LI>
        </UL>
        <P>All outputs are generated automatically by artificial intelligence.</P>
        <P>The Service is a <B>digital, non-tangible, on-demand software service</B>.</P>
      </S>
      <S>
        <H2>3. AI Disclaimer (Critical)</H2>
        <P>The Service provides AI-generated outputs. You acknowledge that:</P>
        <UL>
          <LI>Outputs may be inaccurate, incomplete, or outdated</LI>
          <LI>Outputs are generated probabilistically and may contain errors</LI>
          <LI>The Service does not provide financial, legal, tax, or professional advice</LI>
          <LI>You are solely responsible for decisions made based on outputs</LI>
        </UL>
        <P>We make <B>no guarantees</B> regarding accuracy, reliability, or outcomes.</P>
      </S>
      <S>
        <H2>4. Credit-Based Usage Model</H2>
        <P>The Service operates using a credit system:</P>
        <UL>
          <LI>Credits are digital units used to access features</LI>
          <LI>Credits are consumed upon usage of analysis tools</LI>
          <LI>Credits have no monetary value outside the Service</LI>
        </UL>
        <H2>Non-Refundable Use</H2>
        <UL>
          <LI>Once credits are used, they are <B>non-refundable and cannot be restored</B></LI>
        </UL>
        <H2>Abuse Clause</H2>
        <P>We reserve the right to revoke credits, adjust usage rules, and block access in cases of abuse, fraud, or violation of these Terms.</P>
      </S>
      <S>
        <H2>5. Payments & Merchant of Record</H2>
        <P>All payments are processed by a <B>Merchant of Record (MoR)</B> (Paddle).</P>
        <UL>
          <LI>The MoR is the legal seller of record</LI>
          <LI>The MoR handles billing, taxes, invoicing, and payment processing</LI>
          <LI>Refunds and disputes are handled according to the MoR's policies</LI>
        </UL>
        <P>We do not directly process or store payment details.</P>
      </S>
      <S>
        <H2>6. EU Digital Content Waiver</H2>
        <P>If you are located in the European Union, you expressly agree that:</P>
        <UL>
          <LI>The Service is delivered immediately upon purchase</LI>
          <LI>You request immediate performance of the Service</LI>
          <LI>You <B>waive your 14-day right of withdrawal</B> once the Service has been used</LI>
        </UL>
      </S>
      <S>
        <H2>7. Acceptable Use</H2>
        <P>You agree not to:</P>
        <UL>
          <LI>bypass or attempt to bypass credit or usage limits</LI>
          <LI>automate excessive or abusive requests</LI>
          <LI>reverse engineer or exploit the Service</LI>
          <LI>attempt prompt injection or manipulate AI behavior</LI>
          <LI>scrape, extract, or copy data at scale</LI>
          <LI>use the Service for unlawful purposes</LI>
        </UL>
        <P>Violation may result in suspension or termination, loss of credits, and denial of future access.</P>
      </S>
      <S>
        <H2>8. Account & Access</H2>
        <P>We may suspend or terminate your access if you violate these Terms, abusive or suspicious behavior is detected, or if required for legal or security reasons. Remaining credits may be forfeited.</P>
      </S>
      <S>
        <H2>9. Data & Privacy</H2>
        <P>We collect and process data to operate and improve the Service, generate outputs, and detect abuse and fraud. Data may include user inputs, generated outputs, and usage metadata. For details, see the Privacy Policy.</P>
      </S>
      <S>
        <H2>10. Service Availability</H2>
        <P>We do not guarantee that the Service will be uninterrupted, error-free, or continuously available. We may modify or discontinue features at any time.</P>
      </S>
      <S>
        <H2>11. Limitation of Liability</H2>
        <P>To the maximum extent permitted by law, we are not liable for business losses, lost profits or revenue, decisions based on AI outputs, or indirect, incidental, or consequential damages. Our total liability shall not exceed the amount paid by you in the last 30 days.</P>
      </S>
      <S>
        <H2>12. Indemnification</H2>
        <P>You agree to indemnify and hold us harmless from claims arising from your use of the Service, your violation of these Terms, or misuse of AI-generated outputs.</P>
      </S>
      <S>
        <H2>13. Governing Law</H2>
        <P>These Terms shall be governed by applicable laws depending on the user's jurisdiction, unless otherwise required by mandatory local laws.</P>
      </S>
      <S>
        <H2>14. Dispute Resolution</H2>
        <P>Where permitted by law, disputes shall be resolved through <B>binding arbitration</B>, not courts. You waive the right to participate in <B>class actions</B>. If not enforceable in your jurisdiction, local laws apply.</P>
      </S>
      <S>
        <H2>15. Changes to Terms</H2>
        <P>We may update these Terms at any time. Continued use of the Service constitutes acceptance of updated Terms.</P>
      </S>
      <S>
        <H2>16. Contact</H2>
        <P><A href="mailto:builder@unbuilt.me">builder@unbuilt.me</A></P>
      </S>
    </>
  );
}
