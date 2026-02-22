// Prisma 7 config — Next.js 타입 체크 대상에서 제외됨 (tsconfig exclude)
// migrate 어댑터는 lib/prisma.ts에서 PrismaClient 생성 시 주입됩니다.
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
});
