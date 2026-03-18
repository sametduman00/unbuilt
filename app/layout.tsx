import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import GlobalHeader from "./components/GlobalHeader";
import CookieConsent from "./components/CookieConsent";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Unbuilt — Market Gap Finder",
  description: "Enter any niche or app idea and instantly discover what competitors are missing. Find your edge before you build.",
};

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
          formButtonPrimary: { background: "#ffffff", color: "#000000" },
          headerTitle: { color: "#ffffff" },
          headerSubtitle: { color: "#888888" },
          // Hide "Don't have an account? Sign up"
          footer: { display: "none" },
          // GitHub: brand dark
          socialButtonsBlockButton__github: {
            background: "#24292e",
            border: "1px solid #444",
            color: "#ffffff",
          },
          socialButtonsBlockButtonText__github: { color: "#ffffff" },
          // Google: clean white, no overlay
          socialButtonsBlockButton__google: {
            background: "#ffffff",
            border: "1px solid #dadce0",
            color: "#3c4043",
            boxShadow: "none",
          },
          socialButtonsBlockButtonText__google: { color: "#3c4043" },
          // UserButton
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
