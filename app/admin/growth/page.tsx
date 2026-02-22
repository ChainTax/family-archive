"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Badge, Modal } from "@/components/ui";

type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";

interface GrowthRecord {
  id: string;
  date: string;
  height: number | null;
  weight: number | null;
  label: string | null;
  visibility: Visibility;
}

interface FormData {
  date: string;
  height: string;
  weight: string;
  label: string;
  visibility: Visibility;
}

const VISIBILITY_LABELS: Record<Visibility, string> = {
  PUBLIC: "공개",
  UNLISTED: "링크 공유",
  PRIVATE: "가족 전용",
};

const defaultForm = (): FormData => ({
  date: new Date().toISOString().slice(0, 10),
  height: "",
  weight: "",
  label: "",
  visibility: "PRIVATE",
});

export default function GrowthPage() {
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/growth");
    const data = await res.json();
    // 최신순 정렬로 표시
    setRecords([...data].reverse());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm(defaultForm());
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (r: GrowthRecord) => {
    setForm({
      date: r.date.slice(0, 10),
      height: r.height != null ? String(r.height) : "",
      weight: r.weight != null ? String(r.weight) : "",
      label: r.label ?? "",
      visibility: r.visibility,
    });
    setEditingId(r.id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.date) return;
    const h = form.height ? parseFloat(form.height) : null;
    const w = form.weight ? parseFloat(form.weight) : null;
    if (h == null && w == null) return;

    setSaving(true);
    try {
      const body = {
        date: form.date,
        height: h,
        weight: w,
        label: form.label || undefined,
        visibility: form.visibility,
      };
      if (editingId) {
        const res = await fetch(`/api/admin/growth/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const updated = await res.json();
        setRecords((prev) =>
          prev.map((r) => (r.id === editingId ? updated : r))
        );
      } else {
        const res = await fetch("/api/admin/growth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const created = await res.json();
        setRecords((prev) => [created, ...prev]);
      }
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/growth/${editingId}`, { method: "DELETE" });
      setRecords((prev) => prev.filter((r) => r.id !== editingId));
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const canSave =
    !!form.date && (form.height.trim() !== "" || form.weight.trim() !== "");

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">성장 기록</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            날짜별 키·몸무게를 기록합니다.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreate}>
          + 기록 추가
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white rounded-2xl border border-border-default animate-pulse" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-20 text-text-tertiary">
          <p className="text-4xl mb-3">📏</p>
          <p className="font-medium">아직 기록이 없어요</p>
          <p className="text-sm mt-1">첫 번째 성장 기록을 추가해보세요.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <button
              key={r.id}
              className="w-full text-left bg-white rounded-2xl border border-border-default px-5 py-4 hover:border-brand/30 hover:shadow-sm transition-all"
              onClick={() => openEdit(r)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <time className="text-sm font-semibold text-text-primary whitespace-nowrap">
                    {new Date(r.date).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  {r.label && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand/10 text-brand">
                      {r.label}
                    </span>
                  )}
                  <div className="flex items-center gap-3 text-sm text-text-secondary">
                    {r.height != null && (
                      <span className="flex items-center gap-1">
                        <span className="text-text-tertiary text-xs">키</span>
                        <span className="font-medium text-text-primary">{r.height} cm</span>
                      </span>
                    )}
                    {r.weight != null && (
                      <span className="flex items-center gap-1">
                        <span className="text-text-tertiary text-xs">몸무게</span>
                        <span className="font-medium text-text-primary">{r.weight} kg</span>
                      </span>
                    )}
                  </div>
                </div>
                <Badge
                  variant={
                    r.visibility === "PUBLIC"
                      ? "success"
                      : r.visibility === "UNLISTED"
                      ? "info"
                      : "default"
                  }
                >
                  {VISIBILITY_LABELS[r.visibility]}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 추가/수정 모달 */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? "기록 수정" : "새 기록"}
        size="md"
        footer={
          <div className="flex justify-between w-full">
            {editingId ? (
              <Button variant="danger" size="sm" onClick={handleDelete} loading={saving}>
                삭제
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={closeModal}>
                취소
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                loading={saving}
                disabled={!canSave}
              >
                저장
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {/* 날짜 */}
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1">측정일</label>
            <input
              type="date"
              className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </div>

          {/* 키 / 몸무게 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-text-primary block mb-1">
                키 <span className="text-text-tertiary font-normal">(cm)</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="300"
                placeholder="예: 75.3"
                className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                value={form.height}
                onChange={(e) => set("height", e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-primary block mb-1">
                몸무게 <span className="text-text-tertiary font-normal">(kg)</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="500"
                placeholder="예: 9.2"
                className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                value={form.weight}
                onChange={(e) => set("weight", e.target.value)}
              />
            </div>
          </div>

          {/* 라벨 */}
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1">
              메모 <span className="text-text-tertiary font-normal">(선택)</span>
            </label>
            <input
              type="text"
              placeholder='예: 출생, 100일, 돌, 6개월'
              className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              value={form.label}
              onChange={(e) => set("label", e.target.value)}
            />
          </div>

          {/* 공개 범위 */}
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1">공개 범위</label>
            <select
              className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
              value={form.visibility}
              onChange={(e) => set("visibility", e.target.value as Visibility)}
            >
              <option value="PRIVATE">가족 전용</option>
              <option value="UNLISTED">링크 공유</option>
              <option value="PUBLIC">공개</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
