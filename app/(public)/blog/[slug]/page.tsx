import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Badge } from "@/components/ui";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const post = await prisma.post.findFirst({
      where: { slug },
      select: { title: true, excerpt: true, coverUrl: true },
    });
    if (!post) return { title: "글 없음" };
    return {
      title: post.title,
      description: post.excerpt ?? undefined,
      openGraph: {
        type: "article",
        url: `${appUrl}/blog/${slug}`,
        title: post.title,
        description: post.excerpt ?? undefined,
        images: post.coverUrl ? [{ url: post.coverUrl }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.excerpt ?? undefined,
        images: post.coverUrl ? [post.coverUrl] : [],
      },
    };
  } catch {
    return { title: "재린월드" };
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;

  let post: {
    id: string;
    title: string;
    status: string;
    content: string;
    excerpt: string | null;
    coverUrl: string | null;
    visibility: "PUBLIC" | "UNLISTED" | "PRIVATE";
    publishedAt: Date | null;
    series: string | null;
    tags: { id: string; name: string }[];
  } | null = null;

  try {
    post = await prisma.post.findFirst({
      where: { slug },
      select: {
        id: true,
        title: true,
        status: true,
        content: true,
        excerpt: true,
        coverUrl: true,
        visibility: true,
        publishedAt: true,
        series: true,
        tags: { select: { id: true, name: true } },
      },
    });
  } catch (e) {
    console.error("[PostPage] DB error:", e);
  }

  if (!post) notFound();
  if (post.status !== "PUBLISHED") notFound();

  // ─── Visibility 규칙 ───────────────────────────────────────────────
  if (post.visibility === "PRIVATE") {
    const session = await auth();
    if (!session) redirect(`/login?callbackUrl=/blog/${slug}`);
  }

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* 커버 이미지 */}
      {post.coverUrl && (
        <div className="w-full h-56 sm:h-72 rounded-2xl overflow-hidden bg-bg-secondary mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverUrl}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* 헤더 */}
      <header className="mb-8">
        {post.series && (
          <Link
            href={`/series/${encodeURIComponent(post.series)}`}
            className="inline-block text-sm font-medium text-brand mb-2 hover:underline"
          >
            {post.series}
          </Link>
        )}
        <h1 className="text-3xl font-bold text-text-primary leading-tight mb-4">
          {post.title}
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          {post.publishedAt && (
            <span className="text-sm text-text-tertiary">
              {new Date(post.publishedAt).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          )}
          {post.visibility === "PRIVATE" && (
            <Badge variant="warning">가족 전용</Badge>
          )}
          {post.tags.map((tag) => (
            <Link key={tag.id} href={`/tags/${encodeURIComponent(tag.name)}`}>
              <Badge variant="default">{tag.name}</Badge>
            </Link>
          ))}
        </div>
        {post.excerpt && (
          <p className="mt-4 text-text-secondary leading-relaxed border-l-2 border-brand pl-4">
            {post.excerpt}
          </p>
        )}
      </header>

      {/* 구분선 */}
      <hr className="border-border-default mb-8" />

      {/* 본문 (TipTap HTML) */}
      <div
        className="prose-editor"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  );
}
