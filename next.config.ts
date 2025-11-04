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
    minimumCacheTTL: 86400, // 1天 = 86400秒
    formats: ['image/svg'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // 启用静态资源缓存
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
