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
          colorPrimary: "#8b5cf6",
          colorBackground: "#111113",
          colorInputBackground: "#18181b",
          colorText: "#fafafa",
          colorTextSecondary: "#a1a1aa",
          borderRadius: "0.75rem",
        },
        elements: {
          card: { background: "#111113", border: "1px solid #27272a", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" },
          socialButtonsBlockButton: { border: "1px solid #27272a", background: "#18181b" },
          formButtonPrimary: { background: "#8b5cf6" },
          footerActionLink: { color: "#8b5cf6" },
          headerTitle: { color: "#fafafa" },
          headerSubtitle: { color: "#a1a1aa" },
          userButtonPopoverCard: { background: "#111113", border: "1px solid #27272a" },
          userButtonPopoverActionButton: { color: "#fafafa" },
          userButtonPopoverActionButtonText: { color: "#fafafa" },
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
