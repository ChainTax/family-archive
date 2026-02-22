import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GrowthChart } from "@/components/growth/GrowthChart";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "성장기록 | 재린월드" };

export default async function GrowthPage() {
  const session = await auth();

  // 비로그인 → PUBLIC 기록만, 로그인 → 전체 기록
  let records: Array<{
    id: string;
    date: Date;
    height: number | null;
    weight: number | null;
    label: string | null;
  }> = [];

  try {
    records = await prisma.growthRecord.findMany({
      where: session ? undefined : { visibility: "PUBLIC" },
      orderBy: { date: "asc" },
      select: { id: true, date: true, height: true, weight: true, label: true },
    });
  } catch {
    // DB 미연결
  }

  // 공개 기록이 없고 비로그인 → 로그인 유도
  if (!session && records.length === 0) {
    redirect("/login?callbackUrl=/growth");
  }

  // 최신 실측값
  const latest = [...records].reverse();
  const latestHeight = latest.find((r) => r.height != null);
  const latestWeight = latest.find((r) => r.weight != null);

  // serialized (Date → string)
  const serialized = records.map((r) => ({
    id: r.id,
    date: r.date.toISOString(),
    height: r.height,
    weight: r.weight,
    label: r.label,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-bold text-text-primary mb-2">성장기록</h1>
      <p className="text-text-secondary mb-8">출생부터 현재까지의 성장 과정을 기록합니다.</p>

      {/* 최근 측정값 카드 */}
      {(latestHeight || latestWeight) && (
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 mb-10">
          {latestHeight && (
            <div className="bg-bg-secondary rounded-2xl border border-border-default px-5 py-4">
              <p className="text-xs text-text-tertiary mb-1">최근 키</p>
              <p className="text-3xl font-bold text-brand">
                {latestHeight.height}
                <span className="text-base font-normal text-text-tertiary ml-1">cm</span>
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                {new Date(latestHeight.date).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}
          {latestWeight && (
            <div className="bg-bg-secondary rounded-2xl border border-border-default px-5 py-4">
              <p className="text-xs text-text-tertiary mb-1">최근 몸무게</p>
              <p className="text-3xl font-bold text-[#7A8ECC]">
                {latestWeight.weight}
                <span className="text-base font-normal text-text-tertiary ml-1">kg</span>
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                {new Date(latestWeight.date).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 차트 */}
      <div className="bg-white rounded-2xl border border-border-default p-5 sm:p-8">
        <GrowthChart records={serialized} />
      </div>

    </div>
  );
}
