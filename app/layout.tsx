import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Unbuilt — Market Gap Finder",
  description:
    "Enter any niche or app idea and instantly discover what competitors are missing. Find your edge before you build.",
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
          socialButtonsBlockButton: { border: "1px solid #222222", background: "#161616" },
          formButtonPrimary: { background: "#ffffff", color: "#000000" },
          footerActionLink: { color: "#e5e5e5" },
          headerTitle: { color: "#ffffff" },
          headerSubtitle: { color: "#888888" },
          userButtonPopoverCard: { background: "#111111", border: "1px solid #222222" },
          userButtonPopoverActionButton: { color: "#ffffff" },
          userButtonPopoverActionButtonText: { color: "#ffffff" },
          userButtonPopoverFooter: { display: "none" },
        },
      }}
    >
      <html lang="en" className={inter.variable}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
