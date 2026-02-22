"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const PublicMapInner = dynamic(
  () => import("@/components/map/PublicMapInner"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full bg-bg-secondary animate-pulse flex items-center justify-center">
        <p className="text-text-tertiary text-sm">지도 불러오는 중…</p>
      </div>
    ),
  }
);

type Place = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  linkedPosts: { id: string; title: string; slug: string }[];
  linkedAlbums: { id: string; title: string; slug: string }[];
};

export default function MapPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/places")
      .then((r) => r.json())
      .then((data) => setPlaces(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 3.5rem)" }}>
      {/* 헤더 바 */}
      <div className="px-4 sm:px-6 py-4 border-b border-border-default bg-white shrink-0">
        <h1 className="text-xl font-bold text-text-primary">여행 지도</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {loading ? "불러오는 중…" : `핀 ${places.length}개`}
        </p>
      </div>

      {/* 지도 */}
      <div className="flex-1 relative">
        {places.length === 0 && !loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-text-tertiary bg-bg-secondary">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            <p className="text-sm">등록된 장소가 없어요.</p>
          </div>
        ) : (
          <PublicMapInner places={places} />
        )}
      </div>
    </div>
  );
}
