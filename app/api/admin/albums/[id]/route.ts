import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";

// ─── GET /api/admin/albums/[id] ──────────────────────────────
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const album = await prisma.album.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { order: "asc" } },
      tags: { select: { id: true, name: true } },
    },
  });

  if (!album) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(album);
}

// ─── PATCH /api/admin/albums/[id] ───────────────────────────
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "VIEWER") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  let body: {
    title?: string;
    description?: string;
    dateStart?: string | null;
    dateEnd?: string | null;
    visibility?: Visibility;
    tags?: string[];
  };

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "요청 파싱 실패" }, { status: 400 });
  }

  const { title, description, dateStart, dateEnd, visibility, tags } = body;

  // 태그 동기화: 기존 태그 모두 disconnect 후 새로 connectOrCreate
  const tagOps = tags !== undefined
    ? {
        set: [],
        connectOrCreate: tags
          .map((t) => t.trim())
          .filter(Boolean)
          .map((name) => ({
            where: { name },
            create: { name },
          })),
      }
    : undefined;

  const album = await prisma.album.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description.trim() || null }),
      ...(dateStart !== undefined && { dateStart: dateStart ? new Date(dateStart) : null }),
      ...(dateEnd !== undefined && { dateEnd: dateEnd ? new Date(dateEnd) : null }),
      ...(visibility !== undefined && { visibility }),
      ...(tagOps !== undefined && { tags: tagOps }),
    },
  });

  try {
    await createAuditLog({
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "Album",
      entityId: album.id,
    });
  } catch {}

  revalidatePath("/");
  revalidatePath("/albums");
  revalidatePath(`/albums/${album.slug}`);

  return Response.json({ id: album.id });
}

// ─── DELETE /api/admin/albums/[id] ──────────────────────────
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "VIEWER") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  await prisma.album.delete({ where: { id } });

  try {
    await createAuditLog({
      actorId: session.user.id,
      action: "DELETE",
      entityType: "Album",
      entityId: id,
    });
  } catch {}

  revalidatePath("/");
  revalidatePath("/albums");

  return new Response(null, { status: 204 });
}
