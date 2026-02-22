import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "VIEWER") return Response.json({ error: "Forbidden" }, { status: 403 });

  const places = await prisma.place.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      lat: true,
      lng: true,
      visibility: true,
      createdAt: true,
      linkedPosts: { select: { id: true, title: true, slug: true } },
      linkedAlbums: { select: { id: true, title: true, slug: true } },
    },
  });

  return Response.json(places);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "VIEWER") return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, lat, lng, visibility = "PUBLIC", postIds = [], albumIds = [] } = body;

  if (!name?.trim()) return Response.json({ error: "이름을 입력하세요" }, { status: 400 });
  if (typeof lat !== "number" || typeof lng !== "number")
    return Response.json({ error: "위치를 선택하세요" }, { status: 400 });

  const place = await prisma.place.create({
    data: {
      name: name.trim(),
      lat,
      lng,
      visibility,
      linkedPosts:
        postIds.length > 0
          ? { connect: postIds.map((id: string) => ({ id })) }
          : undefined,
      linkedAlbums:
        albumIds.length > 0
          ? { connect: albumIds.map((id: string) => ({ id })) }
          : undefined,
    },
  });

  try {
    await createAuditLog({
      actorId: session.user.id,
      action: "CREATE",
      entityType: "Place",
      entityId: place.id,
    });
  } catch {}

  return Response.json({ id: place.id }, { status: 201 });
}
