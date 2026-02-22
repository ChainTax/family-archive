import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Badge } from "@/components/ui";
import { PhotoGrid } from "@/components/gallery/PhotoGrid";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function formatDateRange(start: Date | null, end: Date | null): string {
  if (!start) return "";
  const fmt = (d: Date) =>
    d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  if (!end || start.toDateString() === end.toDateString()) return fmt(start);
  return `${fmt(start)} ~ ${fmt(end)}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const rawSlug = (await params).slug;
  const slug = (() => { try { return decodeURIComponent(rawSlug); } catch { return rawSlug; } })();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const album = await prisma.album.findFirst({
      where: { slug },
      select: { title: true, description: true, coverUrl: true },
    });
    if (!album) return { title: "앨범 없음" };
    return {
      title: album.title,
      description: album.description ?? undefined,
      openGraph: {
        type: "website",
        url: `${appUrl}/albums/${slug}`,
        title: album.title,
        description: album.description ?? undefined,
        images: album.coverUrl ? [{ url: album.coverUrl }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: album.title,
        description: album.description ?? undefined,
        images: album.coverUrl ? [album.coverUrl] : [],
      },
    };
  } catch {
    return { title: "재린월드" };
  }
}

export default async function AlbumPage({ params }: Props) {
  const rawSlug = (await params).slug;
  const slug = (() => { try { return decodeURIComponent(rawSlug); } catch { return rawSlug; } })();

  let album: {
    id: string;
    title: string;
    description: string | null;
    coverUrl: string | null;
    visibility: "PUBLIC" | "UNLISTED" | "PRIVATE";
    dateStart: Date | null;
    dateEnd: Date | null;
    photos: {
      id: string;
      url: string;
      thumbUrl: string;
      caption: string | null;
      width: number;
      height: number;
      order: number;
    }[];
    tags: { id: string; name: string }[];
  } | null = null;

  try {
    album = await prisma.album.findFirst({
      where: { slug },
      select: {
        id: true,
        title: true,
        description: true,
        coverUrl: true,
        visibility: true,
        dateStart: true,
        dateEnd: true,
        photos: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            url: true,
            thumbUrl: true,
            caption: true,
            width: true,
            height: true,
            order: true,
          },
        },
        tags: { select: { id: true, name: true } },
      },
    });
  } catch (e) {
    console.error("[AlbumPage] DB error for slug:", slug, e);
    throw e; // 실제 에러를 Vercel 로그에 노출 (조용한 404 방지)
  }

  if (!album) {
    console.warn("[AlbumPage] Album not found for slug:", slug);
    notFound();
  }

  // ─── Visibility 규칙 ───────────────────────────────────────────────
  // PUBLIC : 누구나 접근 가능
  // UNLISTED: 링크로만 접근 가능 (목록 제외, 직접 URL은 허용)
  // PRIVATE : 로그인 가족만 접근 가능
  if (album.visibility === "PRIVATE") {
    const session = await auth();
    if (!session) redirect(`/login?callbackUrl=/albums/${slug}`);
  }

  const dateLabel = formatDateRange(album.dateStart, album.dateEnd);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {/* 앨범 헤더 */}
      <header className="mb-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-text-primary leading-tight">
              {album.title}
            </h1>
            {album.description && (
              <p className="mt-2 text-text-secondary">{album.description}</p>
            )}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {dateLabel && (
                <span className="text-sm text-text-tertiary">{dateLabel}</span>
              )}
              {album.visibility === "PRIVATE" && (
                <Badge variant="warning">가족 전용</Badge>
              )}
              {album.tags.map((tag) => (
                <Link key={tag.id} href={`/tags/${encodeURIComponent(tag.name)}`}>
                  <Badge variant="default">{tag.name}</Badge>
                </Link>
              ))}
            </div>
          </div>
          <span className="text-sm text-text-tertiary whitespace-nowrap mt-1">
            {album.photos.length}장
          </span>
        </div>
      </header>

      {/* 사진 그리드 (Lightbox 포함) */}
      <PhotoGrid photos={album.photos} />
    </div>
  );
}
