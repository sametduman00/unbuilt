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

export default function DoNotSellPage() {
  return (
    <>
      <S><H2>1. Your Rights</H2><P>Under certain privacy laws (such as the California Consumer Privacy Act), users have the right to opt out of the sale of their personal information.</P></S>
      <S><H2>2. Our Position</H2><P>We do <B>not sell your personal information</B>. We do not sell your data to third parties or exchange your data for monetary or other valuable consideration.</P></S>
      <S><H2>3. Data Sharing</H2><P>We may share data only with service providers necessary to operate the Service: authentication providers, infrastructure providers, payment processors, and AI providers. These providers process data on our behalf and are not permitted to use it for their own purposes.</P></S>
      <S><H2>4. Future Changes</H2><P>If our practices change and we begin selling personal information, we will update this page and provide a clear opt-out mechanism.</P></S>
      <S><H2>5. Contact</H2><P><A href="mailto:builder@unbuilt.me">builder@unbuilt.me</A></P></S>
    </>
  );
}