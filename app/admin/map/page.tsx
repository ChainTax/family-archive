import { prisma } from "@/lib/prisma";
import MapPageClient from "./MapPageClient";

export const metadata = { title: "지도 핀 | Admin" };

export default async function AdminMapPage() {
  let places: {
    id: string;
    name: string;
    lat: number;
    lng: number;
    visibility: "PUBLIC" | "UNLISTED" | "PRIVATE";
    linkedPosts: { id: string; title: string; slug: string }[];
    linkedAlbums: { id: string; title: string; slug: string }[];
  }[] = [];

  let posts: { id: string; title: string; slug: string }[] = [];
  let albums: { id: string; title: string; slug: string }[] = [];

  try {
    [places, posts, albums] = await Promise.all([
      prisma.place.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          lat: true,
          lng: true,
          visibility: true,
          linkedPosts: { select: { id: true, title: true, slug: true } },
          linkedAlbums: { select: { id: true, title: true, slug: true } },
        },
      }),
      prisma.post.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        select: { id: true, title: true, slug: true },
      }),
      prisma.album.findMany({
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, slug: true },
      }),
    ]);
  } catch {
    // DB 미연결
  }

  return (
    <MapPageClient
      initialPlaces={places}
      posts={posts}
      albums={albums}
    />
  );
}
