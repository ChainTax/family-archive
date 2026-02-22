import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "VIEWER") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { type, title, date, notes, visibility } = body;

  const data: Record<string, unknown> = {};
  if (type !== undefined) data.type = type;
  if (title !== undefined) data.title = title.trim();
  if (date !== undefined) data.date = new Date(date);
  if (notes !== undefined) data.notes = notes?.trim() || null;
  if (visibility !== undefined) data.visibility = visibility;

  const milestone = await prisma.milestone.update({ where: { id }, data });

  try {
    await createAuditLog({
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "Milestone",
      entityId: milestone.id,
    });
  } catch {}

  revalidatePath("/");
  revalidatePath("/milestones");

  return Response.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "VIEWER") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.milestone.delete({ where: { id } });

  try {
    await createAuditLog({
      actorId: session.user.id,
      action: "DELETE",
      entityType: "Milestone",
      entityId: id,
    });
  } catch {}

  revalidatePath("/");
  revalidatePath("/milestones");

  return Response.json({ ok: true });
}
