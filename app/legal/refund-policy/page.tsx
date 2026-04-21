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

export default function RefundPolicyPage() {
  return (
    <>
      <S><H2>1. General</H2><P>unbuilt.me provides digital, non-tangible, on-demand software services, including AI-generated analyses, reports, gated features, subscriptions, and add-on purchases.</P><P>All sales are final unless otherwise required by applicable law, required by our Merchant of Record, or expressly approved by us in a verified exceptional case.</P><P>We do not offer refunds as a matter of ordinary customer preference, change of mind, dissatisfaction with an idea score, dissatisfaction with AI output, unused time remaining in a billing cycle, or failure to use purchased features.</P></S>

      <S><H2>2. Free and Paid Access</H2><P>The Service may include:</P><UL><LI>free limited access,</LI><LI>paid subscription plans,</LI><LI>included monthly analyses,</LI><LI>and one-time add-on analysis purchases.</LI></UL><P>Access levels, included analyses, features, and restrictions may change prospectively at any time.</P></S>

      <S><H2>3. Subscription Billing</H2><P>If you purchase a subscription:</P><UL><LI>you authorize recurring billing at the selected interval unless canceled before renewal;</LI><LI>your subscription may include a fixed number of monthly analyses per billing cycle;</LI><LI>included monthly analyses do not roll over unless we expressly state otherwise;</LI><LI>unused included monthly analyses have no cash value and do not create any refund right;</LI><LI>canceling a subscription stops future renewals but does not retroactively cancel charges already incurred.</LI></UL><P>Unless otherwise stated at checkout, your subscription remains active until the end of the then-current billing period after cancellation.</P></S>

      <S><H2>4. Add-On Analyses</H2><P>We may offer one-time purchases of additional analyses.</P><P>Unless otherwise required by law:</P><UL><LI>add-on analyses are final sale;</LI><LI>add-on analyses are non-refundable once granted to your account;</LI><LI>unused add-on analyses have no cash value;</LI><LI>add-on analyses are not transferable, exchangeable, or redeemable for money.</LI></UL><P>If your subscription is canceled or expires, valid purchased add-on analyses may remain associated with your account unless access is suspended or terminated under our Terms of Service.</P></S>

      <S><H2>5. No Refunds as a General Rule</H2><P>To the maximum extent permitted by law, we do not provide refunds for:</P><UL><LI>subscription fees already charged,</LI><LI>partial billing periods,</LI><LI>used analyses,</LI><LI>unused included monthly analyses,</LI><LI>unused add-on analyses,</LI><LI>dissatisfaction with outputs,</LI><LI>disagreement with AI conclusions or scores,</LI><LI>changes in business plans,</LI><LI>accidental underuse,</LI><LI>or failure to cancel before renewal.</LI></UL><P>The Service is an on-demand digital software product. You are responsible for evaluating whether it is suitable for your needs before purchasing.</P></S>

      <S><H2>6. Limited Exceptions</H2><P>We may, in our sole discretion, consider a refund, replacement, or account credit only in narrow cases such as:</P><UL><LI>a verified duplicate charge,</LI><LI>a verified billing error,</LI><LI>a verified technical failure that prevented delivery of the purchased entitlement,</LI><LI>or a clearly documented system malfunction that consumed analyses incorrectly.</LI></UL><P>Even in such cases, we may choose, at our sole discretion, to provide:</P><UL><LI>no remedy,</LI><LI>an account credit,</LI><LI>restored analyses,</LI><LI>partial refund,</LI><LI>or full refund.</LI></UL><P>We are under no obligation to provide a refund except where required by applicable law.</P></S>

      <S><H2>7. AI Outputs Are Not Grounds for Refund</H2><P>Because the Service generates probabilistic AI outputs, you agree that the following are not grounds for refund:</P><UL><LI>you dislike the result,</LI><LI>you disagree with the analysis,</LI><LI>the idea receives a low score,</LI><LI>the output is harsh, unhelpful, incomplete, or commercially disappointing,</LI><LI>the result does not match your expectations,</LI><LI>you choose not to act on the output,</LI><LI>or the output does not produce a business outcome.</LI></UL><P>The Service is informational software, not a guaranteed result or advisory service.</P></S>

      <S><H2>8. EU / EEA Consumers and Immediate Performance</H2><P>If you are a consumer in the EU/EEA or another jurisdiction with statutory withdrawal rights for digital content or digital services, you expressly request immediate performance of the Service where applicable and acknowledge that, to the extent permitted by law, you may lose or limit your withdrawal right once performance begins.</P><P>Nothing in this Policy limits any mandatory consumer rights that cannot be lawfully excluded or waived.</P></S>

      <S><H2>9. Merchant of Record and Payment Handling</H2><P>Payments, subscriptions, taxes, invoicing, and related billing operations are handled by our Merchant of Record, including Paddle and its affiliates/processors.</P><P>As a result:</P><UL><LI>some refund requests,</LI><LI>disputes,</LI><LI>chargebacks,</LI><LI>cancellation flows,</LI><LI>and consumer-rights workflows</LI></UL><P>may be handled or influenced by the Merchant of Record&apos;s systems, policies, and legal obligations.</P><P>We do not directly store full payment card information.</P></S>

      <S><H2>10. Chargebacks and Payment Disputes</H2><P>If you initiate a chargeback, payment dispute, reversal, or unauthorized payment claim, we may:</P><UL><LI>suspend or terminate your account,</LI><LI>revoke access to the Service,</LI><LI>revoke analyses or gated features,</LI><LI>block future purchases,</LI><LI>and challenge the dispute where appropriate.</LI></UL><P>If a chargeback is found invalid, abusive, or fraudulent, we reserve all rights available to us.</P></S>

      <S><H2>11. Cancellation</H2><P>You are responsible for canceling your subscription before the next renewal date if you do not want to be charged again.</P><P>Cancellation:</P><UL><LI>stops future renewals,</LI><LI>does not retroactively reverse prior charges,</LI><LI>does not entitle you to refund for the current period,</LI><LI>and does not create any right to payment for unused included monthly analyses.</LI></UL><P>Unless otherwise stated, cancellation takes effect at the end of the current billing period.</P></S>

      <S><H2>12. Pricing Changes</H2><P>We may change pricing, plan structure, included analyses, feature access, or add-on pricing prospectively.</P><P>Any such change will apply as permitted by law and applicable billing rules. Continued use after renewal or after a new purchase constitutes acceptance of the then-current pricing.</P></S>

      <S><H2>13. Contact for Billing Issues</H2><P>For billing-related questions, contact:</P><P><A href="mailto:builder@unbuilt.me">builder@unbuilt.me</A></P><P>If your payment was processed by Paddle, you may also be required to use Paddle&apos;s support or buyer flows for certain billing, cancellation, or refund matters.</P></S>
    </>
  );
}
