const S = ({ children }: { children: React.ReactNode }) => (
  <section style={{ marginBottom: "2.5rem" }}>{children}</section>
);
const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--clr-text)", marginBottom: "0.75rem", letterSpacing: "-0.01em" }}>{children}</h2>
);
const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--clr-text)", marginBottom: "0.5rem" }}>{children}</h3>
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

export default function CookiePage() {
  return (
    <>
      <S>
        <H2>1. Introduction</H2>
        <P>This Cookie Policy explains how unbuilt.me uses cookies and similar technologies.</P>
        <P>Cookies are small text files stored on your device.</P>
      </S>
      <S>
        <H2>2. Types of Cookies We Use</H2>
        <H3>Essential Cookies (Required)</H3>
        <P>These cookies are necessary for the Service to function.</P>
        <P>Examples:</P>
        <UL>
          <LI>authentication (login sessions)</LI>
          <LI>security and fraud prevention</LI>
          <LI>API request validation</LI>
        </UL>
        <P>Without these cookies, the Service cannot operate.</P>
        <H3>Functional Cookies</H3>
        <P>These cookies store user preferences such as:</P>
        <UL>
          <LI>interface settings</LI>
          <LI>usage preferences</LI>
        </UL>
        <H3>Analytics Cookies (if used)</H3>
        <P>We may use analytics cookies to:</P>
        <UL>
          <LI>understand how users interact with the Service</LI>
          <LI>improve performance</LI>
        </UL>
        <P>These cookies are only used with your consent where required.</P>
      </S>
      <S>
        <H2>3. Third-Party Cookies</H2>
        <P>We use third-party providers that may set cookies:</P>
        <UL>
          <LI>Clerk → authentication</LI>
          <LI>Supabase → session handling</LI>
          <LI>Vercel → infrastructure and performance</LI>
          <LI>Payment providers (Paddle / Lemon Squeezy) → payment processing</LI>
        </UL>
        <P>These providers may process data according to their own privacy policies.</P>
      </S>
      <S>
        <H2>4. Legal Basis (EU Users)</H2>
        <P>For users in the European Union:</P>
        <UL>
          <LI>essential cookies → legitimate interest</LI>
          <LI>analytics cookies → consent</LI>
        </UL>
      </S>
      <S>
        <H2>5. Cookie Duration</H2>
        <P>Cookies may be:</P>
        <UL>
          <LI>Session cookies → deleted when you close your browser</LI>
          <LI>Persistent cookies → stored for a limited time</LI>
        </UL>
        <P>Typical durations:</P>
        <UL>
          <LI>authentication cookies → short-term session</LI>
          <LI>preference cookies → longer duration</LI>
        </UL>
      </S>
      <S>
        <H2>6. Managing Cookies</H2>
        <P>You can control cookies through:</P>
        <UL>
          <LI>browser settings</LI>
          <LI>cookie consent banner (if shown)</LI>
        </UL>
        <P>Blocking cookies may affect functionality.</P>
      </S>
      <S>
        <H2>7. Consent</H2>
        <P>Where required by law:</P>
        <UL>
          <LI>we request your consent before placing non-essential cookies</LI>
          <LI>you can withdraw consent at any time</LI>
        </UL>
      </S>
      <S>
        <H2>8. Updates</H2>
        <P>We may update this Cookie Policy.</P>
      </S>
      <S>
        <H2>9. Contact</H2>
        <P><A href="mailto:builder@unbuilt.me">builder@unbuilt.me</A></P>
      </S>
    </>
  );
}