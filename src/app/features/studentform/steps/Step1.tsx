"use client";

import React from "react";
import { StepProps, YesNo } from "../types/types";
import { useTranslations } from "next-intl";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/webp"];

export default function Step1({ data, onChange, onValidationError }: StepProps) {
  const t = useTranslations();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (data.studentImage instanceof File) {
      const url = URL.createObjectURL(data.studentImage);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof data.studentImage === 'string') {
      setPreviewUrl(data.studentImage);
    } else {
      setPreviewUrl(null);
    }
  }, [data.studentImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (!file) {
      onChange('studentImage', null);
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      onValidationError?.("Please choose a JPG or WEBP image. PNG images are not accepted.");
      e.target.value = "";
      onChange('studentImage', null);
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      onValidationError?.("Please choose an image under 5 MB.");
      e.target.value = "";
      onChange('studentImage', null);
      return;
    }

    onChange('studentImage', file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-sky-200 rounded-2xl bg-sky-50/60 hover:bg-sky-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center">
            {previewUrl ? (
               
              <img src={previewUrl} alt="Student" className="w-full h-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-white text-center">
                <svg className="mb-2 h-9 w-9 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5M7 10l5-5m0 0l5 5m-5-5v12" />
                </svg>
                <span className="px-3 text-xs font-black uppercase tracking-wide text-sky-700">Choose image</span>
              </div>
            )}
          </div>
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-950/45 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-sky-700 shadow">Choose image</span>
          </div>
        </div>
        <div className="mt-3 text-center">
          <span className="text-sm font-semibold text-sky-700">{t('form.studentImage')}<span className="text-red-500 ml-1">*</span></span>
          <p className="text-xs text-gray-500 mt-1">JPG or WEBP only. PNG is not accepted. Image must be under 5 MB.</p>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/webp"
          required
          aria-required="true"
          className="hidden"
        />
      </div>

      <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-black">{t('form.fullName')}<span className="text-red-500 ml-1">*</span></span>
          <input required aria-required="true" value={String(data.fullNameWithSurname ?? '')} onChange={(e) => onChange('fullNameWithSurname', e.target.value)} placeholder={t('form.fullName')}
            className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm focus:border-black focus:ring-2 focus:ring-black/10 bg-white text-black" />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-black">{t('form.nameWithInitials')}</span>
          <input value={String(data.nameWithInitials ?? '')} onChange={(e) => onChange('nameWithInitials', e.target.value)} placeholder={t('form.nameWithInitials')}
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
          <input required aria-required="true" value={String(data.address ?? '')} onChange={(e) => onChange('address', e.target.value)} placeholder={t('form.address')}
            className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-black">{t('form.school')}<span className="text-red-500 ml-1">*</span></span>
          <input required aria-required="true" value={String(data.school ?? '')} onChange={(e) => onChange('school', e.target.value)} placeholder={t('form.school')}
            className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <label className="block">
          <span className="text-sm font-medium text-black">{t('form.earlierSchool')}</span>
          <select value={data.earlierSchool ?? 'NO'} onChange={(e) => onChange('earlierSchool', e.target.value as YesNo)} className="mt-1 block w-full rounded-lg border border-black px-3 py-2 shadow-sm bg-white text-black">
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
              <input value={String(data.earlierSchoolReason ?? '')} onChange={(e) => onChange('earlierSchoolReason', e.target.value)} placeholder={t('form.earlierSchoolName')}
                className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" />
          </label>
        </div>
      )}

      <div>
        <label className="block">
          <span className="text-sm font-medium text-black">{t('form.reasonForLeave')}</span>
          <textarea value={String(data.reasonForLeave ?? '')} onChange={(e) => onChange('reasonForLeave', e.target.value)} placeholder={t('form.reasonForLeave')}
            className="mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm bg-white text-black" rows={3} />
        </label>
      </div>
      </div>
    </div>
  );
}
