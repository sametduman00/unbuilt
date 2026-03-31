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

export default function PrivacyPage() {
  return (
    <>
      <S><H2>1. Operator</H2><P>This Service is operated by an independent developer based in Turkey.</P></S>
      <S><H2>2. Scope</H2><P>This Privacy Policy explains how we collect, use, and protect your data when you use unbuilt.me.</P></S>
      <S><H2>3. Data We Collect</H2><P><B>Account Data:</B> email address, authentication data (via Clerk). <B>User Input Data:</B> business ideas, prompts, generated outputs. <B>Usage Data:</B> API requests, interaction logs, feature usage. <B>Technical Data:</B> IP address, browser type, device info.</P></S>
      <S><H2>4. How We Use Data</H2><UL><LI>provide AI-generated analysis</LI><LI>operate and improve the Service</LI><LI>prevent abuse and fraud</LI><LI>monitor system performance</LI></UL></S>
      <S><H2>5. AI Processing</H2><P>Your inputs may be processed by third-party AI providers. We do NOT sell your data or use your inputs for advertising. We may process inputs to generate outputs and store them temporarily for performance and abuse prevention.</P></S>
      <S><H2>6. Third-Party Services</H2><UL><LI>Authentication — Clerk</LI><LI>Database — Supabase</LI><LI>Payments — Paddle</LI><LI>AI processing — Anthropic and other providers</LI></UL><P>These providers may process your data on our behalf.</P></S>
      <S><H2>7. Data Retention</H2><P>Account data is retained while your account is active. Usage data is retained for a limited period. Logs are retained short-term for monitoring.</P></S>
      <S><H2>8. Legal Basis (GDPR)</H2><P>If you are in the EU, we process data based on contract (providing the Service), legitimate interest (security, abuse prevention), and consent where required.</P></S>
      <S><H2>9. Your Rights</H2><P>You may have the right to access your data, request deletion, request correction, restrict processing, and object to processing. Contact us to exercise your rights.</P></S>
      <S><H2>10. Cookies</H2><P>We use cookies for authentication, essential functionality, and performance. You can control cookies via your browser.</P></S>
      <S><H2>11. Data Security</H2><P>We implement reasonable security measures to protect data. However, no system is completely secure.</P></S>
      <S><H2>12. International Transfers</H2><P>Your data may be processed outside your country. By using the Service, you consent to this.</P></S>
      <S><H2>13. Children</H2><P>The Service is not intended for users under 16.</P></S>
      <S><H2>14. Changes</H2><P>We may update this Privacy Policy at any time.</P></S>
      <S><H2>15. Contact</H2><P><A href="mailto:builder@unbuilt.me">builder@unbuilt.me</A></P></S>
    </>
  );
}