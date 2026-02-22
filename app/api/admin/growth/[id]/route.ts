import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";

// ─── PATCH /api/admin/growth/[id] ───────────────────────────
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "VIEWER") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  let body: {
    date?: string;
    height?: number | null;
    weight?: number | null;
    label?: string;
    visibility?: Visibility;
  };

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "요청 파싱 실패" }, { status: 400 });
  }

  const { date, height, weight, label, visibility } = body;

  const record = await prisma.growthRecord.update({
    where: { id },
    data: {
      ...(date !== undefined && { date: new Date(date) }),
      ...(height !== undefined && { height }),
      ...(weight !== undefined && { weight }),
      ...(label !== undefined && { label: label?.trim() || null }),
      ...(visibility !== undefined && { visibility }),
    },
  });

  try {
    await createAuditLog({
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "GrowthRecord",
      entityId: record.id,
    });
  } catch {}

  return Response.json(record);
}

// ─── DELETE /api/admin/growth/[id] ──────────────────────────
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "VIEWER") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.growthRecord.delete({ where: { id } });

  try {
    await createAuditLog({
      actorId: session.user.id,
      action: "DELETE",
      entityType: "GrowthRecord",
      entityId: id,
    });
  } catch {}

  return new Response(null, { status: 204 });
}
