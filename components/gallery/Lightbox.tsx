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
  const [visible, setVisible] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDraggingH = useRef(false);
  const thumbStripRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // ─── 마운트 + 진입 애니메이션 ────────────────────────────────
  useEffect(() => {
    setMounted(true);
    let id2: number;
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => setVisible(true));
    });
    return () => {
      cancelAnimationFrame(id1);
      cancelAnimationFrame(id2);
    };
  }, []);

  useEffect(() => {
    if (mounted) closeBtnRef.current?.focus();
  }, [mounted]);

  // ─── 스크롤 잠금 ─────────────────────────────────────────────
  useEffect(() => {
    const saved = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = saved;
    };
  }, []);

  // ─── 썸네일 스트립 활성 항목 자동 스크롤 ────────────────────
  useEffect(() => {
    const strip = thumbStripRef.current;
    if (!strip) return;
    const thumb = strip.children[index] as HTMLElement | undefined;
    thumb?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [index]);

  // ─── 인접 이미지 프리로드 (±2장) ─────────────────────────────
  useEffect(() => {
    [-2, -1, 1, 2]
      .map((d) => index + d)
      .filter((i) => i >= 0 && i < photos.length)
      .forEach((i) => {
        const img = new window.Image();
        img.src = photos[i].url;
      });
  }, [index, photos]);

  // ─── 닫기 (페이드아웃 후 unmount) ───────────────────────────
  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 250);
  }, [onClose]);

  // ─── 이동 ────────────────────────────────────────────────────
  const navigate = useCallback((next: number) => {
    setIndex(next);
    setImgLoaded(false);
    setCaptionExpanded(false);
  }, []);

  const goPrev = useCallback(() => {
    if (index > 0) navigate(index - 1);
  }, [index, navigate]);

  const goNext = useCallback(() => {
    if (index < photos.length - 1) navigate(index + 1);
  }, [index, navigate, photos.length]);

  // ─── 키보드 ──────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, handleClose]);

  // ─── 터치 스와이프 (실시간 드래그 피드백) ────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDraggingH.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    if (!isDraggingH.current) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
        isDraggingH.current = true;
      } else if (Math.abs(dy) > 12) {
        return; // 수직 스크롤 — 무시
      }
    }

    if (isDraggingH.current) {
      // 양 끝에서 고무줄 저항감
      const atEdge =
        (dx > 0 && index === 0) || (dx < 0 && index === photos.length - 1);
      const resistance = atEdge ? 0.2 : 1;
      const maxPull = window.innerWidth * 0.45;
      setDragOffset(
        Math.max(-maxPull, Math.min(maxPull, dx * resistance))
      );
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    setDragOffset(0); // 스냅백 (transition이 처리)

    if (isDraggingH.current) {
      const threshold = window.innerWidth * 0.22;
      if (dx < -threshold) goNext();
      else if (dx > threshold) goPrev();
    }
    isDraggingH.current = false;
  };

  // ─── 이미지 스타일 ───────────────────────────────────────────
  // 드래그 중: translateX (transition 없음 — 손가락에 딱 붙어야 함)
  // 드래그 후 스냅백: translateX(0) with transition (부드러운 복귀)
  // 새 사진 로딩: scale(0.96) opacity(0) → scale(1) opacity(1)
  const imgStyle: React.CSSProperties =
    dragOffset !== 0
      ? {
          transform: `translateX(${dragOffset}px)`,
          transition: "none",
          opacity: imgLoaded ? 1 : 0,
        }
      : {
          transform: imgLoaded ? "scale(1)" : "scale(0.96)",
          opacity: imgLoaded ? 1 : 0,
          transition:
            "opacity 0.28s ease, transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)",
        };

  const photo = photos[index];
  const caption = photo.caption;
  const CAPTION_THRESHOLD = 52;
  const captionIsLong = !!caption && caption.length > CAPTION_THRESHOLD;

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="사진 뷰어"
      className="fixed inset-0 z-[100] flex flex-col select-none"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 0.25s ease",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ─── 배경 딤 ─── */}
      <div
        className="absolute inset-0 bg-black"
        aria-hidden="true"
      />

      {/* ─── 상단 바: 인덱스 + 닫기 ─── */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 shrink-0">
        <span className="text-white/60 text-sm font-medium tabular-nums">
          {index + 1}
          <span className="mx-1.5 text-white/25">/</span>
          {photos.length}
        </span>

        <button
          ref={closeBtnRef}
          type="button"
          onClick={handleClose}
          aria-label="닫기 (Esc)"
          className="w-10 h-10 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ─── 이미지 영역 ─── */}
      {/* 이미지 바깥(여백) 클릭 → 닫기 / 이미지 클릭 → stopPropagation */}
      <div
        className="relative flex-1 flex items-center justify-center overflow-hidden"
        onClick={handleClose}
      >
        {/* 블러 플레이스홀더 (썸네일 → 원본 로딩 중 표시) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.thumbUrl}
          alt=""
          aria-hidden="true"
          className={[
            "absolute inset-0 w-full h-full object-contain scale-110 blur-2xl pointer-events-none",
            "transition-opacity duration-500",
            imgLoaded ? "opacity-0" : "opacity-20",
          ].join(" ")}
        />

        {/* 원본 이미지 — key 변경 시 re-mount → 애니메이션 재생 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photo.url}
          src={photo.url}
          alt={caption ?? ""}
          onLoad={() => setImgLoaded(true)}
          draggable={false}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 max-w-full max-h-full w-auto h-auto object-contain"
          style={imgStyle}
        />

        {/* ← 이전 버튼 */}
        {index > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label="이전 사진 (←)"
            className="absolute left-3 sm:left-5 z-20 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 backdrop-blur-sm"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* → 다음 버튼 */}
        {index < photos.length - 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label="다음 사진 (→)"
            className="absolute right-3 sm:right-5 z-20 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 backdrop-blur-sm"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>

      {/* ─── 하단 바: 캡션 + 썸네일 스트립 ─── */}
      <div className="relative z-10 shrink-0">
        {/* 캡션 (길면 접기/펼치기) */}
        {caption && (
          <div className="px-6 pt-3 pb-1 text-center">
            <p
              className={[
                "text-white/65 text-sm leading-relaxed mx-auto max-w-lg",
                !captionExpanded ? "line-clamp-1" : "",
              ].join(" ")}
            >
              {caption}
            </p>
            {captionIsLong && (
              <button
                type="button"
                onClick={() => setCaptionExpanded((v) => !v)}
                className="mt-0.5 text-white/35 text-xs hover:text-white/65 transition-colors"
              >
                {captionExpanded ? "접기 ↑" : "더 보기 ↓"}
              </button>
            )}
          </div>
        )}

        {/* 썸네일 스트립 */}
        {photos.length > 1 && (
          <div
            ref={thumbStripRef}
            className="lb-thumb-strip flex gap-1.5 px-4 py-2 pb-4 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {photos.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(i);
                }}
                aria-label={`사진 ${i + 1} 보기`}
                className={[
                  "shrink-0 w-12 h-12 rounded-lg overflow-hidden",
                  "transition-all duration-200",
                  i === index
                    ? "ring-2 ring-white ring-offset-1 ring-offset-black opacity-100 scale-110"
                    : "opacity-35 hover:opacity-65 scale-100",
                ].join(" ")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.thumbUrl}
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
