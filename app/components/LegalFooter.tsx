export default function LegalFooter() {
  return (
    <footer style={{
      borderTop: "1px solid #1a1a1a",
      padding: "1.5rem 1.5rem",
      marginTop: "4rem",
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: "0.5rem 1.5rem",
    }}>
      {[
        { href: "/legal/terms-of-service", label: "Terms of Service" },
        { href: "/legal/privacy-policy", label: "Privacy Policy" },
        { href: "/legal/refund-policy", label: "Refund Policy" },
        { href: "/legal/cookie-policy", label: "Cookie Policy" },
        { href: "/legal/acceptable-use", label: "Acceptable Use" },
        { href: "/legal/ai-transparency", label: "AI Transparency" },
        { href: "/legal/disclaimer", label: "Disclaimer" },
        { href: "/legal/do-not-sell", label: "Do Not Sell My Info" },
      ].map(({ href, label }) => (
        <a
          key={href}
          href={href}
          style={{
            color: "#555",
            textDecoration: "none",
            fontSize: 12,
            transition: "color 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "#999")}
          onMouseLeave={e => (e.currentTarget.style.color = "#555")}
        >
          {label}
        </a>
      ))}
    </footer>
  );
}
