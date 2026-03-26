"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { StepProps } from "../types";
import { useLocaleFieldsPrefect } from "../hooks/usePrefectForm";

export default function Step3({ data, onChange }: StepProps) {
  const t = useTranslations();

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? checked : value;
    onChange(name, val);
  }
  const { locale, getLocaleValue, setLocaleValue } = useLocaleFieldsPrefect(data, onChange);

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
      <div>
        <label className="flex items-start gap-3">
          <input required aria-required="true" type="checkbox" name="studentAgreement" checked={!!data.studentAgreement} onChange={handleChange} className="mt-1" />
          <div>
            <div className="text-sm font-medium text-slate-700">{t('prefect_board_studentAgreement')}<span className="text-red-500 ml-1">*</span></div>
            <div className="text-xs text-slate-500">{t('prefect_board_studentAgreement_help') || ''}</div>
          </div>
        </label>
      </div>

      <div>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">{t('prefect_board_parentFullName')}</span>
          <input name="parentFullName" value={getLocaleValue('parentFullNameEn','parentFullNameSi') ?? ''} onChange={(e) => setLocaleValue('parentFullNameEn','parentFullNameSi', e.target.value)} placeholder={t('prefect_board_parentFullName_placeholder') || ''} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300" />
        </label>
      </div>

      <div>
        <label className="flex items-start gap-3">
          <input required aria-required="true" type="checkbox" name="parentAgreement" checked={!!data.parentAgreement} onChange={handleChange} className="mt-1" />
          <div>
            <div className="text-sm font-medium text-slate-700">{t('prefect_board_parentAgreement')}<span className="text-red-500 ml-1">*</span></div>
            <div className="text-xs text-slate-500">{t('prefect_board_parentAgreement_help') || ''}</div>
          </div>
        </label>
      </div>

    </div>
  );
}
