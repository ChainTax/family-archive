import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";
type PostStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED";

// ─── GET /api/admin/posts ─────────────────────────────────────
export async function GET() {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "VIEWER") return Response.json({ error: "Forbidden" }, { status: 403 });

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { tags: true },
  });

  return Response.json({ posts });
}

// ─── POST /api/admin/posts ────────────────────────────────────
interface CreatePostBody {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverUrl?: string;
  visibility?: Visibility;
  status?: PostStatus;
  scheduledAt?: string;
  series?: string;
  tags?: string[];
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "VIEWER") return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: CreatePostBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "요청 파싱 실패" }, { status: 400 });
  }

  const {
    title, slug, content, excerpt, coverUrl,
    visibility = "PRIVATE", status = "DRAFT",
    scheduledAt, series, tags = [],
  } = body;

  if (!title?.trim()) return Response.json({ error: "제목은 필수입니다" }, { status: 400 });
  if (!slug?.trim()) return Response.json({ error: "슬러그는 필수입니다" }, { status: 400 });

  const existing = await prisma.post.findUnique({ where: { slug } });
  if (existing) return Response.json({ error: "이미 사용 중인 슬러그입니다" }, { status: 409 });

  // 태그 upsert
  const tagConnections = await Promise.all(
    tags.map((name) =>
      prisma.tag.upsert({ where: { name }, create: { name }, update: {} })
    )
  );

  const post = await prisma.post.create({
    data: {
      title: title.trim(),
      slug: slug.trim(),
      content: content ?? "",
      excerpt: excerpt?.trim() || null,
      coverUrl: coverUrl || null,
      visibility,
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      series: series?.trim() || null,
      tags: { connect: tagConnections.map((t) => ({ id: t.id })) },
    },
  });

  await createAuditLog({
    actorId: session.user.id,
    action: "CREATE",
    entityType: "Post",
    entityId: post.id,
  });

  return Response.json({ id: post.id, slug: post.slug }, { status: 201 });
}
