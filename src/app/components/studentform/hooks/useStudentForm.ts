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
    } catch (e) {
      // ignore
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
    } catch (e) {
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
    // Ensure agreeToTerms flag exists
    if (!data.agreeToTerms) {
      throw new Error("Must agree to terms");
    }

    // Combine English and Sinhala emergency medicine into `medicine` before sending.
    const en = data.emergencyMedicineEn ?? '';
    const si = data.emergencyMedicineSi ?? '';
    const combined = [en, si].filter((s) => !!s).join(' | ');

    const payload: any = { ...data, medicine: combined };

    console.log("Submitting Student payload:", payload);
    try {
      const res = await registerStudent(payload);
      try {
        sessionStorage.removeItem(storageKey);
      } catch (e) {}
      return res;
    } catch (e) {
      console.error("Failed to submit student:", e);
      throw e;
    }
  }

  function reset() {
    try {
      sessionStorage.removeItem(storageKey);
    } catch (e) {}
    const base = { fullNameWithSurnameEn: "", agreeToTerms: false } as Partial<StudentDTO>;
    setData({ fullNameWithSurnameEn: "", agreeToTerms: false, ...initial } as StudentDTO);
    setStep(1);
  }

  // sync storage when data or step change (catch cases not covered above)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      sessionStorage.setItem(storageKey, JSON.stringify({ ...parsed, data, step }));
    } catch (e) {}
  }, [data, step]);

  return { data, setField, step, next, prev, submit, setData, reset } as const;
}

// UI helpers previously in separate files
export function useLocaleFields(data: StudentDTO, onChange: (k: keyof StudentDTO, v: any) => void) {
  const locale = useLocale();

  const getLocaleValue = (enKey: keyof StudentDTO, siKey: keyof StudentDTO) => {
    const val = locale === 'si' ? (data[siKey] ?? '') : (data[enKey] ?? '');
    return typeof val === 'string' ? val : String(val ?? '');
  };

  const setLocaleValue = (enKey: keyof StudentDTO, siKey: keyof StudentDTO, value: any) => {
    const key = locale === 'si' ? siKey : enKey;
    onChange(key, value);
  };

  return { locale, getLocaleValue, setLocaleValue } as const;
}

export function useSiblings(data: StudentDTO, onChange: (k: keyof StudentDTO, v: any) => void) {
  function setSiblings(next: Sibling[]) {
    onChange('siblings' as any, next);
  }

  function addSibling() {
    const next = [...(data.siblings ?? []), { nameEn: '', nameSi: '', gradeEn: '', gradeSi: '' } as any];
    setSiblings(next);
  }

  function removeSibling(idx: number) {
    const next = (data.siblings ?? []).filter((_, i) => i !== idx);
    setSiblings(next);
  }

  function updateSibling(idx: number, field: keyof Sibling, value: any) {
    const arr = [...(data.siblings ?? [])];
    const item = { ...(arr[idx] || {}) } as any;
    item[field] = value;
    arr[idx] = item;
    setSiblings(arr);
  }

  return { setSiblings, addSibling, removeSibling, updateSibling } as const;
}

export function useStudentFormUI({ data, step, setField, submit }: { data: StudentDTO; step: number; setField: (k: keyof StudentDTO, v: any) => void; submit: () => Promise<any>; }) {
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
