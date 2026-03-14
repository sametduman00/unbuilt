"use client";

import { useState, useEffect } from "react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  function accept(level: "all" | "essential") {
    localStorage.setItem("cookie_consent", level);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: "#111",
      borderTop: "1px solid #222",
      padding: "1rem 1.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "1rem",
      flexWrap: "wrap",
      boxShadow: "0 -4px 24px rgba(0,0,0,0.5)",
    }}>
      <p style={{
        color: "#aaa",
        fontSize: 13,
        margin: 0,
        lineHeight: 1.5,
        maxWidth: 600,
      }}>
        We use cookies for authentication and to improve your experience.{" "}
        <a
          href="/legal/cookie-policy"
          style={{ color: "#888", textDecoration: "underline", textUnderlineOffset: 3 }}
        >
          Learn more
        </a>
      </p>
      <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
        <button
          onClick={() => accept("essential")}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 8,
            background: "transparent",
            border: "1px solid #333",
            color: "#999",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#555"; e.currentTarget.style.color = "#ccc"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.color = "#999"; }}
        >
          Essential Only
        </button>
        <button
          onClick={() => accept("all")}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 8,
            background: "#fff",
            border: "1px solid #fff",
            color: "#000",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        >
          Accept All
        </button>
      </div>
    </div>
  );
}
