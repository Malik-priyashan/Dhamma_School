"use client";

import { useTranslations } from "next-intl";
import { StepProps } from "../types";
import { useFilePreview } from "../hooks/usePrefectForm";

export default function Step4({ data, onChange }: StepProps) {
  const t = useTranslations();
  // use new model fields directly
  const { fileInputRef, fileName, previewUrl, setFileFromInput } = useFilePreview(data.libraryStatusConfirmationFile);
  const { fileInputRef: teacherSignRef, fileName: teacherSignName, previewUrl: teacherSignPreview, setFileFromInput: setTeacherSignFromInput } = useFilePreview(data.teachersAgreementFileUpload);

  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm space-y-4">
      <div>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">{t('prefect_board_libraryStatement')}</span>
          <select
            name="libraryStatus"
            value={String(data.libraryStatus ?? '')}
            onChange={(e) => onChange('libraryStatus', e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300"
          >
            <option value="">{t('notSelected') || 'Not selected'}</option>
            <option value="very_good">{t('prefect_board_libraryStatement_very_good') || 'Very good'}</option>
            <option value="good">{t('prefect_board_libraryStatement_good') || 'Good'}</option>
            <option value="normal">{t('prefect_board_libraryStatement_normal') || 'Normal'}</option>
            <option value="weak">{t('prefect_board_libraryStatement_weak') || 'Weak'}</option>
          </select>
        </label>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t('prefect_board_libraryConfirmation') || 'Library confirmation file'}</label>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center px-4 py-2 bg-sky-500 text-white rounded-lg shadow hover:bg-sky-600">
            {t('choose_file')}
          </button>
          <div className="text-sm text-slate-700">{fileName || t('no_file_chosen')}</div>
        </div>
        {previewUrl && (
          <div className="mt-3">
            { }
            <img src={previewUrl} alt={t('prefect_board_libraryConfirmation_preview')} className="w-36 h-24 object-cover rounded-md border" />
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" name="libraryStatusConfirmationFile" aria-required="false" onChange={(e) => {
          const f = (e.target as HTMLInputElement).files?.[0] ?? null;
          onChange('libraryStatusConfirmationFile', f);
          setFileFromInput(f);
        }} className="hidden" />
        <div className="text-xs text-slate-500 mt-2">{t('allowed_images_note')}</div>
      </div>
      <section className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5 shadow-sm sm:p-6">
        <h3 className="text-lg font-semibold text-sky-950">
          {t('prefect_board_teacherRecommendationTitle')}
        </h3>
        <p className="mt-3 text-base leading-8 text-slate-800">
          {t('prefect_board_teacherRecommendationText')}
        </p>
      </section>
      <div className="mt-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">{t('prefect_board_teachersSign') || "Teacher's sign file upload"}</label>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => teacherSignRef.current?.click()} className="inline-flex items-center px-4 py-2 bg-sky-500 text-white rounded-lg shadow hover:bg-sky-600">
            {t('choose_file')}
          </button>
          <div className="text-sm text-slate-700">{teacherSignName || t('no_file_chosen')}</div>
        </div>
        {teacherSignPreview && (
          <div className="mt-3">
            { }
            <img src={teacherSignPreview} alt={t('prefect_board_teachersSign_preview')} className="w-36 h-24 object-cover rounded-md border" />
          </div>
        )}
        <input ref={teacherSignRef} type="file" accept="image/*" name="teachersAgreementFileUpload" aria-required="false" onChange={(e) => {
          const f = (e.target as HTMLInputElement).files?.[0] ?? null;
          onChange('teachersAgreementFileUpload', f);
          setTeacherSignFromInput(f);
        }} className="hidden" />
        <div className="text-xs text-slate-500 mt-2">{t('allowed_images_note')}</div>
      </div>
    </div>
  );
}
