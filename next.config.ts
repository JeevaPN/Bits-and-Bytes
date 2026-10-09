import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Avoid concurrent generated-directory creation races on Windows builds.
  experimental: { webpackBuildWorker: false },
};

export default nextConfig;
