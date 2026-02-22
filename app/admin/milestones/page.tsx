"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Badge, Modal } from "@/components/ui";

type MilestoneType =
  | "BIRTHDAY"
  | "ANNIVERSARY"
  | "GROWTH"
  | "FIRST_EXPERIENCE"
  | "OTHER";

type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";

type Milestone = {
  id: string;
  type: MilestoneType;
  title: string;
  date: string;
  notes: string | null;
  visibility: Visibility;
  createdAt: string;
};

type FormData = {
  type: MilestoneType;
  title: string;
  date: string;
  notes: string;
  visibility: Visibility;
};

const TYPE_LABELS: Record<MilestoneType, string> = {
  BIRTHDAY: "생일",
  ANNIVERSARY: "기념일",
  GROWTH: "성장",
  FIRST_EXPERIENCE: "첫 경험",
  OTHER: "기타",
};

const VISIBILITY_LABELS: Record<Visibility, string> = {
  PUBLIC: "공개",
  UNLISTED: "링크 공유",
  PRIVATE: "가족 전용",
};

const defaultForm = (): FormData => ({
  type: "OTHER",
  title: "",
  date: new Date().toISOString().slice(0, 10),
  notes: "",
  visibility: "PRIVATE",
});

function toInputDate(iso: string) {
  return iso.slice(0, 10);
}

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/milestones")
      .then((r) => r.json())
      .then(setMilestones)
      .finally(() => setLoading(false));
  }, []);

  const openCreate = useCallback(() => {
    setForm(defaultForm());
    setEditingId(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((m: Milestone) => {
    setForm({
      type: m.type,
      title: m.title,
      date: toInputDate(m.date),
      notes: m.notes ?? "",
      visibility: m.visibility,
    });
    setEditingId(m.id);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingId(null);
  }, []);

  const handleSave = async () => {
    if (!form.title.trim() || !form.date) return;
    setSaving(true);
    try {
      const body = {
        type: form.type,
        title: form.title,
        date: form.date,
        notes: form.notes,
        visibility: form.visibility,
      };
      if (editingId) {
        await fetch(`/api/admin/milestones/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        setMilestones((prev) =>
          prev.map((m) =>
            m.id === editingId
              ? { ...m, ...body, date: new Date(body.date).toISOString() }
              : m
          )
        );
      } else {
        const res = await fetch("/api/admin/milestones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const { id } = await res.json();
        const newMilestone: Milestone = {
          id,
          ...body,
          date: new Date(body.date).toISOString(),
          notes: body.notes || null,
          createdAt: new Date().toISOString(),
        };
        setMilestones((prev) => [newMilestone, ...prev]);
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
      const res = await fetch(`/api/admin/milestones/${editingId}`, {
        method: "DELETE",
      });
      if (!res.ok) return;
      setMilestones((prev) => prev.filter((m) => m.id !== editingId));
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">마일스톤</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            가족의 특별한 순간을 기록합니다.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreate}>
          + 마일스톤 추가
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-border-default p-5 animate-pulse h-20"
            />
          ))}
        </div>
      ) : milestones.length === 0 ? (
        <div className="text-center py-20 text-text-tertiary">
          <p className="text-4xl mb-3">🎉</p>
          <p className="font-medium">아직 마일스톤이 없어요</p>
          <p className="text-sm mt-1">가족의 첫 번째 기록을 남겨보세요.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {milestones.map((m) => (
            <li key={m.id}>
              <button
                className="w-full text-left bg-white rounded-2xl border border-border-default p-5 hover:border-brand/30 hover:shadow-sm transition-all"
                onClick={() => openEdit(m)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-text-primary">
                        {m.title}
                      </span>
                      <Badge variant="default">{TYPE_LABELS[m.type]}</Badge>
                      <Badge
                        variant={
                          m.visibility === "PUBLIC"
                            ? "success"
                            : m.visibility === "UNLISTED"
                            ? "default"
                            : "warning"
                        }
                      >
                        {VISIBILITY_LABELS[m.visibility]}
                      </Badge>
                    </div>
                    {m.notes && (
                      <p className="text-sm text-text-secondary mt-1 truncate">
                        {m.notes}
                      </p>
                    )}
                  </div>
                  <time className="text-sm text-text-tertiary shrink-0">
                    {new Date(m.date).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 마일스톤 편집 모달 */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? "마일스톤 수정" : "새 마일스톤"}
        size="md"
        footer={
          <div className="flex justify-between w-full">
            {editingId ? (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                loading={saving}
              >
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
                disabled={!form.title.trim() || !form.date}
              >
                저장
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {/* 제목 */}
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1">
              제목
            </label>
            <input
              className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="예: 첫 걸음마"
            />
          </div>

          {/* 유형 */}
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1">
              유형
            </label>
            <select
              className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({ ...f, type: e.target.value as MilestoneType }))
              }
            >
              {(Object.keys(TYPE_LABELS) as MilestoneType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          {/* 날짜 */}
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1">
              날짜
            </label>
            <input
              type="date"
              className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              value={form.date}
              onChange={(e) =>
                setForm((f) => ({ ...f, date: e.target.value }))
              }
            />
          </div>

          {/* 공개 범위 */}
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1">
              공개 범위
            </label>
            <select
              className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
              value={form.visibility}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  visibility: e.target.value as Visibility,
                }))
              }
            >
              <option value="PUBLIC">공개</option>
              <option value="UNLISTED">링크 공유</option>
              <option value="PRIVATE">가족 전용</option>
            </select>
          </div>

          {/* 메모 */}
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1">
              메모 (선택)
            </label>
            <textarea
              className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
              rows={3}
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder="기억하고 싶은 이야기를 적어보세요"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
