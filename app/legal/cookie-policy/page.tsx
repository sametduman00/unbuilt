const S = ({ children }: { children: React.ReactNode }) => (
  <section style={{ marginBottom: "2.5rem" }}>{children}</section>
);
const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--clr-text)", marginBottom: "0.75rem", letterSpacing: "-0.01em" }}>{children}</h2>
);
const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--clr-text)", marginBottom: "0.5rem" }}>{children}</h3>
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

export default function CookiePolicyPage() {
  return (
    <>
      <S><H2>1. Introduction</H2><P>This Cookie Policy explains how unbuilt.me (the &ldquo;Service&rdquo;) uses cookies, local storage, and similar technologies (&ldquo;Cookies&rdquo;).</P><P>Cookies are small text files or similar technologies stored on your device or browser that help websites and online services function, remember settings, measure usage, and improve reliability and security.</P><P>By using the Service, you acknowledge that certain Cookies are necessary for the Service to function properly.</P></S>

      <S><H2>2. Scope</H2><P>This Cookie Policy applies to Cookies and similar technologies used in connection with:</P><UL><LI>the unbuilt.me website,</LI><LI>user authentication and account access,</LI><LI>free and paid product experiences,</LI><LI>subscriptions and billing-related flows,</LI><LI>saved reports, exports, and gated features,</LI><LI>performance, reliability, and abuse prevention,</LI><LI>and related pages, components, and support flows.</LI></UL><P>This Policy does not apply to third-party websites or services that may have their own cookie or tracking policies.</P></S>

      <S><H2>3. What Types of Cookies We Use</H2><P>We may use the following categories of Cookies.</P>

      <H3>A. Strictly Necessary Cookies</H3><P>These Cookies are essential for the Service to operate and cannot generally be disabled without breaking core functionality.</P><P>They may be used for purposes such as:</P><UL><LI>authentication and session management,</LI><LI>maintaining login state,</LI><LI>account security,</LI><LI>fraud and abuse prevention,</LI><LI>request validation,</LI><LI>feature gating,</LI><LI>rate limiting,</LI><LI>subscription and entitlement checks,</LI><LI>load balancing,</LI><LI>and core site reliability.</LI></UL><P>Without these Cookies, some or all parts of the Service may not function.</P>

      <H3>B. Functional Cookies</H3><P>These Cookies help remember choices or settings to improve your experience.</P><P>They may be used for purposes such as:</P><UL><LI>interface preferences,</LI><LI>product settings,</LI><LI>remembering display choices,</LI><LI>remembering plan-related UI state,</LI><LI>and improving continuity across sessions.</LI></UL>

      <H3>C. Performance and Analytics Cookies</H3><P>Where used, these Cookies help us understand how users interact with the Service so we can improve product quality, feature performance, and user experience.</P><P>They may be used to measure things such as:</P><UL><LI>page views,</LI><LI>session behavior,</LI><LI>feature interactions,</LI><LI>conversion flows,</LI><LI>paywall interactions,</LI><LI>free-to-paid conversion patterns,</LI><LI>error rates,</LI><LI>and general product performance.</LI></UL><P>Where required by law, we will request consent before using non-essential analytics Cookies.</P>

      <H3>D. Security and Abuse-Prevention Technologies</H3><P>We may use Cookies or similar technologies to:</P><UL><LI>detect suspicious activity,</LI><LI>prevent abuse of free usage,</LI><LI>enforce daily or feature limits,</LI><LI>detect repeated automated requests,</LI><LI>protect accounts,</LI><LI>and maintain service integrity.</LI></UL><P>These technologies may be strictly necessary to operate and protect the Service.</P></S>

      <S><H2>4. How We Use Cookies</H2><P>We use Cookies and similar technologies to:</P><UL><LI>keep users signed in,</LI><LI>recognize returning users,</LI><LI>enable account and subscription functionality,</LI><LI>determine access to free and paid features,</LI><LI>manage gating of blurred or locked content,</LI><LI>remember plan-related UI state,</LI><LI>secure the Service,</LI><LI>prevent fraud and abuse,</LI><LI>measure product and infrastructure performance,</LI><LI>understand which features are used,</LI><LI>improve reliability and usability,</LI><LI>and support billing, checkout, and payment-related flows.</LI></UL><P>We may also use browser storage or similar local technologies for equivalent purposes.</P></S>

      <S><H2>5. Third-Party Cookies and Similar Technologies</H2><P>We use third-party providers that may set Cookies or similar technologies on our behalf, or in connection with services integrated into the Service.</P><P>Depending on configuration over time, these may include providers such as:</P><UL><LI>Clerk — authentication and account/session management</LI><LI>Supabase — database/session-related functionality</LI><LI>Vercel or similar infrastructure providers — hosting, delivery, performance, and security</LI><LI>Paddle and related billing/payment providers — checkout, billing, renewals, subscriptions, and payment operations</LI><LI>analytics, monitoring, logging, or support providers as needed</LI></UL><P>These providers may process data in accordance with their own privacy and cookie practices.</P><P>We do not control all third-party Cookies directly.</P></S>

      <S><H2>6. Legal Basis (EU / EEA / UK)</H2><P>If you are in the EU, EEA, UK, or another jurisdiction with similar rules:</P><UL><LI>strictly necessary Cookies may be used where required to provide the Service, maintain security, authenticate sessions, enforce plan logic, and protect the platform;</LI><LI>functional Cookies may be used where necessary for requested service functionality;</LI><LI>analytics or other non-essential Cookies will be used only where consent is required and has been obtained.</LI></UL><P>If local law requires consent for non-essential Cookies, we will rely on consent as the legal basis for those technologies.</P></S>

      <S><H2>7. Cookie Duration</H2><P>Cookies may remain on your device for different lengths of time depending on their purpose.</P>

      <H3>A. Session Cookies</H3><P>These expire when you close your browser or end your session.</P>

      <H3>B. Persistent Cookies</H3><P>These remain for a period of time after your session ends, unless deleted earlier.</P><P>Different Cookies may have different durations depending on:</P><UL><LI>security needs,</LI><LI>account/session continuity,</LI><LI>preference retention,</LI><LI>billing flows,</LI><LI>abuse prevention,</LI><LI>and analytics configuration.</LI></UL><P>We may change Cookie duration from time to time as product and security needs evolve.</P></S>

      <S><H2>8. Managing Cookies</H2><P>You may be able to manage Cookies through:</P><UL><LI>your browser settings,</LI><LI>device settings,</LI><LI>privacy or content blocking tools,</LI><LI>and any cookie consent controls we may provide where required.</LI></UL><P>Please note:</P><UL><LI>blocking or disabling strictly necessary Cookies may break core parts of the Service;</LI><LI>authentication, subscription checks, gated access, and core product functionality may stop working correctly if required Cookies are disabled;</LI><LI>some features may become unavailable or unreliable.</LI></UL></S>

      <S><H2>9. Consent and Withdrawal</H2><P>Where required by applicable law:</P><UL><LI>we will request your consent before placing or reading non-essential Cookies;</LI><LI>you may withdraw consent at any time using available settings or tools;</LI><LI>withdrawing consent does not affect the lawfulness of prior processing based on consent before withdrawal.</LI></UL><P>If we do not currently use non-essential Cookies in a jurisdiction where consent is required, no cookie banner may be shown beyond what is required for essential technologies.</P></S>

      <S><H2>10. Do Not Track / Similar Signals</H2><P>The Service may not respond to &ldquo;Do Not Track&rdquo; browser signals or similar automatic mechanisms unless required by applicable law.</P></S>

      <S><H2>11. Changes to this Cookie Policy</H2><P>We may update this Cookie Policy at any time.</P><P>The updated version becomes effective when posted, unless otherwise stated.</P><P>Your continued use of the Service after the updated Policy becomes effective constitutes acknowledgment of the updated Policy.</P></S>

      <S><H2>12. Contact</H2><P>If you have questions about this Cookie Policy, contact:</P><P><A href="mailto:builder@unbuilt.me">builder@unbuilt.me</A></P></S>
    </>
  );
}
