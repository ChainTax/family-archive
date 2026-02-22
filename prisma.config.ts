import { defineConfig } from "prisma/config";
import { config } from "dotenv";

// Prisma CLI는 .env.local을 자동으로 읽지 않으므로 수동 로드
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
