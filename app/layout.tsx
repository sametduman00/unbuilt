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
          colorPrimary: "#7c5cfc",
          colorBackground: "#111118",
          colorInputBackground: "#1a1a24",
          colorText: "#e8e8f0",
          colorTextSecondary: "#8888a8",
          borderRadius: "0.75rem",
        },
        elements: {
          card: { background: "#111118", border: "1px solid #232334", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" },
          socialButtonsBlockButton: { border: "1px solid #232334", background: "#1a1a24" },
          formButtonPrimary: { background: "linear-gradient(135deg, #7c5cfc, #4f8ef7)" },
          footerActionLink: { color: "#7c5cfc" },
          headerTitle: { color: "#e8e8f0" },
          headerSubtitle: { color: "#8888a8" },
          userButtonPopoverCard: { background: "#111118", border: "1px solid #232334" },
          userButtonPopoverActionButton: { color: "#e8e8f0" },
          userButtonPopoverActionButtonText: { color: "#e8e8f0" },
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
