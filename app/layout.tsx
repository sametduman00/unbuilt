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

const clerkAppearance = {
  variables: {
    colorPrimary: "#fff",
    colorBackground: "#111",
    colorInputBackground: "#1a1a1a",
    colorText: "#fff",
    colorTextSecondary: "#999",
    borderRadius: "0.75rem",
  },
  elements: {
    card: { background: "#111", border: "1px solid #2a2a2a", boxShadow: "0 8px 40px rgba(0,0,0,0.7)" },
    formButtonPrimary: { background: "#fff", color: "#000" },
    headerTitle: { color: "#fff" },
    headerSubtitle: { color: "#999" },
    footer: { display: "none" },
    socialButtonsBlockButton__github: {
      background: "#24292e",
      border: "1px solid #444",
      color: "#fff",
    },
    socialButtonsBlockButtonText__github: { color: "#fff" },
    socialButtonsProviderIcon__github: { filter: "invert(1)" },
    socialButtonsBlockButton__google: {
      background: "#fff",
      border: "1px solid #dadce0",
      color: "#3c4043",
      boxShadow: "none",
      backgroundImage: "none",
      filter: "none",
    },
    socialButtonsBlockButtonText__google: { color: "#3c4043" },
    userButtonPopoverCard: { background: "#111", border: "1px solid #2a2a2a" },
    userButtonPopoverActionButton: { color: "#fff" },
    userButtonPopoverActionButtonText: { color: "#fff" },
    userButtonPopoverFooter: { display: "none" },
    userButtonPopoverActionButton__manageAccount: { display: "none" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
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
          <GlobalHeader />
          {children}
          <CookieConsent />
        </body>
      </html>
    </ClerkProvider>
  );
}
