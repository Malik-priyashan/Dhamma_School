"use client";

import React from "react";
import { StepProps } from "../types/types";
import { useTranslations } from "next-intl";

export default function Step2({ data, onChange }: StepProps) {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block">
            <span className="text-sm font-medium text-black">{t('form.fatherFullName')}</span>
            <input value={data.fatherFullName ?? ''} onChange={(e) => onChange('fatherFullName', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-medium text-black">{t('form.fatherJob')}</span>
            <input value={data.fatherJob ?? ''} onChange={(e) => onChange('fatherJob', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-medium text-black">{t('form.fatherJobAddress')}</span>
            <input value={data.fatherJobAddress ?? ''} onChange={(e) => onChange('fatherJobAddress', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block">
            <span className="text-sm font-medium text-black">{t('form.motherFullName')}</span>
            <input value={data.motherFullName ?? ''} onChange={(e) => onChange('motherFullName', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-medium text-black">{t('form.motherJob')}</span>
            <input value={data.motherJob ?? ''} onChange={(e) => onChange('motherJob', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-medium text-black">{t('form.motherJobAddress')}</span>
            <input value={data.motherJobAddress ?? ''} onChange={(e) => onChange('motherJobAddress', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block">
            <span className="text-sm font-medium text-black">{t('form.guardianFullName')}</span>
            <input value={data.guardianFullName ?? ''} onChange={(e) => onChange('guardianFullName', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-medium text-black">{t('form.guardianJob')}</span>
            <input value={data.guardianJob ?? ''} onChange={(e) => onChange('guardianJob', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-medium text-black">{t('form.guardianJobAddress')}</span>
            <input value={data.guardianJobAddress ?? ''} onChange={(e) => onChange('guardianJobAddress', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>
      </div>
    </div>
  );
}
