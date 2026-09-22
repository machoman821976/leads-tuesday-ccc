import { desc } from "drizzle-orm";
import { db } from "@/db";
import { supabase } from "@/lib/supabase-client";
import { applications, applicationNotes } from "../../../drizzle/schema";
import NotesPanel from "./NotesPanel";

export const dynamic = "force-dynamic";

async function getFileUrl(path: string) {
  const { data, error } = await supabase.storage
    .from("applications")
    .createSignedUrl(path, 60 * 60);

  if (error || !data?.signedUrl) {
    return supabase.storage.from("applications").getPublicUrl(path).data
      .publicUrl;
  }
  return data.signedUrl;
}

async function getApplications() {
  const rows = await db
    .select()
    .from(applications)
    .orderBy(desc(applications.createdAt));

  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      ceoCardUrl: await getFileUrl(row.ceoCardPath),
      managerCardUrl: await getFileUrl(row.managerCardPath),
      irDeckUrl: await getFileUrl(row.irDeckPath),
    }))
  );
}

async function getNotesByApplication() {
  const notes = await db
    .select()
    .from(applicationNotes)
    .orderBy(desc(applicationNotes.createdAt));

  const byApplication = new Map<number, typeof notes>();
  for (const note of notes) {
    const list = byApplication.get(note.applicationId) ?? [];
    list.push(note);
    byApplication.set(note.applicationId, list);
  }
  return byApplication;
}

export default async function AdminPage() {
  const [rows, notesByApplication] = await Promise.all([
    getApplications(),
    getNotesByApplication(),
  ]);

  return (
    <div className="flex flex-1 flex-col items-center bg-slate-100 font-sans dark:bg-black">
      <header className="flex w-full flex-col bg-[#0b3b74]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 sm:px-10">
          <h1 className="text-lg font-semibold text-white">
            보증신청 관리자
          </h1>
          <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-blue-50">
            총 {rows.length}건
          </span>
        </div>
        <div className="h-1 w-full bg-[#F5B335]" />
      </header>

      <main className="flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10 sm:px-10">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-white/[.145] dark:bg-zinc-950">
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              등록된 신청서가 없습니다.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_12px_28px_-16px_rgba(15,23,42,0.25)] dark:border-white/[.145] dark:bg-zinc-950">
            <table className="w-full min-w-[1180px] table-auto text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:border-white/[.145] dark:text-zinc-500">
                  <th className="px-4 py-3">접수일시</th>
                  <th className="px-4 py-3">기업명</th>
                  <th className="px-4 py-3">대표이사</th>
                  <th className="px-4 py-3">담당자</th>
                  <th className="px-4 py-3">BM</th>
                  <th className="px-4 py-3">첨부파일</th>
                  <th className="px-4 py-3">메모</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 align-top last:border-0 dark:border-white/[.08]"
                  >
                    <td className="whitespace-nowrap px-4 py-4 text-slate-500 dark:text-zinc-400">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-900 dark:text-zinc-50">
                      {row.companyName}
                    </td>
                    <td className="px-4 py-4 text-slate-700 dark:text-zinc-200">
                      <div>{row.ceoName}</div>
                      <div className="text-xs text-slate-400 dark:text-zinc-500">
                        {row.ceoPhone}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-700 dark:text-zinc-200">
                      <div>{row.managerName}</div>
                      <div className="text-xs text-slate-400 dark:text-zinc-500">
                        {row.managerPhone}
                      </div>
                    </td>
                    <td className="max-w-xs px-4 py-4 text-slate-700 dark:text-zinc-200">
                      {row.businessModel}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1.5">
                        <FileLink href={row.ceoCardUrl} label="대표자 명함" />
                        <FileLink
                          href={row.managerCardUrl}
                          label="담당자 명함"
                        />
                        <FileLink href={row.irDeckUrl} label="IR DECK" />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <NotesPanel
                        applicationId={row.id}
                        initialNotes={(notesByApplication.get(row.id) ?? []).map(
                          (note) => ({
                            id: note.id,
                            content: note.content,
                            createdAt: note.createdAt.toISOString(),
                          })
                        )}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function FileLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs font-medium text-[#0b3b74] hover:underline dark:text-blue-300"
    >
      {label} 보기
    </a>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}
