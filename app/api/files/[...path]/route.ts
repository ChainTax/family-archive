// 로컬 개발용 정적 파일 서빙
// STORAGE_PROVIDER=local 일 때만 동작, 운영(S3/R2)에서는 404 반환
import { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";

const MIME: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  if (process.env.STORAGE_PROVIDER !== "local") {
    return new Response("Not Found", { status: 404 });
  }

  const { path: parts } = await params;

  // 경로 순회 방지 (.., ~, 절대경로 제거)
  const safeParts = parts.map((p) => path.basename(p));
  const filePath = path.join(
    process.cwd(),
    process.env.LOCAL_UPLOAD_DIR ?? "uploads",
    ...safeParts
  );

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] ?? "application/octet-stream";

    return new Response(data, {
      headers: {
        "Content-Type": contentType,
        // 처리된 이미지는 불변 → 장기 캐싱
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}
