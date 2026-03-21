import Link from "next/link";

const LEGAL_LINKS = [
  { href: "/legal/terms-of-service", label: "Terms of Service" },
  { href: "/legal/privacy-policy", label: "Privacy Policy" },
  { href: "/legal/refund-policy", label: "Refund Policy" },
  { href: "/legal/cookie-policy", label: "Cookie Policy" },
  { href: "/legal/acceptable-use", label: "Acceptable Use" },
  { href: "/legal/ai-transparency", label: "AI Transparency" },
  { href: "/legal/disclaimer", label: "Disclaimer" },
  { href: "/legal/do-not-sell", label: "Do Not Sell My Info" },
];

export default function LegalFooter() {
  return (
    <footer className="legal-footer">
      {LEGAL_LINKS.map(({ href, label }) => (
        <Link key={href} href={href} className="legal-footer-link">
          {label}
        </Link>
      ))}
      <style>{`
        .legal-footer {
          border-top: 1px solid #1a1a1a;
          padding: 1.5rem;
          margin-top: 4rem;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.5rem 1.5rem;
        }
        .legal-footer-link {
          color: #555;
          text-decoration: none;
          font-size: 12px;
        }
        .legal-footer-link:hover {
          color: #999;
        }
      `}</style>
    </footer>
  );
}
