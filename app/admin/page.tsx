import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = { title: "대시보드" };

export default async function AdminDashboardPage() {
  const session = await auth();

  let postCount = 0, albumCount = 0, photoCount = 0, pendingGuestbook = 0, milestoneCount = 0;
  try {
    [postCount, albumCount, photoCount, pendingGuestbook, milestoneCount] =
      await Promise.all([
        prisma.post.count({ where: { status: "PUBLISHED" } }),
        prisma.album.count(),
        prisma.photo.count(),
        prisma.guestbookEntry.count({ where: { approved: false } }),
        prisma.milestone.count(),
      ]);
  } catch {
    // DB 미연결 시 0으로 표시
  }

  const stats = [
    { label: "게시된 글", value: postCount, href: "/admin/posts" },
    { label: "전체 앨범", value: albumCount, href: "/admin/albums" },
    { label: "사진 수", value: photoCount, href: "/admin/albums" },
    {
      label: "미승인 방명록",
      value: pendingGuestbook,
      href: "/admin/guestbook",
      highlight: pendingGuestbook > 0,
    },
    { label: "마일스톤", value: milestoneCount, href: "/admin/milestones" },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-text-primary">대시보드</h1>
      <p className="mt-1 text-text-secondary">
        안녕하세요, {session?.user?.name ?? session?.user?.email}님.
      </p>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <div
              className={`rounded-2xl border p-5 transition-all hover:shadow-sm hover:border-brand/30 ${
                stat.highlight
                  ? "border-amber-300 bg-amber-50"
                  : "border-border-default bg-white"
              }`}
            >
              <p className="text-sm text-text-secondary">{stat.label}</p>
              <p
                className={`text-3xl font-bold mt-1 ${
                  stat.highlight ? "text-amber-600" : "text-text-primary"
                }`}
              >
                {stat.value.toLocaleString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
