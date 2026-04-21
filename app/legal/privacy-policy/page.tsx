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
const B = ({ children }: { children: React.ReactNode }) => <strong style={{ fontWeight: 600 }}>{children}</strong>;
const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} style={{ color: "var(--clr-accent)", textDecoration: "underline" }}>{children}</a>
);

export default function PrivacyPolicyPage() {
  return (
    <>
      <S><H2>1. Operator</H2><P>unbuilt.me (the &ldquo;Service&rdquo;) is operated by an independent developer based in Türkiye (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;).</P><P>This Privacy Policy explains how we collect, use, store, share, and protect personal data when you access or use the Service.</P></S>

      <S><H2>2. Scope</H2><P>This Privacy Policy applies to personal data collected through or in connection with:</P><UL><LI>the website and product at unbuilt.me,</LI><LI>user accounts,</LI><LI>free and paid features,</LI><LI>subscriptions and add-on purchases,</LI><LI>saved reports, exports, and gated features,</LI><LI>customer support and service communications,</LI><LI>and any related interactions with the Service.</LI></UL><P>This Policy does not govern third-party sites, services, or payment flows that may have their own privacy notices.</P></S>

      <S><H2>3. Categories of Data We Collect</H2><P>Depending on how you use the Service, we may collect the following categories of data.</P>

      <H3>A. Account and Identity Data</H3><P>If you create or use an account, we may collect:</P><UL><LI>email address,</LI><LI>authentication identifiers,</LI><LI>account ID,</LI><LI>subscription status,</LI><LI>purchase status,</LI><LI>and other account-related metadata.</LI></UL><P>Authentication may be handled by third-party providers such as Clerk.</P>

      <H3>B. Input and Output Data</H3><P>We may collect and process:</P><UL><LI>prompts,</LI><LI>business ideas,</LI><LI>product concepts,</LI><LI>stack requests,</LI><LI>feature requests,</LI><LI>text you submit,</LI><LI>generated outputs,</LI><LI>reports,</LI><LI>saved analyses,</LI><LI>exports,</LI><LI>and related content you create or receive through the Service.</LI></UL>

      <H3>C. Usage Data</H3><P>We may collect:</P><UL><LI>feature usage,</LI><LI>pages viewed,</LI><LI>buttons clicked,</LI><LI>analyses started or completed,</LI><LI>plan status,</LI><LI>analyses remaining,</LI><LI>subscription events,</LI><LI>add-on purchases,</LI><LI>save/export activity,</LI><LI>and other interaction logs.</LI></UL>

      <H3>D. Technical and Device Data</H3><P>We may collect:</P><UL><LI>IP address,</LI><LI>approximate region or country inferred from IP,</LI><LI>browser type,</LI><LI>device type,</LI><LI>operating system,</LI><LI>referring URL,</LI><LI>timestamps,</LI><LI>request metadata,</LI><LI>error logs,</LI><LI>and performance diagnostics.</LI></UL>

      <H3>E. Billing and Transaction Data</H3><P>Payments are processed by our Merchant of Record and payment providers. We may receive limited billing-related data such as:</P><UL><LI>transaction IDs,</LI><LI>subscription IDs,</LI><LI>plan or product purchased,</LI><LI>billing status,</LI><LI>invoice/payment status,</LI><LI>renewal status,</LI><LI>cancellation status,</LI><LI>and amounts paid.</LI></UL><P>We do not directly store full payment card numbers.</P>

      <H3>F. Abuse Prevention and Security Data</H3><P>To protect the Service, we may collect and process:</P><UL><LI>rate limit logs,</LI><LI>IP-based usage logs,</LI><LI>account-to-usage relationships,</LI><LI>suspicious request patterns,</LI><LI>fraud or abuse signals,</LI><LI>failed access attempts,</LI><LI>and other security-related metadata.</LI></UL></S>

      <S><H2>4. How We Use Data</H2><P>We use personal data only as needed to operate, secure, maintain, improve, and support the Service.</P><P>This includes using data to:</P><UL><LI>provide the Service and generate AI outputs;</LI><LI>authenticate users and manage accounts;</LI><LI>operate free and paid plan logic;</LI><LI>track included monthly analyses and purchased analyses;</LI><LI>process subscriptions, renewals, cancellations, and add-on purchases;</LI><LI>provide saved reports, exports, and gated features;</LI><LI>enforce rate limits, access controls, and anti-abuse protections;</LI><LI>detect fraud, abuse, scraping, evasion of limits, or security threats;</LI><LI>monitor performance, reliability, errors, and service health;</LI><LI>improve product functionality and user experience;</LI><LI>communicate about purchases, billing, plan changes, support, or security;</LI><LI>comply with legal obligations;</LI><LI>and protect our rights, systems, users, contractors, vendors, and the Service itself.</LI></UL><P>We may also use aggregated or de-identified data for analytics, service improvement, and internal reporting.</P></S>

      <S><H2>5. AI Processing</H2><P>The Service relies on third-party AI and infrastructure providers to process prompts and generate outputs.</P><P>When you submit Inputs to the Service, those Inputs may be transmitted to and processed by third-party model or infrastructure providers solely for purposes of providing the Service, improving performance, preventing abuse, debugging issues, or maintaining reliability.</P><P>You acknowledge that:</P><UL><LI>AI processing may involve temporary or logged transmission of your Inputs and Outputs to service providers;</LI><LI>AI-generated results may be stored by us for account history, saved reports, abuse prevention, debugging, support, and product improvement;</LI><LI>we do not promise that outputs are private in any absolute or privileged sense;</LI><LI>you should not submit highly sensitive, regulated, confidential, or legally privileged information unless you are comfortable with the associated risks and have all necessary rights and permissions to do so.</LI></UL><P>We do not sell your personal data for third-party advertising.</P></S>

      <S><H2>6. Legal Bases for Processing (GDPR / UK GDPR)</H2><P>If you are in the EEA, UK, or another jurisdiction with similar rules, we rely on one or more of the following legal bases:</P>

      <H3>A. Performance of a Contract</H3><P>We process data as necessary to:</P><UL><LI>create and manage accounts,</LI><LI>deliver analyses and outputs,</LI><LI>provide subscriptions and add-ons,</LI><LI>process saved reports and exports,</LI><LI>and otherwise provide the Service you requested.</LI></UL>

      <H3>B. Legitimate Interests</H3><P>We process data where reasonably necessary for our legitimate interests, including:</P><UL><LI>operating and improving the Service,</LI><LI>measuring feature performance,</LI><LI>detecting abuse and fraud,</LI><LI>enforcing usage limits and Terms,</LI><LI>securing systems,</LI><LI>supporting users,</LI><LI>and protecting the Service, our rights, and other users.</LI></UL>

      <H3>C. Consent</H3><P>Where required, we rely on consent for certain cookies, tracking, or optional communications.</P>

      <H3>D. Legal Obligation</H3><P>We may process data where necessary to comply with applicable law, lawful requests, tax, accounting, consumer, payment, or regulatory obligations.</P></S>

      <S><H2>7. Cookies and Similar Technologies</H2><P>We may use cookies, local storage, and similar technologies for:</P><UL><LI>authentication and session management,</LI><LI>essential product functionality,</LI><LI>remembering preferences,</LI><LI>measuring usage,</LI><LI>performance monitoring,</LI><LI>and security or abuse prevention.</LI></UL><P>Some cookies may be set by third-party providers such as authentication, analytics, hosting, or payment vendors.</P><P>You can control some cookies through your browser settings. However, disabling essential cookies may break parts of the Service.</P><P>If local law requires consent for non-essential cookies or similar technologies, we will request it where applicable.</P></S>

      <S><H2>8. When We Share Data</H2><P>We do not sell your personal data for third-party advertising. We may share data only in the following limited circumstances:</P>

      <H3>A. Service Providers and Processors</H3><P>We may share data with vendors who process data on our behalf to operate the Service, such as providers for:</P><UL><LI>authentication,</LI><LI>hosting,</LI><LI>database storage,</LI><LI>payments and subscriptions,</LI><LI>AI/model inference,</LI><LI>search enrichment,</LI><LI>email delivery,</LI><LI>logging,</LI><LI>analytics,</LI><LI>monitoring,</LI><LI>and support tools.</LI></UL>

      <H3>B. Payment and Billing Providers</H3><P>Payment-related data may be shared with our Merchant of Record and payment partners to process transactions, manage subscriptions, prevent fraud, and comply with legal obligations.</P>

      <H3>C. Compliance and Legal Requests</H3><P>We may disclose data if reasonably necessary to:</P><UL><LI>comply with law, regulation, court order, or lawful government request;</LI><LI>enforce our Terms or policies;</LI><LI>investigate fraud, security incidents, or abuse;</LI><LI>or protect the rights, property, or safety of us, our users, service providers, or others.</LI></UL>

      <H3>D. Business Transfers</H3><P>If we are involved in a merger, acquisition, asset sale, restructuring, financing, or similar transaction, user data may be transferred as part of that transaction, subject to applicable law.</P>

      <H3>E. With Your Direction</H3><P>We may share data when you request or direct us to do so, such as when exporting, downloading, or connecting certain services.</P></S>

      <S><H2>9. Third-Party Providers We May Use</H2><P>Depending on how the Service is configured over time, we may use providers such as:</P><UL><LI>Clerk for authentication and account management,</LI><LI>Supabase for database and storage,</LI><LI>Paddle (or related payment entities) for billing, subscriptions, taxes, invoicing, and payment operations,</LI><LI>Anthropic and other AI/model providers for prompt processing and output generation,</LI><LI>Serper or similar enrichment/search providers,</LI><LI>hosting, logging, monitoring, analytics, email, and infrastructure vendors as needed.</LI></UL><P>These providers may process personal data on our behalf or, in some cases, as independent controllers under their own privacy terms.</P><P>We are not responsible for third-party privacy practices outside our control.</P></S>

      <S><H2>10. Data Retention</H2><P>We retain personal data only for as long as reasonably necessary for the purposes described in this Policy, including to provide the Service, comply with law, enforce Terms, prevent abuse, resolve disputes, and maintain business records.</P><P>Retention periods may vary by data type:</P><UL><LI><B>Account data:</B> typically retained while your account is active and for a reasonable period afterward for compliance, security, fraud prevention, or dispute handling.</LI><LI><B>Inputs, outputs, and saved reports:</B> may be retained while needed to provide account functionality, saved history, exports, debugging, abuse prevention, and product improvement.</LI><LI><B>Usage logs and technical logs:</B> retained for limited periods as reasonably necessary for monitoring, security, analytics, and abuse prevention.</LI><LI><B>Billing and subscription records:</B> retained as needed for tax, accounting, consumer protection, payment dispute handling, and legal compliance.</LI><LI><B>Free usage / rate-limit logs:</B> retained as needed to enforce free-tier limits and prevent abuse.</LI></UL><P>We may delete, anonymize, aggregate, or de-identify data when it is no longer needed.</P><P>We do not guarantee indefinite retention of saved reports, exports, or account history.</P></S>

      <S><H2>11. International Data Transfers</H2><P>Your data may be processed in countries other than your own, including countries that may not provide the same level of legal protection as your home jurisdiction.</P><P>By using the Service, you understand that your data may be transferred internationally as necessary to operate the Service.</P><P>Where required, we take reasonable steps to use appropriate safeguards for cross-border transfers.</P></S>

      <S><H2>12. Data Security</H2><P>We use reasonable technical, organizational, and administrative measures designed to protect personal data against unauthorized access, loss, misuse, alteration, or disclosure.</P><P>However:</P><UL><LI>no internet service is completely secure,</LI><LI>no storage system is completely immune from breach,</LI><LI>and no method of transmission is 100% secure.</LI></UL><P>You use the Service at your own risk and are responsible for maintaining the security of your devices, browsers, email accounts, and authentication credentials.</P></S>

      <S><H2>13. Children</H2><P>The Service is not intended for children under 16.</P><P>We do not knowingly collect personal data from children under 16. If you believe a child has provided us personal data, contact us and we will take reasonable steps to delete it where required.</P></S>

      <S><H2>14. Your Rights</H2><P>Depending on your location and applicable law, you may have rights including the right to:</P><UL><LI>access your personal data,</LI><LI>request correction of inaccurate data,</LI><LI>request deletion of personal data,</LI><LI>request restriction of processing,</LI><LI>object to certain processing,</LI><LI>request portability of certain data,</LI><LI>withdraw consent where processing is based on consent,</LI><LI>and lodge a complaint with a supervisory authority.</LI></UL><P>These rights are not absolute and may be limited by law, security needs, fraud prevention needs, legal retention obligations, or overriding legitimate interests.</P><P>To exercise rights, contact us using the details below.</P><P>We may need to verify your identity before fulfilling a request.</P></S>

      <S><H2>15. Account Deletion</H2><P>If you request account deletion, we may delete or anonymize personal data associated with your account, subject to:</P><UL><LI>legal retention requirements,</LI><LI>fraud prevention needs,</LI><LI>billing and accounting obligations,</LI><LI>dispute resolution,</LI><LI>enforcement of our Terms,</LI><LI>and legitimate internal recordkeeping.</LI></UL><P>Deletion may result in loss of saved reports, exports, account history, and other account-linked materials.</P><P>Some records may be retained where permitted or required by law.</P></S>

      <S><H2>16. Do Not Track / Similar Signals</H2><P>The Service may not respond to &ldquo;Do Not Track&rdquo; browser signals or similar mechanisms unless required by applicable law.</P></S>

      <S><H2>17. Changes to this Privacy Policy</H2><P>We may update this Privacy Policy at any time.</P><P>The updated version becomes effective when posted, unless otherwise stated.</P><P>Your continued use of the Service after an updated Privacy Policy becomes effective constitutes acknowledgment of the updated Policy.</P></S>

      <S><H2>18. Contact</H2><P>If you have questions, concerns, or requests regarding this Privacy Policy, contact:</P><P><A href="mailto:builder@unbuilt.me">builder@unbuilt.me</A></P></S>
    </>
  );
}
