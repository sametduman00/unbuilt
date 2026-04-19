import Link from "next/link";

const NAV_LINKS = [
  { href: "/use-cases", label: "Use Cases" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/help", label: "Help" },
  { href: "/careers", label: "Careers" },
];

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
      <div className="legal-footer-nav">
        {NAV_LINKS.map(({ href, label }) => (
          <Link key={href} href={href} className="legal-footer-nav-link">
            {label}
          </Link>
        ))}
      </div>
      <div className="legal-footer-legal">
        {LEGAL_LINKS.map(({ href, label }) => (
          <Link key={href} href={href} className="legal-footer-link">
            {label}
          </Link>
        ))}
      </div>
      <div className="legal-footer-copy">© 2026 unbuilt.me</div>
      <style>{`
        .legal-footer {
          border-top: 1px solid #e8e8e5;
          padding: 2rem 1.5rem 1.5rem;
          margin-top: 4rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .legal-footer-nav {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.5rem 1.5rem;
        }
        .legal-footer-nav-link {
          color: #333;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
        }
        .legal-footer-nav-link:hover { color: #000; }
        .legal-footer-legal {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.4rem 1.25rem;
        }
        .legal-footer-link {
          color: #999;
          text-decoration: none;
          font-size: 11px;
        }
        .legal-footer-link:hover { color: #666; }
        .legal-footer-copy {
          font-size: 11px;
          color: #bbb;
        }
      `}</style>
    </footer>
  );
}
