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

export default function AcceptableUsePage() {
  return (
    <>
      <P>This Acceptable Use Policy explains what you may not do when using unbuilt.me (the &ldquo;Service&rdquo;).</P>
      <P>You must use the Service responsibly, lawfully, and in compliance with our Terms of Service, Privacy Policy, Billing/Refund/Cancellation Policy, and all applicable laws.</P>

      <S><H2>1. No Abuse of Access, Plans, or Analyses</H2><P>You may not:</P><UL><LI>attempt to obtain free or paid analyses without authorization;</LI><LI>attempt to bypass, manipulate, or evade plan restrictions, free limits, paywalls, blur gates, feature locks, or usage rules;</LI><LI>create multiple accounts, identities, sessions, or artificial usage patterns to bypass daily limits, analysis limits, or pricing logic;</LI><LI>exploit subscription logic, renewal logic, add-on logic, legacy credit logic, plan migration logic, or billing edge cases;</LI><LI>attempt to retain paid access after cancellation or non-payment by exploiting system behavior;</LI><LI>share, resell, sublicense, lease, or commercially distribute access to paid features unless explicitly authorized by us.</LI></UL></S>

      <S><H2>2. No Abuse of Free Usage</H2><P>You may not:</P><UL><LI>use bots, scripts, rotating IPs, VPN farms, fake accounts, device farms, or similar methods to multiply free usage;</LI><LI>repeatedly trigger free analyses in a way designed to avoid upgrading or to drain infrastructure;</LI><LI>automate free usage across multiple sessions, devices, IPs, or identities;</LI><LI>intentionally generate repeated or low-value requests to consume system resources.</LI></UL><P>We may enforce free-tier limits using IP-based controls, account-based controls, device or session controls, behavioral signals, and other anti-abuse methods.</P></S>

      <S><H2>3. No Prompt Injection, Extraction, or Model Abuse</H2><P>You may not:</P><UL><LI>attempt prompt injection, jailbreaks, adversarial prompting, or manipulation of model instructions;</LI><LI>attempt to extract, reconstruct, infer, or reveal system prompts, hidden instructions, routing logic, moderation logic, or internal workflows;</LI><LI>attempt to probe, benchmark, or stress-test the model or prompt layer in abusive ways;</LI><LI>use the Service to discover or replicate proprietary prompt design, product logic, gating logic, or output formatting in a way that competes with or harms the Service;</LI><LI>intentionally submit deceptive, malicious, or adversarial inputs designed to degrade, subvert, or destabilize outputs.</LI></UL></S>

      <S><H2>4. No Scraping, Harvesting, or Bulk Extraction</H2><P>You may not:</P><UL><LI>scrape, crawl, or harvest data, outputs, reports, ideas, launches, startup listings, or other content from the Service at scale;</LI><LI>use automated tools to extract substantial portions of the Service, whether through the UI, APIs, scripts, browser automation, or any similar method;</LI><LI>build datasets, indexes, archives, mirrors, or derivative databases from Service content without authorization;</LI><LI>systematically collect outputs for resale, redistribution, competitive training, or competing product development.</LI></UL></S>

      <S><H2>5. No Unauthorized Automation</H2><P>You may not:</P><UL><LI>use bots, scripts, headless browsers, browser automation, macros, or agentic systems to access or use the Service in an abusive or unauthorized way;</LI><LI>automate interactions with the Service in a way that exceeds normal human use, degrades performance, or bypasses intended product flows;</LI><LI>simulate user activity to manipulate analytics, conversion flows, billing logic, or internal systems.</LI></UL><P>Limited automation that is clearly authorized by us in writing is the only exception.</P></S>

      <S><H2>6. No Security Violations</H2><P>You may not:</P><UL><LI>attempt unauthorized access to any account, report, export, endpoint, database, admin tool, or internal system;</LI><LI>probe, scan, test, or exploit vulnerabilities;</LI><LI>interfere with authentication, session handling, entitlement checks, payment flows, or access control mechanisms;</LI><LI>bypass rate limits, security rules, or anti-abuse protections;</LI><LI>upload malware, malicious code, exploit payloads, or any content designed to damage or compromise the Service or its providers;</LI><LI>interfere with other users&apos; access, data, or experience.</LI></UL></S>

      <S><H2>7. No Infrastructure or Service Disruption</H2><P>You may not:</P><UL><LI>overload, flood, or degrade our systems or our providers&apos; systems;</LI><LI>generate excessive requests or traffic intended to slow, crash, or destabilize the Service;</LI><LI>exploit edge cases or system weaknesses in ways that increase cost, latency, or operational burden;</LI><LI>engage in denial-of-service behavior, coordinated request bursts, or similar disruptive activity.</LI></UL></S>

      <S><H2>8. No Illegal, Fraudulent, or Harmful Use</H2><P>You may not use the Service to:</P><UL><LI>commit or facilitate fraud, scams, deception, or unlawful conduct;</LI><LI>impersonate others or misrepresent affiliation;</LI><LI>generate unlawful, infringing, abusive, defamatory, harassing, or harmful content;</LI><LI>violate privacy rights, confidentiality obligations, export controls, sanctions, or other legal restrictions;</LI><LI>submit content you do not have the right to use;</LI><LI>exploit the Service in connection with criminal activity, financial fraud, phishing, social engineering, or harmful manipulation.</LI></UL></S>

      <S><H2>9. No Misuse of Outputs</H2><P>You may not:</P><UL><LI>represent AI-generated outputs as guaranteed facts, professional advice, or authoritative conclusions where that would be misleading or unlawful;</LI><LI>use outputs in ways that violate law, contract, confidentiality, or third-party rights;</LI><LI>use outputs to build deceptive, fraudulent, or abusive products or communications;</LI><LI>use outputs in high-stakes contexts without appropriate human review and legal/commercial validation.</LI></UL><P>You remain solely responsible for how you use any output.</P></S>

      <S><H2>10. Competitive and Reverse-Engineering Restrictions</H2><P>You may not:</P><UL><LI>use the Service to build or improve a competing service by extracting prompts, flows, analyses, structures, or outputs at scale;</LI><LI>reverse engineer the Service except to the limited extent non-waivable law expressly permits;</LI><LI>copy, mirror, or recreate the Service&apos;s commercial logic, gating logic, prompt architecture, subscription logic, or report structure in a way that harms or competes with us;</LI><LI>benchmark the Service for public or commercial comparison in a misleading, abusive, or extractive way.</LI></UL></S>

      <S><H2>11. Enforcement</H2><P>If we believe you have violated this Policy, our Terms, or any applicable law, we may take action at our sole discretion, including without notice:</P><UL><LI>rate limiting or throttling,</LI><LI>blocking free usage,</LI><LI>invalidating analyses,</LI><LI>revoking included or purchased analyses,</LI><LI>suspending or terminating accounts,</LI><LI>disabling saved reports or exports,</LI><LI>canceling access to paid features,</LI><LI>blocking future purchases,</LI><LI>refusing service,</LI><LI>preserving evidence,</LI><LI>and reporting conduct to payment providers, hosting vendors, law enforcement, or other relevant parties where appropriate.</LI></UL><P>We are not obligated to warn you before taking action.</P></S>

      <S><H2>12. No Refunds for Abuse</H2><P>If you violate this Policy, you are not entitled to any refund, restoration, replacement, or compensation for:</P><UL><LI>subscription charges,</LI><LI>add-on purchases,</LI><LI>revoked analyses,</LI><LI>suspended accounts,</LI><LI>terminated access,</LI><LI>or disabled features,</LI></UL><P>except where required by applicable law.</P></S>

      <S><H2>13. Reporting Issues</H2><P>If you believe your account or access was restricted in error, or if you want to report suspected abuse, contact:</P><P><A href="mailto:builder@unbuilt.me">builder@unbuilt.me</A></P></S>
    </>
  );
}
