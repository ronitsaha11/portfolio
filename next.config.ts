import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Tree-shakes the barrel exports that would otherwise land whole in
    // the first-load chunk. anime.js ships one entry re-exporting every
    // module, so this is the difference between the timeline engine and
    // the entire library.
    optimizePackageImports: ["animejs", "@radix-ui/react-popover", "@react-three/drei"],
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

export default nextConfig;
