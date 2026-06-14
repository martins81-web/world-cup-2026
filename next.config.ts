import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media.api-sports.io" },
      { protocol: "https", hostname: "www.thesportsdb.com" },
      { protocol: "https", hostname: "www.themealdb.com" }
    ]
  }
};

export default nextConfig;
