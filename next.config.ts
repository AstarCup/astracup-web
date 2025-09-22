import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["rosu-pp-js"],
  turbopack: {},
};

export default nextConfig;
