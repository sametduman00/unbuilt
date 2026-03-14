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

export default function CookiePolicyPage() {
  return (
    <>
      <S>
        <P>
          This Cookie Policy explains how Unbuilt uses cookies and similar technologies when you visit and use our service.
        </P>
      </S>

      <S>
        <H2>1. What Are Cookies</H2>
        <P>
          Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and understand how you interact with the service. Cookies may be &quot;session&quot; cookies (deleted when you close your browser) or &quot;persistent&quot; cookies (remaining until they expire or you delete them).
        </P>
      </S>

      <S>
        <H2>2. Cookies We Use</H2>

        <H3>Essential Cookies</H3>
        <P>
          These cookies are required for the service to function and cannot be disabled. They are set by our authentication provider, Clerk, and are used to:
        </P>
        <div style={{
          background: "#111",
          border: "1px solid #1a1a1a",
          borderRadius: 8,
          padding: "1rem 1.25rem",
          marginBottom: "1rem",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #222" }}>
                <th style={{ textAlign: "left", padding: "0.5rem 0", color: "#999", fontWeight: 500 }}>Purpose</th>
                <th style={{ textAlign: "left", padding: "0.5rem 0", color: "#999", fontWeight: 500 }}>Provider</th>
                <th style={{ textAlign: "left", padding: "0.5rem 0", color: "#999", fontWeight: 500 }}>Duration</th>
              </tr>
            </thead>
            <tbody style={{ color: "#bbb" }}>
              <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                <td style={{ padding: "0.5rem 0" }}>Authentication & session management</td>
                <td style={{ padding: "0.5rem 0" }}>Clerk</td>
                <td style={{ padding: "0.5rem 0" }}>Session</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                <td style={{ padding: "0.5rem 0" }}>CSRF protection</td>
                <td style={{ padding: "0.5rem 0" }}>Clerk</td>
                <td style={{ padding: "0.5rem 0" }}>Session</td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0" }}>User preferences</td>
                <td style={{ padding: "0.5rem 0" }}>Unbuilt</td>
                <td style={{ padding: "0.5rem 0" }}>1 year</td>
              </tr>
            </tbody>
          </table>
        </div>

        <H3>Analytics Cookies</H3>
        <P>
          We use analytics cookies to understand how visitors interact with Unbuilt. This helps us improve the service, identify popular features, and fix issues. Analytics data is aggregated and does not personally identify you.
        </P>
        <div style={{
          background: "#111",
          border: "1px solid #1a1a1a",
          borderRadius: 8,
          padding: "1rem 1.25rem",
          marginBottom: "1rem",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #222" }}>
                <th style={{ textAlign: "left", padding: "0.5rem 0", color: "#999", fontWeight: 500 }}>Purpose</th>
                <th style={{ textAlign: "left", padding: "0.5rem 0", color: "#999", fontWeight: 500 }}>Provider</th>
                <th style={{ textAlign: "left", padding: "0.5rem 0", color: "#999", fontWeight: 500 }}>Duration</th>
              </tr>
            </thead>
            <tbody style={{ color: "#bbb" }}>
              <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                <td style={{ padding: "0.5rem 0" }}>Page views & feature usage</td>
                <td style={{ padding: "0.5rem 0" }}>Analytics</td>
                <td style={{ padding: "0.5rem 0" }}>1 year</td>
              </tr>
              <tr>
                <td style={{ padding: "0.5rem 0" }}>Performance monitoring</td>
                <td style={{ padding: "0.5rem 0" }}>Analytics</td>
                <td style={{ padding: "0.5rem 0" }}>1 year</td>
              </tr>
            </tbody>
          </table>
        </div>
      </S>

      <S>
        <H2>3. Managing Cookies</H2>
        <P>
          Most web browsers allow you to control cookies through their settings. You can typically find these in the &quot;Options&quot; or &quot;Preferences&quot; menu of your browser. You can set your browser to block or delete cookies, though this may affect the functionality of the service.
        </P>
        <P>
          Please note that disabling essential cookies will prevent you from logging in and using authenticated features of Unbuilt.
        </P>
      </S>

      <S>
        <H2>4. Third-Party Cookies</H2>
        <P>
          We do not use third-party advertising cookies. The only third-party cookies are those set by Clerk for authentication purposes.
        </P>
      </S>

      <S>
        <H2>5. Changes to This Policy</H2>
        <P>
          We may update this Cookie Policy from time to time to reflect changes in our practices or for operational, legal, or regulatory reasons. The &quot;Last updated&quot; date at the top of this page indicates when the policy was last revised.
        </P>
      </S>

      <S>
        <H2>6. Contact</H2>
        <P>
          If you have any questions about our use of cookies, please contact us at{" "}
          <a href="mailto:builder@unbuilt.me" style={{ color: "#888", textDecoration: "underline", textUnderlineOffset: 3 }}>builder@unbuilt.me</a>.
        </P>
      </S>
    </>
  );
}
