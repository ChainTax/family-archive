import sharp from "sharp";

export interface ProcessedImage {
  /** EXIF 제거 + 리사이즈 + WebP (공개 경로 노출용 — AC4) */
  web: Buffer;
  /** 썸네일 WebP */
  thumb: Buffer;
  /** web 이미지 최종 너비 */
  width: number;
  /** web 이미지 최종 높이 */
  height: number;
}

/**
 * 이미지 처리 파이프라인
 * - EXIF 방향 정보 반영 후 모든 메타데이터 제거 (GPS 포함 — AC4)
 * - 최대 크기로 리사이즈 (withoutEnlargement: 원본보다 크게 만들지 않음)
 * - WebP 변환
 */
export async function processImage(input: Buffer): Promise<ProcessedImage> {
  const maxWidth = parseInt(process.env.IMAGE_MAX_WIDTH ?? "2048");
  const thumbWidth = parseInt(process.env.IMAGE_THUMB_WIDTH ?? "480");
  const quality = parseInt(process.env.IMAGE_QUALITY ?? "85");

  // .rotate(): EXIF orientation으로 자동 회전, 이후 EXIF 제거
  // .webp({ quality }): 기본적으로 메타데이터 미포함 (withMetadata() 미호출)
  const [webResult, thumbData] = await Promise.all([
    sharp(input)
      .rotate()
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer({ resolveWithObject: true }),

    sharp(input)
      .rotate()
      .resize({ width: thumbWidth, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer(),
  ]);

  return {
    web: webResult.data,
    thumb: thumbData,
    width: webResult.info.width,
    height: webResult.info.height,
  };
}
