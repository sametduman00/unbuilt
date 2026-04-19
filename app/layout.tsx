import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";
import ClerkThemeProvider from "./components/ClerkThemeProvider";
import CookieConsent from "./components/CookieConsent";
import AppTopNav from "./components/AppTopNav";
import MobileNav from "./components/MobileNav";
import LegalFooter from "./components/LegalFooter";
import ConsentGate from "./components/ConsentGate";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
import ConversionTracker from "./components/ConversionTracker";

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Unbuilt — for vibecoders",
  description: "Unbuilt is the home base for vibe coders. Launches tracks what's launching daily. Dig analyzes any app idea against 70+ live sources in 5 minutes. Stack recommends the exact tools to build it from 700+ options.",
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
    description: "The home base for vibe coders. Launches, Dig, Stack — find the gap, validate the idea, ship the right thing.",
    site: "@Unbuilt_me",
  },
  alternates: {
    canonical: "https://unbuilt.me",
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Unbuilt",
    "url": "https://unbuilt.me",
    "description": "Unbuilt helps vibe coders find what to build before they waste months on the wrong idea. Launches tracks what's launching daily (free). Dig analyzes any app idea against 70+ live sources in 5 minutes. Stack recommends the exact tools to build it from 700+ options.",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "120",
      "bestRating": "5"
    },
    "offers": [
      {
        "@type": "Offer",
        "name": "Launches",
        "price": "0",
        "priceCurrency": "USD",
        "description": "Free daily feed of what's launching and what's missing in every product."
      },
      {
        "@type": "Offer",
        "name": "Dig",
        "description": "Full market analysis: competitors, pain points, gaps, verdict. Scans 70+ live sources in 5 minutes."
      },
      {
        "@type": "Offer",
        "name": "Stack",
        "description": "Phased build plan from 700+ tools, filtered for your idea, budget, and technical level."
      }
    ],
    "creator": {
      "@type": "Organization",
      "name": "Unbuilt",
      "url": "https://unbuilt.me"
    },
    "keywords": "vibe coding, app idea validation, market research, indie hacker, no-code, saas validation, find market gap, what to build, vibecoder tools"
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Unbuilt",
    "url": "https://unbuilt.me",
    "description": "The home base for the vibecoding generation. Market intelligence for vibe coders, indie hackers, and no-code founders.",
    "foundingDate": "2026",
    "sameAs": [
      "https://x.com/Unbuilt_me"
    ]
  }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Preconnect to Clerk — saves 100-300ms on auth requests */}
        <link rel="preconnect" href="https://clerk.unbuilt.me" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://www.clarity.ms" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Figtree:wght@300;400;500;600&display=swap" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <noscript>
          <img height="1" width="1" style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=2766426413706285&ev=PageView&noscript=1"
          />
          <h1>Unbuilt — The home base for the vibecoding generation</h1>
          <p>Find what to build, validate if it's worth it, and get the exact tools to ship. Launches shows every new app daily with AI analysis (free). Dig analyzes any idea against 70+ sources. Stack recommends from 700+ tools. Browse 2,400+ app idea analyses at unbuilt.me/ideas.</p>
        </noscript>
        <ClerkThemeProvider>
          <ConsentGate>
              <AppTopNav />
              <MobileNav />
            <div className="app-content-wrapper" style={{ paddingTop: "72px" }}>
              {children}
            </div>
            <LegalFooter />
            
            <CookieConsent />
          </ConsentGate>
                      <ConversionTracker />
        </ClerkThemeProvider>
        {/* Facebook Pixel — afterInteractive: loads right after hydration so conversions are tracked */}
        <Script id="fb-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','2766426413706285');fbq('track','PageView');`}</Script>
        {/* Clarity — lazyOnload: heatmap only, no conversion impact */}
        <Script id="ms-clarity" strategy="lazyOnload">{`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","wcichozutv");`}</Script>
      </body>
      <GoogleAnalytics gaId="G-QPCR0DP98G" />
    </html>
  );
}
