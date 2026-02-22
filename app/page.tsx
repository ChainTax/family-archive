import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-secondary">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-text-primary tracking-tight">
          FamilyArchive
        </h1>
        <p className="mt-3 text-text-secondary text-lg">
          우리 가족의 이야기를 기록합니다.
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <a
            href="/admin"
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover transition-colors"
          >
            관리자
          </a>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-border-default px-5 py-2.5 text-sm font-semibold text-text-primary hover:bg-bg-secondary transition-colors"
          >
            블로그
          </Link>
          <Link
            href="/albums"
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-border-default px-5 py-2.5 text-sm font-semibold text-text-primary hover:bg-bg-secondary transition-colors"
          >
            앨범
          </Link>
        </div>
      </div>
    </main>
  );
}
