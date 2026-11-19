"use client";

import { StepProps } from "../types/types";
import { useTranslations } from "next-intl";

export default function Step3({ data, onChange, setShowConfirm, loading, notify }: StepProps & { setShowConfirm?: (v: boolean) => void; loading?: boolean; notify?: (m: string, t?: 'success'|'error') => void }) {
  const t = useTranslations();

  function handleStepSubmit() {
    if (!data.agreed) {
      if (notify) notify(t('form.mustAgree') || 'You must agree to the terms', 'error');
      return;
    }
    if (setShowConfirm) setShowConfirm(true);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm sm:p-6">
        <h3 className="text-lg font-semibold text-emerald-950">
          {t('announcing_form.studentConfirmationTitle')}
        </h3>
        <p className="mt-3 text-base leading-8 text-slate-800">
          {t('announcing_form.studentConfirmationBeforeName')}
          <span className="inline-block min-w-40 max-w-full break-words border-b-2 border-dotted border-emerald-700 px-1 text-center font-semibold text-emerald-950">
            {data.fullNameWithSurname?.trim() || '........................'}
          </span>
          {t('announcing_form.studentConfirmationText')}
        </p>
      </section>

      <div className="flex items-center gap-3">
        <input id="agree" type="checkbox" checked={!!data.agreed} onChange={(e) => onChange('agreed' as any, e.target.checked as any)} className="w-4 h-4" />
        <label htmlFor="agree" className="text-sm text-black">{t('announcing_form.agreement') || 'I agree to the student agreement'}</label>
      </div>

      <div>
        {/* If parent provides a floating submit (via setShowConfirm), hide the inline button to avoid duplicates */}
        {!setShowConfirm && (
          <button onClick={handleStepSubmit} disabled={loading} className={`px-5 py-2 rounded-full ${loading ? 'bg-slate-300 text-slate-600' : 'bg-sky-400 text-white hover:bg-sky-500'}`}>
            {loading ? (t('form.submitting') || 'Submitting...') : t('form.submit')}
          </button>
        )}
      </div>
    </div>
  );
}
