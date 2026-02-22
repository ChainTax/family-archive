import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // 정적 라우트
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: appUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${appUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${appUrl}/albums`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${appUrl}/map`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${appUrl}/archive`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
    { url: `${appUrl}/guestbook`, lastModified: new Date(), changeFrequency: "daily", priority: 0.4 },
  ];

  let postRoutes: MetadataRoute.Sitemap = [];
  let albumRoutes: MetadataRoute.Sitemap = [];

  try {
    // PUBLIC 포스트만 (UNLISTED 제외 — AC3)
    const posts = await prisma.post.findMany({
      where: { status: "PUBLISHED", visibility: "PUBLIC" },
      select: { slug: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
    });
    postRoutes = posts.map((post: { slug: string; updatedAt: Date }) => ({
      url: `${appUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    // PUBLIC 앨범만 (UNLISTED 제외 — AC3)
    const albums = await prisma.album.findMany({
      where: { visibility: "PUBLIC" },
      select: { slug: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
    });
    albumRoutes = albums.map((album: { slug: string; updatedAt: Date }) => ({
      url: `${appUrl}/albums/${album.slug}`,
      lastModified: album.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    // DB 미연결 시 정적 라우트만 반환
  }

  return [...staticRoutes, ...postRoutes, ...albumRoutes];
}
