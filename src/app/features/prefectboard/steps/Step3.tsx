"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { StepProps, } from "../types";
import { eventToFieldValue } from "../hooks/usePrefectForm";

export default function Step3({ data, onChange }: StepProps) {
  const t = useTranslations();

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = eventToFieldValue(e);
    onChange(name, value);
  }
  // use new `parentsName` field

  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm space-y-4">
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm sm:p-6">
        <h3 className="text-lg font-semibold text-emerald-950">
          {t('prefect_board_studentDeclarationTitle')}
        </h3>
        <p className="mt-3 text-base leading-8 text-slate-800">
          {t('prefect_board_studentDeclarationBeforeName')}
          <span className="inline-block min-w-40 max-w-full break-words border-b-2 border-dotted border-emerald-700 px-1 text-center font-semibold text-emerald-950">
            {data.fullName?.trim() || '........................'}
          </span>
          {t('prefect_board_studentDeclarationText')}
        </p>
      </section>

      <div>
        <label className="flex items-start gap-3">
          <input required aria-required="true" type="checkbox" name="studentAgreement" checked={!!data.studentAgreement} onChange={handleChange} className="mt-1" />
          <div>
            <div className="text-sm font-medium text-slate-700">{t('prefect_board_studentAgreement')}<span className="text-red-500 ml-1">*</span></div>
            <div className="text-xs text-slate-500">{t('prefect_board_studentAgreement_help') || ''}</div>
          </div>
        </label>
      </div>

      <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm sm:p-6">
        <h3 className="text-lg font-semibold text-amber-950">
          {t('prefect_board_parentConfirmationTitle')}
        </h3>
        <p className="mt-3 text-base leading-8 text-slate-800">
          {t('prefect_board_parentConfirmationText')}
        </p>
      </section>

      <div>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">{t('prefect_board_parentFullName')}</span>
          <input name="parentsName" value={data.parentsName ?? ''} onChange={(e) => onChange('parentsName', e.target.value)} placeholder={t('prefect_board_parentFullName_placeholder') || ''} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300" />
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
