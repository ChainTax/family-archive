import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui";

export const revalidate = 300;
export const metadata = { title: "아카이브 | FamilyArchive" };

const MONTH_KO = [
  "", "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

interface PostItem {
  id: string;
  title: string;
  slug: string;
  publishedAt: Date | null;
  series: string | null;
  tags: { id: string; name: string }[];
}

interface MonthGroup {
  year: number;
  month: number;
  posts: PostItem[];
}

function groupByYearMonth(posts: PostItem[]): MonthGroup[] {
  const map = new Map<string, MonthGroup>();

  for (const post of posts) {
    if (!post.publishedAt) continue;
    const y = post.publishedAt.getFullYear();
    const m = post.publishedAt.getMonth() + 1;
    const key = `${y}-${String(m).padStart(2, "0")}`;
    if (!map.has(key)) map.set(key, { year: y, month: m, posts: [] });
    map.get(key)!.posts.push(post);
  }

  return Array.from(map.values()).sort((a, b) =>
    a.year !== b.year ? b.year - a.year : b.month - a.month
  );
}

export default async function ArchivePage() {
  let posts: PostItem[] = [];

  try {
    // PUBLIC + PUBLISHED만 (AC3: UNLISTED/PRIVATE 제외)
    posts = await prisma.post.findMany({
      where: { status: "PUBLISHED", visibility: "PUBLIC" },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        publishedAt: true,
        series: true,
        tags: { select: { id: true, name: true } },
      },
    });
  } catch {
    // DB 미연결
  }

  const groups = groupByYearMonth(posts);

  // 연도별로 묶기
  const byYear = new Map<number, MonthGroup[]>();
  for (const g of groups) {
    if (!byYear.has(g.year)) byYear.set(g.year, []);
    byYear.get(g.year)!.push(g);
  }
  const years = Array.from(byYear.entries()).sort((a, b) => b[0] - a[0]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-bold text-text-primary mb-2">아카이브</h1>
      <p className="text-text-secondary mb-10">
        총 {posts.length}편의 글
      </p>

      {posts.length === 0 ? (
        <p className="text-text-tertiary text-sm text-center py-16">
          아직 게시된 글이 없어요.
        </p>
      ) : (
        <div className="space-y-12">
          {years.map(([year, monthGroups]) => (
            <section key={year}>
              {/* 연도 헤더 */}
              <h2 className="text-xl font-bold text-text-primary mb-6 pb-2 border-b border-border-default">
                {year}
                <span className="ml-2 text-sm font-normal text-text-tertiary">
                  ({monthGroups.reduce((s, g) => s + g.posts.length, 0)}편)
                </span>
              </h2>

              <div className="space-y-8">
                {monthGroups.map((group) => (
                  <div key={`${group.year}-${group.month}`}>
                    {/* 월 헤더 */}
                    <h3 className="text-sm font-semibold text-text-tertiary mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand inline-block" />
                      {MONTH_KO[group.month]}
                    </h3>

                    {/* 포스트 목록 */}
                    <ul className="space-y-0 divide-y divide-border-default ml-4">
                      {group.posts.map((post) => (
                        <li key={post.id} className="group py-3 first:pt-0">
                          <Link href={`/blog/${post.slug}`} className="flex items-start gap-3">
                            {/* 날짜 */}
                            <span className="shrink-0 text-xs text-text-tertiary tabular-nums mt-0.5 w-6 text-right">
                              {post.publishedAt
                                ? String(post.publishedAt.getDate()).padStart(2, "0")
                                : "--"}
                            </span>
                            {/* 제목 + 메타 */}
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-text-primary group-hover:text-brand transition-colors">
                                {post.title}
                              </span>
                              {(post.series || post.tags.length > 0) && (
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  {post.series && (
                                    <Link
                                      href={`/series/${encodeURIComponent(post.series)}`}
                                      className="text-xs text-brand hover:underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {post.series}
                                    </Link>
                                  )}
                                  {post.tags.slice(0, 2).map((tag) => (
                                    <Link
                                      key={tag.id}
                                      href={`/tags/${encodeURIComponent(tag.name)}`}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Badge variant="default" className="text-xs">
                                        {tag.name}
                                      </Badge>
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
