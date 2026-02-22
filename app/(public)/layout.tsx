import Link from "next/link";
import { auth } from "@/auth";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 bg-bg-primary/90 backdrop-blur-md border-b border-border-default">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold text-text-primary hover:text-brand transition-colors"
          >
            재린월드
          </Link>
          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/blog"
              className="text-sm sm:text-base text-text-secondary hover:text-text-primary transition-colors"
            >
              기록
            </Link>
            <Link
              href="/albums"
              className="text-sm sm:text-base text-text-secondary hover:text-text-primary transition-colors"
            >
              앨범
            </Link>
            <Link
              href="/milestones"
              className="text-sm sm:text-base text-text-secondary hover:text-text-primary transition-colors"
            >
              마일스톤
            </Link>
            <Link
              href="/growth"
              className="text-sm sm:text-base text-text-secondary hover:text-text-primary transition-colors"
            >
              성장
            </Link>
            {/* 검색 아이콘 */}
            <Link
              href="/search"
              aria-label="검색"
              className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </Link>
            {session && (
              <Link
                href="/admin"
                className="text-sm sm:text-base font-semibold text-brand hover:text-brand-hover transition-colors"
              >
                관리자
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* ─── Main ─── */}
      <main className="flex-1">{children}</main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border-default py-10 text-center text-text-tertiary text-sm">
        © {new Date().getFullYear()} 재린월드 · 우리 가족의 이야기
      </footer>
    </div>
  );
}
