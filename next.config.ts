import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.appsheet.com",
      },
    ],
  },
  async rewrites() {
    return [
      { source: "/calls", destination: "/" },
      { source: "/email", destination: "/" },
    ];
  },
};

export default nextConfig;
