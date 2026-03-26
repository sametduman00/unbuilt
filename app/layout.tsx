import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import ClerkThemeProvider from "./components/ClerkThemeProvider";
import AppSidebar from "./components/AppSidebar";
import CookieConsent from "./components/CookieConsent";
import ConsentGate from "./components/ConsentGate";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Unbuilt — Build Smarter",
  description: "Enter any niche or app idea and instantly discover what competitors are missing. Find your edge before you build.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head />
      <body>
        <ClerkThemeProvider>
          <ConsentGate>
            <AppSidebar />
            <div style={{ marginLeft: 220 }}>
              <div style={{position:"fixed",top:0,left:0,right:0,zIndex:9999,background:"#000",color:"#fff",textAlign:"center",padding:"8px",fontSize:"14px",fontFamily:"monospace",fontWeight:"bold",letterSpacing:"0.05em"}}>unbuilt-security-verification: 27-march-2026-chatgpt</div><div style={{paddingTop:"40px"}}>{children}</div>
            </div>
            <CookieConsent />
          </ConsentGate>
        </ClerkThemeProvider>
      </body>
      <GoogleAnalytics gaId="G-QPCR0DP98G" />
    </html>
  );
}
