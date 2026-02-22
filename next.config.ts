import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 250MB 제한 대응:
  // @prisma/client, prisma 를 외부 패키지로 처리 → 람다 번들에서 제외
  // (엔진 바이너리 ~50-100MB가 번들에 포함되는 문제 해결)
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "@prisma/adapter-pg",
    "sharp",
    "bcryptjs",
  ],

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [],
    // 로컬 스토리지 이미지 최적화 비활성화 (파일시스템 서빙)
    unoptimized: process.env.STORAGE_PROVIDER === "local",
  },

  // 추가 안전망: 모든 플랫폼 Prisma 엔진 바이너리 + 빌드 툴 추적 제외
  outputFileTracingExcludes: {
    "*": [
      "node_modules/.prisma/client/libquery_engine*",
      "node_modules/@prisma/engines/**",
      "node_modules/prisma/libquery_engine*",
      "node_modules/sharp/**",
      "node_modules/@swc/core*",
      "node_modules/esbuild/**",
      "node_modules/webpack/**",
      "node_modules/rollup/**",
      "node_modules/terser/**",
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
