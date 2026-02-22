import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const places = await prisma.place.findMany({
      where: { visibility: "PUBLIC" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        lat: true,
        lng: true,
        // AC5: 연결된 PUBLIC 글/앨범만 노출
        linkedPosts: {
          where: { status: "PUBLISHED", visibility: "PUBLIC" },
          select: { id: true, title: true, slug: true },
        },
        linkedAlbums: {
          where: { visibility: "PUBLIC" },
          select: { id: true, title: true, slug: true },
        },
      },
    });

    return Response.json(places);
  } catch {
    return Response.json([]);
  }
}
