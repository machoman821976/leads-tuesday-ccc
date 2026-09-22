"use client";

import { useState, type FormEvent } from "react";

type Note = {
  id: number;
  content: string;
  createdAt: string;
};

export default function NotesPanel({
  applicationId,
  initialNotes,
}: {
  applicationId: number;
  initialNotes: Note[];
}) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      if (!res.ok) throw new Error(`메모 저장 실패 (${res.status})`);
      const { note } = await res.json();
      setNotes((prev) => [note, ...prev]);
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "메모 저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex w-64 flex-col gap-2">
      {notes.length > 0 && (
        <ul className="flex max-h-32 flex-col gap-1.5 overflow-y-auto pr-1">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 dark:bg-white/[.06] dark:text-zinc-200"
            >
              <p className="whitespace-pre-wrap">{note.content}</p>
              <p className="mt-1 text-[10px] text-slate-400 dark:text-zinc-500">
                {formatDate(note.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="메모 입력..."
          rows={2}
          className="w-full resize-none rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none transition-colors focus:border-[#0b3b74] focus:ring-1 focus:ring-[#0b3b74] dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50"
        />
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="self-end rounded-full bg-[#0b3b74] px-3 py-1 text-[11px] font-medium text-white transition-colors hover:bg-[#0a2f5c] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "저장 중..." : "메모 추가"}
        </button>
        {error && (
          <p className="text-[10px] text-red-600 dark:text-red-400">{error}</p>
        )}
      </form>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
