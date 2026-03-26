"use client";

import React from "react";
import { StudentDTO } from "../types/types";
import { useTranslations } from "next-intl";
import { useLocaleFields } from "../hooks/useStudentForm";

export default function Step2({ data, onChange }: { data: StudentDTO; onChange: (k: keyof StudentDTO, v: any) => void; }) {
  const t = useTranslations();
  const { getLocaleValue, setLocaleValue } = useLocaleFields(data, onChange);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block">
            <span className="text-sm font-medium text-black">{t('form.fatherFullName')}</span>
            <input value={getLocaleValue('fatherFullNameEn' as any, 'fatherFullNameSi' as any)} onChange={(e) => setLocaleValue('fatherFullNameEn' as any, 'fatherFullNameSi' as any, e.target.value)}
              className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-medium text-black">{t('form.fatherJob')}</span>
            <input value={getLocaleValue('fatherJobEn' as any, 'fatherJobSi' as any)} onChange={(e) => setLocaleValue('fatherJobEn' as any, 'fatherJobSi' as any, e.target.value)}
              className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-medium text-black">{t('form.fatherJobAddress')}</span>
            <input value={getLocaleValue('fatherJobAddressEn' as any, 'fatherJobAddressSi' as any)} onChange={(e) => setLocaleValue('fatherJobAddressEn' as any, 'fatherJobAddressSi' as any, e.target.value)}
              className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block">
            <span className="text-sm font-medium text-black">{t('form.motherFullName')}</span>
            <input value={getLocaleValue('motherFullNameEn' as any, 'motherFullNameSi' as any)} onChange={(e) => setLocaleValue('motherFullNameEn' as any, 'motherFullNameSi' as any, e.target.value)}
              className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-medium text-black">{t('form.motherJob')}</span>
            <input value={getLocaleValue('motherJobEn' as any, 'motherJobSi' as any)} onChange={(e) => setLocaleValue('motherJobEn' as any, 'motherJobSi' as any, e.target.value)}
              className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-medium text-black">{t('form.motherJobAddress')}</span>
            <input value={getLocaleValue('motherJobAddressEn' as any, 'motherJobAddressSi' as any)} onChange={(e) => setLocaleValue('motherJobAddressEn' as any, 'motherJobAddressSi' as any, e.target.value)}
              className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block">
            <span className="text-sm font-medium text-black">{t('form.guardianFullName')}</span>
            <input value={getLocaleValue('guardianFullNameEn' as any, 'guardianFullNameSi' as any)} onChange={(e) => setLocaleValue('guardianFullNameEn' as any, 'guardianFullNameSi' as any, e.target.value)}
              className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-medium text-black">{t('form.guardianJob')}</span>
            <input value={getLocaleValue('guardianJobEn' as any, 'guardianJobSi' as any)} onChange={(e) => setLocaleValue('guardianJobEn' as any, 'guardianJobSi' as any, e.target.value)}
              className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-medium text-black">{t('form.guardianJobAddress')}</span>
            <input value={getLocaleValue('guardianJobAddressEn' as any, 'guardianJobAddressSi' as any)} onChange={(e) => setLocaleValue('guardianJobAddressEn' as any, 'guardianJobAddressSi' as any, e.target.value)}
              className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>
      </div>
    </div>
  );
}
