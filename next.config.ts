import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Hostinger Node.js deployment — bundles all dependencies into .next/standalone
  output: "standalone",

  // Performance: compress responses
  compress: true,

  // Performance: image optimisation
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Prevent Turbopack bundling native-only packages that should stay external
  serverExternalPackages: [
    "@prisma/client",
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner",
    "bcryptjs",
    "nodemailer",
    "officeparser",
  ],

  // Security + performance headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Cache static assets aggressively (filenames are content-hashed → safe forever)
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Same for top-level public files with hashed/versioned extensions
        source: "/(.*)\\.(woff2|woff|ttf|ico|png|jpg|jpeg|svg|webp|avif)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // HTML pages: never let an upstream CDN serve a stale shell that
        // references old JS chunk hashes after a deploy. Browsers may
        // revalidate, but proxies must not store.
        source: "/((?!_next/static|_next/image|api/).*)",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" },
        ],
      },
    ];
  },

  // Performance: enable React strict mode
  reactStrictMode: true,

  // Powered-by header removal
  poweredByHeader: false,

  // Strip console.* from production bundles to keep the event loop free of
  // synchronous log writes on Hostinger's overlayfs. Errors are kept so we
  // still get diagnostics for genuine failures.
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },

  // Tree-shake big libraries so only the icons / motion components actually
  // imported land in the client bundle. Cuts ~30-60 KiB on public routes.
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-navigation-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-accordion",
    ],
  },
};

export default nextConfig;
