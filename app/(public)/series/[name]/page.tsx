import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui";
import type { Metadata } from "next";

type Props = { params: Promise<{ name: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  return { title: `시리즈: ${decodedName} | FamilyArchive` };
}

export default async function SeriesPage({ params }: Props) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  let posts: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    publishedAt: Date | null;
    coverUrl: string | null;
    tags: { id: string; name: string }[];
  }> = [];

  try {
    // PUBLIC + PUBLISHED + 해당 시리즈만 (AC3 준수)
    posts = await prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        visibility: "PUBLIC",
        series: decodedName,
      },
      orderBy: { publishedAt: "asc" }, // 시리즈는 오름차순 (1화→2화)
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        publishedAt: true,
        coverUrl: true,
        tags: { select: { id: true, name: true } },
      },
    });
  } catch {
    // DB 미연결
  }

  if (posts.length === 0) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* 헤더 */}
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/blog" className="text-text-tertiary hover:text-text-primary transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <span className="text-xs font-semibold text-brand uppercase tracking-wide">Series</span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary">{decodedName}</h1>
        <p className="text-text-secondary text-sm mt-1">총 {posts.length}편</p>
      </header>

      {/* 포스트 목록 */}
      <ol className="space-y-0 divide-y divide-border-default">
        {posts.map((post, i) => (
          <li key={post.id} className="group">
            <Link href={`/blog/${post.slug}`} className="flex gap-4 py-5 items-start">
              {/* 번호 */}
              <span className="shrink-0 w-8 h-8 rounded-full bg-bg-secondary text-text-tertiary text-sm font-bold flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors">
                {i + 1}
              </span>
              {/* 본문 */}
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-text-primary group-hover:text-brand transition-colors">
                  {post.title}
                </h2>
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
                  {post.tags.slice(0, 2).map((tag) => (
                    <Link key={tag.id} href={`/tags/${encodeURIComponent(tag.name)}`}>
                      <Badge variant="default">{tag.name}</Badge>
                    </Link>
                  ))}
                </div>
              </div>
              {/* 커버 썸네일 */}
              {post.coverUrl && (
                <div className="hidden sm:block shrink-0 w-16 h-12 rounded-lg overflow-hidden bg-bg-secondary">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.coverUrl}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
