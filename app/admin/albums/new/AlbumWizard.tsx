"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BasicInfoStep } from "./BasicInfoStep";
import { PhotoUploadStep } from "./PhotoUploadStep";
import { CaptionOrderStep } from "./CaptionOrderStep";

export type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";

export interface BasicInfo {
  title: string;
  slug: string;
  description: string;
  dateStart: string;
  dateEnd: string;
  visibility: Visibility;
  tags: string[];
}

export interface PhotoItem {
  tempId: string;
  url: string;
  thumbUrl: string;
  width: number;
  height: number;
  caption: string;
}

const STEPS = ["기본 정보", "사진 업로드", "캡션 & 순서"] as const;

const defaultBasicInfo: BasicInfo = {
  title: "",
  slug: "",
  description: "",
  dateStart: "",
  dateEnd: "",
  visibility: "PRIVATE",
  tags: [],
};

export function AlbumWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [basicInfo, setBasicInfo] = useState<BasicInfo>(defaultBasicInfo);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleAddPhoto = (photo: PhotoItem) => {
    setPhotos((prev) => [...prev, photo]);
  };

  const handleRemovePhoto = (tempId: string) => {
    setPhotos((prev) => {
      const next = prev.filter((p) => p.tempId !== tempId);
      setCoverIndex((ci) => Math.min(ci, Math.max(0, next.length - 1)));
      return next;
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/admin/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...basicInfo,
          tags: basicInfo.tags,
          coverUrl: photos[coverIndex]?.thumbUrl ?? null,
          photos: photos.map((p, i) => ({
            url: p.url,
            thumbUrl: p.thumbUrl,
            width: p.width,
            height: p.height,
            caption: p.caption,
            order: i,
          })),
        }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "앨범 생성 실패");
      }
      router.push("/admin/albums");
      router.refresh();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "알 수 없는 오류");
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* ─── 단계 표시 ─── */}
      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((label, i) => {
          const num = (i + 1) as 1 | 2 | 3;
          const done = step > num;
          const active = step === num;
          return (
            <div key={num} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={[
                    "w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                    done
                      ? "bg-brand text-white"
                      : active
                      ? "bg-brand text-white"
                      : "bg-bg-secondary text-text-tertiary",
                  ].join(" ")}
                >
                  {done ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    num
                  )}
                </div>
                <span
                  className={`text-sm font-medium hidden sm:block ${
                    active ? "text-text-primary" : "text-text-tertiary"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px ${done ? "bg-brand" : "bg-border-default"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ─── 단계 콘텐츠 ─── */}
      {step === 1 && (
        <BasicInfoStep
          data={basicInfo}
          onChange={setBasicInfo}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <PhotoUploadStep
          photos={photos}
          onAdd={handleAddPhoto}
          onRemove={handleRemovePhoto}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <CaptionOrderStep
          photos={photos}
          coverIndex={coverIndex}
          onPhotosChange={setPhotos}
          onCoverChange={setCoverIndex}
          onBack={() => setStep(2)}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitError={submitError}
        />
      )}
    </div>
  );
}
