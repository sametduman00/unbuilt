const S = ({ children }: { children: React.ReactNode }) => (
  <section style={{ marginBottom: "2.5rem" }}>{children}</section>
);
const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontSize: 20, fontWeight: 600, color: "#fff", marginBottom: "0.75rem", letterSpacing: "-0.01em" }}>{children}</h2>
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

export default function DoNotSellPage() {
  return (
    <>
      <S>
        <P>
          This page explains your rights regarding the sale or sharing of your personal information, in accordance with the California Consumer Privacy Act (CCPA), California Privacy Rights Act (CPRA), and similar state privacy laws.
        </P>
      </S>

      <S>
        <H2>1. We Do Not Sell Your Personal Information</H2>
        <P>
          <strong style={{ color: "#fff" }}>Unbuilt does not sell your personal information.</strong> We have never sold personal information, and we have no plans to do so. This applies to all users, regardless of location.
        </P>
      </S>

      <S>
        <H2>2. We Do Not Share for Cross-Context Behavioral Advertising</H2>
        <P>
          We do not share your personal information with third parties for the purpose of cross-context behavioral advertising. We do not participate in data brokerages or information exchanges.
        </P>
      </S>

      <S>
        <H2>3. What Information We Collect</H2>
        <P>We collect limited information necessary to operate the service:</P>
        <UL>
          <LI><strong style={{ color: "#ddd" }}>Account information</strong> — Email address and basic profile data via Clerk (authentication provider)</LI>
          <LI><strong style={{ color: "#ddd" }}>Usage data</strong> — Search queries, feature usage, and interaction patterns to improve the service</LI>
          <LI><strong style={{ color: "#ddd" }}>Device information</strong> — Browser type and basic device information for compatibility</LI>
        </UL>
        <P>This information is used solely for providing and improving the Unbuilt service.</P>
      </S>

      <S>
        <H2>4. Third-Party Service Providers</H2>
        <P>
          We share data with third-party service providers only as necessary to operate the platform (e.g., Anthropic for AI analysis, Clerk for authentication). These providers are contractually bound to use your data only for the purposes we specify and are not permitted to sell it.
        </P>
      </S>

      <S>
        <H2>5. Your Rights</H2>
        <P>Depending on your jurisdiction, you may have the right to:</P>
        <UL>
          <LI>Know what personal information we collect and how it is used</LI>
          <LI>Request deletion of your personal information</LI>
          <LI>Opt out of the sale or sharing of personal information (though we do not engage in these practices)</LI>
          <LI>Non-discrimination for exercising your privacy rights</LI>
          <LI>Correct inaccurate personal information</LI>
        </UL>
      </S>

      <S>
        <H2>6. How to Exercise Your Rights</H2>
        <P>
          To submit a privacy request, including requests to access, delete, or correct your personal information, please contact us at{" "}
          <a href="mailto:builder@unbuilt.me" style={{ color: "#888", textDecoration: "underline", textUnderlineOffset: 3 }}>builder@unbuilt.me</a>.
          We will respond to verified requests within 45 days.
        </P>
      </S>

      <S>
        <H2>7. Verification</H2>
        <P>
          To protect your privacy, we may need to verify your identity before processing certain requests. We will do so by matching information you provide against information we have on file.
        </P>
      </S>

      <S>
        <H2>8. Contact</H2>
        <P>
          For questions about this policy or to exercise your rights, contact us at{" "}
          <a href="mailto:builder@unbuilt.me" style={{ color: "#888", textDecoration: "underline", textUnderlineOffset: 3 }}>builder@unbuilt.me</a>.
        </P>
      </S>
    </>
  );
}
