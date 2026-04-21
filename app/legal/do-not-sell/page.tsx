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
const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} style={{ color: "var(--clr-accent)", textDecoration: "underline" }}>{children}</a>
);

export default function DoNotSellPage() {
  return (
    <>
      <S><H2>1. Your Rights</H2><P>Depending on where you live, including if you are a California resident, you may have rights under privacy laws such as the California Consumer Privacy Act (CCPA) as amended by the California Privacy Rights Act (CPRA), including the right to request that a business not sell or share your personal information, subject to applicable definitions, exceptions, and limitations.</P></S>

      <S><H2>2. Our Position</H2><P>We do not sell your personal information for money. We also do not sell your personal information to data brokers or third parties for their own independent advertising purposes.</P><P>We do not exchange your personal information for monetary consideration in the ordinary meaning of a &ldquo;sale.&rdquo;</P></S>

      <S><H2>3. How We Use Service Providers</H2><P>To operate unbuilt.me, we may disclose limited personal information to service providers, contractors, or processors that help us provide the Service, including providers for:</P><UL><LI>authentication,</LI><LI>hosting and infrastructure,</LI><LI>database and storage,</LI><LI>billing, subscriptions, taxes, invoicing, and payments,</LI><LI>AI/model inference,</LI><LI>search or enrichment,</LI><LI>logging, analytics, monitoring, and support,</LI><LI>security, abuse prevention, and fraud detection.</LI></UL><P>These disclosures are made to operate, secure, maintain, and improve the Service, not to sell your personal information for third-party marketing.</P><P>Where applicable, these parties process data on our behalf or under contractual restrictions consistent with service-provider, contractor, or processor roles, as applicable.</P></S>

      <S><H2>4. We Do Not Sell for Cross-Context Behavioral Advertising</H2><P>We do not knowingly sell or share your personal information for cross-context behavioral advertising in the sense commonly associated with third-party ad targeting across unrelated businesses, websites, or apps.</P><P>We do not permit third parties to use user-submitted ideas, prompts, generated outputs, subscription status, saved reports, or related account data for unrelated ad targeting on their own behalf.</P></S>

      <S><H2>5. What We May Still Disclose</H2><P>Even though we do not sell your personal information in the ordinary sense, we may still disclose information where reasonably necessary to:</P><UL><LI>provide the Service,</LI><LI>authenticate users,</LI><LI>process subscriptions and add-on purchases,</LI><LI>generate AI outputs,</LI><LI>enforce free and paid usage limits,</LI><LI>detect abuse, fraud, or security threats,</LI><LI>monitor product performance,</LI><LI>comply with law,</LI><LI>enforce our Terms,</LI><LI>and protect our rights, systems, users, and service providers.</LI></UL><P>These operational disclosures are different from selling your personal information.</P></S>

      <S><H2>6. Future Changes</H2><P>If our practices materially change in a way that causes us to sell or share personal information in a manner that triggers a legal opt-out requirement, we will update this page and provide any legally required notices or opt-out mechanisms.</P></S>

      <S><H2>7. Exercising Privacy Requests</H2><P>If you believe you have a legal right to submit a &ldquo;Do Not Sell&rdquo; or similar privacy request, or if you have questions about our practices, you may contact us at:</P><P><A href="mailto:builder@unbuilt.me">builder@unbuilt.me</A></P><P>We may need to verify your identity before acting on certain requests.</P></S>
    </>
  );
}
