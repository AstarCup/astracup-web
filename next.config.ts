import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["rosu-pp-js"],
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'a.ppy.sh',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.ppy.sh',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'osu.ppy.sh',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
