import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "VIEWER") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  await prisma.guestbookEntry.update({
    where: { id },
    data: { approved: body.approved },
  });

  try {
    await createAuditLog({
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "GuestbookEntry",
      entityId: id,
    });
  } catch {}

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
  await prisma.guestbookEntry.delete({ where: { id } });

  try {
    await createAuditLog({
      actorId: session.user.id,
      action: "DELETE",
      entityType: "GuestbookEntry",
      entityId: id,
    });
  } catch {}

  return Response.json({ ok: true });
}
