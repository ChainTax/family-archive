import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";

// ─── GET /api/admin/albums ────────────────────────────────────
export async function GET() {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "VIEWER") return Response.json({ error: "Forbidden" }, { status: 403 });

  const albums = await prisma.album.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { photos: true } } },
  });

  return Response.json({ albums });
}

// ─── POST /api/admin/albums ───────────────────────────────────
interface PhotoInput {
  url: string;
  thumbUrl: string;
  width: number;
  height: number;
  caption?: string;
}

interface CreateAlbumBody {
  title: string;
  slug: string;
  description?: string;
  dateStart?: string;
  dateEnd?: string;
  visibility?: Visibility;
  coverUrl?: string;
  photos?: PhotoInput[];
  tags?: string[];
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "VIEWER") return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: CreateAlbumBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "요청 파싱 실패" }, { status: 400 });
  }

  const { title, slug, description, dateStart, dateEnd, visibility, coverUrl, photos = [], tags = [] } = body;

  if (!title?.trim()) return Response.json({ error: "제목은 필수입니다" }, { status: 400 });
  if (!slug?.trim()) return Response.json({ error: "슬러그는 필수입니다" }, { status: 400 });
  if (photos.length > 50) return Response.json({ error: "사진은 최대 50장까지 업로드할 수 있습니다" }, { status: 400 });

  // 슬러그 중복 확인
  const existing = await prisma.album.findUnique({ where: { slug } });
  if (existing) return Response.json({ error: "이미 사용 중인 슬러그입니다" }, { status: 409 });

  const album = await prisma.album.create({
    data: {
      title: title.trim(),
      slug: slug.trim(),
      description: description?.trim() || null,
      dateStart: dateStart ? new Date(dateStart) : null,
      dateEnd: dateEnd ? new Date(dateEnd) : null,
      visibility: visibility ?? "PRIVATE",
      coverUrl: coverUrl || photos[0]?.thumbUrl || null,
      photos: {
        create: photos.map((p, i) => ({
          url: p.url,
          thumbUrl: p.thumbUrl,
          width: p.width,
          height: p.height,
          caption: p.caption?.trim() || null,
          order: i,
        })),
      },
      tags: {
        connectOrCreate: tags
          .map((t) => t.trim())
          .filter(Boolean)
          .map((name) => ({
            where: { name },
            create: { name },
          })),
      },
    },
  });

  try {
    await createAuditLog({
      actorId: session.user.id,
      action: "CREATE",
      entityType: "Album",
      entityId: album.id,
    });
  } catch {}

  return Response.json({ id: album.id, slug: album.slug }, { status: 201 });
}
