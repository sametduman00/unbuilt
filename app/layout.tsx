import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import ClerkThemeProvider from "./components/ClerkThemeProvider";
import AppSidebar from "./components/AppSidebar";
import CookieConsent from "./components/CookieConsent";
import MobileNav from "./components/MobileNav";
import ConsentGate from "./components/ConsentGate";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Unbuilt — Build Smarter",
  description: "Enter any niche or app idea and instantly discover what competitors are missing. Find your edge before you build.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>
        <ClerkThemeProvider>
          <ConsentGate>
            <AppSidebar />
            <div className="app-content-wrapper" style={{ marginLeft: 220 }}>
              {children}
            </div>
            <MobileNav />
            <CookieConsent />
          </ConsentGate>
        </ClerkThemeProvider>
      </body>
      <GoogleAnalytics gaId="G-QPCR0DP98G" />
    </html>
  );
}
