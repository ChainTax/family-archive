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

// 두 터치 포인트 간 거리
function pinchDist(touches: React.TouchList) {
  const dx = touches[1].clientX - touches[0].clientX;
  const dy = touches[1].clientY - touches[0].clientY;
  return Math.hypot(dx, dy);
}

// 제스처 상태머신
type Gesture = "idle" | "swipe" | "pan" | "pinch";

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const SNAP_THRESHOLD = 1.08; // 이 미만이면 scale=1로 스냅
const SWIPE_THRESHOLD_RATIO = 0.22; // 화면 너비의 22%
const RUBBER_BAND = 0.2; // 양 끝 저항

export function Lightbox({ photos, initialIndex, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);

  // 스와이프 드래그 오프셋 (픽셀)
  const [dragOffset, setDragOffset] = useState(0);

  // 줌 + 팬
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  // DOM refs
  const imgRef = useRef<HTMLImageElement>(null);
  const imageAreaRef = useRef<HTMLDivElement>(null);
  const thumbStripRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // 상태 미러 refs — native 이벤트 핸들러(wheel)의 stale closure 방지
  const scaleRef = useRef(scale);
  const panXRef = useRef(panX);
  const panYRef = useRef(panY);
  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { panXRef.current = panX; }, [panX]);
  useEffect(() => { panYRef.current = panY; }, [panY]);

  // 제스처 refs (렌더링 불필요 — ref로 관리)
  const gesture = useRef<Gesture>("idle");
  const isGesturing = useRef(false); // transition 억제용

  // 스와이프
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // 터치 팬 시작 스냅샷
  const panSnap = useRef({ touchX: 0, touchY: 0, panX: 0, panY: 0 });

  // 핀치 시작 스냅샷
  const pinchSnap = useRef({ dist: 0, scale: 1 });

  // 더블탭
  const lastTap = useRef({ time: 0, x: 0, y: 0 });

  // 마우스 드래그 팬 (데스크톱)
  const mousePanStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const isMousePanning = useRef(false);
  const [mouseGrabbing, setMouseGrabbing] = useState(false);

  // ─── 팬 클램프 ────────────────────────────────────────────────
  // naturalWidth/Height 기반으로 표시 크기를 계산하여 경계 내로 제한
  const clampPan = useCallback(
    (x: number, y: number, s: number): { x: number; y: number } => {
      const img = imgRef.current;
      const area = imageAreaRef.current;
      if (!img || !area) return { x, y };

      const containerW = area.clientWidth;
      const containerH = area.clientHeight;
      const natW = img.naturalWidth || 1;
      const natH = img.naturalHeight || 1;
      const imgAspect = natW / natH;
      const areaAspect = containerW / containerH;

      // contain 모드로 표시되는 크기
      const displayW =
        imgAspect > areaAspect ? containerW : containerH * imgAspect;
      const displayH =
        imgAspect > areaAspect ? containerW / imgAspect : containerH;

      const maxX = Math.max(0, (displayW * s - containerW) / 2);
      const maxY = Math.max(0, (displayH * s - containerH) / 2);

      return {
        x: Math.max(-maxX, Math.min(maxX, x)),
        y: Math.max(-maxY, Math.min(maxY, y)),
      };
    },
    []
  );

  // ─── 줌 리셋 ─────────────────────────────────────────────────
  const resetZoom = useCallback(() => {
    setScale(1);
    setPanX(0);
    setPanY(0);
  }, []);

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

  // ─── 썸네일 스트립 자동 스크롤 ──────────────────────────────
  useEffect(() => {
    const strip = thumbStripRef.current;
    if (!strip) return;
    (strip.children[index] as HTMLElement | undefined)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [index]);

  // ─── 인접 이미지 프리로드 (±2) ───────────────────────────────
  useEffect(() => {
    [-2, -1, 1, 2]
      .map((d) => index + d)
      .filter((i) => i >= 0 && i < photos.length)
      .forEach((i) => {
        const img = new window.Image();
        img.src = photos[i].url;
      });
  }, [index, photos]);

  // ─── 휠 줌 (데스크톱) — passive:false + 커서 위치 기준 ────────
  // deps에 mounted 포함: mounted=false 시 imageAreaRef가 null이라 리스너 미등록되는 버그 방지
  useEffect(() => {
    if (!mounted) return;
    const el = imageAreaRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const currentScale = scaleRef.current;
      const currentPanX = panXRef.current;
      const currentPanY = panYRef.current;

      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, currentScale * factor));

      if (newScale < SNAP_THRESHOLD) {
        setScale(MIN_SCALE);
        setPanX(0);
        setPanY(0);
        return;
      }

      // 커서 위치 기준 줌: 커서 아래 지점이 화면에 고정되도록 pan 보정
      const rect = el.getBoundingClientRect();
      const cursorX = e.clientX - rect.left - rect.width / 2;
      const cursorY = e.clientY - rect.top - rect.height / 2;
      const ratio = newScale / currentScale;
      const rawPanX = cursorX * (1 - ratio) + currentPanX * ratio;
      const rawPanY = cursorY * (1 - ratio) + currentPanY * ratio;
      const clamped = clampPan(rawPanX, rawPanY, newScale);

      setScale(newScale);
      setPanX(clamped.x);
      setPanY(clamped.y);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [mounted, clampPan]);

  // ─── 마우스 드래그 팬 (데스크톱) — 전역 리스너 ──────────────
  // 요소 밖으로 마우스가 나가도 팬이 끊기지 않도록 document에 등록
  useEffect(() => {
    if (!mounted) return;
    const onMouseMove = (e: MouseEvent) => {
      if (!isMousePanning.current) return;
      const dx = e.clientX - mousePanStart.current.x;
      const dy = e.clientY - mousePanStart.current.y;
      const clamped = clampPan(
        mousePanStart.current.panX + dx,
        mousePanStart.current.panY + dy,
        scaleRef.current
      );
      setPanX(clamped.x);
      setPanY(clamped.y);
    };
    const onMouseUp = () => {
      if (!isMousePanning.current) return;
      isMousePanning.current = false;
      setMouseGrabbing(false);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [mounted, clampPan]);

  // ─── 닫기 (페이드아웃 후 unmount) ───────────────────────────
  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 250);
  }, [onClose]);

  // ─── 이동 (줌 리셋 포함) ─────────────────────────────────────
  const navigate = useCallback(
    (next: number) => {
      setIndex(next);
      setImgLoaded(false);
      setCaptionExpanded(false);
      resetZoom();
      setDragOffset(0);
    },
    [resetZoom]
  );

  const goPrev = useCallback(() => {
    if (index > 0) navigate(index - 1);
  }, [index, navigate]);

  const goNext = useCallback(() => {
    if (index < photos.length - 1) navigate(index + 1);
  }, [index, navigate, photos.length]);

  // ─── 키보드 ──────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      else if (e.key === "ArrowLeft" && scale === MIN_SCALE) goPrev();
      else if (e.key === "ArrowRight" && scale === MIN_SCALE) goNext();
      else if (e.key === "0" && scale > MIN_SCALE) resetZoom();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, handleClose, scale, resetZoom]);

  // ─── 마우스 다운 — 줌 상태에서 드래그 팬 시작 ──────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scaleRef.current <= MIN_SCALE) return;
    e.preventDefault();
    isMousePanning.current = true;
    setMouseGrabbing(true);
    mousePanStart.current = {
      x: e.clientX,
      y: e.clientY,
      panX: panXRef.current,
      panY: panYRef.current,
    };
  }, []);

  // ─── 더블클릭 줌 — 클릭 위치 기준으로 확대 ────────────────
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (scale > MIN_SCALE) {
        resetZoom();
        return;
      }
      const newScale = 2.5;
      const area = imageAreaRef.current;
      if (!area) { setScale(newScale); return; }

      // 클릭 지점을 이미지 영역 중심 기준 좌표로 변환
      const rect = area.getBoundingClientRect();
      const clickX = e.clientX - rect.left - rect.width / 2;
      const clickY = e.clientY - rect.top - rect.height / 2;

      // 클릭 지점이 화면에서 같은 위치에 머물도록 pan 계산
      // after: center + P*newScale + pan = before: center + P (scale=1, pan=0)
      // → pan = clickX*(1-newScale)
      const rawPanX = clickX * (1 - newScale);
      const rawPanY = clickY * (1 - newScale);
      const clamped = clampPan(rawPanX, rawPanY, newScale);

      setScale(newScale);
      setPanX(clamped.x);
      setPanY(clamped.y);
    },
    [scale, resetZoom, clampPan]
  );

  // ─── 터치 시작 ───────────────────────────────────────────────
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      isGesturing.current = true;

      // 두 손가락 → 핀치 시작
      if (e.touches.length === 2) {
        gesture.current = "pinch";
        setDragOffset(0);
        pinchSnap.current = { dist: pinchDist(e.touches), scale };
        return;
      }

      const touch = e.touches[0];

      // 더블탭 감지
      const now = Date.now();
      const dt = now - lastTap.current.time;
      const dx = Math.abs(touch.clientX - lastTap.current.x);
      const dy = Math.abs(touch.clientY - lastTap.current.y);
      if (dt < 300 && dx < 40 && dy < 40) {
        lastTap.current.time = 0;
        isGesturing.current = false;
        if (scale > MIN_SCALE) {
          resetZoom();
        } else {
          setScale(2.5);
        }
        return;
      }
      lastTap.current = { time: now, x: touch.clientX, y: touch.clientY };

      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;

      if (scale > MIN_SCALE) {
        // 줌 상태 → 팬 모드
        gesture.current = "pan";
        panSnap.current = {
          touchX: touch.clientX,
          touchY: touch.clientY,
          panX,
          panY,
        };
      } else {
        // 일반 상태 → 방향 결정 대기
        gesture.current = "idle";
      }
    },
    [scale, panX, panY, resetZoom]
  );

  // ─── 터치 이동 ───────────────────────────────────────────────
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      // 두 번째 손가락이 추가됐으면 핀치로 전환
      if (e.touches.length === 2 && gesture.current !== "pinch") {
        gesture.current = "pinch";
        setDragOffset(0);
        pinchSnap.current = { dist: pinchDist(e.touches), scale };
        return;
      }

      // 핀치 처리
      if (gesture.current === "pinch" && e.touches.length === 2) {
        const ratio = pinchDist(e.touches) / pinchSnap.current.dist;
        const next = Math.max(
          MIN_SCALE,
          Math.min(MAX_SCALE, pinchSnap.current.scale * ratio)
        );
        setScale(next);
        if (next < SNAP_THRESHOLD) {
          setPanX(0);
          setPanY(0);
        }
        return;
      }

      if (e.touches.length !== 1) return;
      const touch = e.touches[0];

      // 팬 처리
      if (gesture.current === "pan") {
        const dx = touch.clientX - panSnap.current.touchX;
        const dy = touch.clientY - panSnap.current.touchY;
        const clamped = clampPan(
          panSnap.current.panX + dx,
          panSnap.current.panY + dy,
          scale
        );
        setPanX(clamped.x);
        setPanY(clamped.y);
        return;
      }

      // idle → 방향 결정
      const dx = touch.clientX - touchStartX.current;
      const dy = touch.clientY - touchStartY.current;

      if (gesture.current === "idle") {
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
          gesture.current = "swipe";
        } else if (Math.abs(dy) > 12) {
          gesture.current = "idle"; // 세로 스크롤 — 무시
          return;
        } else {
          return; // 아직 방향 미확정
        }
      }

      // 스와이프 드래그
      if (gesture.current === "swipe") {
        const atEdge =
          (dx > 0 && index === 0) ||
          (dx < 0 && index === photos.length - 1);
        const r = atEdge ? RUBBER_BAND : 1;
        const maxPull = window.innerWidth * 0.45;
        setDragOffset(Math.max(-maxPull, Math.min(maxPull, dx * r)));
      }
    },
    [scale, index, photos.length, clampPan]
  );

  // ─── 터치 종료 ───────────────────────────────────────────────
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      // 핀치 중 한 손가락을 떼면 → 팬으로 전환
      if (e.touches.length === 1 && gesture.current === "pinch") {
        const touch = e.touches[0];
        // 1배 근처면 그냥 리셋
        if (scale < SNAP_THRESHOLD) {
          resetZoom();
          gesture.current = "idle";
          isGesturing.current = false;
        } else {
          gesture.current = "pan";
          panSnap.current = {
            touchX: touch.clientX,
            touchY: touch.clientY,
            panX,
            panY,
          };
        }
        return;
      }

      // 핀치 완전 종료 (두 손가락 모두 떼기)
      if (gesture.current === "pinch") {
        if (scale < SNAP_THRESHOLD) resetZoom();
        gesture.current = "idle";
        isGesturing.current = false;
        return;
      }

      // 스와이프 종료 → 이동 or 스냅백
      if (gesture.current === "swipe") {
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        const threshold = window.innerWidth * SWIPE_THRESHOLD_RATIO;
        setDragOffset(0); // CSS transition이 스냅백 처리
        if (dx < -threshold) goNext();
        else if (dx > threshold) goPrev();
      } else {
        setDragOffset(0);
      }

      gesture.current = "idle";
      isGesturing.current = false;
    },
    [panX, panY, scale, goNext, goPrev, resetZoom]
  );

  // ─── 파생 값 ─────────────────────────────────────────────────
  const isZoomed = scale > MIN_SCALE;
  const photo = photos[index];
  const caption = photo.caption;
  const CAPTION_THRESHOLD = 52;
  const captionIsLong = !!caption && caption.length > CAPTION_THRESHOLD;

  // ─── 이미지 transform + transition ──────────────────────────
  // 줌 중: translate + scale / 스와이프: translateX / 로딩: scale(0.96)→scale(1)
  const imgTransform = isZoomed
    ? `translate(${panX}px, ${panY}px) scale(${scale})`
    : dragOffset !== 0
    ? `translateX(${dragOffset}px)`
    : imgLoaded
    ? "scale(1)"
    : "scale(0.96)";

  // 제스처 중에는 transition 없음 (즉각 반응), 이후엔 스냅백·페이드 transition
  const imgTransition =
    isGesturing.current || dragOffset !== 0
      ? "none"
      : "opacity 0.28s ease, transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)";

  const imgStyle: React.CSSProperties = {
    transform: imgTransform,
    opacity: imgLoaded ? 1 : 0,
    transition: imgTransition,
    cursor: isZoomed ? (mouseGrabbing ? "grabbing" : "grab") : "default",
    touchAction: "none",
    userSelect: "none",
    WebkitUserSelect: "none",
  };

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="사진 뷰어"
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 0.25s ease" }}
    >
      {/* ─── 배경 ─── */}
      <div className="absolute inset-0 bg-black" aria-hidden="true" />

      {/* ─── 상단 바 ─── */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 shrink-0 select-none">
        <span className="text-white/60 text-sm font-medium tabular-nums">
          {index + 1}
          <span className="mx-1.5 text-white/25">/</span>
          {photos.length}
        </span>
        <div className="flex items-center gap-2">
          {/* 줌 리셋 버튼 — 줌 상태일 때만 표시 */}
          {isZoomed && (
            <button
              type="button"
              onClick={resetZoom}
              className="h-8 px-3 flex items-center gap-1.5 rounded-full bg-white/10 text-white/80 text-xs font-medium hover:bg-white/20 transition-all"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
              원래 크기
            </button>
          )}
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
      </div>

      {/* ─── 이미지 영역 ─── */}
      {/* touch-action: none → 브라우저 기본 핀치줌·스크롤 차단 */}
      <div
        ref={imageAreaRef}
        className="relative flex-1 flex items-center justify-center overflow-hidden"
        style={{ touchAction: "none" }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={!isZoomed ? handleClose : undefined}
      >
        {/* 블러 플레이스홀더 */}
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

        {/* 원본 이미지 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          key={photo.url}
          src={photo.url}
          alt={caption ?? ""}
          onLoad={() => setImgLoaded(true)}
          draggable={false}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={handleDoubleClick}
          className="relative z-10 max-w-full max-h-full w-auto h-auto object-contain"
          style={imgStyle}
        />

        {/* 줌 안내 힌트 (첫 로드 시) */}
        {imgLoaded && !isZoomed && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <span className="text-white/20 text-xs select-none hidden sm:block">
              더블클릭 · 휠로 확대 / ← → 이동
            </span>
          </div>
        )}

        {/* ← 이전 버튼 (줌 상태에서 숨김) */}
        {!isZoomed && index > 0 && (
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

        {/* → 다음 버튼 (줌 상태에서 숨김) */}
        {!isZoomed && index < photos.length - 1 && (
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

      {/* ─── 하단 바: 캡션 + 썸네일 (줌 상태에서 숨김) ─── */}
      {!isZoomed && (
        <div className="relative z-10 shrink-0 select-none">
          {/* 캡션 */}
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
              style={{ scrollbarWidth: "none", touchAction: "pan-x" }}
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
                    "shrink-0 w-12 h-12 rounded-lg overflow-hidden transition-all duration-200",
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
      )}
    </div>,
    document.body
  );
}
