"use client";

/**
 * ProUpgradeReveal — the single, shared upgrade prompt for free users.
 *
 * Used by:
 *   - app/launches/page.tsx (Product Hunt grid + App Store list)
 *   - app/components/ProBlurGate.tsx (Startup Ideas)
 *
 * Design intent (per founder feedback): "landing-page gibi sonradan ekrana
 * gelen renkli, teşvik eden, eğlendiren — şaşırt beni." So this component
 * deliberately leans festive — animated mesh-gradient backdrop, a confetti
 * burst on first reveal, a live "just upgraded" ticker, and dual CTAs.
 *
 * It is positioned at the SEAM where the blurred locked content fades into
 * the page. The parent must give us a wrapper that is both:
 *   - the visual end of the masked/locked content (so we sit on top of the
 *     last visible blur), and
 *   - a positioning context (position:relative).
 * We render absolutely inside that wrapper with bottom: 0 so we always
 * land where the fade ends — independent of how many cards are below us.
 *
 * Free for the parent to control the wrapper height; we reserve enough room
 * via `minHeight` on our outer element so the mask fade has visual room to
 * breathe.
 */

import { useEffect, useRef, useState } from "react";

// Plausible-feeling builder names (no real users — this is social proof
// theatre, not fake claims). We rotate through them on a slow timer so the
// ticker feels alive without ever lying about a specific person.
const TICKER_NAMES = [
  "Maya", "Theo", "Ines", "Kenji", "Ravi", "Lena", "Omar", "Yui",
  "Diego", "Aanya", "Soren", "Mei", "Felix", "Zara", "Nico", "Priya",
];
const TICKER_VERBS = [
  "just unlocked the full feed",
  "just upgraded",
  "is exploring 8000+ launches",
  "joined Pro",
];

function pick<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

interface Props {
  /** "+N more launches" → the N */
  hiddenCount: number;
  /** What's hidden, in plain language: "launches", "ideas", "apps" */
  noun?: string;
  /** Sub-line beneath the headline */
  description?: string;
  /** Where Upgrade button goes */
  href?: string;
}

export default function ProUpgradeReveal({
  hiddenCount,
  noun = "launches",
  description = "Get the full daily feed, fresh every 10 minutes.",
  href = "/pricing",
}: Props) {
  // --- Confetti: fire once, the first time this element actually scrolls
  // into view. Using IntersectionObserver instead of mount means the burst
  // syncs with the user actually arriving at the seam — feels earned, not
  // jumpy on page load.
  const rootRef = useRef<HTMLDivElement>(null);
  const [hasFired, setHasFired] = useState(false);
  useEffect(() => {
    if (!rootRef.current || hasFired) return;
    const el = rootRef.current;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasFired(true);
          obs.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasFired]);

  // --- Live ticker: cycle a name every 4 seconds. Three names visible at
  // once, slid up like a slot reel.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 4200);
    return () => clearInterval(t);
  }, []);
  const names = pick(TICKER_NAMES, 3);
  const verbs = pick(TICKER_VERBS, 3);
  const visibleName = names[tick % names.length];
  const visibleVerb = verbs[tick % verbs.length];
  const minutesAgo = ((tick * 3) % 12) + 1;

  return (
    <div
      ref={rootRef}
      style={{
        // Sits on the seam between the fading-out locked content above and
        // the rest of the page below. The parent must mark this position
        // (typically by placing us right after the masked grid).
        position: "relative",
        marginTop: 24,
        marginBottom: 24,
        borderRadius: 20,
        overflow: "hidden",
        // The card itself sits on a tinted gradient surface; everything
        // inside is layered on top with explicit z-index so the orb and
        // confetti can live in the background without bleeding out of the
        // rounded corners.
        isolation: "isolate",
        background:
          "linear-gradient(135deg, rgba(124,111,255,0.10) 0%, rgba(8,145,178,0.08) 50%, rgba(124,111,255,0.06) 100%)",
        border: "1px solid rgba(124,111,255,0.18)",
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.6) inset, 0 12px 32px rgba(124,111,255,0.10)",
      }}
    >
      {/* Animated breathing orb in the back */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(60% 80% at 20% 20%, rgba(124,111,255,0.35) 0%, transparent 60%), radial-gradient(50% 70% at 90% 80%, rgba(8,145,178,0.30) 0%, transparent 60%)",
          animation: "pur-orb 12s ease-in-out infinite alternate",
        }}
      />

      {/* Confetti burst — purely decorative, runs once when scrolled into view */}
      {hasFired && <ConfettiBurst />}

      {/* Foreground content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          padding: "32px 28px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 12,
        }}
      >
        {/* Tilted big number badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "baseline",
            gap: 8,
            padding: "10px 18px 12px",
            borderRadius: 14,
            background: "rgba(255,255,255,0.55)",
            border: "1px solid rgba(124,111,255,0.20)",
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.8) inset, 0 6px 20px rgba(124,111,255,0.12)",
            transform: "rotate(-1.2deg)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          <span
            style={{
              fontSize: "2.5rem",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color: "var(--clr-text)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            +{hiddenCount.toLocaleString()}
          </span>
          <span
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--clr-text-3)",
              letterSpacing: "0.01em",
            }}
          >
            more {noun} waiting
          </span>
        </div>

        <p
          style={{
            margin: 0,
            maxWidth: 380,
            fontSize: "0.875rem",
            lineHeight: 1.5,
            color: "var(--clr-text-2)",
          }}
        >
          {description}
        </p>

        {/* Dual CTAs */}
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: 4,
          }}
        >
          <a
            href={href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "11px 22px",
              borderRadius: 10,
              background:
                "linear-gradient(135deg, var(--clr-primary) 0%, var(--clr-accent) 100%)",
              color: "#fff",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 700,
              letterSpacing: "-0.01em",
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.25) inset, 0 6px 20px rgba(124,111,255,0.30)",
              transition:
                "transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow =
                "0 1px 0 rgba(255,255,255,0.25) inset, 0 8px 24px rgba(124,111,255,0.40)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow =
                "0 1px 0 rgba(255,255,255,0.25) inset, 0 6px 20px rgba(124,111,255,0.30)";
            }}
          >
            <SparkIcon />
            Unlock everything
          </a>
          <a
            href={href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "11px 14px",
              borderRadius: 10,
              color: "var(--clr-text-2)",
              textDecoration: "none",
              fontSize: "0.8125rem",
              fontWeight: 600,
              transition: "color 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = "var(--clr-text)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = "var(--clr-text-2)";
            }}
          >
            See what&apos;s inside <span aria-hidden>→</span>
          </a>
        </div>

        {/* Live ticker */}
        <div
          style={{
            marginTop: 10,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: "0.6875rem",
            color: "var(--clr-text-4)",
            fontWeight: 500,
          }}
        >
          <span
            aria-hidden
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#22c55e",
              boxShadow: "0 0 0 3px rgba(34,197,94,0.18)",
              animation: "pur-pulse 1.6s ease-in-out infinite",
              flexShrink: 0,
            }}
          />
          <span
            key={tick}
            style={{
              animation: "pur-fade 0.6s ease",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 320,
            }}
          >
            <strong style={{ color: "var(--clr-text-3)", fontWeight: 600 }}>
              {visibleName}
            </strong>{" "}
            {visibleVerb} · {minutesAgo}m ago
          </span>
        </div>
      </div>

      {/* Inline keyframes — easier than maintaining a global stylesheet just
          for one component. */}
      <style>{`
        @keyframes pur-orb {
          0%   { transform: translate3d(0,0,0) scale(1); opacity: 1; }
          50%  { transform: translate3d(2%,-1%,0) scale(1.05); opacity: 0.9; }
          100% { transform: translate3d(-1%,2%,0) scale(0.98); opacity: 1; }
        }
        @keyframes pur-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.4); opacity: 0.6; }
        }
        @keyframes pur-fade {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes pur-confetti-fall {
          0%   { transform: translate3d(0, -20px, 0) rotate(0deg); opacity: 0; }
          10%  { opacity: 1; }
          100% { transform: translate3d(var(--pur-x), 240px, 0) rotate(var(--pur-r)); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function SparkIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </svg>
  );
}

/**
 * Confetti — pure DOM, no library. 24 tiny rotated rects fall once, then
 * we render nothing. Each piece gets a randomized x drift, rotation, and
 * delay via inline CSS variables consumed by `pur-confetti-fall`.
 */
function ConfettiBurst() {
  // Precompute pieces once on first render. Keeps positions stable across
  // re-renders and avoids hydration-mismatch: this component only renders
  // after IntersectionObserver fires, well after hydration.
  const pieces = useRef<
    Array<{ x: number; r: number; left: number; delay: number; color: string; size: number }>
  >([]);
  if (pieces.current.length === 0) {
    const palette = ["#7c6fff", "#0891b2", "#a78bfa", "#22d3ee", "#fbbf24", "#f472b6"];
    for (let i = 0; i < 28; i++) {
      pieces.current.push({
        x: (Math.random() - 0.5) * 320, // horizontal drift (px)
        r: (Math.random() - 0.5) * 720, // rotation (deg)
        left: Math.random() * 100, // start position (%)
        delay: Math.random() * 0.4, // stagger (s)
        color: palette[Math.floor(Math.random() * palette.length)],
        size: 6 + Math.random() * 6,
      });
    }
  }

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {pieces.current.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: 0,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            background: p.color,
            borderRadius: 1,
            // CSS variables consumed by the keyframe animation below.
            ["--pur-x" as string]: `${p.x}px`,
            ["--pur-r" as string]: `${p.r}deg`,
            animation: `pur-confetti-fall 1.6s cubic-bezier(0.2, 0.6, 0.4, 1) ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
