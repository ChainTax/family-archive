"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import { Badge, Button, Modal } from "@/components/ui";

const AdminMapInner = dynamic(
  () => import("@/components/map/AdminMapInner"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full bg-bg-secondary animate-pulse" />
    ),
  }
);

type Place = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  visibility: "PUBLIC" | "UNLISTED" | "PRIVATE";
  linkedPosts: { id: string; title: string; slug: string }[];
  linkedAlbums: { id: string; title: string; slug: string }[];
};

type ContentItem = { id: string; title: string; slug: string };

type Props = {
  initialPlaces: Place[];
  posts: ContentItem[];
  albums: ContentItem[];
};

type FormData = {
  name: string;
  lat: number | null;
  lng: number | null;
  visibility: "PUBLIC" | "UNLISTED" | "PRIVATE";
  postIds: string[];
  albumIds: string[];
};

const defaultForm = (): FormData => ({
  name: "",
  lat: null,
  lng: null,
  visibility: "PUBLIC",
  postIds: [],
  albumIds: [],
});

function toggleId(arr: string[], id: string) {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

const VISIBILITY_LABELS = {
  PUBLIC: "공개",
  UNLISTED: "링크 공유",
  PRIVATE: "가족 전용",
} as const;

export default function MapPageClient({ initialPlaces, posts, albums }: Props) {
  const [places, setPlaces] = useState<Place[]>(initialPlaces);
  const [addMode, setAddMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm());
  const [saving, setSaving] = useState(false);

  const openCreateAt = useCallback((lat: number, lng: number) => {
    setForm({ ...defaultForm(), lat, lng });
    setEditingId(null);
    setAddMode(false);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback(
    (id: string) => {
      const place = places.find((p) => p.id === id);
      if (!place) return;
      setForm({
        name: place.name,
        lat: place.lat,
        lng: place.lng,
        visibility: place.visibility,
        postIds: place.linkedPosts.map((p) => p.id),
        albumIds: place.linkedAlbums.map((a) => a.id),
      });
      setEditingId(place.id);
      setModalOpen(true);
    },
    [places]
  );

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingId(null);
  }, []);

  const handleSave = async () => {
    if (!form.name.trim() || form.lat == null || form.lng == null) return;
    setSaving(true);
    try {
      if (editingId) {
        await fetch(`/api/admin/places/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            lat: form.lat,
            lng: form.lng,
            visibility: form.visibility,
            postIds: form.postIds,
            albumIds: form.albumIds,
          }),
        });
        setPlaces((prev) =>
          prev.map((p) =>
            p.id === editingId
              ? {
                  ...p,
                  name: form.name,
                  lat: form.lat!,
                  lng: form.lng!,
                  visibility: form.visibility,
                  linkedPosts: posts.filter((pt) => form.postIds.includes(pt.id)),
                  linkedAlbums: albums.filter((al) => form.albumIds.includes(al.id)),
                }
              : p
          )
        );
      } else {
        const res = await fetch("/api/admin/places", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            lat: form.lat,
            lng: form.lng,
            visibility: form.visibility,
            postIds: form.postIds,
            albumIds: form.albumIds,
          }),
        });
        const { id } = await res.json();
        const newPlace: Place = {
          id,
          name: form.name,
          lat: form.lat!,
          lng: form.lng!,
          visibility: form.visibility,
          linkedPosts: posts.filter((pt) => form.postIds.includes(pt.id)),
          linkedAlbums: albums.filter((al) => form.albumIds.includes(al.id)),
        };
        setPlaces((prev) => [newPlace, ...prev]);
      }
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/places/${editingId}`, { method: "DELETE" });
      if (!res.ok) return;
      setPlaces((prev) => prev.filter((p) => p.id !== editingId));
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-border-default bg-white flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-text-primary">지도 핀</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {addMode
              ? "지도에서 위치를 클릭하여 핀을 추가하세요"
              : `핀 ${places.length}개`}
          </p>
        </div>
        <Button
          variant={addMode ? "secondary" : "primary"}
          size="sm"
          onClick={() => setAddMode((v) => !v)}
        >
          {addMode ? "취소" : "+ 핀 추가하기"}
        </Button>
      </div>

      {/* 본문: 사이드 + 지도 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 왼쪽: 핀 목록 */}
        <aside className="w-72 shrink-0 border-r border-border-default overflow-y-auto bg-white">
          {places.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-text-tertiary gap-3 py-16">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              <p className="text-sm">핀이 없어요</p>
            </div>
          ) : (
            <ul className="divide-y divide-border-default">
              {places.map((place) => (
                <li key={place.id}>
                  <button
                    className="w-full text-left px-4 py-3 hover:bg-bg-secondary transition-colors"
                    onClick={() => openEdit(place.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm text-text-primary truncate">
                        {place.name}
                      </span>
                      <Badge
                        variant={
                          place.visibility === "PUBLIC"
                            ? "success"
                            : place.visibility === "UNLISTED"
                            ? "default"
                            : "warning"
                        }
                        className="shrink-0"
                      >
                        {VISIBILITY_LABELS[place.visibility]}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-tertiary mt-1">
                      {[
                        place.linkedPosts.length > 0 &&
                          `글 ${place.linkedPosts.length}개`,
                        place.linkedAlbums.length > 0 &&
                          `앨범 ${place.linkedAlbums.length}개`,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "연결 없음"}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* 오른쪽: 지도 */}
        <div className="flex-1 relative">
          <AdminMapInner
            places={places}
            addMode={addMode}
            onMapClick={openCreateAt}
            onMarkerClick={openEdit}
            pendingLat={form.lat}
            pendingLng={form.lng}
          />
        </div>
      </div>

      {/* 핀 편집 모달 */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? "핀 수정" : "새 핀"}
        size="md"
        footer={
          <div className="flex justify-between w-full">
            {editingId ? (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                loading={saving}
              >
                삭제
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={closeModal}>
                취소
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                loading={saving}
                disabled={!form.name.trim() || form.lat == null}
              >
                저장
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {/* 이름 */}
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1">
              이름
            </label>
            <input
              className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              placeholder="장소 이름"
            />
          </div>

          {/* 좌표 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-text-primary block mb-1">
                위도
              </label>
              <input
                type="number"
                readOnly
                className="w-full border border-border-default rounded-lg px-3 py-2 text-sm bg-bg-secondary text-text-secondary cursor-not-allowed"
                value={form.lat?.toFixed(6) ?? ""}
                placeholder="지도 클릭으로 설정"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-primary block mb-1">
                경도
              </label>
              <input
                type="number"
                readOnly
                className="w-full border border-border-default rounded-lg px-3 py-2 text-sm bg-bg-secondary text-text-secondary cursor-not-allowed"
                value={form.lng?.toFixed(6) ?? ""}
                placeholder="지도 클릭으로 설정"
              />
            </div>
          </div>

          {/* 공개 범위 */}
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1">
              공개 범위
            </label>
            <select
              className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
              value={form.visibility}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  visibility: e.target.value as "PUBLIC" | "UNLISTED" | "PRIVATE",
                }))
              }
            >
              <option value="PUBLIC">공개</option>
              <option value="UNLISTED">링크 공유</option>
              <option value="PRIVATE">가족 전용</option>
            </select>
          </div>

          {/* 연결된 글 */}
          {posts.length > 0 && (
            <div>
              <label className="text-sm font-medium text-text-primary block mb-2">
                연결된 글
              </label>
              <div className="max-h-36 overflow-y-auto border border-border-default rounded-lg divide-y divide-border-default">
                {posts.map((post) => (
                  <label
                    key={post.id}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-bg-secondary"
                  >
                    <input
                      type="checkbox"
                      checked={form.postIds.includes(post.id)}
                      onChange={() =>
                        setForm((f) => ({
                          ...f,
                          postIds: toggleId(f.postIds, post.id),
                        }))
                      }
                      className="accent-brand"
                    />
                    <span className="text-sm text-text-primary truncate">
                      {post.title}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 연결된 앨범 */}
          {albums.length > 0 && (
            <div>
              <label className="text-sm font-medium text-text-primary block mb-2">
                연결된 앨범
              </label>
              <div className="max-h-36 overflow-y-auto border border-border-default rounded-lg divide-y divide-border-default">
                {albums.map((album) => (
                  <label
                    key={album.id}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-bg-secondary"
                  >
                    <input
                      type="checkbox"
                      checked={form.albumIds.includes(album.id)}
                      onChange={() =>
                        setForm((f) => ({
                          ...f,
                          albumIds: toggleId(f.albumIds, album.id),
                        }))
                      }
                      className="accent-brand"
                    />
                    <span className="text-sm text-text-primary truncate">
                      {album.title}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
