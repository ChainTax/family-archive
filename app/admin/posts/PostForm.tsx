"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Button, Chip, Badge } from "@/components/ui";
import { RichEditor } from "@/components/editor/RichEditor";

type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";
type PostStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED";

export interface PostFormInitial {
  id?: string;
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  coverUrl?: string;
  visibility?: Visibility;
  status?: PostStatus;
  scheduledAt?: string;
  series?: string;
  tags?: string[];
}

interface Props {
  initial?: PostFormInitial;
}

function toSlug(title: string): string {
  return (
    title.trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9가-힣-]/gi, "")
      .replace(/-+/g, "-")
      .slice(0, 60) +
    "-" + Date.now().toString(36)
  );
}

const VISIBILITY_OPTIONS: { value: Visibility; label: string }[] = [
  { value: "PRIVATE", label: "비공개" },
  { value: "UNLISTED", label: "링크공유" },
  { value: "PUBLIC", label: "공개" },
];

export function PostForm({ initial }: Props) {
  const router = useRouter();
  const isEdit = !!initial?.id;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl ?? "");
  const [visibility, setVisibility] = useState<Visibility>(initial?.visibility ?? "PRIVATE");
  const [scheduledAt, setScheduledAt] = useState(initial?.scheduledAt ?? "");
  const [series, setSeries] = useState(initial?.series ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (!isEdit) setSlug(v ? toSlug(v) : "");
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().replace(/,+$/, "");
      if (tag && !tags.includes(tag)) setTags((prev) => [...prev, tag]);
      setTagInput("");
    }
  };

  const handleCoverUpload = async (file: File) => {
    setCoverUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json()).error);
      const { url } = await res.json();
      setCoverUrl(url);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "커버 업로드 실패");
    } finally {
      setCoverUploading(false);
    }
  };

  const save = async (status: PostStatus) => {
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        title, slug, content, excerpt, coverUrl, visibility, status,
        scheduledAt: scheduledAt || undefined,
        series: series || undefined,
        tags,
      };

      const url = isEdit ? `/api/admin/posts/${initial!.id}` : "/api/admin/posts";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "저장 실패");
      }

      router.push("/admin/posts");
      router.refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "알 수 없는 오류");
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ─── 본문 영역 ─── */}
      <div className="flex-1 space-y-4 min-w-0">
        {/* 제목 */}
        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full text-2xl font-bold text-text-primary placeholder:text-text-tertiary bg-transparent border-none outline-none py-2"
          autoFocus
        />

        {/* 에디터 */}
        <RichEditor
          value={content}
          onChange={setContent}
          placeholder="내용을 입력하세요…"
        />
      </div>

      {/* ─── 메타 사이드바 ─── */}
      <aside className="w-full lg:w-64 shrink-0 space-y-5">

        {/* 저장 버튼 */}
        <div className="flex flex-col gap-2">
          <Button fullWidth onClick={() => save("PUBLISHED")} loading={saving} size="md">
            발행하기
          </Button>
          <Button fullWidth variant="secondary" onClick={() => save("DRAFT")} disabled={saving} size="md">
            임시저장
          </Button>
          {isEdit && (
            <Button fullWidth variant="ghost" onClick={() => router.back()} disabled={saving} size="md">
              취소
            </Button>
          )}
          {saveError && (
            <p className="text-xs text-[#FF4B4B] px-1">{saveError}</p>
          )}
        </div>

        <hr className="border-border-default" />

        {/* 공개 범위 */}
        <div>
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-2">공개 범위</p>
          <div className="flex gap-1.5 flex-wrap">
            {VISIBILITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setVisibility(opt.value)}
                className={[
                  "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                  visibility === opt.value
                    ? "bg-brand text-white border-brand"
                    : "text-text-secondary border-border-default hover:border-border-strong",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 슬러그 */}
        <Input
          label="슬러그"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          helperText="/posts/ 뒤에 붙는 주소"
        />

        {/* 커버 이미지 */}
        <div>
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-2">커버 이미지</p>
          {coverUrl ? (
            <div className="relative group rounded-lg overflow-hidden aspect-video bg-bg-secondary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverUrl} alt="커버" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setCoverUrl("")}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              >✕</button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={coverUploading}
              className="w-full aspect-video rounded-lg border-2 border-dashed border-border-default flex flex-col items-center justify-center gap-1 text-text-tertiary hover:border-brand hover:text-brand transition-colors text-sm"
            >
              {coverUploading ? (
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span className="text-xs">커버 이미지 업로드</span>
                </>
              )}
            </button>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])}
          />
        </div>

        {/* 요약 */}
        <div>
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-2">요약 (선택)</p>
          <textarea
            className="w-full px-3 py-2 rounded-[10px] border border-border-default bg-white text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand transition-colors resize-none"
            placeholder="검색·미리보기에 표시될 요약"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
          />
        </div>

        {/* 태그 */}
        <div>
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-2">태그</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((tag) => (
              <Chip key={tag} onDismiss={() => setTags(tags.filter((t) => t !== tag))}>
                {tag}
              </Chip>
            ))}
          </div>
          <input
            type="text"
            placeholder="입력 후 Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            className="w-full h-9 px-3 rounded-[10px] border border-border-default text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand transition-colors bg-white"
          />
        </div>

        {/* 시리즈 */}
        <Input
          label="시리즈"
          placeholder="예: 제주도 여행기"
          value={series}
          onChange={(e) => setSeries(e.target.value)}
        />

        {/* 예약 발행 */}
        <div>
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-2">예약 발행</p>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full h-10 px-3 rounded-[10px] border border-border-default text-sm text-text-primary focus:outline-none focus:border-brand transition-colors bg-white"
          />
        </div>
      </aside>
    </div>
  );
}
