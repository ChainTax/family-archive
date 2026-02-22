import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "감사 로그" };

const ACTION_LABELS: Record<string, string> = {
  CREATE: "생성",
  UPDATE: "수정",
  DELETE: "삭제",
  PUBLISH: "게시",
  VISIBILITY_CHANGE: "공개범위 변경",
};

const ENTITY_LABELS: Record<string, string> = {
  Post: "글",
  Album: "앨범",
  Photo: "사진",
  Place: "지도 핀",
  Milestone: "마일스톤",
  GuestbookEntry: "방명록",
  User: "사용자",
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") redirect("/admin");

  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1"));
  const take = 50;
  const skip = (page - 1) * take;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: { actor: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count(),
  ]);

  const totalPages = Math.ceil(total / take);

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">감사 로그</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          전체 {total.toLocaleString()}건 · {page}/{totalPages} 페이지
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-20 text-text-tertiary">
          <p className="font-medium">로그가 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border-default overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default bg-bg-secondary">
                <th className="text-left px-4 py-3 text-text-secondary font-medium">
                  시간
                </th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">
                  사용자
                </th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">
                  작업
                </th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">
                  대상
                </th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">
                  ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {logs.map((log: (typeof logs)[number]) => (
                <tr key={log.id} className="hover:bg-bg-secondary/50">
                  <td className="px-4 py-3 text-text-tertiary whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("ko-KR", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-text-primary font-medium">
                    {log.actor.name ?? log.actor.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        log.action === "DELETE"
                          ? "bg-red-50 text-red-600"
                          : log.action === "CREATE"
                          ? "bg-green-50 text-green-600"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {ACTION_LABELS[log.action] ?? log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {ENTITY_LABELS[log.entityType] ?? log.entityType}
                  </td>
                  <td className="px-4 py-3 text-text-tertiary font-mono text-xs truncate max-w-32">
                    {log.entityId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {page > 1 && (
            <a
              href={`/admin/audit?page=${page - 1}`}
              className="px-4 py-2 rounded-lg border border-border-default text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
            >
              이전
            </a>
          )}
          <span className="text-sm text-text-secondary">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/admin/audit?page=${page + 1}`}
              className="px-4 py-2 rounded-lg border border-border-default text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
            >
              다음
            </a>
          )}
        </div>
      )}
    </div>
  );
}
