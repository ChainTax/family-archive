// prisma/seed.ts — 로컬 .env.local 우선 로드
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@family.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "changeme123!";

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL 환경변수가 설정되지 않았습니다.");
  }

  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      password: hash,
      name: "관리자",
      role: "OWNER",
    },
    update: {
      password: hash,
      role: "OWNER",
    },
  });

  console.log(`✓ 관리자 계정 준비: ${user.email} (${user.role})`);
}

main()
  .catch((e) => {
    console.error("시드 실패:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
