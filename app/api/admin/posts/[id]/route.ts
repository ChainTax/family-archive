import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";
type PostStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED";

interface Ctx { params: Promise<{ id: string }> }

// ─── GET /api/admin/posts/[id] ────────────────────────────────
export async function GET(_req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "VIEWER") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: { tags: true },
  });
  if (!post) return Response.json({ error: "Not Found" }, { status: 404 });

  return Response.json({ post });
}

// ─── PATCH /api/admin/posts/[id] ─────────────────────────────
interface UpdatePostBody {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  coverUrl?: string;
  visibility?: Visibility;
  status?: PostStatus;
  scheduledAt?: string;
  series?: string;
  tags?: string[];
}

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "VIEWER") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body: UpdatePostBody = await req.json();
  const { title, slug, content, excerpt, coverUrl, visibility, status, scheduledAt, series, tags } = body;

  // 슬러그 중복 확인 (자기 자신 제외)
  if (slug) {
    const conflict = await prisma.post.findFirst({ where: { slug, NOT: { id } } });
    if (conflict) return Response.json({ error: "이미 사용 중인 슬러그입니다" }, { status: 409 });
  }

  const prevPost = await prisma.post.findUnique({ where: { id }, select: { status: true } });

  // 태그 upsert
  let tagConnections: { id: string }[] | undefined;
  if (tags !== undefined) {
    const upserted = await Promise.all(
      tags.map((name) =>
        prisma.tag.upsert({ where: { name }, create: { name }, update: {} })
      )
    );
    tagConnections = upserted.map((t) => ({ id: t.id }));
  }

  const post = await prisma.post.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(slug !== undefined && { slug: slug.trim() }),
      ...(content !== undefined && { content }),
      ...(excerpt !== undefined && { excerpt: excerpt.trim() || null }),
      ...(coverUrl !== undefined && { coverUrl: coverUrl || null }),
      ...(visibility !== undefined && { visibility }),
      ...(status !== undefined && {
        status,
        publishedAt:
          status === "PUBLISHED" && prevPost?.status !== "PUBLISHED"
            ? new Date()
            : undefined,
      }),
      ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
      ...(series !== undefined && { series: series.trim() || null }),
      ...(tagConnections !== undefined && {
        tags: { set: tagConnections },
      }),
    },
  });

  await createAuditLog({
    actorId: session.user.id,
    action: "UPDATE",
    entityType: "Post",
    entityId: post.id,
  });

  return Response.json({ id: post.id, slug: post.slug });
}

// ─── DELETE /api/admin/posts/[id] ────────────────────────────
export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.post.delete({ where: { id } });

  await createAuditLog({
    actorId: session.user.id,
    action: "DELETE",
    entityType: "Post",
    entityId: id,
  });

  return Response.json({ success: true });
}
