import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Required to generate the 'out' folder for Capacitor
  images: {
    unoptimized: true, // Required if your app uses Next.js <Image /> components
  },
  // Avoid concurrent generated-directory creation races on Windows builds.
  experimental: { webpackBuildWorker: false },
};

export default nextConfig;
