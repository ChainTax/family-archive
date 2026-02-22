"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import type { PhotoItem } from "./AlbumWizard";

interface UploadState {
  tempId: string;
  fileName: string;
  status: "uploading" | "done" | "error";
  error?: string;
  thumbUrl?: string;
}

interface Props {
  photos: PhotoItem[];
  onAdd: (photo: PhotoItem) => void;
  onRemove: (tempId: string) => void;
  onBack: () => void;
  onNext: () => void;
}

const MAX_PHOTOS = 50;

export function PhotoUploadStep({ photos, onAdd, onRemove, onBack, onNext }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadState[]>([]);

  const isUploading = uploads.some((u) => u.status === "uploading");

  const updateUpload = (tempId: string, patch: Partial<UploadState>) =>
    setUploads((prev) => prev.map((u) => (u.tempId === tempId ? { ...u, ...patch } : u)));

  const handleFiles = async (files: FileList) => {
    const available = MAX_PHOTOS - photos.length;
    if (available <= 0) return;

    const toUpload = Array.from(files).slice(0, available);
    const newStates: UploadState[] = toUpload.map((f) => ({
      tempId: crypto.randomUUID(),
      fileName: f.name,
      status: "uploading",
    }));
    setUploads((prev) => [...prev, ...newStates]);

    await Promise.all(
      toUpload.map(async (file, i) => {
        const { tempId } = newStates[i];
        try {
          const fd = new FormData();
          fd.append("file", file);
          const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
          if (!res.ok) {
            const { error } = await res.json();
            throw new Error(error ?? "업로드 실패");
          }
          const result: { url: string; thumbUrl: string; width: number; height: number } =
            await res.json();

          updateUpload(tempId, { status: "done", thumbUrl: result.thumbUrl });
          onAdd({ tempId, caption: "", ...result });
        } catch (e) {
          updateUpload(tempId, {
            status: "error",
            error: e instanceof Error ? e.message : "업로드 실패",
          });
        }
      })
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (tempId: string) => {
    onRemove(tempId);
    setUploads((prev) => prev.filter((u) => u.tempId !== tempId));
  };

  const canProceed = !isUploading && photos.length > 0;

  return (
    <div className="space-y-6">
      {/* 드롭존 */}
      <div
        className="border-2 border-dashed border-border-default rounded-2xl p-8 text-center cursor-pointer hover:border-brand hover:bg-[#EEF4FE] transition-colors"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-bg-secondary flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-secondary">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">사진을 드래그하거나 클릭해서 선택</p>
            <p className="text-xs text-text-tertiary mt-1">
              JPG, PNG, HEIC, WebP 지원 · 최대 50MB · 최대 {MAX_PHOTOS}장
            </p>
          </div>
          <Button variant="secondary" size="sm" type="button">
            파일 선택
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* 업로드 중 / 결과 */}
      {uploads.length > 0 && (
        <div>
          <p className="text-sm font-medium text-text-secondary mb-3">
            업로드 현황 ({photos.length}/{uploads.filter((u) => u.status === "done").length + photos.length})
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {uploads.map((u) => (
              <div key={u.tempId} className="flex items-center gap-3 p-2 rounded-lg bg-bg-secondary">
                {/* 상태 아이콘 */}
                <div className="shrink-0 w-8 h-8 flex items-center justify-center">
                  {u.status === "uploading" && (
                    <svg className="animate-spin w-4 h-4 text-brand" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {u.status === "done" && (
                    <svg className="w-4 h-4 text-[#27B563]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {u.status === "error" && (
                    <svg className="w-4 h-4 text-[#FF4B4B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-primary truncate">{u.fileName}</p>
                  {u.error && <p className="text-xs text-[#FF4B4B]">{u.error}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 업로드된 사진 그리드 */}
      {photos.length > 0 && (
        <div>
          <p className="text-sm font-medium text-text-secondary mb-3">{photos.length}장 업로드됨</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {photos.map((photo) => (
              <div key={photo.tempId} className="relative group aspect-square rounded-lg overflow-hidden bg-bg-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.thumbUrl} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemove(photo.tempId)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="삭제"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 이전 / 다음 */}
      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack} size="lg">
          이전
        </Button>
        <Button onClick={onNext} disabled={!canProceed} size="lg">
          {isUploading ? "업로드 중…" : `다음 — 캡션 & 순서 (${photos.length}장)`}
        </Button>
      </div>
    </div>
  );
}
