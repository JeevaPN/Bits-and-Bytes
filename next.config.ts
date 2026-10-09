import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/people", destination: "/neighbourhood", permanent: true },
      { source: "/people/report", destination: "/neighbourhood/report", permanent: true },
      { source: "/groups", destination: "/community-partners", permanent: true },
      { source: "/groups/dashboard", destination: "/community-partners/dashboard", permanent: true },
      { source: "/groups/dashboard/tasks", destination: "/community-partners/dashboard/tasks", permanent: true },
      { source: "/groups/:slug", destination: "/community-partners/:slug", permanent: true },
    ];
  },
};
export default nextConfig;
