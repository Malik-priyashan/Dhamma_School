"use client";

import { useState, useEffect, useRef } from "react";
import { AnnouncingDTO } from "../types/types";
import { createAnnouncing } from "../api/announcingApi";

export function useAnnouncingForm(initial?: Partial<AnnouncingDTO>) {
  const storageKey = 'announcingForm:v1';

  const [data, setData] = useState<AnnouncingDTO>(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      const base = { parentGuardianName: '', fullNameWithSurname: '' } as Partial<AnnouncingDTO>;
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...base, agreed: false, ...(parsed.data ?? {}), ...initial } as AnnouncingDTO;
      }
    } catch {}
    return { parentGuardianName: '', fullNameWithSurname: '', agreed: false, ...initial } as AnnouncingDTO;
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

  function setField<K extends keyof AnnouncingDTO>(key: K, value: AnnouncingDTO[K]) {
    setData((s) => {
      const next = { ...s, [key]: value } as AnnouncingDTO;
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
      const next = Math.min(3, s + 1);
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
    try {
      // Build payload that matches Prisma schema: AnnouncingForm + nested Special JSON
      const payloadToSend: Record<string, unknown> = {
        fullNameWithSurname: data.fullNameWithSurname ?? undefined,
        birthday: data.dob ? new Date(String(data.dob)).toISOString() : undefined,
        address: data.address ?? undefined,
        phoneLand: (data.phoneLandline ?? (data as any).phone1 ?? undefined) as string | undefined,
        phoneMobile: (data.phoneMobile ?? (data as any).phone2 ?? undefined) as string | undefined,
        school: data.school ?? undefined,
        guardianName: data.parentGuardianName ?? undefined,
        guardianAddress: data.parentGuardianAddress ?? undefined,
        studentAgreement: Boolean(data.agreed ?? false),
      };

      // Map specialTalents (UI keys) to Special model fields
      const talentKeyMap: Record<string, string> = {
        announcing: 'announcing',
        kathika: 'kathika',
        padyagayana: 'padyagayana',
        debate: 'debate',
        acting: 'acting',
        singing: 'singing',
        dancing: 'dancing',
        prefect: 'prefectOrClassLeader',
        committee: 'committee',
      };

      const special: Record<string, unknown> = {};
      if (data.specialTalents && typeof data.specialTalents === 'object') {
        for (const [k, v] of Object.entries(data.specialTalents)) {
          const mapped = talentKeyMap[k] ?? k;
          const entry = v as Record<string, unknown> | undefined;
          special[mapped] = {
            earlierSchool: entry?.inDhammaSchool ?? null,
            school: entry?.inSchool ?? null,
            other: entry?.other ?? null,
          };
        }
      }

      // Ensure all Special fields exist (set null if not provided)
      const allSpecialFields = [
        'announcing','dancing','kathika','padyagayana','debate','acting','singing','prefectOrClassLeader','committee','other'
      ];
      for (const f of allSpecialFields) {
        if (!(f in special)) special[f] = null;
      }

      (payloadToSend as any).special = special;

      const res = await createAnnouncing(payloadToSend);
      return res;
    } catch (err) {
      console.error('submit error', err);
      throw err;
    }
  }

  function reset() {
    try { sessionStorage.removeItem(storageKey); } catch {}
    setData({ parentGuardianName: '', fullNameWithSurname: '', ...initial } as AnnouncingDTO);
    setStep(1);
  }

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      sessionStorage.setItem(storageKey, JSON.stringify({ ...parsed, data, step }));
    } catch {}
  }, [data, step]);

  return { data, setField, step, next, prev, submit, setData, reset } as const;
}

export function useAnnouncingFormUI({ step, setField, submit, data }: { step: number; setField: <K extends keyof AnnouncingDTO>(k: K, v: AnnouncingDTO[K]) => void; submit: () => Promise<unknown>; data: AnnouncingDTO; }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type?: 'success' | 'error'; duration: number; id: number }>({ show: false, message: '', type: 'success', duration: 3000, id: 0 });

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  function computeCompletion() {
    const completed = Math.max(0, step - 1);
    const pct = Math.round((completed / 3) * 100);
    return Math.min(100, Math.max(0, pct));
  }

  const percent = computeCompletion();

  function onChange<K extends keyof AnnouncingDTO>(k: K, v: AnnouncingDTO[K]) {
    setField(k, v);
  }

  function notify(messageText: string, type: 'success' | 'error' = 'success') {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    const duration = 3000;
    setToast({ show: true, message: messageText, type, duration, id: Date.now() });
    toastTimerRef.current = setTimeout(() => {
      setToast((current) => ({ ...current, show: false, message: '' }));
      toastTimerRef.current = null;
    }, duration);
  }

  function validateStepFields(currentStep: number) {
    if (currentStep === 1) {
      const hasParent = !!String(data.parentGuardianName ?? '').trim();
      const hasName = !!String(data.fullNameWithSurname ?? '').trim();
      const hasDob = !!String(data.dob ?? '').trim();
      const hasMobile = !!String(data.phoneMobile ?? '').trim();
      const hasAddress = !!String(data.address ?? '').trim();
      const hasSchool = !!String(data.school ?? '').trim();
      if (!hasParent || !hasName || !hasDob || !hasMobile || !hasAddress || !hasSchool) {
        notify('Please fill required fields', 'error');
        return false;
      }
    }
    return true;
  }

  async function handleSubmit(onSuccess?: () => void, onError?: (err: unknown) => void) {
    setMessage(null);
    setLoading(true);
    try {
      const res = await submit();
      if (onSuccess) onSuccess();
      return res;
    } catch (err) {
      setMessage('Submission failed');
      if (onError) onError(err);
      throw err;
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  }

  return { loading, message, showConfirm, setShowConfirm, percent, onChange, handleSubmit, validateStepFields, toast, notify } as const;
}
