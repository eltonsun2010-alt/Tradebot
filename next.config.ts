import type { NextConfig } from "next";

// Static-export mode (GitHub Pages) is opt-in via env so local `npm run dev`
// and normal `npm run build` keep serving from the root as before.
const isStatic = process.env.BUILD_STATIC === "true";
// GitHub Pages serves a project repo under /<repo>; the workflow injects the
// real (case-correct) repo name so assets resolve. Empty for local/dev.
const basePath = process.env.PAGES_BASE_PATH || "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // three.js ships untranspiled ESM in places; let Next handle it.
  transpilePackages: ["three"],
  eslint: {
    // Design build — lint runs locally, never blocks production builds.
    ignoreDuringBuilds: true,
  },
  ...(isStatic
    ? {
        output: "export" as const,
        basePath,
        assetPrefix: basePath || undefined,
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
