"use client";

import { useState } from "react";
import { Lightbox } from "./Lightbox";

export interface GridPhoto {
  id: string;
  url: string;
  thumbUrl: string;
  caption: string | null;
  width: number;
  height: number;
}

interface Props {
  photos: GridPhoto[];
}

export function PhotoGrid({ photos }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <p className="text-text-tertiary text-sm text-center py-16">사진이 없어요.</p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setLightboxIndex(i)}
            aria-label={photo.caption ?? `사진 ${i + 1} 크게 보기`}
            className="relative aspect-square bg-bg-secondary rounded-xl overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.thumbUrl}
              alt={photo.caption ?? ""}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {photo.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <p className="text-white text-xs line-clamp-2 text-left">
                  {photo.caption}
                </p>
              </div>
            )}
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
