"use client";

import React from "react";
import { StudentDTO } from "../types/types";
import { useTranslations } from "next-intl";

export default function Step4({ data, onChange }: { data: StudentDTO; onChange: (k: keyof StudentDTO, v: unknown) => void; }) {
  const t = useTranslations();

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-black">{t('form.registrationPayment')}</span>
        <input type="number" value={data.registrationPayment ?? ''} onChange={(e) => onChange('registrationPayment' as keyof StudentDTO, parseFloat(e.target.value || '0'))} placeholder="0.00"
          className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
      </label>

      <label className="flex items-center gap-2">
        <input type="checkbox" checked={!!data.agreeToTerms} onChange={(e) => onChange('agreeToTerms' as keyof StudentDTO, e.target.checked)} className="w-4 h-4 border-black" />
        <span className="text-sm text-black">{t('form.agreeToTerms')}</span>
      </label>
    </div>
  );
}
