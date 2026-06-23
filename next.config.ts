import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Disable in-memory ISR/data-cache LRU; spill to filesystem instead.
  // Mitigates Next 16.x sticky-heap fetch leak (vercel/next.js#88603, #85914).
  cacheMaxMemorySize: 0,
  images: {
    remotePatterns: [{ hostname: "cdn.brawlify.com" }],
  },
};

export default nextConfig;
