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

export default function CookiePage() {
  return (
    <>
      <S><H2>1. Introduction</H2><P>This Cookie Policy explains how unbuilt.me uses cookies and similar technologies. Cookies are small text files stored on your device.</P></S>
      <S><H2>2. Types of Cookies We Use</H2><P><B>Essential Cookies:</B> Necessary for the Service to function — authentication, security and fraud prevention, API request validation. Without these, the Service cannot operate.</P><P><B>Functional Cookies:</B> Store user preferences such as interface settings and usage preferences.</P><P><B>Analytics Cookies:</B> Used with your consent to understand how users interact with the Service and improve performance.</P></S>
      <S><H2>3. Third-Party Cookies</H2><UL><LI>Clerk — authentication</LI><LI>Supabase — session handling</LI><LI>Vercel — infrastructure and performance</LI><LI>Paddle — payment processing</LI></UL><P>These providers may process data according to their own privacy policies.</P></S>
      <S><H2>4. Legal Basis (EU Users)</H2><UL><LI>essential cookies — legitimate interest</LI><LI>analytics cookies — consent</LI></UL></S>
      <S><H2>5. Cookie Duration</H2><UL><LI>Session cookies — deleted when you close your browser</LI><LI>Persistent cookies — stored for a limited time</LI><LI>authentication cookies — short-term session</LI><LI>preference cookies — longer duration</LI></UL></S>
      <S><H2>6. Managing Cookies</H2><P>You can control cookies through browser settings or the cookie consent banner. Blocking cookies may affect functionality.</P></S>
      <S><H2>7. Consent</H2><P>Where required by law, we request your consent before placing non-essential cookies. You can withdraw consent at any time.</P></S>
      <S><H2>8. Updates</H2><P>We may update this Cookie Policy at any time.</P></S>
      <S><H2>9. Contact</H2><P><A href="mailto:builder@unbuilt.me">builder@unbuilt.me</A></P></S>
    </>
  );
}