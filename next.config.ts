import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // 워크스페이스 루트 명시 (lockfile 경고 해결)
  outputFileTracingRoot: path.join(__dirname, "../../"),

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [],
    // 로컬 스토리지 이미지 최적화 비활성화 (파일시스템 서빙)
    unoptimized: process.env.STORAGE_PROVIDER === "local",
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
