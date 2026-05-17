"use client";

import { useState, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { PrefectFormData, UsePrefectFormInitial } from "../types";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "../../../../config";

async function parseResponseText(res: Response) {
  const raw = await res.text().catch(() => null);
  let parsed: unknown = null;
  try { parsed = raw ? JSON.parse(raw) : null; } catch { parsed = null; }
  return { res, raw, parsed };
}

export function buildPrefectFormData(dto: Record<string, unknown>, teacherFile?: File | null, libraryFile?: File | null, teacherSignFile?: File | null) {
  const form = new FormData();
  Object.entries(dto || {}).forEach(([key, val]) => {
    if (val === null || val === undefined) return;
    if (Array.isArray(val) || typeof val === 'object') form.append(key, JSON.stringify(val));
    else form.append(key, String(val));
  });

  if (teacherFile) form.append('teachersConfirmFile', teacherFile, teacherFile.name);
  if (libraryFile) form.append('libraryStatusConfirmationFile', libraryFile, libraryFile.name);
  if (teacherSignFile) form.append('teachersAgreementFile', teacherSignFile, teacherSignFile.name);

  return form;
}

export async function postForm(url: string, form: FormData) {
  const res = await fetch(url, { method: 'POST', credentials: 'include', body: form });
  const { res: response, raw, parsed } = await parseResponseText(res);
  if (!response.ok) {
    let msg = `Request failed with status ${response.status}`;
    if (typeof parsed === 'object' && parsed !== null) {
      const p = parsed as Record<string, unknown>;
      if (typeof p.message === 'string') msg = p.message;
    }
    throw Object.assign(new Error(msg), { status: response.status, body: parsed ?? raw });
  }
  try { return (parsed ?? JSON.parse(raw as string)); } catch { return raw; }
}

export async function postJson(url: string, dto: Record<string, unknown>) {
  const sanitized: Record<string, unknown> = {};
  Object.entries(dto || {}).forEach(([k, v]) => { if (v === undefined || v === null) return; sanitized[k] = v; });
  const res = await fetch(url, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(sanitized) });
  const { res: response, raw, parsed } = await parseResponseText(res);
  if (!response.ok) {
    try { console.error('Prefect register error response:', { status: response.status, body: parsed ?? raw }); } catch {}
    let msg = `Request failed with status ${response.status}`;
    if (typeof parsed === 'object' && parsed !== null) {
      const p = parsed as Record<string, unknown>;
      if (typeof p.message === 'string') msg = String(p.message);
      else msg = JSON.stringify(p);
    } else if (raw) msg = String(raw);
    interface HttpError extends Error { status?: number; body?: unknown }
    const err = new Error(msg) as HttpError;
    err.status = response.status;
    err.body = parsed ?? raw;
    throw err;
  }
  try { return (parsed ?? JSON.parse(raw as string)); } catch { return raw; }
}
export function eventToFieldValue(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  const { name, value, type, checked } = e.target as HTMLInputElement;
  const val = type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? '' : Number(value)) : value);
  return { name, value: val } as { name: string; value: unknown };
}

export function useFilePreview(fileValue: unknown) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const computeFileName = (val: unknown) => {
    const f = val as File | string | null | undefined;
    if (f && typeof f === 'object' && 'name' in f) return (f as File).name ?? '';
    if (typeof f === 'string') return f;
    return '';
  };

  const fileName = computeFileName(fileValue);

  const previewUrl = ((): string | null => {
    const f = fileValue as File | null | undefined;
    if (f && typeof f === 'object' && 'name' in f) {
      try {
        return URL.createObjectURL(f as File);
      } catch {
        return null;
      }
    }
    return null;
  })();

  // revoke object URL when value changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        try { URL.revokeObjectURL(previewUrl); } catch {}
      }
    };
  }, [previewUrl]);

  function setFileFromInput(_f?: File | null) {
    // accept an optional file parameter for callers; parent updates `fileValue`
    // to trigger preview. Mark param as used to avoid unused-var lint.
    void _f;
    return;
  }

  return { fileInputRef, fileName, previewUrl, setFileFromInput } as const;
}

export function validateStepFields(data: PrefectFormData, step: number) {
  if (step === 1) {
    const hasName = !!(data.fullName ?? '').toString().trim();
    const hasAddress = !!(data.address ?? '').toString().trim();
    const hasEntranceDay = !!(data.entranceDay ?? '').toString().trim();
    const hasEntranceNo = !!(data.entranceNo ?? '').toString().trim();
    const hasGrade = !!(data.grade ?? '').toString().trim();
    if (!hasName || !hasAddress || !hasEntranceDay || !hasEntranceNo || !hasGrade) return { ok: false, message: 'Please fill all required fields' };
  }

  if (step === 2) {
    const hasTeacherFile = !!data.teacherConfirmation;
    if (!hasTeacherFile) return { ok: false, message: 'Please provide teacher confirmation file' };
  }

  if (step === 3) {
    const studentAgree = !!data.studentAgreement;
    const parentAgree = !!(data.parentsAgreement ?? data.parentAgreement);
    if (!studentAgree || !parentAgree) return { ok: false, message: 'Please accept student and parent agreements' };
  }

  return { ok: true } as const;
}

export function usePrefectForm(initial?: UsePrefectFormInitial) {
  const locale = useLocale();
  const storageKey = 'prefectForm:v1';
  const [data, setData] = useState<PrefectFormData>(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      const base = { fullName: "", grade: "" } as unknown as PrefectFormData;
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        const parsedData = (parsed && typeof parsed === 'object') ? (parsed as Record<string, unknown>)['data'] : undefined;
        return { ...base, ...(parsedData ?? {}), ...initial } as PrefectFormData;
      }
    } catch {}
    return { fullName: "", grade: "", ...initial } as PrefectFormData;
  });

  const [step, setStep] = useState<number>(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.step ?? 1;
      }
    } catch {}
    return 1;
  });

  function setField(key: keyof PrefectFormData | string, value: unknown) {
    setData((s) => {
      const next = { ...s, [key]: value } as PrefectFormData;
      try {
        const raw = sessionStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : {};
        sessionStorage.setItem(storageKey, JSON.stringify({ ...parsed, data: next, step }));
      } catch {}
      return next;
    });
  }

  function next() {
    setStep((s) => {
      const next = Math.min(4, s + 1);
      try {
        const raw = sessionStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : {};
        sessionStorage.setItem(storageKey, JSON.stringify({ ...parsed, data, step: next }));
      } catch {}
      return next;
    });
  }

  function prev() {
    setStep((s) => {
      const next = Math.max(1, s - 1);
      try {
        const raw = sessionStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : {};
        sessionStorage.setItem(storageKey, JSON.stringify({ ...parsed, data, step: next }));
      } catch {}
      return next;
    });
  }

  async function submit() {
    // basic check placeholder
    console.log("Submitting Prefect DTO:", data);
    try {
      // dynamic import to avoid client/server mismatch
      const { registerPrefect } = await import('../api/prefectboardapi');

      // prepare payload: normalize years fields (comma separated) to number[]
      const normalizeYears = (v: unknown) => {
        if (!v) return [];
        if (Array.isArray(v)) return v.map((x) => Number(x)).filter(Boolean);
        return String(v)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((n) => Number(n));
      };

      const toBoolean = (v: unknown) => {
        const truthy = (val: unknown) => {
          if (typeof val === 'boolean') return val;
          if (!val) return false;
          const s = String(val).toLowerCase();
          return s === 'yes' || s === 'true' || s === 'y' || s === '1';
        };
        return truthy(v);
      };

      const mapLibraryStatus = (v: unknown) => {
        if (!v) return null;
        const s = String(v).toLowerCase();
        switch (s) {
          case 'very_good':
            return 'VERY_GOOD';
          case 'good':
            return 'GOOD';
          case 'normal':
            return 'NORMAL';
          case 'weak':
            return 'WEAK';
          default:
            return null;
        }
      };

      const toNumberOrNull = (v: unknown) => {
        if (v === undefined || v === null || v === '') return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      };
      const payload: Record<string, unknown> = {
        // Only include fields matching the new PrefectBoard model.
        fullName: (data.fullName as string) ?? String(data.fullNameEn ?? data.fullNameSi ?? ''),

        address: data.address ?? data.addressEn ?? null,
        grade: data.grade ?? null,

        entranceDay: (() => {
          const val = data.entranceDay ?? data.gradeEntranceDayEn ?? data.gradeEntranceDaySi ?? null;
          if (!val) return null;
          try {
            const d = new Date(String(val));
            if (isNaN(d.getTime())) return null;
            return d.toISOString();
          } catch {
            return null;
          }
        })(),
        entranceNo: (locale === 'si') ? (data.entranceNoSi ?? data.entranceNoEn ?? data.entranceNo ?? null) : (data.entranceNoEn ?? data.entranceNoSi ?? data.entranceNo ?? null),

        firstTermPlace: data.firstTermPlace ?? data.firstTermPlaceEn ?? data.firstTermPlaceSi ?? null,
        firstTermMarks: toNumberOrNull(data.firstTermMarks),
        secondTermPlace: data.secondTermPlace ?? data.secondTermPlaceEn ?? data.secondTermPlaceSi ?? null,
        secondTermMarks: toNumberOrNull(data.secondTermMarks),
        thirdTermPlace: data.thirdTermPlace ?? data.thirdTermPlaceEn ?? data.thirdTermPlaceSi ?? null,
        thirdTermMarks: toNumberOrNull(data.thirdTermMarks),

        absentDaysCount: toNumberOrNull(data.absentDaysCount ?? data.poyaCount ?? data.poyaDayCount),

        isPrefect: toBoolean(data.isPrefect ?? data.wasPrefectBefore),
        isPrefectYears: normalizeYears(data.isPrefectYears ?? data.wasPrefectYears),

        isClassLeader: toBoolean(data.isClassLeader ?? data.wasClassLeaderBefore),
        isClassLeaderYears: normalizeYears(data.isClassLeaderYears ?? data.wasClassLeaderYears),

        participateForCompetitions: toBoolean(data.participateForCompetitions ?? data.participatedInCompetitions),
        participateForCompetitionsYears: normalizeYears(data.participateForCompetitionsYears ?? data.participatedCompetitionsYears),

        isInAnnouncingClub: toBoolean(data.isInAnnouncingClub ?? data.isAnnouncingMember),
        isInAnnouncingClubYears: normalizeYears(data.isInAnnouncingClubYears ?? data.announcingYears),

        isOnStage: toBoolean(data.isOnStage ?? data.performedOnUdaHamuwa),
        isOnStageYears: normalizeYears(data.isOnStageYears ?? data.udaHamuwaYears),

        participateToKatina: toBoolean(data.participateToKatina ?? data.attendedKatinaFestival),
        participateToKatinaYears: normalizeYears(data.participateToKatinaYears ?? data.katinaYears),

        poyaDayCount: toNumberOrNull(data.poyaDayCount ?? data.poyaThisYear ?? data.poyaCount),

        studentAgreement: !!data.studentAgreement,
        parentsName: data.parentsName ?? data.parentFullName ?? null,
        parentsAgreement: !!(data.parentsAgreement ?? data.parentAgreement),

        libraryStatus: mapLibraryStatus(data.libraryStatus ?? data.libraryStatement),
          libraryStatusConfirmationFile: data.libraryStatusConfirmationFile ?? null,
          teachersAgreementFile: data.teachersAgreementFile ?? null,

        teachersAgreement: !!data.teachersAgreement,

        // placeholder for uploaded teacher file URL — use teachersConfirmFile only
        teachersConfirmFile: null,

        regNo: data.regNo ?? null,
        // marks should be set by admin panel; do not populate from the form
        marks: null,
        status: data.status ?? "PENDING",
        date: data.date ?? null,
      };

      // files: upload to Cloudinary if configured; support both teacher confirm and library status files
      const teacherFile = data.teacherConfirmation;
      const libraryFile = data.libraryStatusConfirmationFile;
      const teacherSignFile = data.teachersAgreementFileUpload;

      let res: unknown;

      if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET && (teacherFile instanceof File || libraryFile instanceof File || teacherSignFile instanceof File)) {
        try {
          const slugify = (s: string) =>
            String(s)
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '') || String(Date.now());

          const localeVal = ((): string => {
            if (locale === 'si') return String(data.fullName ?? data.fullNameSi ?? data.fullNameEn ?? 'unknown');
            return String(data.fullName ?? data.fullNameEn ?? data.fullNameSi ?? 'unknown');
          })();

          const publicId = slugify(localeVal);

          // helper to upload a single file and return secure URL
          const uploadOne = async (file: File) => {
            const form = new FormData();
            form.append('file', file);
            form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            form.append('folder', 'dhammaschool');
            form.append('public_id', `${publicId}-${String(Date.now())}`);
            const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;
            const uploadRes = await fetch(uploadUrl, { method: 'POST', body: form });
            const uploadJson = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadJson?.error?.message || 'Cloudinary upload failed');
            return uploadJson.secure_url ?? uploadJson.url ?? null;
          };

          if (teacherFile instanceof File) {
            const secure = await uploadOne(teacherFile);
            if (secure) payload.teachersConfirmFile = secure;
          }

          if (libraryFile instanceof File) {
            const secure = await uploadOne(libraryFile as File);
            if (secure) payload.libraryStatusConfirmationFile = secure;
          }

          if (teacherSignFile instanceof File) {
            const secure = await uploadOne(teacherSignFile as File);
            if (secure) payload.teachersAgreementFile = secure;
          }

          try { console.debug('Prefect payload (Cloudinary):', payload); } catch {}
          res = await registerPrefect(payload);
        } catch (err) {
          throw err;
        }
      } else {
        // fallback: send any files present as multipart; registerPrefect supports both files now
        try { console.debug('Submitting Prefect payload (fallback):', payload, 'files:', teacherFile, libraryFile); } catch {}
        res = await registerPrefect(
          payload,
          teacherFile instanceof File ? teacherFile : null,
          libraryFile instanceof File ? (libraryFile as File) : null,
          teacherSignFile instanceof File ? (teacherSignFile as File) : null,
        );
      }

      try {
        sessionStorage.removeItem(storageKey);
      } catch {}

      return res;
    } catch (err) {
      throw err;
    }
  }

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      sessionStorage.setItem(storageKey, JSON.stringify({ ...parsed, data, step }));
    } catch {}
  }, [data, step]);

  function reset() {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {}
    setData({ fullName: "", grade: "", ...initial } as PrefectFormData);
    setStep(1);
  }

  return { data, setField, step, next, prev, submit, setData, reset } as const;
}

export function useLocaleFieldsPrefect(data: PrefectFormData, onChange: (k: string, v: unknown) => void) {
  const locale = useLocale();

  const getLocaleValue = (enKey: string, siKey: string): string => {
    const val = locale === 'si' ? data[siKey] : data[enKey];
    if (val === undefined || val === null) return '';
    if (typeof val === 'string' || typeof val === 'number') return String(val);
    return '';
  };

  const setLocaleValue = (enKey: string, siKey: string, value: unknown) => {
    const key = locale === 'si' ? siKey : enKey;
    onChange(key, value);
  };

  return { locale, getLocaleValue, setLocaleValue } as const;
}

export function usePrefectFormUI(args: { data: PrefectFormData; step: number; setField: (k: string | keyof PrefectFormData, v: unknown) => void; submit: () => Promise<unknown>; }) {
  const { step, setField, submit } = args;
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  function computeCompletion() {
    const completed = Math.max(0, step - 1);
    const pct = Math.round((completed / 4) * 100);
    return Math.min(100, Math.max(0, pct));
  }

  const percent = computeCompletion();

  function onChange(k: string | keyof PrefectFormData, v: unknown) {
    setField(k, v);
  }

  async function handleSubmit(onSuccess?: () => void, onError?: (err: unknown) => Promise<void> | void) {
    setMessage(null);
    setLoading(true);
    try {
      const res = await submit();
      if (onSuccess) onSuccess();
      return res;
    } catch (err) {
      // use helper to extract message safely
      try { const { getErrorMessage } = await import('../../../../lib/errors');
        setMessage(getErrorMessage(err));
      } catch {
        setMessage('Submission failed');
      }
      if (onError) await onError(err);
      throw err;
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  }

  return {
    loading,
    message,
    showConfirm,
    setShowConfirm,
    setMessage,
    percent,
    onChange,
    handleSubmit,
  } as const;
}
