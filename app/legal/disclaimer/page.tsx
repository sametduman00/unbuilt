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

export default function DisclaimerPage() {
  return (
    <>
      <S><H2>1. General Information</H2><P>unbuilt.me (the &ldquo;Service&rdquo;) provides software features, AI-generated outputs, reports, summaries, recommendations, stack suggestions, and related digital tools for general informational and product-support purposes only.</P><P>Nothing made available through the Service should be understood as verified fact, guaranteed insight, or a substitute for independent judgment.</P></S>

      <S><H2>2. AI-Generated Content</H2><P>All or part of the outputs provided by the Service may be generated automatically by artificial intelligence and related automated systems.</P><P>Accordingly, outputs may be:</P><UL><LI>inaccurate,</LI><LI>incomplete,</LI><LI>misleading,</LI><LI>outdated,</LI><LI>speculative,</LI><LI>inconsistent,</LI><LI>or unsuitable for your specific use case.</LI></UL><P>We do not guarantee that any output is:</P><UL><LI>accurate,</LI><LI>complete,</LI><LI>reliable,</LI><LI>current,</LI><LI>unbiased,</LI><LI>or fit for any particular purpose.</LI></UL></S>

      <S><H2>3. Free vs Paid Output Disclaimer</H2><P>The Service may provide different levels of output depending on whether you are using a free or paid flow, whether you have remaining included analyses, and whether certain features are gated or unlocked.</P><P>For example:</P><UL><LI>free users may receive limited, reduced-depth, or partially gated output;</LI><LI>paid users may receive broader or deeper output;</LI><LI>users who exhaust included monthly analyses may fall back to limited output modes.</LI></UL><P>No output — free or paid — should be treated as authoritative, complete, or guaranteed.</P></S>

      <S><H2>4. No Professional Advice</H2><P>The Service does not provide:</P><UL><LI>legal advice,</LI><LI>financial advice,</LI><LI>tax advice,</LI><LI>accounting advice,</LI><LI>investment advice,</LI><LI>professional consulting,</LI><LI>or guaranteed business advice.</LI></UL><P>Nothing in the Service constitutes a recommendation to:</P><UL><LI>launch a business,</LI><LI>invest capital,</LI><LI>hire or fire,</LI><LI>enter into contracts,</LI><LI>select a legal or tax structure,</LI><LI>or make any high-stakes commercial decision without your own independent review.</LI></UL></S>

      <S><H2>5. Use at Your Own Risk</H2><P>You use the Service entirely at your own risk.</P><P>You are solely responsible for:</P><UL><LI>evaluating outputs,</LI><LI>verifying material claims,</LI><LI>testing assumptions,</LI><LI>deciding whether to act on any recommendation,</LI><LI>and accepting all commercial, legal, financial, operational, and strategic consequences of your decisions.</LI></UL><P>If you rely on an output, you do so entirely at your own risk.</P></S>

      <S><H2>6. No Guarantee of Business, Product, or Financial Outcomes</H2><P>We are not responsible for and do not guarantee:</P><UL><LI>business success,</LI><LI>product-market fit,</LI><LI>revenue,</LI><LI>profitability,</LI><LI>fundraising success,</LI><LI>customer adoption,</LI><LI>launch outcomes,</LI><LI>growth outcomes,</LI><LI>market opportunity,</LI><LI>strategic correctness,</LI><LI>or any other commercial result.</LI></UL><P>We are also not responsible for:</P><UL><LI>failed projects,</LI><LI>poor product choices,</LI><LI>bad stack decisions,</LI><LI>misread market signals,</LI><LI>lost time,</LI><LI>lost money,</LI><LI>or missed business opportunities.</LI></UL><P>A low score does not prove an idea cannot work. A high score does not prove an idea will work.</P></S>

      <S><H2>7. Third-Party Data and Providers</H2><P>The Service may rely on third-party providers, including AI/model vendors, payment processors, search or enrichment services, hosting vendors, and infrastructure providers.</P><P>The Service may also rely on external data, retrieval, or model knowledge that may be incomplete, delayed, or incorrect.</P><P>We do not guarantee:</P><UL><LI>the availability,</LI><LI>accuracy,</LI><LI>completeness,</LI><LI>or reliability</LI></UL><P>of any third-party data, service, model output, or vendor infrastructure.</P><P>Third-party failures, outages, inaccuracies, or inconsistencies may affect outputs.</P></S>

      <S><H2>8. No Warranty</H2><P>The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis.</P><P>To the maximum extent permitted by law, we disclaim all warranties, whether express, implied, statutory, or otherwise, including implied warranties of:</P><UL><LI>merchantability,</LI><LI>fitness for a particular purpose,</LI><LI>non-infringement,</LI><LI>accuracy,</LI><LI>availability,</LI><LI>satisfactory quality,</LI><LI>and uninterrupted access.</LI></UL><P>We do not warrant that the Service will be uninterrupted, error-free, secure, or suitable for your intended use.</P></S>

      <S><H2>9. Feature, Report, and Access Limitations</H2><P>We do not guarantee that:</P><UL><LI>any feature will remain available,</LI><LI>any plan will remain unchanged,</LI><LI>saved reports will remain accessible,</LI><LI>exports will remain available,</LI><LI>subscription benefits will remain identical,</LI><LI>or any output structure, score, label, or report section will remain the same over time.</LI></UL><P>We may change, limit, gate, suspend, or discontinue features, pricing, entitlements, report structures, or output depth at any time.</P></S>

      <S><H2>10. Limitation Reminder</H2><P>This Disclaimer must be read together with:</P><UL><LI>the Terms of Service,</LI><LI>Privacy Policy,</LI><LI>Refund, Billing, and Cancellation Policy,</LI><LI>Acceptable Use Policy,</LI><LI>AI Transparency Policy,</LI><LI>and Cookie Policy.</LI></UL><P>If there is any conflict between this Disclaimer and the Terms of Service, the Terms of Service prevail.</P></S>

      <S><H2>11. Contact</H2><P>If you have questions about this Disclaimer, contact:</P><P><A href="mailto:builder@unbuilt.me">builder@unbuilt.me</A></P></S>
    </>
  );
}
