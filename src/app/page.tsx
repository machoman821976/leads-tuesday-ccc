"use client";

import Image from "next/image";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { supabase } from "@/lib/supabase-client";

const BM_MAX_LENGTH = 30;

type FormState = {
  companyName: string;
  ceoName: string;
  managerName: string;
  ceoPhone: string;
  managerPhone: string;
  businessModel: string;
};

const initialForm: FormState = {
  companyName: "",
  ceoName: "",
  managerName: "",
  ceoPhone: "",
  managerPhone: "",
  businessModel: "",
};

const SENDER = {
  title: "신용보증기금 판교스타트업지점",
  name: "김대식",
  role: "부지점장",
  tel: "031-724-3221",
  mobile: "010-8652-4403",
  email: "kds@kodit.or.kr",
};

export default function Home() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [ceoCard, setCeoCard] = useState<File | null>(null);
  const [managerCard, setManagerCard] = useState<File | null>(null);
  const [irDeck, setIrDeck] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange =
    (field: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) => {
      const value =
        field === "businessModel"
          ? e.target.value.slice(0, BM_MAX_LENGTH)
          : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<string, string>> = {};
    if (!form.companyName.trim()) nextErrors.companyName = "기업명을 입력해 주세요.";
    if (!form.ceoName.trim()) nextErrors.ceoName = "대표이사 이름을 입력해 주세요.";
    if (!form.managerName.trim()) nextErrors.managerName = "담당자 이름을 입력해 주세요.";
    if (!form.ceoPhone.trim()) nextErrors.ceoPhone = "대표자 연락처를 입력해 주세요.";
    if (!form.managerPhone.trim()) nextErrors.managerPhone = "담당자 연락처를 입력해 주세요.";
    if (!form.businessModel.trim()) nextErrors.businessModel = "BM을 입력해 주세요.";
    if (!ceoCard) nextErrors.ceoCard = "대표자 명함을 첨부해 주세요.";
    if (!managerCard) nextErrors.managerCard = "담당자 명함을 첨부해 주세요.";
    if (!irDeck) nextErrors.irDeck = "IR DECK 파일을 첨부해 주세요.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const sanitizeFileName = (name: string) => {
    const lastDot = name.lastIndexOf(".");
    const ext = lastDot > -1 ? name.slice(lastDot) : "";
    const base = (lastDot > -1 ? name.slice(0, lastDot) : name)
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .slice(0, 50);
    return `${base || "file"}${ext}`;
  };

  const uploadAttachment = async (file: File) => {
    const path = `${Date.now()}-${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
    const { error } = await supabase.storage
      .from("applications")
      .upload(path, file);
    if (error) throw error;
    return path;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) {
      setSubmitted(false);
      return;
    }

    setSubmitting(true);
    try {
      const [ceoCardPath, managerCardPath, irDeckPath] = await Promise.all([
        uploadAttachment(ceoCard!),
        uploadAttachment(managerCard!),
        uploadAttachment(irDeck!),
      ]);

      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ceoCardPath,
          managerCardPath,
          irDeckPath,
        }),
      });

      if (!res.ok) {
        throw new Error(`제출 실패 (${res.status})`);
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitted(false);
      setSubmitError(
        err instanceof Error ? err.message : "제출 중 오류가 발생했습니다."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(initialForm);
    setCeoCard(null);
    setManagerCard(null);
    setIrDeck(null);
    setErrors({});
    setSubmitted(false);
    setSubmitError(null);
  };

  return (
    <div className="flex flex-1 flex-col items-center bg-slate-100 font-sans dark:bg-black">
      <BrandHeader />

      <main className="flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10 sm:px-10">
        <div className="flex flex-col gap-2 text-center sm:text-left">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
            보증신청 기업정보 입력
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            보증신청을 위한 최소한의 기업 정보를 입력해 주세요.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_12px_28px_-16px_rgba(15,23,42,0.25)] dark:border-white/[.145] dark:bg-zinc-950 sm:p-8"
        >
          <SectionLabel index={1} title="기업 정보" />
          <Field
            label="기업명"
            hint="(주) 포함하여 정확한 법인명을 입력해 주세요."
            error={errors.companyName}
          >
            <input
              type="text"
              value={form.companyName}
              onChange={handleChange("companyName")}
              placeholder="예: (주)판교스타트업"
              className={inputClass}
            />
          </Field>

          <SectionLabel index={2} title="대표자 및 담당자" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field label="대표이사 이름" error={errors.ceoName}>
              <input
                type="text"
                value={form.ceoName}
                onChange={handleChange("ceoName")}
                placeholder="홍길동"
                className={inputClass}
              />
            </Field>
            <Field label="담당자 이름" error={errors.managerName}>
              <input
                type="text"
                value={form.managerName}
                onChange={handleChange("managerName")}
                placeholder="홍길동"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field label="대표자 연락처" error={errors.ceoPhone}>
              <input
                type="tel"
                value={form.ceoPhone}
                onChange={handleChange("ceoPhone")}
                placeholder="010-0000-0000"
                className={inputClass}
              />
            </Field>
            <Field label="담당자 연락처" error={errors.managerPhone}>
              <input
                type="tel"
                value={form.managerPhone}
                onChange={handleChange("managerPhone")}
                placeholder="010-0000-0000"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FileField
              label="대표자 명함 첨부"
              file={ceoCard}
              onChange={setCeoCard}
              accept="image/*,.pdf"
              error={errors.ceoCard}
            />
            <FileField
              label="담당자 명함 첨부"
              file={managerCard}
              onChange={setManagerCard}
              accept="image/*,.pdf"
              error={errors.managerCard}
            />
          </div>

          <SectionLabel index={3} title="사업 소개" />
          <Field
            label="기본 BM (사업모델)"
            hint={`${form.businessModel.length}/${BM_MAX_LENGTH}자`}
            error={errors.businessModel}
          >
            <input
              type="text"
              value={form.businessModel}
              onChange={handleChange("businessModel")}
              placeholder="30자 이내로 간단히 기술해 주세요."
              maxLength={BM_MAX_LENGTH}
              className={inputClass}
            />
          </Field>

          <FileField
            label="IR DECK 첨부파일"
            file={irDeck}
            onChange={setIrDeck}
            accept=".pdf,.ppt,.pptx"
            error={errors.irDeck}
          />

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#0b3b74] px-5 text-base font-medium text-white shadow-sm transition-colors hover:bg-[#0a2f5c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "제출 중..." : "제출하기"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex h-12 items-center justify-center rounded-full border border-solid border-slate-200 px-5 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/[.145] dark:text-zinc-200 dark:hover:bg-[#1a1a1a]"
            >
              초기화
            </button>
          </div>

          {submitted && (
            <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
              제출이 완료되었습니다. 감사합니다.
            </p>
          )}
          {submitError && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
              {submitError}
            </p>
          )}
        </form>

        <SenderCard />
      </main>
    </div>
  );
}

function BrandHeader() {
  return (
    <header className="flex w-full flex-col bg-[#0b3b74]">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-3 rounded-lg bg-white px-3 py-2">
          <Image
            src="/kodit-logo.png"
            alt="KODIT 신용보증기금 KOREA CREDIT GUARANTEE FUND"
            width={160}
            height={34}
            priority
          />
        </div>
        <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-blue-50">
          판교스타트업지점
        </span>
      </div>
      <div className="h-1 w-full bg-[#F5B335]" />
    </header>
  );
}

function SenderCard() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/[.145] dark:bg-zinc-950 sm:p-6">
      <span className="text-xs font-medium text-slate-400 dark:text-zinc-500">
        보내는 사람
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold text-slate-900 dark:text-zinc-50">
          {SENDER.name} {SENDER.role}
        </p>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          {SENDER.title}
        </p>
      </div>
      <div className="mt-2 flex flex-col gap-1.5 text-sm text-slate-600 dark:text-zinc-300">
        <a href={`tel:${SENDER.tel}`} className="hover:text-[#0b3b74]">
          전화 {SENDER.tel}
        </a>
        <a href={`tel:${SENDER.mobile}`} className="hover:text-[#0b3b74]">
          휴대폰 {SENDER.mobile}
        </a>
        <a href={`mailto:${SENDER.email}`} className="hover:text-[#0b3b74]">
          이메일 {SENDER.email}
        </a>
      </div>
    </div>
  );
}

function SectionLabel({ index, title }: { index: number; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0b3b74] text-[11px] font-semibold text-white">
        {index}
      </span>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-zinc-500">
        {title}
      </span>
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-[#0b3b74] focus:ring-1 focus:ring-[#0b3b74] dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50";

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-800 dark:text-zinc-200">
        {label}
      </span>
      {children}
      {error ? (
        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
      ) : hint ? (
        <span className="text-xs text-slate-400 dark:text-zinc-400">{hint}</span>
      ) : null}
    </label>
  );
}

function FileField({
  label,
  file,
  onChange,
  accept,
  error,
}: {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  accept: string;
  error?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-800 dark:text-zinc-200">
        {label}
      </span>
      <div className="flex h-11 w-full items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 text-sm dark:border-white/[.2] dark:bg-zinc-900">
        <input
          type="file"
          accept={accept}
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          className="w-full text-xs text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-[#0b3b74]/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-[#0b3b74] hover:file:bg-[#0b3b74]/20 dark:text-zinc-400 dark:file:bg-white/[.08] dark:file:text-zinc-200"
        />
      </div>
      {error ? (
        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
      ) : file ? (
        <span className="text-xs text-slate-400 dark:text-zinc-400">
          선택됨: {file.name}
        </span>
      ) : null}
    </label>
  );
}
