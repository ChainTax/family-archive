import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const revalidate = 60;
export const metadata: Metadata = { title: "마일스톤 | 재린월드" };

const TYPE_LABELS: Record<string, string> = {
  BIRTHDAY: "생일",
  ANNIVERSARY: "기념일",
  GROWTH: "성장",
  FIRST_EXPERIENCE: "첫 경험",
  OTHER: "기타",
};

const TYPE_COLORS: Record<string, string> = {
  BIRTHDAY: "bg-pink-100 text-pink-700",
  ANNIVERSARY: "bg-purple-100 text-purple-700",
  GROWTH: "bg-green-100 text-green-700",
  FIRST_EXPERIENCE: "bg-blue-100 text-blue-700",
  OTHER: "bg-brand/10 text-brand",
};

export default async function MilestonesPage() {
  let milestones: Array<{
    id: string;
    type: string;
    title: string;
    date: Date;
    notes: string | null;
  }> = [];

  try {
    milestones = await prisma.milestone.findMany({
      where: { visibility: "PUBLIC" },
      orderBy: { date: "desc" },
      select: {
        id: true,
        type: true,
        title: true,
        date: true,
        notes: true,
      },
    });
  } catch {
    // DB 미연결 시 빈 목록
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-bold text-text-primary mb-2">마일스톤</h1>
      <p className="text-text-secondary mb-10">가족의 소중한 순간들을 기록합니다.</p>

      {milestones.length === 0 ? (
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
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <p className="text-text-tertiary text-sm">아직 공개된 마일스톤이 없어요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-4 p-5 bg-bg-secondary rounded-2xl border border-border-default"
            >
              <span
                className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  TYPE_COLORS[m.type] ?? TYPE_COLORS.OTHER
                }`}
              >
                {TYPE_LABELS[m.type] ?? m.type}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary">{m.title}</p>
                {m.notes && (
                  <p className="text-sm text-text-secondary mt-0.5 line-clamp-2">
                    {m.notes}
                  </p>
                )}
              </div>
              <p className="shrink-0 text-xs text-text-tertiary whitespace-nowrap">
                {new Date(m.date).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
