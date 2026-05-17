"use client";

import React from "react";
import { StepProps, YesNo } from "../types/types";
import { useTranslations } from "next-intl";
import { useSiblings } from "../hooks/useStudentForm";

export default function Step3({ data, onChange }: StepProps) {
  const t = useTranslations();
  const { addSibling, removeSibling, updateSibling } = useSiblings(data, onChange);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-black">{t('form.emergencyContact')}<span className="text-red-500 ml-1">*</span></span>
          <input required aria-required="true" value={data.emergencyPersonName ?? ''} onChange={(e) => onChange('emergencyPersonName', e.target.value)} placeholder={t('form.emergencyContact')}
            className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-black">{t('form.emergencyNumber')}<span className="text-red-500 ml-1">*</span></span>
          <input required aria-required="true" value={data.emergencyNumber ?? ''} onChange={(e) => onChange('emergencyNumber', e.target.value)} placeholder={t('form.emergencyNumber')}
            className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-black">{t('form.emergencyContact') + ' ' + t('form.address')}</span>
          <input value={data.emergencyPersonAddress ?? ''} onChange={(e) => onChange('emergencyPersonAddress', e.target.value)} placeholder={t('form.emergencyContact')}
          className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <label className="block">
          <span className="text-sm font-medium text-black">{t('form.disabilities')}</span>
          <select value={data.disabilities ?? 'NO'} onChange={(e) => onChange('disabilities', e.target.value as YesNo)} className="mt-1 block w-full rounded-lg border border-black px-3 py-2 shadow-sm bg-white text-black">
            <option value="NO">{t('form.earlierSchoolNo')}</option>
            <option value="YES">{t('form.earlierSchoolYes')}</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-black">{t('form.medicated')}</span>
          <select value={data.medicated ?? 'NO'} onChange={(e) => onChange('medicated', e.target.value as YesNo)} className="mt-1 block w-full rounded-lg border border-black px-3 py-2 shadow-sm bg-white text-black">
            <option value="NO">{t('form.earlierSchoolNo')}</option>
            <option value="YES">{t('form.earlierSchoolYes')}</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-black">{t('form.emergencyMedicine')}</span>
          <input value={data.medicine ?? ''} onChange={(e) => onChange('medicine', e.target.value)} placeholder={t('form.emergencyMedicine')}
            className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
        </label>
      </div>

        {data.disabilities === 'YES' && (
        <label className="block">
          <span className="text-sm font-medium text-black">{t('form.disabilityReason')}</span>
          <input value={data.disabilityReason ?? ''} onChange={(e) => onChange('disabilityReason', e.target.value)} placeholder={t('form.disabilityReason')}
            className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
        </label>
      )}

      <div>
          <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium text-black">{t('form.siblings')}</h3>
          <button type="button" onClick={addSibling} className="px-3 py-1 bg-sky-400 hover:bg-sky-500 text-white rounded-full shadow">{t('form.addSibling')}</button>
        </div>

        {(data.siblings ?? []).map((s, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mb-2">
            <label className="block">
              <span className="text-sm text-black">{t('form.siblingName')}</span>
              <input value={s.name ?? ''} onChange={(e) => updateSibling(idx, 'name', e.target.value)} className="mt-1 block w-full rounded-lg border border-black px-3 py-2 shadow-sm bg-white text-black" />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm text-black">{t('form.siblingGrade')}</span>
              <input value={s.grade ?? ''} onChange={(e) => updateSibling(idx, 'grade', e.target.value)} className="mt-1 block w-full rounded-lg border border-black px-3 py-2 shadow-sm bg-white text-black" />
            </label>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => removeSibling(idx)} className="px-3 py-1 bg-white border border-sky-300 text-sky-700 rounded-full hover:bg-sky-50">{t('form.removeSibling')}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
