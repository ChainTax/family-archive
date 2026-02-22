import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui";
type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";

export const metadata = { title: "앨범" };

const visibilityLabel: Record<Visibility, string> = {
  PUBLIC: "공개",
  UNLISTED: "링크 공유",
  PRIVATE: "비공개",
};
const visibilityVariant: Record<
  Visibility,
  "success" | "info" | "default"
> = {
  PUBLIC: "success",
  UNLISTED: "info",
  PRIVATE: "default",
};

export default async function AlbumsPage() {
  let albums: Array<{
    id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
    visibility: Visibility;
    dateStart: Date | null;
    _count: { photos: number };
    createdAt: Date;
  }> = [];

  try {
    albums = await prisma.album.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { photos: true } } },
    });
  } catch {
    // DB 미연결 시 빈 목록 표시
  }

  return (
    <div className="p-8 max-w-6xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-text-primary">앨범</h1>
        <Link
          href="/admin/albums/new"
          className="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium bg-brand text-white rounded-[10px] hover:bg-brand-hover transition-colors"
        >
          <span>+</span> 새 앨범 만들기
        </Link>
      </div>

      {albums.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-bg-secondary flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <p className="text-text-secondary font-medium mb-1">앨범이 없습니다</p>
          <p className="text-sm text-text-tertiary mb-6">첫 번째 앨범을 만들어 가족의 추억을 기록해 보세요.</p>
          <Link
            href="/admin/albums/new"
            className="inline-flex items-center gap-2 h-10 px-5 text-sm font-medium bg-brand text-white rounded-[10px] hover:bg-brand-hover transition-colors"
          >
            새 앨범 만들기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {albums.map((album) => (
            <Link
              key={album.id}
              href={`/admin/albums/${album.id}`}
              className="group block bg-white rounded-2xl border border-border-default overflow-hidden hover:shadow-[0_4px_16px_0_rgba(0,0,0,0.08)] transition-shadow"
            >
              {/* 커버 이미지 */}
              <div className="aspect-[4/3] bg-bg-secondary overflow-hidden">
                {album.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="3" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                )}
              </div>

              {/* 정보 */}
              <div className="p-3">
                <p className="text-sm font-semibold text-text-primary truncate">{album.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant={visibilityVariant[album.visibility]}>
                    {visibilityLabel[album.visibility]}
                  </Badge>
                  <span className="text-xs text-text-tertiary">{album._count.photos}장</span>
                </div>
                {album.dateStart && (
                  <p className="text-xs text-text-tertiary mt-1">
                    {album.dateStart.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
