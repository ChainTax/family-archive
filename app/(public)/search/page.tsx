import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui";
import type { Metadata } from "next";

// T8-01: 검색 쿼리 — PUBLIC 콘텐츠만, UNLISTED/PRIVATE 제외 (AC3)
type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `"${q}" 검색 결과 | 재린월드` : "검색 | 재린월드" };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  let posts: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    publishedAt: Date | null;
    tags: { id: string; name: string }[];
  }> = [];

  let albums: Array<{
    id: string;
    title: string;
    slug: string;
    description: string | null;
    coverUrl: string | null;
    _count: { photos: number };
  }> = [];

  if (query) {
    try {
      [posts, albums] = await Promise.all([
        // 포스트 검색: 제목·발췌·시리즈 대상 (PUBLIC + PUBLISHED만)
        prisma.post.findMany({
          where: {
            status: "PUBLISHED",
            visibility: "PUBLIC",
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { excerpt: { contains: query, mode: "insensitive" } },
              { series: { contains: query, mode: "insensitive" } },
              { tags: { some: { name: { contains: query, mode: "insensitive" } } } },
            ],
          },
          orderBy: { publishedAt: "desc" },
          take: 20,
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            publishedAt: true,
            tags: { select: { id: true, name: true } },
          },
        }),
        // 앨범 검색: 제목·설명 대상 (PUBLIC만)
        prisma.album.findMany({
          where: {
            visibility: "PUBLIC",
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { tags: { some: { name: { contains: query, mode: "insensitive" } } } },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            coverUrl: true,
            _count: { select: { photos: true } },
          },
        }),
      ]);
    } catch {
      // DB 미연결
    }
  }

  const totalCount = posts.length + albums.length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-bold text-text-primary mb-6">검색</h1>

      {/* 검색 폼 */}
      <form action="/search" method="GET" className="mb-10">
        <div className="flex flex-row gap-2">
          <input
            name="q"
            type="search"
            defaultValue={query}
            placeholder="글, 앨범, 태그 검색…"
            autoFocus
            autoComplete="off"
            className="flex-1 min-w-0 h-11 px-4 rounded-xl border border-border-default bg-white text-text-primary placeholder:text-text-tertiary text-sm focus:outline-none focus:border-brand transition-colors"
          />
          <button
            type="submit"
            className="shrink-0 h-11 px-5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors"
          >
            검색
          </button>
        </div>
      </form>

      {/* 결과 없음 */}
      {query && totalCount === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <svg className="text-text-tertiary" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <p className="text-text-secondary text-sm">
            &ldquo;{query}&rdquo;에 대한 검색 결과가 없어요.
          </p>
        </div>
      )}

      {/* 글 결과 */}
      {posts.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide mb-4">
            글 ({posts.length})
          </h2>
          <div className="space-y-0 divide-y divide-border-default">
            {posts.map((post) => (
              <article key={post.id} className="group py-4 first:pt-0">
                <Link href={`/blog/${post.slug}`} className="block">
                  <h3 className="font-bold text-text-primary group-hover:text-brand transition-colors">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm text-text-secondary mt-1 line-clamp-2">{post.excerpt}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {post.publishedAt && (
                      <span className="text-xs text-text-tertiary">
                        {new Date(post.publishedAt).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    )}
                    {post.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag.id} variant="default">{tag.name}</Badge>
                    ))}
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* 앨범 결과 */}
      {albums.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide mb-4">
            앨범 ({albums.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {albums.map((album) => (
              <Link
                key={album.id}
                href={`/albums/${album.slug}`}
                className="group flex gap-4 p-4 rounded-2xl border border-border-default hover:shadow-md transition-shadow bg-white"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-bg-secondary shrink-0">
                  {album.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-text-primary group-hover:text-brand transition-colors truncate">
                    {album.title}
                  </p>
                  {album.description && (
                    <p className="text-sm text-text-secondary mt-1 line-clamp-2">{album.description}</p>
                  )}
                  <p className="text-xs text-text-tertiary mt-1">{album._count.photos}장</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 검색 전 안내 */}
      {!query && (
        <p className="text-text-tertiary text-sm text-center py-8">
          검색어를 입력하면 글과 앨범을 찾아드려요.
        </p>
      )}
    </div>
  );
}
