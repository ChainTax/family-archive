import { auth } from "@/auth";
import { processImage } from "@/lib/media";
import { storage } from "@/lib/storage";

// 최대 업로드 크기: 50 MB
const MAX_BYTES = 50 * 1024 * 1024;

export async function POST(req: Request) {
  // ─── 인증 / 권한 확인 ────────────────────────────────────
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role === "VIEWER") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // ─── 요청 파싱 ──────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: "요청 파싱 실패" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "파일이 없습니다 (field: file)" }, { status: 400 });
  }

  // ─── 유효성 검사 ────────────────────────────────────────
  if (!file.type.startsWith("image/")) {
    return Response.json(
      { error: "이미지 파일만 업로드할 수 있습니다" },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: "파일 크기는 50 MB 이하여야 합니다" },
      { status: 413 }
    );
  }

  // ─── Sharp 처리 (EXIF 제거 + 리사이즈 + WebP) ────────────
  const buffer = Buffer.from(await file.arrayBuffer());

  let processed: Awaited<ReturnType<typeof processImage>>;
  try {
    processed = await processImage(buffer);
  } catch {
    return Response.json(
      { error: "이미지 처리 실패 (지원하지 않는 형식일 수 있습니다)" },
      { status: 422 }
    );
  }

  // ─── 스토리지 저장 ──────────────────────────────────────
  const id = crypto.randomUUID();
  const [url, thumbUrl] = await Promise.all([
    storage.save(`photos/${id}.webp`, processed.web, "image/webp"),
    storage.save(`photos/${id}_thumb.webp`, processed.thumb, "image/webp"),
  ]);

  return Response.json({
    url,
    thumbUrl,
    width: processed.width,
    height: processed.height,
  });
}
