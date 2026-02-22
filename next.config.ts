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

  // Vercel 250MB 제한 대응: 런타임 불필요 파일 추적 제외
  outputFileTracingExcludes: {
    "*": [
      // ★ webpack 빌드 캐시 — 절대 런타임에 불필요 (~200MB+ 주범)
      ".next/cache/**",

      // @prisma/client/runtime — PostgreSQL 외 DB WASM 파일 (~56MB)
      "node_modules/@prisma/client/runtime/*mysql*",
      "node_modules/@prisma/client/runtime/*sqlite*",
      "node_modules/@prisma/client/runtime/*sqlserver*",
      "node_modules/@prisma/client/runtime/*cockroachdb*",

      // Prisma 엔진 바이너리 (~23MB)
      "node_modules/@prisma/engines/**",
      "node_modules/.prisma/client/libquery_engine*",
      "node_modules/prisma/libquery_engine*",

      // Prisma Studio GUI — 런타임 불필요 (~26MB)
      "node_modules/@prisma/studio-core/**",

      // Prisma CLI 전용 — 런타임 불필요
      "node_modules/@prisma/fetch-engine/**",
      "node_modules/@prisma/get-platform/**",
      "node_modules/prisma/build/**",

      // 플랫폼별 네이티브 바이너리 (macOS/Windows 등 비Linux)
      "node_modules/@img/sharp-libvips-darwin*/**",
      "node_modules/@img/sharp-darwin*/**",
      "node_modules/@img/sharp-win32*/**",

      // 빌드 툴 — 런타임 불필요
      "node_modules/@swc/core*",
      "node_modules/@esbuild/**",
      "node_modules/esbuild/**",
      "node_modules/webpack/**",
      "node_modules/rollup/**",
      "node_modules/terser/**",
      "node_modules/typescript/**",
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
