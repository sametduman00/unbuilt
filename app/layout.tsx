import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import ClerkThemeProvider from "./components/ClerkThemeProvider";
import CookieConsent from "./components/CookieConsent";
import AppTopNav from "./components/AppTopNav";
import ConsentGate from "./components/ConsentGate";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
import ConversionTracker from "./components/ConversionTracker";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Unbuilt — for vibecoders",
  description: "Unbuilt is the home base for vibe coders. Pulse tracks what's launching daily. Dig analyzes any app idea against 70+ live sources in 5 minutes. Stack recommends the exact tools to build it from 700+ options.",
  keywords: [
    "vibe coding",
    "vibecoder",
    "app idea validation",
    "market research for developers",
    "no-code market research",
    "saas idea validation",
    "find market gaps",
    "indie hacker tools",
    "what to build",
    "competitor analysis tool",
    "build in public",
    "app store research",
    "product hunt analysis",
    "startup idea validator",
    "vibe coder tools",
  ],
  openGraph: {
    title: "Unbuilt — for vibecoders",
    description: "The home base for vibe coders. Find what to build, validate if it's worth it, and get the exact tools to ship it.",
    url: "https://unbuilt.me",
    siteName: "Unbuilt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Unbuilt — for vibecoders",
    description: "The home base for vibe coders. Pulse, Dig, Stack — find the gap, validate the idea, ship the right thing.",
    site: "@Unbuilt_me",
  },
  alternates: {
    canonical: "https://unbuilt.me",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Unbuilt",
  "url": "https://unbuilt.me",
  "description": "Unbuilt helps vibe coders find what to build before they waste months on the wrong idea. Pulse tracks what's launching daily (free). Dig analyzes any app idea against 70+ live sources in 5 minutes. Stack recommends the exact tools to build it from 700+ options.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": [
    {
      "@type": "Offer",
      "name": "Pulse",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free daily feed of what's launching and what's missing in every product."
    },
    {
      "@type": "Offer",
      "name": "Dig",
      "description": "Full market analysis: competitors, pain points, gaps, verdict. 70+ live sources."
    },
    {
      "@type": "Offer",
      "name": "Stack",
      "description": "Phased build plan from 700+ tools, filtered for your idea, budget, and level."
    }
  ],
  "creator": {
    "@type": "Organization",
    "name": "Unbuilt",
    "url": "https://unbuilt.me"
  },
  "keywords": "vibe coding, app idea validation, market research, indie hacker, no-code, saas validation, find market gap, what to build"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <ClerkThemeProvider>
          <ConsentGate>
              <AppTopNav />
            <div className="app-content-wrapper" style={{ }}>
              {children}
            </div>
            
            <CookieConsent />
          </ConsentGate>
                      <ConversionTracker />
        </ClerkThemeProvider>
      </body>
      <GoogleAnalytics gaId="G-QPCR0DP98G" />
    </html>
  );
}
