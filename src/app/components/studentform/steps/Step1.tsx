"use client";

import React from "react";
import { StudentDTO } from "../types/types";
import { useTranslations } from "next-intl";
import { useLocaleFields } from "../hooks/useStudentForm";

export default function Step1({ data, onChange }: { data: StudentDTO; onChange: (k: keyof StudentDTO, v: unknown) => void; }) {
  const t = useTranslations();
  const { getLocaleValue, setLocaleValue } = useLocaleFields(data, onChange);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-black">{t('form.fullName')}<span className="text-red-500 ml-1">*</span></span>
          <input required aria-required="true" value={String(getLocaleValue('fullNameWithSurnameEn' as keyof StudentDTO, 'fullNameWithSurnameSi' as keyof StudentDTO) ?? '')} onChange={(e) => setLocaleValue('fullNameWithSurnameEn' as keyof StudentDTO, 'fullNameWithSurnameSi' as keyof StudentDTO, e.target.value)} placeholder={t('form.fullName')}
            className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm focus:border-black focus:ring-2 focus:ring-black/10 bg-white text-black" />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-black">{t('form.nameWithInitials')}</span>
          <input value={String(getLocaleValue('nameWithInitialsEn' as keyof StudentDTO, 'nameWithInitialsSi' as keyof StudentDTO) ?? '')} onChange={(e) => setLocaleValue('nameWithInitialsEn' as keyof StudentDTO, 'nameWithInitialsSi' as keyof StudentDTO, e.target.value)} placeholder={t('form.nameWithInitials')}
            className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-black">{t('form.dob')}<span className="text-red-500 ml-1">*</span></span>
          <input required aria-required="true" type="date" value={data.dob ?? ''} onChange={(e) => onChange('dob', e.target.value)} className="mt-1 block w-full rounded-lg border border-black px-3 py-2 shadow-sm bg-white text-black" />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-black">{t('form.phoneFixed')}</span>
          <input value={data.phone1 ?? ''} onChange={(e) => onChange('phone1', e.target.value)} placeholder="011 234 5678" className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-black">{t('form.phoneMobile')}<span className="text-red-500 ml-1">*</span></span>
          <input required aria-required="true" value={data.phone2 ?? ''} onChange={(e) => onChange('phone2', e.target.value)} placeholder="071 123 4567" className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-black">{t('form.address')}<span className="text-red-500 ml-1">*</span></span>
          <input required aria-required="true" value={String(getLocaleValue('addressEn' as keyof StudentDTO, 'addressSi' as keyof StudentDTO) ?? '')} onChange={(e) => setLocaleValue('addressEn' as keyof StudentDTO, 'addressSi' as keyof StudentDTO, e.target.value)} placeholder={t('form.address')}
            className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-black">{t('form.school')}<span className="text-red-500 ml-1">*</span></span>
          <input required aria-required="true" value={String(getLocaleValue('schoolEn' as keyof StudentDTO, 'schoolSi' as keyof StudentDTO) ?? '')} onChange={(e) => setLocaleValue('schoolEn' as keyof StudentDTO, 'schoolSi' as keyof StudentDTO, e.target.value)} placeholder={t('form.school')}
            className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <label className="block">
          <span className="text-sm font-medium text-black">{t('form.earlierSchool')}</span>
          <select value={data.earlierSchool ?? 'NO'} onChange={(e) => onChange('earlierSchool', e.target.value)} className="mt-1 block w-full rounded-lg border border-black px-3 py-2 shadow-sm bg-white text-black">
            <option value="NO">{t('form.earlierSchoolNo')}</option>
            <option value="YES">{t('form.earlierSchoolYes')}</option>
          </select>
        </label>

        <div />
      </div>

      {data.earlierSchool === 'YES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-black">{t('form.earlierSchoolName')}</span>
              <input value={String(getLocaleValue('earlierSchoolEn' as keyof StudentDTO, 'earlierSchoolSi' as keyof StudentDTO) ?? '')} onChange={(e) => setLocaleValue('earlierSchoolEn' as keyof StudentDTO, 'earlierSchoolSi' as keyof StudentDTO, e.target.value)} placeholder={t('form.earlierSchoolName')}
                className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>
      )}

      <div>
        <label className="block">
          <span className="text-sm font-medium text-black">{t('form.reasonForLeave')}</span>
          <textarea value={String(getLocaleValue('reasonForLeaveEn' as keyof StudentDTO, 'reasonForLeaveSi' as keyof StudentDTO) ?? '')} onChange={(e) => setLocaleValue('reasonForLeaveEn' as keyof StudentDTO, 'reasonForLeaveSi' as keyof StudentDTO, e.target.value)} placeholder={t('form.reasonForLeave')}
            className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" rows={3} />
        </label>
      </div>
    </div>
  );
}
