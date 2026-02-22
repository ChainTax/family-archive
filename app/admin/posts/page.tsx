import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui";
type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";
type PostStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED";

export const metadata = { title: "글" };

const statusMeta: Record<PostStatus, { label: string; variant: "default" | "warning" | "success" }> = {
  DRAFT: { label: "임시저장", variant: "default" },
  SCHEDULED: { label: "예약발행", variant: "warning" },
  PUBLISHED: { label: "발행됨", variant: "success" },
};

const visibilityMeta: Record<Visibility, { label: string; variant: "default" | "info" | "success" }> = {
  PRIVATE: { label: "비공개", variant: "default" },
  UNLISTED: { label: "링크공유", variant: "info" },
  PUBLIC: { label: "공개", variant: "success" },
};

export default async function PostsPage() {
  let posts: Array<{
    id: string;
    title: string;
    slug: string;
    status: PostStatus;
    visibility: Visibility;
    publishedAt: Date | null;
    createdAt: Date;
    tags: { id: string; name: string }[];
  }> = [];

  try {
    posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: { tags: true },
    });
  } catch {
    // DB 미연결 시 빈 목록
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-text-primary">글</h1>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium bg-brand text-white rounded-[10px] hover:bg-brand-hover transition-colors"
        >
          <span>+</span> 새 글 쓰기
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-bg-secondary flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <p className="text-text-secondary font-medium mb-1">아직 작성된 글이 없습니다</p>
          <p className="text-sm text-text-tertiary mb-6">첫 번째 글을 작성해 가족의 이야기를 기록해 보세요.</p>
          <Link
            href="/admin/posts/new"
            className="inline-flex items-center gap-2 h-10 px-5 text-sm font-medium bg-brand text-white rounded-[10px] hover:bg-brand-hover transition-colors"
          >
            새 글 쓰기
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => {
            const s = statusMeta[post.status];
            const v = visibilityMeta[post.visibility];
            return (
              <Link
                key={post.id}
                href={`/admin/posts/${post.id}/edit`}
                className="flex items-center gap-4 px-5 py-4 bg-white rounded-2xl border border-border-default hover:shadow-[0_4px_16px_0_rgba(0,0,0,0.08)] transition-shadow group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate group-hover:text-brand transition-colors">
                    {post.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Badge variant={s.variant}>{s.label}</Badge>
                    <Badge variant={v.variant}>{v.label}</Badge>
                    {post.tags.map((tag) => (
                      <span key={tag.id} className="text-xs text-text-tertiary">#{tag.name}</span>
                    ))}
                  </div>
                </div>
                <p className="shrink-0 text-xs text-text-tertiary">
                  {(post.publishedAt ?? post.createdAt).toLocaleDateString("ko-KR")}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
