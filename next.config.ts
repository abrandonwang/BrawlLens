import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [{ hostname: "cdn.brawlify.com" }],
  },
};

export default nextConfig;
