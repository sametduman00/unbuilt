const S = ({ children, style, ...props }: React.HTMLAttributes<HTMLElement> & { as?: string }) => (
  <section style={{ marginBottom: "2.5rem", ...style }} {...props}>{children}</section>
);
const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontSize: 20, fontWeight: 600, color: "#fff", marginBottom: "0.75rem", letterSpacing: "-0.01em" }}>{children}</h2>
);
const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 style={{ fontSize: 16, fontWeight: 600, color: "#ddd", marginBottom: "0.5rem" }}>{children}</h3>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ color: "#bbb", marginBottom: "0.75rem" }}>{children}</p>
);
const UL = ({ children }: { children: React.ReactNode }) => (
  <ul style={{ color: "#bbb", paddingLeft: "1.25rem", marginBottom: "0.75rem", listStyleType: "disc" }}>{children}</ul>
);
const LI = ({ children }: { children: React.ReactNode }) => (
  <li style={{ marginBottom: "0.35rem" }}>{children}</li>
);

export default function PrivacyPolicyPage() {
  return (
    <>
      <S>
        <P>
          Unbuilt (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the Unbuilt market research platform. This Privacy Policy explains how we collect, use, and protect your information when you use our service.
        </P>
      </S>

      <S>
        <H2>1. Information We Collect</H2>

        <H3>Account Information</H3>
        <P>
          When you create an account, we collect your email address and basic profile information through our authentication provider, Clerk. This information is used solely for account management and authentication purposes.
        </P>

        <H3>Usage Data</H3>
        <P>We automatically collect certain information about how you use the service, including:</P>
        <UL>
          <LI>Queries you submit for market analysis</LI>
          <LI>Features and tools you use</LI>
          <LI>Timestamps and frequency of usage</LI>
          <LI>Device type and browser information</LI>
        </UL>
        <P>This data is used exclusively to improve the service and user experience.</P>
      </S>

      <S>
        <H2>2. Third-Party Services and APIs</H2>
        <P>To provide market analysis, we integrate with the following third-party services:</P>
        <UL>
          <LI><strong style={{ color: "#ddd" }}>Anthropic API (Claude)</strong> — AI-powered market analysis and content generation</LI>
          <LI><strong style={{ color: "#ddd" }}>Apple iTunes Search API</strong> — App Store data for competitor analysis</LI>
          <LI><strong style={{ color: "#ddd" }}>Google Play</strong> — Android app market data</LI>
          <LI><strong style={{ color: "#ddd" }}>YouTube Data API</strong> — Video content and trend analysis</LI>
          <LI><strong style={{ color: "#ddd" }}>GitHub API</strong> — Open-source project and repository data</LI>
          <LI><strong style={{ color: "#ddd" }}>SerpAPI</strong> — Search engine data and trends</LI>
          <LI><strong style={{ color: "#ddd" }}>Product Hunt API</strong> — Product launch and community data</LI>
        </UL>
        <P>
          Your search queries may be sent to these services to generate analysis results. Each third-party service has its own privacy policy governing how they handle data.
        </P>
      </S>

      <S>
        <H2>3. How We Use Your Information</H2>
        <UL>
          <LI>To provide and maintain the Unbuilt service</LI>
          <LI>To authenticate your account and manage sessions</LI>
          <LI>To generate market research and analysis based on your queries</LI>
          <LI>To improve the quality and accuracy of our analysis</LI>
          <LI>To communicate important service updates</LI>
        </UL>
      </S>

      <S>
        <H2>4. Data Sharing</H2>
        <P>
          <strong style={{ color: "#fff" }}>We do not sell your personal data.</strong> We do not share your personal information with third parties for marketing purposes. Your data is only shared with the third-party services listed above to the extent necessary to provide the market analysis you request.
        </P>
      </S>

      <S>
        <H2>5. Data Retention</H2>
        <P>
          We retain your account information for as long as your account is active. Usage data is retained for up to 12 months to improve the service. You may request deletion of your data at any time by contacting us.
        </P>
      </S>

      <S>
        <H2>6. Data Security</H2>
        <P>
          We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
        </P>
      </S>

      <S>
        <H2>7. Your Rights</H2>
        <P>You have the right to:</P>
        <UL>
          <LI>Access the personal data we hold about you</LI>
          <LI>Request correction of inaccurate data</LI>
          <LI>Request deletion of your data</LI>
          <LI>Withdraw consent for data processing</LI>
          <LI>Export your data in a portable format</LI>
        </UL>
      </S>

      <S>
        <H2>8. Changes to This Policy</H2>
        <P>
          We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
        </P>
      </S>

      <S>
        <H2>9. Contact</H2>
        <P>
          If you have any questions about this Privacy Policy, please contact us at{" "}
          <a href="mailto:builder@unbuilt.me" style={{ color: "#888", textDecoration: "underline", textUnderlineOffset: 3 }}>builder@unbuilt.me</a>.
        </P>
      </S>
    </>
  );
}
