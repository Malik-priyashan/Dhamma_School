"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useLocaleFieldsPrefect } from "../hooks/usePrefectForm";
import { StepProps } from "../types";

export default function Step2({ data, onChange }: StepProps) {
  const t = useTranslations();
  

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const initialFileName = (() => {
    const f = data.teacherConfirmation;
    if (f && typeof f === 'object' && 'name' in f) return (f as File).name ?? '';
    if (typeof f === 'string') return f;
    return '';
  })();
  const [fileName, setFileName] = React.useState<string>(initialFileName);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    const f = data.teacherConfirmation as File | null | undefined;
    if (f && typeof f === 'object' && 'name' in f) {
      setFileName((f as File).name ?? '');
      try {
        const url = URL.createObjectURL(f as File);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
      } catch {
        setPreviewUrl(null);
      }
    } else if (typeof data.teacherConfirmation === 'string') {
      setFileName(data.teacherConfirmation);
      setPreviewUrl(null);
    } else {
      setFileName('');
      setPreviewUrl(null);
    }
  }, [data.teacherConfirmation]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : (type === 'number' ? (value === '' ? '' : Number(value)) : value);
    onChange(name, val);
  }

  const { getLocaleValue, setLocaleValue } = useLocaleFieldsPrefect(data, onChange);

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">{t('prefect_board_firstTerm') || 'First term test'}</span>
            <div className="mt-1 space-y-2">
              <input name="firstTermMarks" value={data.firstTermMarks ?? ''} onChange={handleChange} placeholder={t('prefect_board_marks_placeholder') || 'Enter marks'} className="w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300" />
              <input name="firstTermPlace" value={getLocaleValue('firstTermPlaceEn','firstTermPlaceSi')} onChange={(e) => setLocaleValue('firstTermPlaceEn','firstTermPlaceSi', e.target.value)} placeholder={t('prefect_board_place_placeholder') || 'Enter place'} className="w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300" />
            </div>
          </label>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">{t('prefect_board_secondTerm') || 'Second term test'}</span>
            <div className="mt-1 space-y-2">
              <input name="secondTermMarks" value={data.secondTermMarks ?? ''} onChange={handleChange} placeholder={t('prefect_board_marks_placeholder') || 'Enter marks'} className="w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300" />
              <input name="secondTermPlace" value={getLocaleValue('secondTermPlaceEn','secondTermPlaceSi')} onChange={(e) => setLocaleValue('secondTermPlaceEn','secondTermPlaceSi', e.target.value)} placeholder={t('prefect_board_place_placeholder') || 'Enter place'} className="w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300" />
            </div>
          </label>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">{t('prefect_board_thirdTerm') || 'Third term test'}</span>
            <div className="mt-1 space-y-2">
              <input name="thirdTermMarks" value={data.thirdTermMarks ?? ''} onChange={handleChange} placeholder={t('prefect_board_marks_placeholder') || 'Enter marks'} className="w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300" />
              <input name="thirdTermPlace" value={getLocaleValue('thirdTermPlaceEn','thirdTermPlaceSi')} onChange={(e) => setLocaleValue('thirdTermPlaceEn','thirdTermPlaceSi', e.target.value)} placeholder={t('prefect_board_place_placeholder') || 'Enter place'} className="w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300" />
            </div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">{t('prefect_board_absentCount') || 'Absent days count'}</span>
          <input type="number" name="absentDaysCount" value={data.absentDaysCount ?? ''} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300" />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">{t('prefect_board_poyaThisYear') || 'Attended poya days this year'}</span>
          <input type="number" name="poyaThisYear" value={data.poyaThisYear ?? ''} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300" />
        </label>
      </div>

      {/** Yes/No questions with conditional years input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <label className="block">
            <span className="text-sm text-slate-700">{t('prefect_board_wasPrefect') || 'Was a prefect before?'}</span>
            <div className="mt-1 flex flex-col md:flex-row md:items-center gap-2">
              <select name="wasPrefectBefore" value={data.wasPrefectBefore ?? 'no'} onChange={handleChange} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300">
                <option value="no">{t('form.no') || 'No'}</option>
                <option value="yes">{t('form.yes') || 'Yes'}</option>
              </select>

              {data.wasPrefectBefore === 'yes' && (
                <input type="text" name="wasPrefectYears" value={data.wasPrefectYears ?? ''} onChange={handleChange} placeholder={t('prefect_board_years') || 'Years (e.g. 2019,2020)'} className="md:w-48 w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300" />
              )}
            </div>
          </label>
        </div>

        <div className="space-y-2">
          <label className="block">
            <span className="text-sm text-slate-700">{t('prefect_board_wasClassLeader') || 'Was a class leader before?'}</span>
            <div className="mt-1 flex flex-col md:flex-row md:items-center gap-2">
              <select name="wasClassLeaderBefore" value={data.wasClassLeaderBefore ?? 'no'} onChange={handleChange} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300">
                <option value="no">{t('form.no') || 'No'}</option>
                <option value="yes">{t('form.yes') || 'Yes'}</option>
              </select>

              {data.wasClassLeaderBefore === 'yes' && (
                <input type="text" name="wasClassLeaderYears" value={data.wasClassLeaderYears ?? ''} onChange={handleChange} placeholder={t('prefect_board_years') || 'Years (e.g. 2019,2020)'} className="md:w-48 w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300" />
              )}
            </div>
          </label>
        </div>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <label className="block">
            <span className="text-sm text-slate-700">{t('prefect_board_participatedCompetitions') || 'Participated in competitions?'}</span>
            <div className="mt-1 flex flex-col md:flex-row md:items-center gap-2">
              <select name="participatedInCompetitions" value={data.participatedInCompetitions ?? 'no'} onChange={handleChange} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300">
                <option value="no">{t('form.no') || 'No'}</option>
                <option value="yes">{t('form.yes') || 'Yes'}</option>
              </select>

              {data.participatedInCompetitions === 'yes' && (
                <input type="text" name="participatedCompetitionsYears" value={data.participatedCompetitionsYears ?? ''} onChange={handleChange} placeholder={t('prefect_board_years') || 'Years (comma-separated, e.g. 2018,2019)'} className="md:w-48 w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300" />
              )}
            </div>
          </label>
        </div>

        <div className="space-y-2">
          <label className="block">
            <span className="text-sm text-slate-700">{t('prefect_board_announcingMember') || 'Is an announcing member?'}</span>
            <div className="mt-1 flex flex-col md:flex-row md:items-center gap-2">
              <select name="isAnnouncingMember" value={data.isAnnouncingMember ?? 'no'} onChange={handleChange} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300">
                <option value="no">{t('form.no') || 'No'}</option>
                <option value="yes">{t('form.yes') || 'Yes'}</option>
              </select>

              {data.isAnnouncingMember === 'yes' && (
                <input type="text" name="announcingYears" value={data.announcingYears ?? ''} onChange={handleChange} placeholder={t('prefect_board_years') || 'Years (comma-separated)'} className="md:w-48 w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300" />
              )}
            </div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <label className="block">
            <span className="text-sm text-slate-700">{t('prefect_board_performedUdaHamuwa') || 'Performed on Uda Hamuwa?'}</span>
            <select name="performedOnUdaHamuwa" value={data.performedOnUdaHamuwa ?? 'no'} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300">
              <option value="no">{t('form.no') || 'No'}</option>
              <option value="yes">{t('form.yes') || 'Yes'}</option>
            </select>
          </label>
          {data.performedOnUdaHamuwa === 'yes' && (
            <input type="text" name="udaHamuwaYears" value={data.udaHamuwaYears ?? ''} onChange={handleChange} placeholder={t('prefect_board_years') || 'Years (comma-separated)'} className="mt-2 block w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300" />
          )}
        </div>

        <div className="space-y-2">
          <label className="block">
            <span className="text-sm text-slate-700">{t('prefect_board_attendedKatina') || 'Attended Katina festival?'}</span>
            <select name="attendedKatinaFestival" value={data.attendedKatinaFestival ?? 'no'} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300">
              <option value="no">{t('form.no') || 'No'}</option>
              <option value="yes">{t('form.yes') || 'Yes'}</option>
            </select>
          </label>
          {data.attendedKatinaFestival === 'yes' && (
            <input type="text" name="katinaYears" value={data.katinaYears ?? ''} onChange={handleChange} placeholder={t('prefect_board_years') || 'Years (comma-separated)'} className="mt-2 block w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-300" />
          )}
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">{t('prefect_board_teacherConfirmation')}<span className="text-red-500 ml-1">*</span></label>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center px-4 py-2 bg-sky-500 text-white rounded-lg shadow hover:bg-sky-600">
            {t('choose_file')}
          </button>
          <div className="text-sm text-slate-700">{fileName || t('no_file_chosen')}</div>
        </div>
        {previewUrl && (
          <div className="mt-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="preview" className="w-36 h-24 object-cover rounded-md border" />
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" name="teacherConfirmation" required aria-required="true" onChange={(e) => {
          const f = (e.target as HTMLInputElement).files?.[0] ?? null;
          onChange('teacherConfirmation', f);
          setFileName(f?.name ?? '');
        }} className="hidden" />
        <div className="text-xs text-slate-500 mt-2">{t('allowed_images_note')}</div>
      </div>
    </div>
  );
}
