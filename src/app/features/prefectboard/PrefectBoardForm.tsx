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
  const toastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toast, setToast] = React.useState<{ show: boolean; message: string; type?: 'success' | 'error'; duration: number; id: number }>({ show: false, message: '', type: 'success', duration: 3000, id: 0 });
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);

  const steps = [
    t('form.step1'),
    t('prefect_board_step2_title') || 'Additional details',
    'Agreements',
    'Library and teacher',
  ];

  const notify = React.useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    const duration = 3000;
    setToast({ show: true, message, type, duration, id: Date.now() });
    toastTimerRef.current = setTimeout(() => {
      setToast((current) => ({ ...current, show: false, message: '' }));
      toastTimerRef.current = null;
    }, duration);
  }, []);

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
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, [locale, router]);

  // use centralized validator

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
      try {
          await ui.handleSubmit(() => {
            const toastMsg = t('prefect_board_submitted') || 'Submitted';
            notify(toastMsg, 'success');
            try { reset(); } catch {}
          }, async (e) => {
            try { const { getErrorMessage } = await import('../../../lib/errors');
              notify(getErrorMessage(e), 'error');
            } catch {
              notify('Submission failed', 'error');
            }
          });
    } catch (err) {
      console.error(err);
    }
  }

  if (isAuthenticated === null) return <LoadingPage />;
  if (!isAuthenticated) return null;

  return (
    <>
      <div className="h-20 sm:h-24" />

      <div className="student-registration-form max-w-5xl mx-auto overflow-hidden rounded-[2rem] border border-white/80 bg-white/95 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5 backdrop-blur">
        <div className="relative border-b border-slate-100 bg-gradient-to-br from-sky-50 via-white to-amber-50 p-6 sm:p-8">
          <div className="relative">
            <div className="mb-3 inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-800">
              {t('form.step')} {step} / 4
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{t('prefect_board_title') || 'Prefect Board Application'}</h2>
          </div>

          <div className="relative mt-6">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-700">{steps[step - 1]}</span>
              <span className="rounded-full bg-white px-3 py-1 font-bold text-sky-700 shadow-sm">{ui.percent}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-500" style={{ width: `${ui.percent}%` }} />
            </div>
            <div className="mt-5 grid grid-cols-4 gap-2">
              {steps.map((label, index) => {
                const current = index + 1;
                const isActive = current === step;
                const isDone = current < step;
                return (
                  <div key={label} className={`rounded-2xl border px-3 py-3 text-center transition ${isActive ? 'border-sky-200 bg-white shadow-sm' : isDone ? 'border-emerald-100 bg-emerald-50/80' : 'border-slate-100 bg-white/60'}`}>
                    <div className={`mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${isActive ? 'bg-sky-600 text-white' : isDone ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {isDone ? <span aria-hidden="true">&#10003;</span> : current}
                    </div>
                    <div className={`hidden truncate text-xs font-semibold sm:block ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-8">
          <form onSubmit={onSubmit}>
            <div className="mb-8">
              {step === 1 && <Step1 data={data} onChange={setField} />}
              {step === 2 && <Step2 data={data} onChange={setField} />}
              {step === 3 && <Step3 data={data} onChange={setField} />}
              {step === 4 && <Step4 data={data} onChange={setField} />}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-6">
              <div>
                {step > 1 && (
                  <button type="button" onClick={prev} className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800">{t('form.back')}</button>
                )}
              </div>

              <div>
                {step < 4 ? (
                  <button type="button" onClick={() => { const v = validateStepFields(data, step); if (v.ok) next(); else notify(t('form.fillRequiredFields') || v.message || 'Please fill all required fields', 'error'); }} className="rounded-full bg-sky-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 active:scale-95">{t('form.next')}</button>
                ) : (
                  <div>
                    <button
                      disabled={ui.loading}
                      type="button"
                      onClick={() => ui.setShowConfirm(true)}
                      className={`rounded-full px-6 py-2.5 text-sm font-bold shadow-lg transition active:scale-95 ${ui.loading ? 'bg-slate-200 text-slate-500 shadow-none' : 'bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700'}`}
                    >
                      {ui.loading ? (t('form.submitting') || 'Submitting...') : (t('prefect_board_submit') || 'Submit')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Confirm modal */}
        {ui.showConfirm && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="w-11/12 max-w-md rounded-3xl bg-white p-6 shadow-2xl">
              <h3 className="mb-2 text-lg font-bold text-slate-900">{t('form.confirmTitle')}</h3>
              <p className="mb-5 text-sm leading-6 text-slate-600">{t('form.confirmMessage')}</p>
              <div className="flex justify-end">
                <button onClick={() => ui.setShowConfirm(false)} className="mr-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">{t('form.confirmNo')}</button>
                <button
                    onClick={async () => {
                    try {
                      await ui.handleSubmit(() => {
                        const toastMsg = t('prefect_board_submitted') || 'Submitted';
                        notify(toastMsg, 'success');
                        try { reset(); } catch {}
                      }, async (e) => {
                        try { const { getErrorMessage } = await import('../../../lib/errors');
                          notify(getErrorMessage(e) || 'Submission failed', 'error');
                        } catch {
                          notify('Submission failed', 'error');
                        }
                      });
                    } catch {
                      // handled in hook
                    }
                  }}
                  disabled={ui.loading}
                  className={`rounded-full px-4 py-2 text-sm font-bold ${ui.loading ? 'bg-slate-200 text-slate-500' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                >
                  {ui.loading ? (t('form.submitting') || 'Submitting...') : t('form.confirmYes')}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      <div className="pointer-events-none fixed right-3 top-3 z-[9999] w-[calc(100vw-1.5rem)] max-w-xs sm:right-4 sm:top-4">
        <div className={`transform transition-all duration-200 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'}`}>
          <div className={`${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'} overflow-hidden rounded-2xl text-sm font-semibold text-white shadow-2xl shadow-slate-900/20`}>
            <div className="px-4 py-3 leading-5">{toast.message}</div>
            {toast.show && (
              <div className="h-1 bg-white/25">
                <div key={toast.id} className="student-toast-progress h-full bg-white" style={{ animationDuration: `${toast.duration}ms` }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
