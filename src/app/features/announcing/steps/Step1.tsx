"use client";

import React from "react";
import { StepProps } from "../types/types";
import { useTranslations } from "next-intl";

export default function Step1({ data, onChange }: StepProps) {
  const t = useTranslations();
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-black">{t('announcing_form.fullName')}<span className="text-red-500 ml-1">*</span></span>
          <input
            required
            value={String(data.fullNameWithSurname ?? '')}
            onChange={(e) => onChange('fullNameWithSurname', e.target.value)}
            placeholder={t('announcing_form.fullName')}
            className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-black">{t('announcing_form.dob')}<span className="text-red-500 ml-1">*</span></span>
          <input
            required
            type="date"
            value={data.dob ?? ''}
            onChange={(e) => onChange('dob', e.target.value)}
            className="mt-1 block w-full rounded-lg border border-black px-3 py-2 shadow-sm bg-white text-black"
          />
        </label>
      </div>

      <div>
        <label className="block">
          <span className="text-sm font-medium text-black">{t('announcing_form.address')}<span className="text-red-500 ml-1">*</span></span>
          <input
            required
            value={String(data.address ?? '')}
            onChange={(e) => onChange('address', e.target.value)}
            placeholder={t('announcing_form.address')}
            className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-black">{t('announcing_form.mobile')}<span className="text-red-500 ml-1">*</span></span>
          <input
            required
            value={data.phoneMobile ?? ''}
            onChange={(e) => onChange('phoneMobile', e.target.value)}
            placeholder="071 123 4567"
            className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-black">{t('announcing_form.landline')}</span>
          <input
            value={data.phoneLandline ?? ''}
            onChange={(e) => onChange('phoneLandline', e.target.value)}
            placeholder="011 234 5678"
            className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-black">{t('announcing_form.school')}<span className="text-red-500 ml-1">*</span></span>
          <input
            required
            value={String(data.school ?? '')}
            onChange={(e) => onChange('school', e.target.value)}
            placeholder={t('announcing_form.school')}
            className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-black">{t('announcing_form.parentGuardianName')}<span className="text-red-500 ml-1">*</span></span>
          <input
            required
            value={String(data.parentGuardianName ?? '')}
            onChange={(e) => onChange('parentGuardianName', e.target.value)}
            placeholder={t('announcing_form.parentGuardianName')}
            className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-black">{t('announcing_form.parentGuardianAddress')}</span>
          <input
            value={String(data.parentGuardianAddress ?? '')}
            onChange={(e) => onChange('parentGuardianAddress', e.target.value)}
            placeholder={t('announcing_form.parentGuardianAddress')}
            className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black"
          />
        </label>
      </div>
    </div>
  );
 }
