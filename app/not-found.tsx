import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "404 — 페이지를 찾을 수 없어요" };

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-secondary px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-brand mb-4">404</p>
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          페이지를 찾을 수 없어요
        </h1>
        <p className="text-text-secondary mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover transition-colors"
          >
            홈으로
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-border-default px-5 py-2.5 text-sm font-semibold text-text-primary hover:bg-bg-secondary transition-colors"
          >
            기록
          </Link>
        </div>
      </div>
    </div>
  );
}
