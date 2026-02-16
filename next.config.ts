import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright", "cheerio"],
  experimental: {
    // Allows background work in route handlers
  },
};

export default nextConfig;
