import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server-only packages that should not be bundled by Turbopack.
  serverExternalPackages: ["youtubei.js", "firebase-admin"],
  devIndicators: process.env.PLAYWRIGHT ? false : undefined,
};

export default nextConfig;
