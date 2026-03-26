"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { StepProps } from "../types";
import { useLocaleFieldsPrefect } from "../hooks/usePrefectForm";

export default function Step4({ data, onChange }: StepProps) {
  const t = useTranslations();
  const { getLocaleValue, setLocaleValue } = useLocaleFieldsPrefect(data, onChange);

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
      <div>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">{t('prefect_board_libraryStatement')}</span>
          <select
            name="libraryStatement"
            value={data.libraryStatement ?? ''}
            onChange={(e) => onChange('libraryStatement', e.target.value)}
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
        <label className="block">
          <span className="text-sm font-medium text-slate-700">{t('prefect_board_specialNote')}</span>
          <textarea
            name="specialNote"
            value={getLocaleValue('specialNoteEn','specialNoteSi') ?? ''}
            onChange={(e) => setLocaleValue('specialNoteEn','specialNoteSi', e.target.value)}
            placeholder={t('prefect_board_specialNote_placeholder') || ''}
            className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300"
            rows={4}
          />
        </label>
      </div>
    </div>
  );
}
