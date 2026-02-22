import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostForm } from "../../PostForm";

export const metadata = { title: "글 수정" };

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let post: Awaited<ReturnType<typeof prisma.post.findUnique>> & { tags?: { name: string }[] } | null = null;
  try {
    post = await prisma.post.findUnique({
      where: { id },
      include: { tags: true },
    });
  } catch {
    // DB 미연결
  }

  if (!post) notFound();

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center gap-3 mb-8">
        <a href="/admin/posts" className="text-text-tertiary hover:text-text-primary transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </a>
        <h1 className="text-xl font-bold text-text-primary">글 수정</h1>
      </div>
      <PostForm
        initial={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt ?? "",
          coverUrl: post.coverUrl ?? "",
          visibility: post.visibility,
          status: post.status,
          scheduledAt: post.scheduledAt?.toISOString().slice(0, 16) ?? "",
          series: post.series ?? "",
          tags: post.tags?.map((t: { name: string }) => t.name) ?? [],
        }}
      />
    </div>
  );
}
