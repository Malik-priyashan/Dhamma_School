"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { StudentDTO, Sibling } from "../types/types";
import { registerStudent } from "../api/studentformapi";

export function useStudentForm(initial?: Partial<StudentDTO>) {
  const storageKey = 'studentForm:v1';

  const [data, setData] = useState<StudentDTO>(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      const base = { fullNameWithSurnameEn: "", agreeToTerms: false } as Partial<StudentDTO>;
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...base, ...(parsed.data ?? {}), ...initial } as StudentDTO;
      }
    } catch {
      // ignore initialization errors
    }
    return { fullNameWithSurnameEn: "", agreeToTerms: false, ...initial } as StudentDTO;
  });

  const [step, setStep] = useState<number>(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.step ?? 1;
      }
    } catch {
      // ignore
    }
    return 1;
  });

  function setField<K extends keyof StudentDTO>(key: K, value: StudentDTO[K]) {
    setData((s) => {
      const next = { ...s, [key]: value } as StudentDTO;
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
    // Ensure agreeToTerms flag exists
    if (!data.agreeToTerms) {
      throw new Error("Must agree to terms");
    }

    // Combine English and Sinhala emergency medicine into `medicine` before sending.
    const en = data.emergencyMedicineEn ?? '';
    const si = data.emergencyMedicineSi ?? '';
    const combined = [en, si].filter((s) => !!s).join(' | ');

    const payload = { ...data, medicine: combined } as StudentDTO;

    try {
      const res = await registerStudent(payload);
      try {
        sessionStorage.removeItem(storageKey);
      } catch {}
      return res;
    } catch (err) {
      console.error("Failed to submit student:", err);
      throw err;
    }
  }

  function reset() {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {}
    setData({ fullNameWithSurnameEn: "", agreeToTerms: false, ...initial } as StudentDTO);
    setStep(1);
  }

  // sync storage when data or step change (catch cases not covered above)
  useEffect(() => {
      try {
        const raw = sessionStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : {};
        sessionStorage.setItem(storageKey, JSON.stringify({ ...parsed, data, step }));
      } catch {}
  }, [data, step]);

  return { data, setField, step, next, prev, submit, setData, reset } as const;
}

// UI helpers previously in separate files
export function useLocaleFields(data: StudentDTO, onChange: (k: keyof StudentDTO, v: unknown) => void) {
  const locale = useLocale();

  const getLocaleValue = (enKey: keyof StudentDTO, siKey: keyof StudentDTO) => {
    const val = locale === 'si' ? (data[siKey] ?? '') : (data[enKey] ?? '');
    return typeof val === 'string' ? val : String(val ?? '');
  };

  const setLocaleValue = (enKey: keyof StudentDTO, siKey: keyof StudentDTO, value: unknown) => {
    const key = locale === 'si' ? siKey : enKey;
    onChange(key, value);
  };

  return { locale, getLocaleValue, setLocaleValue } as const;
}

export function useSiblings(data: StudentDTO, onChange: (k: keyof StudentDTO, v: unknown) => void) {
  function setSiblings(next: Sibling[]) {
    onChange('siblings' as keyof StudentDTO, next);
  }

  function addSibling() {
    const next = [...(data.siblings ?? []), { nameEn: '', nameSi: '', gradeEn: '', gradeSi: '' } as Sibling];
    setSiblings(next);
  }

  function removeSibling(idx: number) {
    const next = (data.siblings ?? []).filter((_, i) => i !== idx);
    setSiblings(next);
  }

  function updateSibling(idx: number, field: keyof Sibling, value: unknown) {
    const arr = [...(data.siblings ?? [])];
    const item = { ...(arr[idx] || {}) } as Record<string, unknown>;
    item[String(field)] = value;
    arr[idx] = item as unknown as Sibling;
    setSiblings(arr);
  }

  return { setSiblings, addSibling, removeSibling, updateSibling } as const;
}

export function useStudentFormUI({ step, setField, submit }: { step: number; setField: <K extends keyof StudentDTO>(k: K, v: StudentDTO[K]) => void; submit: () => Promise<unknown>; }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  function computeCompletion() {
    const completed = Math.max(0, step - 1);
    const pct = Math.round((completed / 4) * 100);
    return Math.min(100, Math.max(0, pct));
  }

  const percent = computeCompletion();

  function onChange<K extends keyof StudentDTO>(k: K, v: StudentDTO[K]) {
    setField(k, v);
  }

  async function handleSubmit(onSuccess?: () => void, onError?: (err: unknown) => void) {
    setMessage(null);
    setLoading(true);
    try {
      const res = await submit();
      if (onSuccess) onSuccess();
      return res;
    } catch (err) {
      try { const { getErrorMessage } = await import('../../../../lib/errors');
        setMessage(getErrorMessage(err));
      } catch {
        setMessage('Submission failed');
      }
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
