import type { NextConfig } from "next";
import { MODEL_ORIGIN } from "./src/lib/mediapipe/config";

const isDev = process.env.NODE_ENV === "development";

// "Without nonces" model from the Next.js CSP guide: the App Router inlines its
// bootstrap scripts, and nonces would make every route dynamic (see docs/adr).
// 'wasm-unsafe-eval' lets MediaPipe compile its self-hosted WebAssembly; the
// model file is the only cross-origin request the page makes.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  `connect-src 'self' ${MODEL_ORIGIN}`,
  "worker-src 'self' blob:",
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    // Always defined so the bundler inlines it and drops the e2e stub branch from
    // normal builds (an undefined NEXT_PUBLIC_* variable is not inlined).
    NEXT_PUBLIC_E2E_STUBS: process.env.NEXT_PUBLIC_E2E_STUBS === "1" ? "1" : "0",
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Versioned by the @mediapipe/tasks-vision release in the path.
        source: "/mediapipe/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
