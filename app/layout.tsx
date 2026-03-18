import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ClerkThemeProvider from "./components/ClerkThemeProvider";
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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    var theme = localStorage.getItem('theme');
    var dark = theme ? theme === 'dark' : true;
    if (!dark) document.documentElement.classList.add('light');
  } catch(e) {}
})();
`,
          }}
        />
      </head>
      <body>
        <ClerkThemeProvider>
          <GlobalHeader />
          {children}
          <CookieConsent />
        </ClerkThemeProvider>
      </body>
    </html>
  );
}
