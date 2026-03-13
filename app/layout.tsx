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
          colorPrimary: "#7c3aed",
          colorBackground: "#0a0a0a",
          colorInputBackground: "#111111",
          colorText: "#ffffff",
          colorTextSecondary: "#71717a",
          borderRadius: "0.75rem",
        },
        elements: {
          card: { background: "#0a0a0a", border: "1px solid #222222", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" },
          socialButtonsBlockButton: { border: "1px solid #222222", background: "#111111" },
          formButtonPrimary: { background: "#7c3aed" },
          footerActionLink: { color: "#7c3aed" },
          headerTitle: { color: "#ffffff" },
          headerSubtitle: { color: "#71717a" },
          userButtonPopoverCard: { background: "#0a0a0a", border: "1px solid #222222" },
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
