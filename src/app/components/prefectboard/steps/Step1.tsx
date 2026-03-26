"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useLocaleFieldsPrefect } from "../hooks/usePrefectForm";
import { StepProps } from "../types";

export default function Step1({ data, onChange }: StepProps) {
  const t = useTranslations();
  const { locale, getLocaleValue, setLocaleValue } = useLocaleFieldsPrefect(data, onChange);

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">{t('form.fullName')}<span className="text-red-500 ml-1">*</span></span>
          <input required aria-required="true" value={getLocaleValue('fullNameEn', 'fullNameSi')} onChange={(e) => setLocaleValue('fullNameEn', 'fullNameSi', e.target.value)} placeholder={t('form.fullName')} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-3 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300" />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">{t('form.address')}<span className="text-red-500 ml-1">*</span></span>
          <input required aria-required="true" value={getLocaleValue('addressEn', 'addressSi')} onChange={(e) => setLocaleValue('addressEn', 'addressSi', e.target.value)} placeholder={t('form.address')} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-3 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300" />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">{t('prefect_board_gradeEntranceDay') || 'Grade entrance day'}<span className="text-red-500 ml-1">*</span></span>
          <input required aria-required="true" type="date" value={getLocaleValue('gradeEntranceDayEn', 'gradeEntranceDaySi')} onChange={(e) => setLocaleValue('gradeEntranceDayEn', 'gradeEntranceDaySi', e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300" />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">{t('prefect_board_entranceNo') || 'Entrance No'}<span className="text-red-500 ml-1">*</span></span>
          <input required aria-required="true" value={getLocaleValue('entranceNoEn', 'entranceNoSi')} onChange={(e) => setLocaleValue('entranceNoEn', 'entranceNoSi', e.target.value)} placeholder={t('prefect_board_entranceNo') || ''} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-3 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300" />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">{t('prefect_board_grade') || 'Grade'}<span className="text-red-500 ml-1">*</span></span>
          <select required aria-required="true" name="grade" value={getLocaleValue('gradeEn','gradeSi') ?? ''} onChange={(e) => setLocaleValue('gradeEn','gradeSi', e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300">
            <option value="">{t('prefect_board_grade_not_selected') || 'Grade not selected'}</option>
            <option value="7">{t('grades.7') || 'Grade 7'}</option>
            <option value="8">{t('grades.8') || 'Grade 8'}</option>
            <option value="9">{t('grades.9') || 'Grade 9'}</option>
            <option value="10">{t('grades.10') || 'Grade 10'}</option>
            <option value="11">{t('grades.11') || 'Grade 11'}</option>
          </select>
        </label>
      </div>

      
    </div>
  );
}
