"use client";

import { useState } from "react";
import { Input, Button, Chip } from "@/components/ui";
import type { BasicInfo, Visibility } from "./AlbumWizard";

interface Props {
  data: BasicInfo;
  onChange: (data: BasicInfo) => void;
  onNext: () => void;
}

function toSlug(title: string): string {
  return (
    title
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9가-힣-]/gi, "")
      .replace(/-+/g, "-")
      .slice(0, 60) +
    "-" +
    Date.now().toString(36)
  );
}

const VISIBILITY_OPTIONS: { value: Visibility; label: string; desc: string }[] = [
  { value: "PRIVATE", label: "비공개", desc: "로그인한 가족만 볼 수 있습니다" },
  { value: "UNLISTED", label: "링크 공유", desc: "링크가 있는 사람만 볼 수 있습니다" },
  { value: "PUBLIC", label: "공개", desc: "누구나 검색·목록에서 볼 수 있습니다" },
];

export function BasicInfoStep({ data, onChange, onNext }: Props) {
  const [tagInput, setTagInput] = useState("");

  const set = <K extends keyof BasicInfo>(k: K, v: BasicInfo[K]) =>
    onChange({ ...data, [k]: v });

  const handleTitleChange = (title: string) => {
    onChange({
      ...data,
      title,
      slug: title ? toSlug(title) : "",
    });
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().replace(/,+$/, "");
      if (tag && !data.tags.includes(tag)) {
        onChange({ ...data, tags: [...data.tags, tag] });
      }
      setTagInput("");
    }
    if (e.key === "Backspace" && !tagInput && data.tags.length > 0) {
      onChange({ ...data, tags: data.tags.slice(0, -1) });
    }
  };

  const removeTag = (tag: string) => {
    onChange({ ...data, tags: data.tags.filter((t) => t !== tag) });
  };

  const canProceed = data.title.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* 제목 */}
      <Input
        label="앨범 제목"
        placeholder="예: 2024 제주도 여행"
        value={data.title}
        onChange={(e) => handleTitleChange(e.target.value)}
        autoFocus
      />

      {/* 슬러그 */}
      <Input
        label="URL 슬러그"
        placeholder="slug"
        value={data.slug}
        onChange={(e) => set("slug", e.target.value)}
        helperText="앨범 URL에 사용됩니다. 자동 생성되며 직접 수정할 수 있습니다."
        prefix={<span className="text-xs">/albums/</span>}
      />

      {/* 설명 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-primary">설명 (선택)</label>
        <textarea
          className="w-full min-h-[90px] px-3 py-2.5 rounded-[10px] border border-border-default bg-white text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand transition-colors resize-none"
          placeholder="앨범에 대한 간단한 설명을 적어주세요"
          value={data.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      {/* 날짜 범위 */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="시작일"
          type="date"
          value={data.dateStart}
          onChange={(e) => set("dateStart", e.target.value)}
        />
        <Input
          label="종료일"
          type="date"
          value={data.dateEnd}
          onChange={(e) => set("dateEnd", e.target.value)}
          min={data.dateStart || undefined}
        />
      </div>

      {/* 태그 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text-primary">태그 (선택)</label>
        <div className="flex flex-wrap gap-1.5 min-h-[42px] px-3 py-2 rounded-[10px] border border-border-default bg-white focus-within:border-brand transition-colors">
          {data.tags.map((tag) => (
            <Chip key={tag} onDismiss={() => removeTag(tag)}>{tag}</Chip>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder={data.tags.length === 0 ? "태그 입력 후 Enter 또는 , " : ""}
            className="flex-1 min-w-[120px] text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none bg-transparent"
          />
        </div>
        <p className="text-xs text-text-tertiary">Enter 또는 쉼표(,)로 태그를 추가합니다. Backspace로 마지막 태그를 삭제합니다.</p>
      </div>

      {/* 공개 범위 */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">공개 범위</label>
        <div className="space-y-2">
          {VISIBILITY_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={[
                "flex items-start gap-3 p-3 rounded-[10px] border cursor-pointer transition-colors",
                data.visibility === opt.value
                  ? "border-brand bg-[#EEF4FE]"
                  : "border-border-default bg-white hover:bg-bg-secondary",
              ].join(" ")}
            >
              <input
                type="radio"
                className="mt-0.5 accent-brand"
                name="visibility"
                value={opt.value}
                checked={data.visibility === opt.value}
                onChange={() => set("visibility", opt.value)}
              />
              <div>
                <p className="text-sm font-medium text-text-primary">{opt.label}</p>
                <p className="text-xs text-text-secondary">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 다음 버튼 */}
      <div className="flex justify-end pt-2">
        <Button onClick={onNext} disabled={!canProceed} size="lg">
          다음 — 사진 업로드
        </Button>
      </div>
    </div>
  );
}
