import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Turbopack(ESM)과 충돌하는 CJS 패키지를 번들링 대상에서 제외하고 Node.js native require로 로드
  serverExternalPackages: ['jsonwebtoken'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'd2r4v5cp38dlsf.cloudfront.net' }, // S3 미디어
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google OAuth 프로필
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
