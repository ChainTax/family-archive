import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui";

export const revalidate = 300;

const MILESTONE_LABELS: Record<string, string> = {
  BIRTHDAY: "생일",
  ANNIVERSARY: "기념일",
  GROWTH: "성장",
  FIRST_EXPERIENCE: "첫 경험",
  OTHER: "기타",
};

export default async function HomePage() {
  let recentPosts: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    coverUrl: string | null;
    publishedAt: Date | null;
  }> = [];

  let recentAlbums: Array<{
    id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
    createdAt: Date;
    _count: { photos: number };
  }> = [];

  let recentMilestones: Array<{
    id: string;
    title: string;
    type: string;
    date: Date;
    notes: string | null;
  }> = [];

  try {
    [recentPosts, recentAlbums, recentMilestones] = await Promise.all([
      prisma.post.findMany({
        where: { status: "PUBLISHED", visibility: "PUBLIC" },
        orderBy: { publishedAt: "desc" },
        take: 4,
        select: { id: true, title: true, slug: true, excerpt: true, coverUrl: true, publishedAt: true },
      }),
      prisma.album.findMany({
        where: { visibility: "PUBLIC" },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { id: true, title: true, slug: true, coverUrl: true, createdAt: true, _count: { select: { photos: true } } },
      }),
      prisma.milestone.findMany({
        where: { visibility: "PUBLIC" },
        orderBy: { date: "desc" },
        take: 4,
        select: { id: true, title: true, type: true, date: true, notes: true },
      }),
    ]);
  } catch {
    // DB 미연결
  }

  const hasContent = recentPosts.length > 0 || recentAlbums.length > 0 || recentMilestones.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      {/* 테마 토글 — 우상단 고정 */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* ─── Hero ─── */}
      <section className="py-28 px-4 text-center border-b border-border-default">
        <div className="flex items-center justify-center gap-3 mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png?v=3" alt="" className="h-14 w-auto" />
          <h1 className="text-5xl font-bold text-text-primary tracking-tight">
            재린월드
          </h1>
        </div>
        <p className="text-lg text-text-secondary mb-10">
          우리 가족의 이야기를 기록합니다.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/blog"
            className="inline-flex items-center rounded-xl bg-brand px-6 py-3 text-base font-semibold text-white hover:bg-brand-hover transition-colors"
          >
            방문하기
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center rounded-xl border border-border-default px-6 py-3 text-base font-semibold text-text-primary hover:bg-bg-secondary transition-colors"
          >
            관리자
          </Link>
        </div>
      </section>

      {/* ─── Content ─── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-16">

        {/* 최근 기록 */}
        {recentPosts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text-primary">기록</h2>
              <Link href="/blog" className="text-sm text-brand hover:text-brand-hover transition-colors">
                전체 보기
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group block rounded-2xl overflow-hidden border border-border-default hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-bg-secondary overflow-hidden">
                    {post.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.coverUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-bg-secondary">
                    <p className="text-sm font-semibold text-text-primary truncate group-hover:text-brand transition-colors">
                      {post.title}
                    </p>
                    {post.publishedAt && (
                      <p className="text-xs text-text-tertiary mt-0.5">
                        {new Date(post.publishedAt).toLocaleDateString("ko-KR", {
                          year: "numeric", month: "long", day: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 최근 앨범 */}
        {recentAlbums.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text-primary">앨범</h2>
              <Link href="/albums" className="text-sm text-brand hover:text-brand-hover transition-colors">
                전체 보기
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recentAlbums.map((album) => (
                <Link
                  key={album.id}
                  href={`/albums/${album.slug}`}
                  className="group block rounded-2xl overflow-hidden border border-border-default hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-bg-secondary overflow-hidden">
                    {album.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={album.coverUrl}
                        alt={album.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
                          <rect x="3" y="3" width="18" height="18" rx="3" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-bg-primary">
                    <p className="text-sm font-semibold text-text-primary truncate group-hover:text-brand transition-colors">
                      {album.title}
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">{album._count.photos}장</p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {new Date(album.createdAt).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 마일스톤 */}
        {recentMilestones.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-text-primary mb-6">마일스톤</h2>
            <div className="space-y-3">
              {recentMilestones.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-4 p-5 bg-bg-secondary rounded-2xl border border-border-default"
                >
                  <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-lg bg-brand/10 text-xs font-semibold text-brand">
                    {MILESTONE_LABELS[m.type] ?? m.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary truncate">{m.title}</p>
                    {m.notes && (
                      <p className="text-sm text-text-secondary mt-0.5 line-clamp-1">{m.notes}</p>
                    )}
                  </div>
                  <p className="shrink-0 text-xs text-text-tertiary whitespace-nowrap">
                    {new Date(m.date).toLocaleDateString("ko-KR", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 데이터 없을 때 */}
        {!hasContent && (
          <div className="text-center py-24">
            <p className="text-lg font-medium text-text-secondary">아직 기록이 없습니다.</p>
            <p className="text-sm text-text-tertiary mt-2">첫 번째 기록을 남겨보세요.</p>
            <Link
              href="/admin"
              className="inline-flex items-center mt-6 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover transition-colors"
            >
              관리자로 이동
            </Link>
          </div>
        )}
      </div>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border-default py-10 text-center text-text-tertiary text-sm">
        © {new Date().getFullYear()} 재린월드 · 우리 가족의 이야기
      </footer>
    </div>
  );
}
