"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface LightboxPhoto {
  url: string;
  thumbUrl: string;
  caption?: string | null;
}

interface Props {
  photos: LightboxPhoto[];
  initialIndex: number;
  onClose: () => void;
}

export function Lightbox({ photos, initialIndex, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const touchStartX = useRef<number>(0);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // 클라이언트 마운트 확인 (createPortal SSR 안전)
  useEffect(() => {
    setMounted(true);
    closeBtnRef.current?.focus();
  }, []);

  // 스크롤 잠금
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ─── 이동 핸들러 ────────────────────────────────────────────
  const goPrev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const goNext = useCallback(
    () => setIndex((i) => Math.min(photos.length - 1, i + 1)),
    [photos.length]
  );

  // ─── 키보드 (←→ Esc) ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goPrev, goNext, onClose]);

  // ─── 인덱스 변경 시 로드 상태 리셋 ─────────────────────────
  useEffect(() => {
    setImgLoaded(false);
  }, [index]);

  // ─── T7-03: 인접 이미지 프리로드 (±1장) ─────────────────────
  useEffect(() => {
    const targets = [index - 1, index + 1].filter(
      (i) => i >= 0 && i < photos.length
    );
    targets.forEach((i) => {
      const img = new window.Image();
      img.src = photos[i].url;
    });
  }, [index, photos]);

  // ─── T7-02: 스와이프 제스처 ─────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0) goNext();
      else goPrev();
    }
  };

  const photo = photos[index];
  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="사진 뷰어"
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ─── 상단 바 ─── */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span className="text-white/50 text-sm tabular-nums">
          {index + 1} / {photos.length}
        </span>
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label="닫기 (Esc)"
          className="w-9 h-9 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ─── 이미지 영역 ─── */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* T7-04: 블러 플레이스홀더 (thumb) */}
        <img
          src={photo.thumbUrl}
          alt=""
          aria-hidden="true"
          className={[
            "absolute inset-0 w-full h-full object-contain scale-110 blur-2xl transition-opacity duration-300",
            imgLoaded ? "opacity-0" : "opacity-30",
          ].join(" ")}
        />

        {/* 풀 이미지 (페이드인) */}
        <img
          key={photo.url}
          src={photo.url}
          alt={photo.caption ?? ""}
          onLoad={() => setImgLoaded(true)}
          draggable={false}
          className={[
            "relative max-w-full max-h-full object-contain select-none transition-opacity duration-300",
            imgLoaded ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />

        {/* 이전 버튼 */}
        {hasPrev && (
          <button
            type="button"
            onClick={goPrev}
            aria-label="이전 사진 (←)"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* 다음 버튼 */}
        {hasNext && (
          <button
            type="button"
            onClick={goNext}
            aria-label="다음 사진 (→)"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        {/* 배경 클릭으로 닫기 (이미지 클릭은 제외) */}
        <div
          className="absolute inset-0 -z-10"
          onClick={onClose}
          aria-hidden="true"
        />
      </div>

      {/* ─── 하단 캡션 ─── */}
      {photo.caption && (
        <div className="px-6 py-3 text-center text-white/60 text-sm shrink-0 max-w-2xl mx-auto w-full">
          {photo.caption}
        </div>
      )}
    </div>,
    document.body
  );
}
