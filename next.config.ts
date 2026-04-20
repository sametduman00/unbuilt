import type { NextConfig } from "next";

const CLERK = ["https://clerk.unbuilt.me","https://*.clerk.accounts.dev","https://api.clerk.com","https://accounts.google.com"];
const PADDLE = ["https://cdn.paddle.com","https://js.paddle.com","https://checkout.paddle.com","https://vendor.paddle.com","https://buy.paddle.com","https://*.paddle.com","https://paddle.com"];
const ANALYTICS = ["https://www.googletagmanager.com","https://www.google-analytics.com","https://analytics.google.com"];
const META = ["https://connect.facebook.net","https://www.facebook.com","https://*.facebook.com","https://*.facebook.net"];
const CLARITY = ["https://www.clarity.ms","https://*.clarity.ms","https://c.bing.com"];
const PROFITWELL = ["https://public.profitwell.com","https://api.profitwell.com"];
const CDN = ["https://cdnjs.cloudflare.com"];
const MEDIA = ["https://ph-files.imgix.net","https://*.mzstatic.com","https://img.youtube.com"];

function buildCSP() {
  const d = {
    "default-src": ["'none'"],
    "script-src": ["'self'", "'unsafe-inline'",...CLERK,...PADDLE,...ANALYTICS,...PROFITWELL,...CDN,...META,...CLARITY],
    "style-src": ["'self'","'unsafe-inline'","https://cdn.paddle.com","https://clerk.unbuilt.me"],
    "img-src": ["'self'","data:","blob:",...MEDIA,...META,...CLARITY,"https://www.googletagmanager.com","https://clerk.unbuilt.me","https://*.clerk.accounts.dev","https://img.clerk.com"],
    "font-src": ["'self'","data:","https://fonts.gstatic.com"],
    "connect-src": ["'self'","https://www.unbuilt.me",...CLERK,...PADDLE,...ANALYTICS,...PROFITWELL,...META,...CLARITY,"https://region1.google-analytics.com"],
    "frame-src": ["https://checkout.paddle.com","https://*.paddle.com","https://accounts.google.com"],
    "frame-ancestors": ["'none'"],
    "worker-src": ["'self'","blob:"],
    "form-action": ["'self'","https://checkout.paddle.com"],
    "manifest-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "upgrade-insecure-requests": [],
  };
  return Object.entries(d).map(([k,v]) => v.length > 0 ? k+" "+v.join(" ") : k).join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: buildCSP() },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "accelerometer=(),camera=(),geolocation=(),gyroscope=(),magnetometer=(),microphone=(),payment=(self),usb=(),interest-cohort=(),fullscreen=(self),display-capture=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ph-files.imgix.net" },
      { protocol: "https", hostname: "**.mzstatic.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "img.clerk.com" },
    ],
  },
  experimental: {
    // Tree-shake heavy package internals for smaller bundles
    optimizePackageImports: [
      "react-markdown",
      "remark-gfm",
      "@clerk/nextjs",
      "jspdf",
      "lucide-react",
    ],
  },
};

export default nextConfig;
