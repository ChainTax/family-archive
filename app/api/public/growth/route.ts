import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/public/growth
// - 비로그인: PUBLIC 기록만
// - 로그인: 모든 기록 (PUBLIC + UNLISTED + PRIVATE)
export async function GET() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  const records = await prisma.growthRecord.findMany({
    where: isLoggedIn ? undefined : { visibility: "PUBLIC" },
    orderBy: { date: "asc" },
    select: {
      id: true,
      date: true,
      height: true,
      weight: true,
      label: true,
    },
  });

  return Response.json(records);
}
