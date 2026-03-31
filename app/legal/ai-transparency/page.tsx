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

export default function AITransparencyPage() {
  return (
    <>
      <S>
        <H2>1. Overview</H2>
        <P>unbuilt.me uses artificial intelligence (AI) to generate insights, recommendations, and analysis.</P>
        <P>These outputs are generated automatically based on user input.</P>
      </S>
      <S>
        <H2>2. How the System Works</H2>
        <P>The Service processes:</P>
        <UL>
          <LI>user-provided inputs (e.g., business ideas)</LI>
          <LI>predefined system instructions</LI>
          <LI>AI models provided by third-party providers</LI>
        </UL>
        <P>Outputs are generated probabilistically and are not deterministic.</P>
      </S>
      <S>
        <H2>3. Limitations of AI</H2>
        <P>You acknowledge that the system:</P>
        <UL>
          <LI>may produce incorrect, incomplete, or outdated results</LI>
          <LI>does not have real-time knowledge or awareness</LI>
          <LI>does not verify all external data sources</LI>
          <LI>may reflect biases present in training data</LI>
        </UL>
        <P>AI outputs should not be treated as facts.</P>
      </S>
      <S>
        <H2>4. No Professional Advice</H2>
        <P>The Service does not provide:</P>
        <UL>
          <LI>financial advice</LI>
          <LI>legal advice</LI>
          <LI>investment recommendations</LI>
        </UL>
        <P>Any decisions made based on outputs are your sole responsibility.</P>
      </S>
      <S>
        <H2>5. Use of Third-Party AI</H2>
        <P>We rely on third-party AI providers to generate outputs.</P>
        <P>Your inputs may be processed by these providers.</P>
      </S>
      <S>
        <H2>6. Data Usage</H2>
        <P>We do not sell your data.</P>
        <P>We may process your inputs to:</P>
        <UL>
          <LI>generate outputs</LI>
          <LI>improve system performance</LI>
          <LI>prevent abuse</LI>
        </UL>
      </S>
      <S>
        <H2>7. Transparency Limits</H2>
        <P>AI systems are inherently complex.</P>
        <P>We cannot fully explain or trace every output generated.</P>
      </S>
      <S>
        <H2>8. Your Responsibility</H2>
        <P>You should:</P>
        <UL>
          <LI>critically evaluate outputs</LI>
          <LI>verify important information</LI>
          <LI>not rely solely on the Service for decisions</LI>
        </UL>
      </S>
      <S>
        <H2>9. Continuous Improvement</H2>
        <P>We continuously improve the system, but accuracy is not guaranteed.</P>
      </S>
    </>
  );
}