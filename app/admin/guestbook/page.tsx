"use client";

import { useState, useEffect } from "react";
import { Button, Badge } from "@/components/ui";

type GuestbookEntry = {
  id: string;
  name: string;
  message: string;
  approved: boolean;
  createdAt: string;
};

export default function AdminGuestbookPage() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  useEffect(() => {
    fetch("/api/admin/guestbook")
      .then((r) => r.json())
      .then(setEntries)
      .finally(() => setLoading(false));
  }, []);

  const approve = async (id: string) => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/guestbook/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true }),
      });
      if (res.ok) {
        setEntries((prev) =>
          prev.map((e) => (e.id === id ? { ...e, approved: true } : e))
        );
      }
    } finally {
      setProcessing(null);
    }
  };

  const remove = async (id: string) => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/guestbook/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
      }
    } finally {
      setProcessing(null);
    }
  };

  const filtered = entries.filter((e) => {
    if (filter === "pending") return !e.approved;
    if (filter === "approved") return e.approved;
    return true;
  });

  const pendingCount = entries.filter((e) => !e.approved).length;

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">방명록 관리</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {pendingCount > 0 ? (
              <span className="text-amber-600 font-medium">
                미승인 {pendingCount}건 대기 중
              </span>
            ) : (
              "모든 방명록이 검토되었습니다."
            )}
          </p>
        </div>
        {/* 필터 탭 */}
        <div className="flex rounded-lg border border-border-default overflow-hidden">
          {(["all", "pending", "approved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm transition-colors ${
                filter === f
                  ? "bg-brand text-white"
                  : "bg-white text-text-secondary hover:bg-bg-secondary"
              }`}
            >
              {f === "all" ? "전체" : f === "pending" ? "미승인" : "승인됨"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-border-default p-5 animate-pulse h-28"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-text-tertiary">
          <p className="font-medium">방명록이 없어요</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((entry) => (
            <li
              key={entry.id}
              className={`bg-white rounded-2xl border p-5 ${
                entry.approved ? "border-border-default" : "border-amber-200 bg-amber-50/30"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-text-primary text-sm">
                      {entry.name}
                    </span>
                    <Badge variant={entry.approved ? "success" : "warning"}>
                      {entry.approved ? "승인됨" : "미승인"}
                    </Badge>
                    <time className="text-xs text-text-tertiary">
                      {new Date(entry.createdAt).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                  <p className="text-sm text-text-secondary whitespace-pre-wrap">
                    {entry.message}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!entry.approved && (
                    <Button
                      variant="primary"
                      size="sm"
                      loading={processing === entry.id}
                      onClick={() => approve(entry.id)}
                    >
                      승인
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    loading={processing === entry.id}
                    onClick={() => remove(entry.id)}
                  >
                    삭제
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
