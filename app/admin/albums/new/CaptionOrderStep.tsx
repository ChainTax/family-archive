"use client";

import { Button } from "@/components/ui";
import type { PhotoItem } from "./AlbumWizard";

interface Props {
  photos: PhotoItem[];
  coverIndex: number;
  onPhotosChange: (photos: PhotoItem[]) => void;
  onCoverChange: (index: number) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | null;
}

export function CaptionOrderStep({
  photos,
  coverIndex,
  onPhotosChange,
  onCoverChange,
  onBack,
  onSubmit,
  submitting,
  submitError,
}: Props) {
  const updateCaption = (tempId: string, caption: string) =>
    onPhotosChange(photos.map((p) => (p.tempId === tempId ? { ...p, caption } : p)));

  const moveUp = (i: number) => {
    if (i === 0) return;
    const next = [...photos];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    // 표지 인덱스도 이동
    if (coverIndex === i) onCoverChange(i - 1);
    else if (coverIndex === i - 1) onCoverChange(i);
    onPhotosChange(next);
  };

  const moveDown = (i: number) => {
    if (i === photos.length - 1) return;
    const next = [...photos];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    if (coverIndex === i) onCoverChange(i + 1);
    else if (coverIndex === i + 1) onCoverChange(i);
    onPhotosChange(next);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary">
        사진 순서를 조정하고 캡션을 입력하세요.
        첫 번째 사진이 앨범 표지가 되며, <strong>표지로 설정</strong> 버튼으로 변경할 수 있습니다.
      </p>

      {photos.length === 0 ? (
        <div className="py-12 text-center text-text-tertiary">
          <p>업로드된 사진이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {photos.map((photo, i) => (
            <div
              key={photo.tempId}
              className={[
                "flex gap-3 p-3 rounded-2xl border transition-colors",
                i === coverIndex
                  ? "border-brand bg-[#EEF4FE]"
                  : "border-border-default bg-white",
              ].join(" ")}
            >
              {/* 썸네일 */}
              <div className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-bg-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.thumbUrl} alt="" className="w-full h-full object-cover" />
                {i === coverIndex && (
                  <div className="absolute inset-x-0 bottom-0 bg-brand/80 text-white text-[10px] font-semibold text-center py-0.5">
                    표지
                  </div>
                )}
              </div>

              {/* 캡션 + 컨트롤 */}
              <div className="flex-1 flex flex-col gap-2 min-w-0">
                <textarea
                  className="w-full flex-1 px-3 py-2 rounded-lg border border-border-default bg-white text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand transition-colors resize-none"
                  placeholder="캡션 입력 (선택)"
                  value={photo.caption}
                  onChange={(e) => updateCaption(photo.tempId, e.target.value)}
                  rows={2}
                />
                <div className="flex items-center gap-2 flex-wrap">
                  {/* 이동 버튼 */}
                  <button
                    type="button"
                    onClick={() => moveUp(i)}
                    disabled={i === 0}
                    className="h-7 px-2.5 text-xs rounded-lg border border-border-default text-text-secondary hover:bg-bg-secondary disabled:opacity-30 transition-colors"
                  >
                    ↑ 위로
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(i)}
                    disabled={i === photos.length - 1}
                    className="h-7 px-2.5 text-xs rounded-lg border border-border-default text-text-secondary hover:bg-bg-secondary disabled:opacity-30 transition-colors"
                  >
                    ↓ 아래로
                  </button>
                  {/* 표지 설정 */}
                  {i !== coverIndex && (
                    <button
                      type="button"
                      onClick={() => onCoverChange(i)}
                      className="h-7 px-2.5 text-xs rounded-lg border border-brand text-brand hover:bg-[#EEF4FE] transition-colors"
                    >
                      표지로 설정
                    </button>
                  )}
                </div>
              </div>

              {/* 번호 */}
              <div className="shrink-0 text-xs text-text-tertiary font-medium w-5 text-right pt-1">
                {i + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 에러 메시지 */}
      {submitError && (
        <div className="px-4 py-3 rounded-xl bg-[#FFF0F0] border border-[#FFCDD2] text-sm text-[#FF4B4B]">
          {submitError}
        </div>
      )}

      {/* 이전 / 게시 */}
      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack} size="lg" disabled={submitting}>
          이전
        </Button>
        <Button onClick={onSubmit} loading={submitting} size="lg">
          앨범 저장
        </Button>
      </div>
    </div>
  );
}
