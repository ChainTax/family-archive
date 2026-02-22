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
  const { name, lat, lng, visibility, postIds, albumIds } = body;

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name.trim();
  if (lat !== undefined) data.lat = lat;
  if (lng !== undefined) data.lng = lng;
  if (visibility !== undefined) data.visibility = visibility;
  if (postIds !== undefined)
    data.linkedPosts = { set: postIds.map((pid: string) => ({ id: pid })) };
  if (albumIds !== undefined)
    data.linkedAlbums = { set: albumIds.map((aid: string) => ({ id: aid })) };

  const place = await prisma.place.update({ where: { id }, data });

  try {
    await createAuditLog({
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "Place",
      entityId: place.id,
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
  await prisma.place.delete({ where: { id } });

  try {
    await createAuditLog({
      actorId: session.user.id,
      action: "DELETE",
      entityType: "Place",
      entityId: id,
    });
  } catch {}

  return Response.json({ ok: true });
}
