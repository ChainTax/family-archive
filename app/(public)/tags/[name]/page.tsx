import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui";
import type { Metadata } from "next";

type Props = { params: Promise<{ name: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  return { title: `#${decodedName} | FamilyArchive` };
}

export default async function TagPage({ params }: Props) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  // 태그 존재 확인
  let tag: { id: string; name: string } | null = null;
  let posts: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    publishedAt: Date | null;
    series: string | null;
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

  try {
    [tag, posts, albums] = await Promise.all([
      prisma.tag.findUnique({ where: { name: decodedName } }),
      // PUBLIC + PUBLISHED 포스트만 (AC3: UNLISTED/PRIVATE 제외)
      prisma.post.findMany({
        where: {
          status: "PUBLISHED",
          visibility: "PUBLIC",
          tags: { some: { name: decodedName } },
        },
        orderBy: { publishedAt: "desc" },
        take: 30,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          publishedAt: true,
          series: true,
          tags: { select: { id: true, name: true } },
        },
      }),
      // PUBLIC 앨범만
      prisma.album.findMany({
        where: {
          visibility: "PUBLIC",
          tags: { some: { name: decodedName } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
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

  if (!tag && (posts.length === 0 && albums.length === 0)) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* 헤더 */}
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/search" className="text-text-tertiary hover:text-text-primary transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <Badge variant="info" className="text-base px-3 py-1">#{decodedName}</Badge>
        </div>
        <p className="text-text-secondary text-sm">
          글 {posts.length}개 · 앨범 {albums.length}개
        </p>
      </header>

      {/* 포스트 목록 */}
      {posts.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-bold text-text-primary mb-5">글</h2>
          <div className="space-y-0 divide-y divide-border-default">
            {posts.map((post) => (
              <article key={post.id} className="group py-5 first:pt-0">
                <Link href={`/blog/${post.slug}`} className="block">
                  {post.series && (
                    <p className="text-xs font-medium text-brand mb-1">{post.series}</p>
                  )}
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
                    {post.tags
                      .filter((t) => t.name !== decodedName)
                      .slice(0, 2)
                      .map((t) => (
                        <Link key={t.id} href={`/tags/${encodeURIComponent(t.name)}`}>
                          <Badge variant="default">{t.name}</Badge>
                        </Link>
                      ))}
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* 앨범 목록 */}
      {albums.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-text-primary mb-5">앨범</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {albums.map((album) => (
              <Link
                key={album.id}
                href={`/albums/${album.slug}`}
                className="group rounded-2xl overflow-hidden border border-border-default bg-white hover:shadow-md transition-shadow"
              >
                <div className="w-full h-36 bg-bg-secondary overflow-hidden">
                  {album.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-bold text-text-primary group-hover:text-brand transition-colors truncate">
                    {album.title}
                  </p>
                  <p className="text-xs text-text-tertiary mt-1">{album._count.photos}장</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {posts.length === 0 && albums.length === 0 && (
        <p className="text-text-tertiary text-sm text-center py-16">
          이 태그에 연결된 공개 콘텐츠가 없어요.
        </p>
      )}
    </div>
  );
}
