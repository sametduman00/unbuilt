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
const B = ({ children }: { children: React.ReactNode }) => <strong style={{ fontWeight: 600 }}>{children}</strong>;
const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} style={{ color: "var(--clr-accent)", textDecoration: "underline" }}>{children}</a>
);

export default function TermsPage() {
  return (
    <>
      <S><H2>1. Operator</H2><P>This service is operated by an independent developer based in Turkey ("we", "us", "our"). By accessing or using unbuilt.me, you agree to these Terms.</P></S>
      <S><H2>2. Description of Service</H2><P>unbuilt.me provides AI-powered tools that generate business idea validation, technology stack recommendations, and product and build plans. All outputs are generated automatically by artificial intelligence. The Service is a <B>digital, non-tangible, on-demand software service</B>.</P></S>
      <S><H2>3. AI Disclaimer</H2><P>The Service provides AI-generated outputs. You acknowledge that outputs may be inaccurate, incomplete, or outdated; outputs are generated probabilistically and may contain errors; the Service does not provide financial, legal, tax, or professional advice; and you are solely responsible for decisions made based on outputs. We make <B>no guarantees</B> regarding accuracy, reliability, or outcomes.</P></S>
      <S><H2>4. Credit-Based Usage Model</H2><P>The Service operates using a credit system. Credits are digital units used to access features, are consumed upon usage, and have no monetary value outside the Service. Once credits are used, they are <B>non-refundable and cannot be restored</B>. We reserve the right to revoke credits, adjust usage rules, and block access in cases of abuse, fraud, or violation of these Terms.</P></S>
      <S><H2>5. Payments & Merchant of Record</H2><P>All payments are processed by a <B>Merchant of Record</B> (Paddle), which handles billing, taxes, invoicing, and payment processing. Refunds and disputes are handled according to the MoR's policies. We do not directly process or store payment details.</P></S>
      <S><H2>6. EU Digital Content Waiver</H2><P>If you are in the European Union, you expressly agree that the Service is delivered immediately upon purchase, you request immediate performance, and you <B>waive your 14-day right of withdrawal</B> once the Service has been used.</P></S>
      <S><H2>7. Acceptable Use</H2><P>You agree not to bypass credit or usage limits, automate abusive requests, reverse engineer the Service, attempt prompt injection, scrape data at scale, or use the Service for unlawful purposes. Violation may result in suspension, loss of credits, or denial of future access.</P></S>
      <S><H2>8. Account & Access</H2><P>We may suspend or terminate your access if you violate these Terms, abusive behavior is detected, or required for legal or security reasons. Remaining credits may be forfeited.</P></S>
      <S><H2>9. Data & Privacy</H2><P>We collect and process data to operate and improve the Service, generate outputs, and detect abuse. Data may include user inputs, generated outputs, and usage metadata. For details, see the Privacy Policy.</P></S>
      <S><H2>10. Service Availability</H2><P>We do not guarantee that the Service will be uninterrupted, error-free, or continuously available. We may modify or discontinue features at any time.</P></S>
      <S><H2>11. Limitation of Liability</H2><P>To the maximum extent permitted by law, we are not liable for business losses, lost profits, decisions based on AI outputs, or indirect, incidental, or consequential damages. Our total liability shall not exceed the amount paid by you in the last 30 days.</P></S>
      <S><H2>12. Indemnification</H2><P>You agree to indemnify and hold us harmless from claims arising from your use of the Service, your violation of these Terms, or misuse of AI-generated outputs.</P></S>
      <S><H2>13. Governing Law</H2><P>These Terms shall be governed by applicable laws depending on the user's jurisdiction, unless otherwise required by mandatory local laws.</P></S>
      <S><H2>14. Dispute Resolution</H2><P>Where permitted by law, disputes shall be resolved through <B>binding arbitration</B>, not courts. You waive the right to participate in <B>class actions</B>. If not enforceable in your jurisdiction, local laws apply.</P></S>
      <S><H2>15. Changes to Terms</H2><P>We may update these Terms at any time. Continued use of the Service constitutes acceptance of updated Terms.</P></S>
      <S><H2>16. Contact</H2><P><A href="mailto:builder@unbuilt.me">builder@unbuilt.me</A></P></S>
    </>
  );
}