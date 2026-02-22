import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";

// ─── GET /api/admin/growth ────────────────────────────────────
export async function GET() {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const records = await prisma.growthRecord.findMany({
    orderBy: { date: "asc" },
  });

  return Response.json(records);
}

// ─── POST /api/admin/growth ───────────────────────────────────
interface CreateBody {
  date: string;
  height?: number | null;
  weight?: number | null;
  label?: string;
  visibility?: Visibility;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "VIEWER") return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: CreateBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "요청 파싱 실패" }, { status: 400 });
  }

  const { date, height, weight, label, visibility = "PRIVATE" } = body;
  if (!date) return Response.json({ error: "날짜는 필수입니다" }, { status: 400 });
  if (height == null && weight == null)
    return Response.json({ error: "키 또는 몸무게 중 하나는 입력해야 합니다" }, { status: 400 });

  const record = await prisma.growthRecord.create({
    data: {
      date: new Date(date),
      height: height ?? null,
      weight: weight ?? null,
      label: label?.trim() || null,
      visibility,
    },
  });

  try {
    await createAuditLog({
      actorId: session.user.id,
      action: "CREATE",
      entityType: "GrowthRecord",
      entityId: record.id,
    });
  } catch {}

  return Response.json(record, { status: 201 });
}
