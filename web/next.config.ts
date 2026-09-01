import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@masayume/core", "@masayume/markets"],
};

export default nextConfig;
