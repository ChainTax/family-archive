import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp, bcryptjs 등 네이티브 모듈은 번들에 포함하지 않고 node_modules에서 직접 로드
  serverExternalPackages: ["sharp", "bcryptjs"],

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [],
    // 로컬 스토리지 이미지 최적화 비활성화 (파일시스템 서빙)
    unoptimized: process.env.STORAGE_PROVIDER === "local",
  },

  // Vercel 250MB 제한 대응: 불필요한 Prisma 플랫폼 바이너리 및 빌드 툴 제외
  outputFileTracingExcludes: {
    "*": [
      "node_modules/.prisma/client/libquery_engine-darwin*",
      "node_modules/.prisma/client/libquery_engine-windows*",
      "node_modules/.prisma/client/libquery_engine-debian*",
      "node_modules/prisma/libquery_engine-darwin*",
      "node_modules/prisma/libquery_engine-windows*",
      "node_modules/prisma/libquery_engine-debian*",
      "node_modules/@swc/core*",
      "node_modules/esbuild*",
      "node_modules/webpack*",
      "node_modules/rollup*",
      "node_modules/terser*",
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // 정적 미디어 파일 캐시 (1년)
        source: "/api/files/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
