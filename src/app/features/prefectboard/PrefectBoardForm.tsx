"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import Step2 from "./steps/Step2";
import Step3 from "./steps/Step3";
import Step4 from "./steps/Step4";
import Step1 from "./steps/Step1";
import { usePrefectForm, usePrefectFormUI, validateStepFields } from "./hooks/usePrefectForm";
import { useRouter } from "next/navigation";
import { fetchCurrentUser } from "../auth/api/authApi";
import { getUserRole } from "../../../lib/authUtils";

import LoadingPage from "../../components/ui/LoadingPage";

export default function PrefectBoardForm() {
  const t = useTranslations();
  const { data, setField, step, next, prev, submit, reset } = usePrefectForm();
  const ui = usePrefectFormUI({ data, step, setField, submit });
  const locale = useLocale();
  const router = useRouter();
  const [toast, setToast] = React.useState<{ show: boolean; message: string; type?: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);

  React.useEffect(() => {
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

  // use centralized validator

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
      try {
          await ui.handleSubmit(() => {
            const toastMsg = t('prefect_board_submitted') || 'Submitted';
            setToast({ show: true, message: toastMsg, type: 'success' });
            setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
            try { reset(); } catch {}
          }, async (e) => {
            try { const { getErrorMessage } = await import('../../../lib/errors');
              setToast({ show: true, message: getErrorMessage(e), type: 'error' });
            } catch {
              setToast({ show: true, message: 'Submission failed', type: 'error' });
            }
            setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
          });
    } catch (err) {
      console.error(err);
    }
  }

  if (isAuthenticated === null) return <LoadingPage />;
  if (!isAuthenticated) return null;

  return (
    <div className="bg-white min-h-screen pt-20">
      {step === 1 && (
        <div className="max-w-4xl mx-auto mt-8 mb-4">
          <div className="flex justify-start">
            <button onClick={() => router.push(`/${locale}`)} className="px-3 py-1 bg-sky-100 text-sky-800 rounded-full shadow-sm">{t('form.backToHome')}</button>
          </div>
        </div>
      )}

      <div className={`max-w-4xl mx-auto bg-white p-8 rounded-3xl shadow-xl border border-gray-200 mt-8`}>
        <div className="mb-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{t('prefect_board_title') || 'Prefect Board Application'}</h2>
          <div className="mt-2 text-sm text-gray-600">{t('form.step')} {step} / 4</div>

          <div className="mt-4 w-full">
            <div className="flex items-center justify-center mb-2">
              <div className="text-sm text-gray-700 font-medium">{ui.percent}%</div>
            </div>

            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${ui.percent}%` }} />
            </div>
          </div>
        </div>

          <div className="mb-6">
          <form onSubmit={onSubmit}>
            <div className="mb-6">
              {step === 1 && <Step1 data={data} onChange={setField} />}
              {step === 2 && <Step2 data={data} onChange={setField} />}
              {step === 3 && <Step3 data={data} onChange={setField} />}
              {step === 4 && <Step4 data={data} onChange={setField} />}
            </div>

            <div className="flex items-center justify-between">
              <div>
                {step > 1 && (
                  <button type="button" onClick={prev} className="px-4 py-2 rounded-full border border-sky-300 text-sky-700 mr-2 hover:bg-sky-50 transition">{t('form.back')}</button>
                )}
              </div>

              <div>
                {step < 4 ? (
                  <button type="button" onClick={() => { const v = validateStepFields(data, step); if (v.ok) next(); else { setToast({ show: true, message: t('form.fillRequiredFields') || v.message || 'Please fill all required fields', type: 'error' }); setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000); } }} className="px-5 py-2 bg-sky-400 hover:bg-sky-500 text-white rounded-full shadow">{t('form.next')}</button>
                ) : (
                  <div>
                    <button
                      disabled={ui.loading}
                      type="button"
                      onClick={() => ui.setShowConfirm(true)}
                      className={`px-5 py-2 rounded-full shadow ${ui.loading ? 'bg-slate-300 text-slate-600' : 'bg-sky-400 text-white hover:bg-sky-500'}`}
                    >
                      {ui.loading ? (t('form.submitting') || 'Submitting...') : (t('prefect_board_submit') || 'Submit')}
                    </button>
                    {ui.message && (
                      <div className="mt-2 text-sm text-gray-700">{ui.message}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Confirm modal */}
        {ui.showConfirm && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
            <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('form.confirmTitle')}</h3>
              <p className="text-sm text-gray-700 mb-4">{t('form.confirmMessage')}</p>
              <div className="flex justify-end">
                <button onClick={() => ui.setShowConfirm(false)} className="px-4 py-2 mr-2 rounded-full border border-sky-300 text-sky-700 hover:bg-sky-50">{t('form.confirmNo')}</button>
                <button
                    onClick={async () => {
                    try {
                      await ui.handleSubmit(() => {
                        const toastMsg = t('prefect_board_submitted') || 'Submitted';
                        setToast({ show: true, message: toastMsg, type: 'success' });
                        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
                        try { reset(); } catch {}
                      }, async (e) => {
                        try { const { getErrorMessage } = await import('../../../lib/errors');
                          setToast({ show: true, message: getErrorMessage(e) || 'Submission failed', type: 'error' });
                        } catch {
                          setToast({ show: true, message: 'Submission failed', type: 'error' });
                        }
                        setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 3000);
                      });
                    } catch {
                      // handled in hook
                    }
                  }}
                  disabled={ui.loading}
                  className={`px-4 py-2 rounded-full ${ui.loading ? 'bg-slate-300 text-slate-600' : 'bg-sky-400 text-white hover:bg-sky-500'}`}
                >
                  {ui.loading ? (t('form.submitting') || 'Submitting...') : t('form.confirmYes')}
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
    </div>
  );
}
