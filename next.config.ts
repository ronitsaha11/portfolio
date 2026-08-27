import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "mdx"],
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Tree-shakes motion's barrel export; without it the whole library
    // lands in the first-load chunk.
    optimizePackageImports: ["motion", "@radix-ui/react-popover"],
    // The stylesheet was the single largest render-blocking request.
    // Inlining removes that round trip before first paint entirely.
    inlineCss: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
