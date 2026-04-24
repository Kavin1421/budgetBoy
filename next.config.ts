import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/user", destination: "/api/v1/user" },
      { source: "/api/analyze", destination: "/api/v1/analyze" },
      { source: "/api/telecom/plans", destination: "/api/v1/telecom/plans" },
    ];
  },
};

export default nextConfig;
