"use client";

import React from "react";
import { StudentDTO } from "../types/types";
import { useTranslations } from "next-intl";
import { useLocaleFields } from "../hooks/useStudentForm";

export default function Step2({ data, onChange }: { data: StudentDTO; onChange: (k: keyof StudentDTO, v: unknown) => void; }) {
  const t = useTranslations();
  const { getLocaleValue, setLocaleValue } = useLocaleFields(data, onChange);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block">
            <span className="text-sm font-medium text-black">{t('form.fatherFullName')}</span>
            <input value={getLocaleValue('fatherFullNameEn' as keyof StudentDTO, 'fatherFullNameSi' as keyof StudentDTO)} onChange={(e) => setLocaleValue('fatherFullNameEn' as keyof StudentDTO, 'fatherFullNameSi' as keyof StudentDTO, e.target.value)}
              className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-medium text-black">{t('form.fatherJob')}</span>
            <input value={getLocaleValue('fatherJobEn' as keyof StudentDTO, 'fatherJobSi' as keyof StudentDTO)} onChange={(e) => setLocaleValue('fatherJobEn' as keyof StudentDTO, 'fatherJobSi' as keyof StudentDTO, e.target.value)}
              className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-medium text-black">{t('form.fatherJobAddress')}</span>
            <input value={getLocaleValue('fatherJobAddressEn' as keyof StudentDTO, 'fatherJobAddressSi' as keyof StudentDTO)} onChange={(e) => setLocaleValue('fatherJobAddressEn' as keyof StudentDTO, 'fatherJobAddressSi' as keyof StudentDTO, e.target.value)}
              className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block">
            <span className="text-sm font-medium text-black">{t('form.motherFullName')}</span>
            <input value={getLocaleValue('motherFullNameEn' as keyof StudentDTO, 'motherFullNameSi' as keyof StudentDTO)} onChange={(e) => setLocaleValue('motherFullNameEn' as keyof StudentDTO, 'motherFullNameSi' as keyof StudentDTO, e.target.value)}
              className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-medium text-black">{t('form.motherJob')}</span>
            <input value={getLocaleValue('motherJobEn' as keyof StudentDTO, 'motherJobSi' as keyof StudentDTO)} onChange={(e) => setLocaleValue('motherJobEn' as keyof StudentDTO, 'motherJobSi' as keyof StudentDTO, e.target.value)}
              className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-medium text-black">{t('form.motherJobAddress')}</span>
            <input value={getLocaleValue('motherJobAddressEn' as keyof StudentDTO, 'motherJobAddressSi' as keyof StudentDTO)} onChange={(e) => setLocaleValue('motherJobAddressEn' as keyof StudentDTO, 'motherJobAddressSi' as keyof StudentDTO, e.target.value)}
              className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block">
            <span className="text-sm font-medium text-black">{t('form.guardianFullName')}</span>
            <input value={getLocaleValue('guardianFullNameEn' as keyof StudentDTO, 'guardianFullNameSi' as keyof StudentDTO)} onChange={(e) => setLocaleValue('guardianFullNameEn' as keyof StudentDTO, 'guardianFullNameSi' as keyof StudentDTO, e.target.value)}
              className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-medium text-black">{t('form.guardianJob')}</span>
            <input value={getLocaleValue('guardianJobEn' as keyof StudentDTO, 'guardianJobSi' as keyof StudentDTO)} onChange={(e) => setLocaleValue('guardianJobEn' as keyof StudentDTO, 'guardianJobSi' as keyof StudentDTO, e.target.value)}
              className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-medium text-black">{t('form.guardianJobAddress')}</span>
            <input value={getLocaleValue('guardianJobAddressEn' as keyof StudentDTO, 'guardianJobAddressSi' as keyof StudentDTO)} onChange={(e) => setLocaleValue('guardianJobAddressEn' as keyof StudentDTO, 'guardianJobAddressSi' as keyof StudentDTO, e.target.value)}
              className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>
      </div>
    </div>
  );
}
