"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { PrefectFormData, UsePrefectFormInitial } from "../types";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "../../../../config";

export function usePrefectForm(initial?: UsePrefectFormInitial) {
  const locale = useLocale();
  const storageKey = 'prefectForm:v1';
  const [data, setData] = useState<PrefectFormData>(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      const base = { fullNameEn: "", grade: "" } as any;
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...base, ...(parsed.data ?? {}), ...initial } as any;
      }
    } catch (e) {}
    return { fullNameEn: "", grade: "", ...initial } as any;
  });

  const [step, setStep] = useState<number>(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.step ?? 1;
      }
    } catch (e) {}
    return 1;
  });

  function setField(key: keyof PrefectFormData | string, value: any) {
    setData((s) => {
      const next = { ...s, [key]: value } as any;
      try {
        const raw = sessionStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : {};
        sessionStorage.setItem(storageKey, JSON.stringify({ ...parsed, data: next, step }));
      } catch (e) {}
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
      } catch (e) {}
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
      } catch (e) {}
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
      const normalizeYears = (v: any) => {
        if (!v) return [];
        if (Array.isArray(v)) return v.map((x) => Number(x)).filter(Boolean);
        return String(v)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((n) => Number(n));
      };

      const toYesNo = (v: any) => {
        const truthy = (val: any) => {
          if (typeof val === 'boolean') return val;
          if (!val) return false;
          const s = String(val).toLowerCase();
          return s === 'yes' || s === 'true' || s === 'y' || s === '1';
        };
        return truthy(v) ? 'YES' : 'NO';
      };

      const mapLibraryStatus = (v: any) => {
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

      const toNumberOrNull = (v: any) => {
        if (v === undefined || v === null || v === '') return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      };

      const payload: any = {
        fullNameEn: data.fullNameEn ?? '',
        fullNameSi: data.fullNameSi ?? null,
        addressEn: data.addressEn ?? null,
        addressSi: data.addressSi ?? null,
        gradeEn: data.gradeEn ?? data.grade ?? null,
        gradeSi: data.gradeSi ?? null,
        entranceNo: (locale === 'si') ? (data.entranceNoSi ?? data.entranceNoEn ?? data.entranceNo ?? null) : (data.entranceNoEn ?? data.entranceNoSi ?? data.entranceNo ?? null),
        entranceDay: (() => {
          const val = data.gradeEntranceDayEn ?? data.gradeEntranceDaySi ?? null;
          if (!val) return null;
          try {
            const d = new Date(val);
            if (isNaN(d.getTime())) return null;
            return d.toISOString();
          } catch (e) {
            return null;
          }
        })(),

        firstTermMarks: toNumberOrNull(data.firstTermMarks),
        firstTermPlace: data.firstTermPlaceEn ?? data.firstTermPlaceSi ?? data.firstTermPlace ?? null,
        secondTermMarks: toNumberOrNull(data.secondTermMarks),
        secondTermPlace: data.secondTermPlaceEn ?? data.secondTermPlaceSi ?? data.secondTermPlace ?? null,
        thirdTermMarks: toNumberOrNull(data.thirdTermMarks),
        thirdTermPlace: data.thirdTermPlaceEn ?? data.thirdTermPlaceSi ?? data.thirdTermPlace ?? null,

        // Map frontend fields to backend column names required by the API
        // Provide both expected casing variants and use a robust number conversion
        Absentdaycount: toNumberOrNull(data.absentDaysCount ?? data.poyaCount),
        absentdaycount: toNumberOrNull(data.absentDaysCount ?? data.poyaCount),
        // camelCase field expected by backend
        absentDaysCount: toNumberOrNull(data.absentDaysCount ?? data.poyaCount),

        isPrefect: toYesNo(data.wasPrefectBefore),
        isPrefectYears: normalizeYears(data.wasPrefectYears),

        isClassLeader: toYesNo(data.wasClassLeaderBefore),
        isClassLeaderYears: normalizeYears(data.wasClassLeaderYears),

        participateForCompetitions: toYesNo(data.participatedInCompetitions),
        participateForCompetitionsYears: normalizeYears(data.participatedCompetitionsYears),

        isInAnnouncingClub: toYesNo(data.isAnnouncingMember),
        isInAnnouncingClubYears: normalizeYears(data.announcingYears),

        isOnStage: toYesNo(data.performedOnUdaHamuwa),
        isOnStageYears: normalizeYears(data.udaHamuwaYears),

        participateToKatina: toYesNo(data.attendedKatinaFestival),
        participateToKatinaYears: normalizeYears(data.katinaYears),

        PoyaDayCount: toNumberOrNull(data.poyaThisYear),
        poyaDayCount: toNumberOrNull(data.poyaThisYear),

        studentAgreement: !!data.studentAgreement,
        parentsNameEn: data.parentFullNameEn ?? data.parentFullName ?? null,
        parentsNameSi: data.parentFullNameSi ?? null,
        parentsAgreement: !!data.parentAgreement,

        libraryStatus: mapLibraryStatus(data.libraryStatement),
        specialNoteEn: data.specialNoteEn ?? data.specialNote ?? null,
        specialNoteSi: data.specialNoteSi ?? null,

        teachersAgreement: !!data.teachersAgreement,

        // ensure teachersconfirmfile exists (will be set to Cloudinary URL below if uploaded)
        teachersconfirmfile: null,

        // no extra fields that the backend doesn't accept
      };

      // files: if a File was chosen and Cloudinary is configured, upload it to Cloudinary
      const teacherFile = data.teacherConfirmation;

      if (teacherFile instanceof File && CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
        try {
          // derive uploader name from the first-name/fullname field (locale-aware)
          const localeVal = ((): string => {
            if (locale === 'si') return String(data.fullNameSi ?? data.fullNameEn ?? 'unknown');
            return String(data.fullNameEn ?? data.fullNameSi ?? 'unknown');
          })();

          const slugify = (s: string) =>
            String(s)
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '') || String(Date.now());

          const publicId = slugify(localeVal);

          const form = new FormData();
          form.append('file', teacherFile);
          form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
          // put files under the `dhammaschool` folder in Cloudinary
          form.append('folder', 'dhammaschool');
          // request a public id based on user's name
          form.append('public_id', publicId);

          const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;
          const uploadRes = await fetch(uploadUrl, { method: 'POST', body: form });
          const uploadJson = await uploadRes.json();
          if (!uploadRes.ok) {
            const msg = uploadJson?.error?.message || 'Cloudinary upload failed';
            throw new Error(msg);
          }
          const secureUrl = uploadJson.secure_url ?? uploadJson.url ?? null;
          if (secureUrl) {
            // backend expects `teachersconfirmfile` column name (we send it in payload)
            payload.teachersconfirmfile = secureUrl;
            payload.teachersConfirmFile = secureUrl;
          }

          // log payload for debugging
          try { console.debug('Prefect payload (Cloudinary):', payload); } catch (e) {}

          // debug log and call backend with JSON payload (no file)
          try { console.debug('Submitting Prefect payload (Cloudinary):', payload, 'formDataFile:', teacherFile); } catch (e) {}
          var res = await registerPrefect(payload);
        } catch (e) {
          // if cloud upload fails, rethrow to surface error to caller
          throw e;
        }
      } else {
        // debug log then fallback: send file (if present) to backend which handles the upload/storage
        try { console.debug('Submitting Prefect payload (fallback):', payload, 'file:', teacherFile); } catch (e) {}
        var res = await registerPrefect(payload, teacherFile instanceof File ? teacherFile : null);
      }

      try {
        sessionStorage.removeItem(storageKey);
      } catch (e) {}

      return res;
    } catch (e) {
      throw e;
    }
  }

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      sessionStorage.setItem(storageKey, JSON.stringify({ ...parsed, data, step }));
    } catch (e) {}
  }, [data, step]);

  function reset() {
    try {
      sessionStorage.removeItem(storageKey);
    } catch (e) {}
    const base = { fullNameEn: "", grade: "" } as any;
    setData({ fullNameEn: "", grade: "", ...initial } as any);
    setStep(1);
  }

  return { data, setField, step, next, prev, submit, setData, reset } as const;
}

export function useLocaleFieldsPrefect(data: any, onChange: (k: string, v: any) => void) {
  const locale = useLocale();

  const getLocaleValue = (enKey: string, siKey: string) => {
    return locale === 'si' ? (data[siKey] ?? '') : (data[enKey] ?? '');
  };

  const setLocaleValue = (enKey: string, siKey: string, value: any) => {
    const key = locale === 'si' ? siKey : enKey;
    onChange(key, value);
  };

  return { locale, getLocaleValue, setLocaleValue } as const;
}

export function usePrefectFormUI({ data, step, setField, submit }: { data: any; step: number; setField: (k: string, v: any) => void; submit: () => Promise<any>; }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  function computeCompletion() {
    const completed = Math.max(0, step - 1);
    const pct = Math.round((completed / 4) * 100);
    return Math.min(100, Math.max(0, pct));
  }

  const percent = computeCompletion();

  function onChange(k: any, v: any) {
    setField(k, v);
  }

  async function handleSubmit(onSuccess?: () => void, onError?: (err: any) => void) {
    setMessage(null);
    setLoading(true);
    try {
      const res = await submit();
      if (onSuccess) onSuccess();
      return res;
    } catch (err) {
      setMessage((err as any)?.message || "Submission failed");
      if (onError) onError(err);
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
