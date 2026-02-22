"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button, Badge, Chip } from "@/components/ui";

type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";

interface Photo {
  id: string;
  url: string;
  thumbUrl: string;
  caption: string | null;
  width: number;
  height: number;
  order: number;
}

interface Album {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  visibility: Visibility;
  dateStart: string | null;
  dateEnd: string | null;
  photos: Photo[];
  tags: { id: string; name: string }[];
}

const VISIBILITY_OPTIONS: { value: Visibility; label: string }[] = [
  { value: "PRIVATE", label: "비공개" },
  { value: "UNLISTED", label: "링크 공유" },
  { value: "PUBLIC", label: "공개" },
];

const visibilityVariant: Record<Visibility, "success" | "info" | "default"> = {
  PUBLIC: "success",
  UNLISTED: "info",
  PRIVATE: "default",
};

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export default function AlbumDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);

  // edit form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("PRIVATE");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/albums/${id}`);
      if (!res.ok) { router.push("/admin/albums"); return; }
      const data: Album = await res.json();
      setAlbum(data);
      setTitle(data.title);
      setDescription(data.description ?? "");
      setDateStart(toDateInput(data.dateStart));
      setDateEnd(toDateInput(data.dateEnd));
      setVisibility(data.visibility);
      setTags(data.tags.map((t) => t.name));
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().replace(/,+$/, "");
      if (tag && !tags.includes(tag)) setTags((prev) => [...prev, tag]);
      setTagInput("");
    }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/albums/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, dateStart: dateStart || null, dateEnd: dateEnd || null, visibility, tags }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "저장 실패");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await fetch(`/api/admin/albums/${id}`, { method: "DELETE" });
      router.push("/admin/albums");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-border-default rounded-xl w-48" />
          <div className="h-64 bg-border-default rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!album) return null;

  return (
    <div className="p-8 max-w-4xl">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/albums"
          className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          앨범 목록
        </Link>
        <span className="text-text-tertiary">/</span>
        <span className="text-sm text-text-primary font-medium">{album.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── 수정 폼 ── */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-border-default p-6 space-y-5">
            <h2 className="text-base font-semibold text-text-primary">앨범 정보</h2>

            {/* 제목 */}
            <div>
              <label className="text-sm font-medium text-text-primary block mb-1">제목</label>
              <input
                className="w-full h-10 px-3 rounded-[10px] border border-border-default text-sm focus:outline-none focus:border-brand transition-colors"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* 설명 */}
            <div>
              <label className="text-sm font-medium text-text-primary block mb-1">설명 (선택)</label>
              <textarea
                className="w-full min-h-[80px] px-3 py-2 rounded-[10px] border border-border-default text-sm focus:outline-none focus:border-brand transition-colors resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* 날짜 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-text-primary block mb-1">시작일</label>
                <input type="date" className="w-full h-10 px-3 rounded-[10px] border border-border-default text-sm focus:outline-none focus:border-brand transition-colors" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary block mb-1">종료일</label>
                <input type="date" className="w-full h-10 px-3 rounded-[10px] border border-border-default text-sm focus:outline-none focus:border-brand transition-colors" value={dateEnd} min={dateStart || undefined} onChange={(e) => setDateEnd(e.target.value)} />
              </div>
            </div>

            {/* 태그 */}
            <div>
              <label className="text-sm font-medium text-text-primary block mb-1">태그</label>
              <div className="flex flex-wrap gap-1.5 min-h-[42px] px-3 py-2 rounded-[10px] border border-border-default bg-white focus-within:border-brand transition-colors">
                {tags.map((tag) => (
                  <Chip key={tag} onDismiss={() => setTags((prev) => prev.filter((t) => t !== tag))}>{tag}</Chip>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder={tags.length === 0 ? "태그 입력 후 Enter 또는 ," : ""}
                  className="flex-1 min-w-[120px] text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none bg-transparent"
                />
              </div>
              <p className="text-xs text-text-tertiary mt-1">Enter 또는 쉼표(,)로 추가, Backspace로 삭제</p>
            </div>

            {/* 공개 범위 */}
            <div>
              <label className="text-sm font-medium text-text-primary block mb-2">공개 범위</label>
              <div className="flex gap-2">
                {VISIBILITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVisibility(opt.value)}
                    className={[
                      "flex-1 py-2 rounded-[10px] text-sm font-medium border transition-colors",
                      visibility === opt.value
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-border-default bg-white text-text-secondary hover:bg-bg-secondary",
                    ].join(" ")}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 저장 */}
            {saveError && <p className="text-sm text-red-500">{saveError}</p>}
            <div className="flex items-center gap-3 pt-1">
              <Button variant="primary" onClick={handleSave} loading={saving} disabled={!title.trim()}>
                저장
              </Button>
              {saved && <span className="text-sm text-green-600">저장되었습니다</span>}
            </div>
          </div>

          {/* 삭제 */}
          <div className="bg-white rounded-2xl border border-red-100 p-6">
            <h2 className="text-base font-semibold text-red-600 mb-2">앨범 삭제</h2>
            <p className="text-sm text-text-secondary mb-4">앨범과 포함된 모든 사진이 영구 삭제됩니다. 이 작업은 되돌릴 수 없습니다.</p>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              loading={deleting}
            >
              {confirmDelete ? "정말 삭제하시겠습니까? 다시 클릭하면 삭제됩니다" : "앨범 삭제"}
            </Button>
          </div>
        </div>

        {/* ── 사이드 정보 ── */}
        <div className="space-y-5">
          {/* 커버 + 메타 */}
          <div className="bg-white rounded-2xl border border-border-default p-5">
            {album.coverUrl && (
              <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-bg-secondary mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-tertiary">공개 범위</span>
                <Badge variant={visibilityVariant[album.visibility]}>
                  {VISIBILITY_OPTIONS.find((o) => o.value === album.visibility)?.label}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-tertiary">사진 수</span>
                <span className="font-medium text-text-primary">{album.photos.length}장</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-tertiary">슬러그</span>
                <span className="text-xs font-mono text-text-secondary truncate max-w-[120px]">{album.slug}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border-default">
              <Link
                href={`/albums/${album.slug}`}
                target="_blank"
                className="flex items-center gap-1.5 text-sm text-brand hover:text-brand-hover transition-colors"
              >
                공개 페이지 보기
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* 사진 썸네일 그리드 */}
          {album.photos.length > 0 && (
            <div className="bg-white rounded-2xl border border-border-default p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3">사진 ({album.photos.length})</h3>
              <div className="grid grid-cols-3 gap-1.5">
                {album.photos.slice(0, 9).map((photo) => (
                  <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-bg-secondary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.thumbUrl} alt={photo.caption ?? ""} className="w-full h-full object-cover" />
                  </div>
                ))}
                {album.photos.length > 9 && (
                  <div className="aspect-square rounded-lg bg-bg-secondary flex items-center justify-center">
                    <span className="text-xs text-text-tertiary">+{album.photos.length - 9}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
