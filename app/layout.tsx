import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import CookieConsent from "./components/CookieConsent";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Unbuilt — Market Gap Finder",
  description: "Enter any niche or app idea and instantly discover what competitors are missing. Find your edge before you build.",
};

function GlobalHeader() {
  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      height: 52, display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 1.5rem",
      background: "var(--clr-bg)",
      borderBottom: "1px solid var(--clr-border)",
      backdropFilter: "blur(12px)",
    }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
        <svg width="20" height="20" viewBox="0 0 19 19" fill="none">
          <path d="M2.5 5.5h14M2.5 9.5h10M2.5 13.5h6" stroke="var(--clr-accent)" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--clr-text)", letterSpacing: "-0.02em" }}>Unbuilt</span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <SignedOut>
          <SignInButton mode="modal">
            <button style={{
              padding: "0.375rem 1rem",
              background: "var(--clr-text)",
              color: "var(--clr-bg)",
              border: "none", borderRadius: 8,
              fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
            }}>
              Sign in
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                userButtonPopoverActionButton__manageAccount: { display: "none" },
              }
            }}
          />
        </SignedIn>
      </div>
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#ffffff",
          colorBackground: "#111111",
          colorInputBackground: "#161616",
          colorText: "#ffffff",
          colorTextSecondary: "#888888",
          borderRadius: "0.75rem",
        },
        elements: {
          card: { background: "#111111", border: "1px solid #222222", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" },
          socialButtonsBlockButton: { border: "1px solid #222222", background: "#161616" },
          formButtonPrimary: { background: "#ffffff", color: "#000000" },
          footerActionLink: { color: "#e5e5e5" },
          headerTitle: { color: "#ffffff" },
          headerSubtitle: { color: "#888888" },
          userButtonPopoverCard: { background: "#111111", border: "1px solid #222222" },
          userButtonPopoverActionButton: { color: "#ffffff" },
          userButtonPopoverActionButtonText: { color: "#ffffff" },
          userButtonPopoverFooter: { display: "none" },
          userButtonPopoverActionButton__manageAccount: { display: "none" },
        },
      }}
    >
      <html lang="en" className={inter.variable}>
        <body>
          <GlobalHeader />
          {children}
          <CookieConsent />
        </body>
      </html>
    </ClerkProvider>
  );
}
