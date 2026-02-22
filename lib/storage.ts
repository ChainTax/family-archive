import fs from "fs/promises";
import path from "path";

export interface StorageAdapter {
  /**
   * 파일을 저장하고 공개 URL을 반환합니다.
   * @param key   스토리지 경로 (예: "photos/abc123.webp")
   * @param data  파일 버퍼
   * @param mimeType  Content-Type
   */
  save(key: string, data: Buffer, mimeType: string): Promise<string>;

  /** 파일 삭제 (존재하지 않아도 에러 미발생) */
  delete(key: string): Promise<void>;
}

// ─── Local Storage (개발용) ───────────────────────────────────

const localAdapter: StorageAdapter = {
  async save(key, data) {
    const baseDir = path.resolve(
      process.cwd(),
      process.env.LOCAL_UPLOAD_DIR ?? "uploads"
    );
    const filePath = path.join(baseDir, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data);
    return `/api/files/${key}`;
  },

  async delete(key) {
    const baseDir = path.resolve(
      process.cwd(),
      process.env.LOCAL_UPLOAD_DIR ?? "uploads"
    );
    await fs.unlink(path.join(baseDir, key)).catch(() => {});
  },
};

// ─── S3 / Cloudflare R2 Storage ──────────────────────────────
// @aws-sdk/client-s3는 동적 import → STORAGE_PROVIDER=local일 때 번들 미포함

const s3Adapter: StorageAdapter = {
  async save(key, data, mimeType) {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = makeS3Client(S3Client);
    const bucket = process.env.STORAGE_BUCKET ?? "family-archive";

    await client.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: data, ContentType: mimeType })
    );

    const publicUrl = process.env.STORAGE_PUBLIC_URL ?? "";
    return `${publicUrl}/${key}`;
  },

  async delete(key) {
    const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = makeS3Client(S3Client);
    const bucket = process.env.STORAGE_BUCKET ?? "family-archive";

    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  },
};

function makeS3Client(
  S3Client: (typeof import("@aws-sdk/client-s3"))["S3Client"]
) {
  return new S3Client({
    region: process.env.STORAGE_REGION ?? "auto",
    endpoint: process.env.STORAGE_ENDPOINT,
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY!,
      secretAccessKey: process.env.STORAGE_SECRET_KEY!,
    },
  });
}

// ─── Factory ──────────────────────────────────────────────────

const provider = process.env.STORAGE_PROVIDER ?? "local";

export const storage: StorageAdapter =
  provider === "s3" || provider === "r2" ? s3Adapter : localAdapter;
