import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack(ESM)과 충돌하는 CJS 패키지를 번들링 대상에서 제외하고 Node.js native require로 로드
  serverExternalPackages: ['jsonwebtoken'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
