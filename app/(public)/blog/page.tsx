import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui";

export const revalidate = 60;
export const metadata = { title: "블로그 | FamilyArchive" };

export default async function BlogPage() {
  let posts: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    coverUrl: string | null;
    publishedAt: Date | null;
    series: string | null;
    tags: { id: string; name: string }[];
  }> = [];

  try {
    posts = await prisma.post.findMany({
      where: { status: "PUBLISHED", visibility: "PUBLIC" },
      orderBy: { publishedAt: "desc" },
      take: 30,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverUrl: true,
        publishedAt: true,
        series: true,
        tags: { select: { id: true, name: true } },
      },
    });
  } catch {
    // DB 미연결 시 빈 목록
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-bold text-text-primary mb-2">블로그</h1>
      <p className="text-text-secondary mb-10">우리 가족의 이야기를 기록합니다.</p>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <svg
            className="text-text-tertiary"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <p className="text-text-tertiary text-sm">아직 게시된 글이 없어요.</p>
        </div>
      ) : (
        <div className="space-y-0 divide-y divide-border-default">
          {posts.map((post) => (
            <article key={post.id} className="group py-6 first:pt-0">
              {/* 카드 링크 (커버 + 제목 + 발췌) */}
              <Link href={`/blog/${post.slug}`} className="flex gap-5 items-start">
                {post.coverUrl && (
                  <div className="hidden sm:block flex-shrink-0 w-32 h-24 rounded-xl overflow-hidden bg-bg-secondary">
                    <img
                      src={post.coverUrl}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-text-primary group-hover:text-brand transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                </div>
              </Link>
              {/* 메타 (날짜·시리즈·태그) — 독립 링크이므로 카드 밖에 배치 */}
              <div className="flex items-center gap-2 mt-2 flex-wrap pl-0">
                {post.publishedAt && (
                  <span className="text-xs text-text-tertiary">
                    {new Date(post.publishedAt).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                )}
                {post.series && (
                  <Link href={`/series/${encodeURIComponent(post.series)}`} className="text-xs font-medium text-brand hover:underline">
                    {post.series}
                  </Link>
                )}
                {post.tags.slice(0, 3).map((tag) => (
                  <Link key={tag.id} href={`/tags/${encodeURIComponent(tag.name)}`}>
                    <Badge variant="default">{tag.name}</Badge>
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
