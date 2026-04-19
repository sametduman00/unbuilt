"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function IslandNav() {
  const pathname = usePathname();

  const items = [
    {
      href: "/launches",
      label: "Launches",
      badge: "LIVE",
      badgeClass: "island-badge-live",
      colorClass: "island-launches",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" fill="currentColor" />
          <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.2" opacity=".4" />
          <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="0.8" opacity=".15" />
        </svg>
      ),
    },
    {
      href: "/?tab=dig",
      label: "Dig my idea",
      colorClass: "island-dig",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
          <line x1="16" y1="16" x2="21" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      href: "/?tab=stack",
      label: "Get my stack",
      colorClass: "island-stack",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="14" width="16" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
          <rect x="6" y="7" width="12" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none" opacity=".6" />
          <rect x="8" y="1" width="8" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none" opacity=".3" />
        </svg>
      ),
    },
    {
      href: "/ideas",
      label: "Startup ideas",
      badge: "NEW",
      badgeClass: "island-badge-new",
      colorClass: "island-ideas",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C8.69 2 6 4.69 6 8c0 2.22 1.21 4.15 3 5.19V15a1 1 0 001 1h4a1 1 0 001-1v-1.81c1.79-1.04 3-2.97 3-5.19 0-3.31-2.69-6-6-6z" stroke="currentColor" strokeWidth="1.3" fill="none" />
          <line x1="9" y1="18" x2="15" y2="18" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="10" y1="21" x2="14" y2="21" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="island-nav">
      {items.map((item) => {
        const isActive =
          item.href === "/launches"
            ? pathname === "/launches"
            : item.href === "/ideas"
            ? pathname.startsWith("/ideas")
            : false;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`island-btn ${item.colorClass} ${isActive ? "island-active" : ""}`}
          >
            <span className="island-icon">{item.icon}</span>
            {item.label}
            {item.badge && (
              <span className={`island-badge ${item.badgeClass}`}>{item.badge}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
