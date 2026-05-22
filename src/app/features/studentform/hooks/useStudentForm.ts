"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { StudentDTO, Sibling } from "../types/types";
import { submitStudentRequest } from "../api/studentRequestApi";
import { buildStudentDTO } from "../dto/dto";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "../../../../config";

const MAX_STUDENT_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_STUDENT_IMAGE_TYPES = ["image/jpeg", "image/webp"];

export function useStudentForm(initial?: Partial<StudentDTO>) {
  const storageKey = 'studentForm:v1';

  const [data, setData] = useState<StudentDTO>(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      const base = { fullNameWithSurname: "", agreeToTerms: false } as Partial<StudentDTO>;
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...base, ...(parsed.data ?? {}), ...initial } as StudentDTO;
      }
    } catch {
      // ignore initialization errors
    }
    return { fullNameWithSurname: "", studentImage: null, agreeToTerms: false, ...initial } as StudentDTO;
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

    if (!(data.studentImage instanceof File)) {
      throw new Error("Please choose a student profile image.");
    }

    if (!ALLOWED_STUDENT_IMAGE_TYPES.includes(data.studentImage.type)) {
      throw new Error("Please choose a JPG or WEBP image. PNG images are not accepted.");
    }

    if (data.studentImage.size > MAX_STUDENT_IMAGE_SIZE) {
      throw new Error("Please choose an image under 5 MB.");
    }

    // medicine is already a single field in the new schema
    const payload = buildStudentDTO(data);

    // Handle student image upload to Cloudinary if it's a File
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET && data.studentImage instanceof File) {
      try {
        const slugify = (s: string) =>
          String(s)
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'student';

        const studentNameSlug = slugify(data.fullNameWithSurname);
        const publicId = `student-profile-${studentNameSlug}-${Date.now()}`;

        const form = new FormData();
        form.append('file', data.studentImage);
        form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        form.append('folder', 'dhammaschool/students');
        form.append('public_id', publicId);

        const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;
        const uploadRes = await fetch(uploadUrl, { method: 'POST', body: form });
        const uploadJson = await uploadRes.json();

        if (!uploadRes.ok) throw new Error(uploadJson?.error?.message || 'Cloudinary upload failed');

        const secureUrl = uploadJson.secure_url || uploadJson.url;
        if (secureUrl) {
          payload.studentImage = secureUrl;
        }
      } catch (err) {
        console.error("Cloudinary upload failed:", err);
        // continue with original payload or throw?
        // for now let's continue, backend might handle it or it stays null
      }
    }

    try {
      const res = await submitStudentRequest(payload as StudentDTO);
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
    setData({ fullNameWithSurname: "", studentImage: null, agreeToTerms: false, ...initial } as StudentDTO);
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
// Note: localized-field helpers removed — the form uses unified field names now.

export function useSiblings(data: StudentDTO, onChange: <K extends keyof StudentDTO>(k: K, v: StudentDTO[K]) => void) {
  function setSiblings(next: Sibling[]) {
    onChange('siblings' as keyof StudentDTO, next);
  }

  function addSibling() {
    const next = [...(data.siblings ?? []), { name: '', grade: '' } as Sibling];
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

export function useStudentFormUI({ step, setFieldAction, submitAction, data }: { step: number; setFieldAction: <K extends keyof StudentDTO>(k: K, v: StudentDTO[K]) => void; submitAction: () => Promise<unknown>; data: StudentDTO; }) {
  const t = useTranslations();
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
    const pct = Math.round((completed / 4) * 100);
    return Math.min(100, Math.max(0, pct));
  }

  const percent = computeCompletion();

  function onChange<K extends keyof StudentDTO>(k: K, v: StudentDTO[K]) {
    setFieldAction(k, v);
  }

  function notify(messageText: string, type: 'success' | 'error' = 'success') {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    const toastDuration = 3000;
    setToast({ show: true, message: messageText, type, duration: toastDuration, id: Date.now() });
    toastTimerRef.current = setTimeout(() => {
      setToast((current) => ({ ...current, show: false, message: '' }));
      toastTimerRef.current = null;
    }, toastDuration);
  }

  function validateStepFields(currentStep: number) {
    if (currentStep === 1) {
      const image = data.studentImage;
      const hasValidImage =
        image instanceof File &&
        ALLOWED_STUDENT_IMAGE_TYPES.includes(image.type) &&
        image.size <= MAX_STUDENT_IMAGE_SIZE;
      const hasName = !!(String(data.fullNameWithSurname ?? '').trim());
      const hasDob = !!String(data.dob ?? '').trim();
      const hasPhone = !!String(data.phone2 ?? '').trim();
      const hasAddress = !!String(data.address ?? '').trim();
      const hasSchool = !!String(data.school ?? '').trim();

      if (!(image instanceof File)) {
        notify('Please choose a student profile image.', 'error');
        return false;
      }

      if (!hasValidImage) {
        notify('Please choose a JPG or WEBP image under 5 MB. PNG images are not accepted.', 'error');
        return false;
      }

      if (!hasName || !hasDob || !hasPhone || !hasAddress || !hasSchool) {
        notify(t('form.fillRequiredFields') || 'Please fill required fields', 'error');
        return false;
      }
    }

    if (currentStep === 3) {
      const hasEmergencyName = !!String(data.emergencyPersonName ?? '').trim();
      const hasEmergencyNumber = !!String(data.emergencyNumber ?? '').trim();
      if (!hasEmergencyName || !hasEmergencyNumber) {
        notify(t('form.fillRequiredFields') || 'Please fill required fields', 'error');
        return false;
      }
    }

    return true;
  }

  async function handleSubmit(onSuccess?: () => void, onError?: (err: unknown) => void) {
    setMessage(null);
    setLoading(true);
    try {
      const res = await submitAction();
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
    validateStepFields,
    toast,
    notify,
  } as const;
}
