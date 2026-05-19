"use client";

import React from "react";
import { useAnnouncingForm, useAnnouncingFormUI } from "./hooks/useAnnouncingForm";
import Step1 from "./steps/Step1";
import Step2 from "./steps/Step2";
import Step3 from "./steps/Step3";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { fetchCurrentUser } from "../auth/api/authApi";
import { getUserRole } from "../../../lib/authUtils";
import LoadingPage from "../../components/ui/LoadingPage";

export default function AnnouncingForm() {
  const { data, setField, step, next, prev, submit, reset } = useAnnouncingForm();
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations();
  const { loading, showConfirm, setShowConfirm, percent, onChange, handleSubmit, validateStepFields, toast, notify } = useAnnouncingFormUI({ step, setField, submit, data });
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function syncAuth() {
      try {
        await fetchCurrentUser();
        const role = getUserRole();
        
        if (role !== 'STUDENT') {
          router.push(`/${locale}`);
          return;
        }

        if (isMounted) {
          setIsAuthenticated(true);
        }
      } catch {
        if (isMounted) {
          setIsAuthenticated(false);
          router.push(`/${locale}/login`);
        }
      }
    }

    syncAuth();

    return () => {
      isMounted = false;
    };
  }, [locale, router]);

  const doSubmit = async () => {
    try {
      await handleSubmit(
        () => { try { reset(); notify('Submitted', 'success'); } catch {} },
        (err) => {
          try {
            const msg = err && (err as any).message ? String((err as any).message).slice(0, 1000) : 'Submission failed';
            notify(msg, 'error');
          } catch {
            notify('Submission failed', 'error');
          }
        }
      );
    } catch {}
  };

  if (isAuthenticated === null) return <LoadingPage />;
  if (!isAuthenticated) return null;

  return (
    <>
      {step === 1 && (
        <div className="max-w-4xl mx-auto mt-20 mb-4 text-left">
          <div className="flex justify-start">
            <button onClick={() => router.push(`/${locale}`)} className="px-3 py-1 bg-sky-100 text-sky-800 rounded-full shadow-sm">
              {t('form.backToHome') || 'Back'}
            </button>
          </div>
        </div>
      )}

      <div className={`relative max-w-4xl mx-auto bg-white p-8 rounded-3xl shadow-xl border border-gray-200 ${step === 1 ? '' : 'mt-20'}`}>
        <div className="mb-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{t('announcing_form.title')}</h2>
        <div className="mt-2 text-sm text-gray-600">{t('form.step')} {step} / 3</div>
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
        {step === 1 && <Step1 data={data} onChange={onChange} />}
        {step === 2 && <Step2 data={data} onChange={onChange} />}
        {step === 3 && <Step3 data={data} onChange={onChange} setShowConfirm={setShowConfirm} loading={loading} notify={notify} />}
      </div>

      <div className="flex items-center justify-between">
        <div>
          {step > 1 && (
            <button onClick={prev} className="px-4 py-2 rounded-full border border-sky-300 text-sky-700 mr-2 hover:bg-sky-50 transition">{t('form.back')}</button>
          )}
        </div>

        <div>
          {step < 3 ? (
            <button onClick={() => { if (validateStepFields(step)) next(); }} className="px-5 py-2 bg-sky-400 hover:bg-sky-500 text-white rounded-full shadow">{t('form.next')}</button>
          ) : null}
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('announcing_form.confirmTitle')}</h3>
            <p className="text-sm text-gray-700 mb-4">{t('announcing_form.confirmMessage')}</p>
            <div className="flex justify-end">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 mr-2 rounded-full border border-sky-300 text-sky-700 hover:bg-sky-50">{t('form.confirmNo')}</button>
              <button onClick={doSubmit} disabled={loading} className={`px-4 py-2 rounded-full ${loading ? 'bg-slate-300 text-slate-600' : 'bg-sky-400 text-white hover:bg-sky-500'}`}>{t('form.confirmYes')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating submit button at bottom-right when on final step */}
      {step === 3 && (
        <div className="absolute right-6 bottom-6 z-40">
          <button
            onClick={() => {
              // replicate Step3's submit validation
              if (!data.agreed) {
                try { notify(t('form.mustAgree') || 'You must agree to the terms', 'error'); } catch {}
                return;
              }
              setShowConfirm(true);
            }}
            disabled={loading}
            className={`px-5 py-3 rounded-full shadow-lg ${loading ? 'bg-slate-300 text-slate-600' : 'bg-sky-500 text-white hover:bg-sky-600'}`}
          >
            {loading ? (t('form.submitting') || 'Submitting...') : t('form.submit')}
          </button>
        </div>
      )}

      <div className="pointer-events-none">
        <div className={`fixed top-4 right-4 z-50 transform transition-all ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className={`${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white px-4 py-2 rounded-lg shadow-lg`}>{toast.message}</div>
        </div>
      </div>
    </div>
    </>
  );
}
