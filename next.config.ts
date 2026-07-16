import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // three.js ships untranspiled ESM in places; let Next handle it.
  transpilePackages: ["three"],
  eslint: {
    // Design build — lint runs locally, never blocks production builds.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
