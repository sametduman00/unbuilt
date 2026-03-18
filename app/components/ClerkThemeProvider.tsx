"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { useEffect, useState } from "react";

const darkAppearance = {
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
    socialButtonsBlockButton__github: { background: "#24292e", border: "1px solid #444", color: "#fff" },
    socialButtonsBlockButtonText__github: { color: "#fff" },
    socialButtonsProviderIcon__github: { filter: "invert(1)" },
    socialButtonsBlockButton__google: { background: "#fff", border: "1px solid #dadce0", color: "#3c4043", boxShadow: "none", backgroundImage: "none", filter: "none" },
    socialButtonsBlockButtonText__google: { color: "#3c4043" },
    socialButtonsProviderIcon__google: { filter: "none" },
    userButtonPopoverCard: { background: "#111", border: "1px solid #2a2a2a" },
    userButtonPopoverActionButton: { color: "#fff" },
    userButtonPopoverActionButtonText: { color: "#fff" },
    userButtonPopoverFooter: { display: "none" },
    userButtonPopoverActionButton__manageAccount: { display: "none" },
  },
};

const lightAppearance = {
  variables: {
    colorPrimary: "#111",
    colorBackground: "#fff",
    colorInputBackground: "#f5f5f5",
    colorText: "#111",
    colorTextSecondary: "#555",
    borderRadius: "0.75rem",
  },
  elements: {
    card: { background: "#fff", border: "1px solid #e5e5e5", boxShadow: "0 8px 40px rgba(0,0,0,0.1)" },
    formButtonPrimary: { background: "#111", color: "#fff" },
    headerTitle: { color: "#111" },
    headerSubtitle: { color: "#555" },
    footer: { display: "none" },
    socialButtonsBlockButton__github: { background: "#f6f8fa", border: "1px solid #d0d7de", color: "#24292f" },
    socialButtonsBlockButtonText__github: { color: "#24292f" },
    socialButtonsProviderIcon__github: { filter: "none" },
    socialButtonsBlockButton__google: { background: "#fff", border: "1px solid #dadce0", color: "#3c4043", boxShadow: "none", backgroundImage: "none", filter: "none" },
    socialButtonsBlockButtonText__google: { color: "#3c4043" },
    socialButtonsProviderIcon__google: { filter: "none" },
    userButtonPopoverCard: { background: "#fff", border: "1px solid #e5e5e5" },
    userButtonPopoverActionButton: { color: "#111" },
    userButtonPopoverActionButtonText: { color: "#111" },
    userButtonPopoverFooter: { display: "none" },
    userButtonPopoverActionButton__manageAccount: { display: "none" },
  },
};

export default function ClerkThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Read initial theme from localStorage
    const saved = localStorage.getItem("theme");
    const dark = saved ? saved === "dark" : true;
    setIsDark(dark);

    // Watch for theme changes via html class mutations
    const observer = new MutationObserver(() => {
      setIsDark(!document.documentElement.classList.contains("light"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <ClerkProvider appearance={isDark ? darkAppearance : lightAppearance}>
      {children}
    </ClerkProvider>
  );
}
