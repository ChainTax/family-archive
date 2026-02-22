import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function escapeXml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "FamilyArchive";

  let posts: Array<{
    title: string;
    slug: string;
    excerpt: string | null;
    publishedAt: Date | null;
    tags: { name: string }[];
  }> = [];

  try {
    posts = await prisma.post.findMany({
      where: { status: "PUBLISHED", visibility: "PUBLIC" },
      orderBy: { publishedAt: "desc" },
      take: 50,
      select: {
        title: true,
        slug: true,
        excerpt: true,
        publishedAt: true,
        tags: { select: { name: true } },
      },
    });
  } catch {
    // DB 미연결 시 빈 피드 반환
  }

  const now = new Date().toUTCString();

  const items = posts
    .map((post) => {
      const url = `${appUrl}/blog/${post.slug}`;
      const pubDate = post.publishedAt
        ? new Date(post.publishedAt).toUTCString()
        : now;
      const description = post.excerpt
        ? escapeXml(post.excerpt)
        : `${escapeXml(appName)} 블로그 포스트`;
      const categories = post.tags
        .map((t) => `<category>${escapeXml(t.name)}</category>`)
        .join("");

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
      ${categories}
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(appName)}</title>
    <link>${appUrl}</link>
    <description>우리 가족의 이야기를 기록합니다.</description>
    <language>ko</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${appUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
