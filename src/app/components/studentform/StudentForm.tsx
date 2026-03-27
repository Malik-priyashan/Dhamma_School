"use client";

import React from "react";
import { useStudentForm } from "./hooks/useStudentForm";
import Step1 from "./steps/Step1";
import Step2 from "./steps/Step2";
import Step3 from "./steps/Step3";
import Step4 from "./steps/Step4";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useStudentFormUI } from "./hooks/useStudentForm";

export default function StudentForm() {
  const { data, setField, step, next, prev, submit, reset } = useStudentForm();
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { loading, message, showConfirm, setShowConfirm, percent, onChange, handleSubmit } = useStudentFormUI({ step, setField, submit });
  const [toast, setToast] = React.useState<{ show: boolean; message: string; type?: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  function validateStepFields(currentStep: number) {
    if (currentStep === 1) {
      const hasName = !!((data.fullNameWithSurnameEn ?? '').toString().trim() || (data.fullNameWithSurnameSi ?? '').toString().trim());
      const hasDob = !!(data.dob ?? '').toString().trim();
      const hasPhone = !!(data.phone2 ?? '').toString().trim();
      const hasAddress = !!((data.addressEn ?? '').toString().trim() || (data.addressSi ?? '').toString().trim());
      const hasSchool = !!((data.schoolEn ?? '').toString().trim() || (data.schoolSi ?? '').toString().trim());
      if (!hasName || !hasDob || !hasPhone || !hasAddress || !hasSchool) {
        setToast({ show: true, message: t('form.fillRequiredFields') || 'Please fill required fields', type: 'error' });
        setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
        return false;
      }
    }

    if (currentStep === 3) {
      const hasEmergencyName = !!((data.emergencyPersonNameEn ?? '').toString().trim() || (data.emergencyPersonNameSi ?? '').toString().trim());
      const hasEmergencyNumber = !!(data.emergencyNumber ?? '').toString().trim();
      if (!hasEmergencyName || !hasEmergencyNumber) {
        setToast({ show: true, message: t('form.fillRequiredFields') || 'Please fill required fields', type: 'error' });
        setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
        return false;
      }
    }

    return true;
  }

  // `percent`, `onChange`, `loading`, `message`, and submit handling
  // are provided by `useStudentFormUI`.

  return (
    <>
      {step === 1 && (
        <div className="max-w-4xl mx-auto mt-20 mb-4">
          <div className="flex justify-start">
            <button onClick={() => router.push(`/${locale}`)} className="px-3 py-1 bg-sky-100 text-sky-800 rounded-full shadow-sm">{t('form.backToHome')}</button>
          </div>
        </div>
      )}

      <div className={`max-w-4xl mx-auto bg-white p-8 rounded-3xl shadow-xl border border-gray-200 ${step === 1 ? '' : 'mt-20'}`}>
      <div className="mb-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{t('form.title')}</h2>
        <div className="mt-2 text-sm text-gray-600">{t('form.step')} {step} / 4</div>

        <div className="mt-4 w-full">
          <div className="flex items-center justify-center mb-2">
            <div className="text-sm text-gray-700 font-medium">{percent}%</div>
          </div>

          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>

      <div className="mb-6">
        {step === 1 && <Step1 data={data} onChange={onChange as (k: keyof typeof data, v: unknown) => void} />}
        {step === 2 && <Step2 data={data} onChange={onChange as (k: keyof typeof data, v: unknown) => void} />}
        {step === 3 && <Step3 data={data} onChange={onChange as (k: keyof typeof data, v: unknown) => void} />}
        {step === 4 && <Step4 data={data} onChange={onChange as (k: keyof typeof data, v: unknown) => void} />}
      </div>

      <div className="flex items-center justify-between">
        <div>
          {step > 1 && (
            <button onClick={prev} className="px-4 py-2 rounded-full border border-sky-300 text-sky-700 mr-2 hover:bg-sky-50 transition">{t('form.back')}</button>
          )}
        </div>

        <div>
          {step < 4 ? (
            <button
              onClick={() => { if (validateStepFields(step)) next(); }}
              className="px-5 py-2 bg-sky-400 hover:bg-sky-500 text-white rounded-full shadow"
            >
              {t('form.next')}
            </button>
          ) : (
            <div>
              <button
                onClick={async () => {
                  try {
                    await handleSubmit(
                      () => {
                        const toastMsg = t('form.toastSuccess') || 'Submitted';
                        setToast({ show: true, message: toastMsg, type: 'success' });
                        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
                        try { reset(); } catch {}
                      },
                      async (e) => {
                        try {
                          const { getErrorMessage } = await import('../../../lib/errors');
                          setToast({ show: true, message: getErrorMessage(e) || t('form.submissionFailed') || 'Submission failed', type: 'error' });
                        } catch {
                          setToast({ show: true, message: t('form.submissionFailed') || 'Submission failed', type: 'error' });
                        }
                        setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
                      }
                    );
                  } catch (err) {
                    console.error(err);
                  }
                }}
                disabled={loading}
                className={`px-5 py-2 rounded-full ${loading ? 'bg-slate-300 text-slate-600' : 'bg-sky-400 text-white hover:bg-sky-500'}`}
              >
                {loading ? (t('form.submitting') || 'Submitting...') : t('form.submit')}
              </button>
              {message && (
                <div className="mt-2 text-sm text-gray-700">{message}</div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('form.confirmTitle')}</h3>
            <p className="text-sm text-gray-700 mb-4">{t('form.confirmMessage')}</p>
            <div className="flex justify-end">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 mr-2 rounded-full border border-sky-300 text-sky-700 hover:bg-sky-50">{t('form.confirmNo')}</button>
              <button
                onClick={async () => {
                    try {
                      await handleSubmit(() => {
                        const toastMsg = t('form.toastSuccess') || 'Submitted';
                        setToast({ show: true, message: toastMsg, type: 'success' });
                        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
                        // reset form to first step and clear data
                        try { reset(); } catch {}
                      }, async (e) => {
                        try { const { getErrorMessage } = await import('../../../lib/errors');
                          setToast({ show: true, message: getErrorMessage(e) || t('form.submissionFailed') || 'Submission failed', type: 'error' });
                        } catch {
                          setToast({ show: true, message: t('form.submissionFailed') || 'Submission failed', type: 'error' });
                        }
                        setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
                      });
                    } catch {
                      // message state is handled in hook; no-op here
                    }
                }}
                disabled={loading}
                className={`px-4 py-2 rounded-full ${loading ? 'bg-slate-300 text-slate-600' : 'bg-sky-400 text-white hover:bg-sky-500'}`}
              >
                {loading ? (t('form.submitting') || 'Submitting...') : t('form.confirmYes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast top-right */}
      <div className="pointer-events-none">
        <div className={`fixed top-4 right-4 z-50 transform transition-all ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className={`${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white px-4 py-2 rounded-lg shadow-lg`}>{toast.message}</div>
        </div>
      </div>
    </div>
    </>
  );
}
