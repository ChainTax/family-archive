"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";

type Entry = {
  id: string;
  name: string;
  message: string;
  createdAt: string;
};

export default function GuestbookPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/guestbook")
      .then((r) => r.json())
      .then(setEntries)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });
      if (res.ok) {
        setSubmitted(true);
        setName("");
        setMessage("");
      } else {
        const data = await res.json();
        setError(data.error ?? "오류가 발생했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-1">방명록</h1>
      <p className="text-text-secondary mb-8">
        방문해 주셔서 감사해요. 짧은 인사라도 남겨주세요 :)
      </p>

      {/* 작성 폼 */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-border-default p-6 mb-8"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1">
              이름
            </label>
            <input
              className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              maxLength={50}
              disabled={submitting || submitted}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1">
              메시지
            </label>
            <textarea
              className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="안녕하세요, 잘 봤어요!"
              maxLength={500}
              disabled={submitting || submitted}
            />
            <p className="text-xs text-text-tertiary mt-1 text-right">
              {message.length}/500
            </p>
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          {submitted ? (
            <p className="text-sm text-green-600 font-medium">
              방명록이 등록되었습니다. 관리자 검토 후 게시됩니다.
            </p>
          ) : (
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              disabled={!name.trim() || !message.trim()}
            >
              방명록 남기기
            </Button>
          )}
        </div>
      </form>

      {/* 방명록 목록 */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-border-default p-5 animate-pulse h-24"
            />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-center text-text-tertiary py-12">
          아직 방명록이 없어요. 첫 번째 방명록을 남겨보세요!
        </p>
      ) : (
        <ul className="space-y-4">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="bg-white rounded-2xl border border-border-default p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-text-primary text-sm">
                  {entry.name}
                </span>
                <time className="text-xs text-text-tertiary">
                  {new Date(entry.createdAt).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                {entry.message}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
