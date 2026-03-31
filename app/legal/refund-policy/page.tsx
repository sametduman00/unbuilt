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

export default function RefundPage() {
  return (
    <>
      <S><H2>1. General</H2><P>This Service provides <B>digital, non-tangible services</B> delivered instantly. All purchases are final unless otherwise stated below.</P></S>
      <S><H2>2. Credit-Based Purchases</H2><P>Credits are digital units used to access the Service. Credits are consumed upon use and have no monetary value outside the Service. Used credits are <B>non-refundable under all circumstances</B>.</P></S>
      <S><H2>3. Unused Credits</H2><P>At our discretion, refunds may be considered if credits have not been used and a request is made within a reasonable time. We reserve the right to deny refund requests.</P></S>
      <S><H2>4. EU Right of Withdrawal</H2><P>If you are in the EU, you expressly waive your 14-day right of withdrawal by requesting immediate performance of the Service upon purchase. Once the Service is used, no withdrawal is possible.</P></S>
      <S><H2>5. Technical Failures</H2><P>If a credit is consumed due to a verified technical failure on our part (not user error), we may issue a replacement credit at our discretion.</P></S>
      <S><H2>6. Exceptions — No Refund</H2><P>No refunds will be issued if the Service is used abusively, Terms of Service are violated, or fraud or manipulation is detected.</P></S>
      <S><H2>7. Payment Processing</H2><P>All payments are handled by our Merchant of Record (Paddle). Refunds and disputes may also be handled directly by the MoR according to their policies.</P></S>
      <S><H2>8. Chargebacks</H2><P>If a chargeback is initiated, your account may be suspended and access to the Service may be revoked.</P></S>
      <S><H2>9. Contact</H2><P><A href="mailto:builder@unbuilt.me">builder@unbuilt.me</A></P></S>
    </>
  );
}