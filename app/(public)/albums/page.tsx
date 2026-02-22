import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;
export const metadata = { title: "앨범 | 재린월드" };

function formatDateRange(start: Date | null, end: Date | null): string {
  if (!start) return "";
  const fmt = (d: Date) =>
    d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  if (!end || start.toDateString() === end.toDateString()) return fmt(start);
  return `${fmt(start)} ~ ${fmt(end)}`;
}

export default async function AlbumsPage() {
  let albums: Array<{
    id: string;
    title: string;
    slug: string;
    description: string | null;
    coverUrl: string | null;
    dateStart: Date | null;
    dateEnd: Date | null;
    createdAt: Date;
    _count: { photos: number };
  }> = [];

  try {
    albums = await prisma.album.findMany({
      where: { visibility: "PUBLIC" },
      orderBy: [{ dateStart: "desc" }, { createdAt: "desc" }],
      take: 30,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverUrl: true,
        dateStart: true,
        dateEnd: true,
        createdAt: true,
        _count: { select: { photos: true } },
      },
    });
  } catch {
    // DB 미연결 시 빈 목록
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-bold text-text-primary mb-2">앨범</h1>
      <p className="text-text-secondary mb-10">소중한 순간들의 모음.</p>

      {albums.length === 0 ? (
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
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p className="text-text-tertiary text-sm">아직 공개된 앨범이 없어요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {albums.map((album) => (
            <Link
              key={album.id}
              href={`/albums/${album.slug}`}
              className="group rounded-2xl overflow-hidden border border-border-default bg-white hover:shadow-md transition-shadow"
            >
              {/* 커버 */}
              <div className="w-full h-48 bg-bg-secondary overflow-hidden">
                {album.coverUrl ? (
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                )}
              </div>

              {/* 정보 */}
              <div className="p-4">
                <h2 className="font-bold text-text-primary group-hover:text-brand transition-colors truncate">
                  {album.title}
                </h2>
                {album.description && (
                  <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                    {album.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-3 text-xs text-text-tertiary">
                  <span>{formatDateRange(album.dateStart, album.dateEnd)}</span>
                  <span>{album._count.photos}장</span>
                </div>
                <p className="text-xs text-text-tertiary mt-1">
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
      )}
    </div>
  );
}
