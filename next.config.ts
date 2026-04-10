import type { NextConfig } from "next";

const springApiUrl =
  process.env.SPRING_API_URL?.replace(/\/$/, "") ??
  process.env.NEXT_PUBLIC_SPRING_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8080";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/spring/:path*",
        destination: `${springApiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
