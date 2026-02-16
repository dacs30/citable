import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core", "cheerio"],
  experimental: {
    // Allows background work in route handlers
  },
};

export default nextConfig;
