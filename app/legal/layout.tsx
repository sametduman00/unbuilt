"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TITLES: Record<string, string> = {
  "/legal/privacy-policy": "Privacy Policy",
  "/legal/terms-of-service": "Terms of Service",
  "/legal/cookie-policy": "Cookie Policy",
  "/legal/acceptable-use": "Acceptable Use",
  "/legal/ai-transparency": "AI Transparency",
  "/legal/do-not-sell": "Do Not Sell My Info",
  "/legal/disclaimer": "Disclaimer",
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = TITLES[pathname] ?? "Legal";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080808",
      color: "#e5e5e5",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "3rem 1.5rem 6rem",
      }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "#888",
            textDecoration: "none",
            fontSize: 14,
            marginBottom: "2rem",
            transition: "color 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={e => (e.currentTarget.style.color = "#888")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Unbuilt
        </Link>

        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          color: "#fff",
          marginBottom: "0.5rem",
          letterSpacing: "-0.02em",
        }}>
          {title}
        </h1>

        <p style={{ color: "#666", fontSize: 14, marginBottom: "2.5rem" }}>
          Last updated: March 14, 2026
        </p>

        <div style={{ lineHeight: 1.7, fontSize: 15 }}>
          {children}
        </div>

        <div style={{
          marginTop: "4rem",
          paddingTop: "2rem",
          borderTop: "1px solid #1a1a1a",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem 1.5rem",
          fontSize: 13,
          color: "#555",
        }}>
          {Object.entries(TITLES).map(([path, label]) => (
            <Link
              key={path}
              href={path}
              style={{
                color: pathname === path ? "#999" : "#555",
                textDecoration: "none",
                transition: "color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#aaa")}
              onMouseLeave={e => (e.currentTarget.style.color = pathname === path ? "#999" : "#555")}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
