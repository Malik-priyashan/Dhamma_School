"use client";

import React, { useState } from "react";
import { StepProps } from "../types/types";
import { useTranslations } from "next-intl";

export default function Step2({ data, onChange }: StepProps) {
  const t = useTranslations();

  const talentKeys = [
    'announcing',
    'kathika',
    'padyagayana',
    'debate',
    'acting',
    'singing',
    'dancing',
    'prefect',
    'committee',
    'other',
  ];

  const [editingType, setEditingType] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ inDhammaSchool?: string; inSchool?: string; other?: string }>({});

  function openDetailFor(type: string) {
    setEditingType(type);
    const existing = data.specialTalents?.[type];
    setDetail({ inDhammaSchool: existing?.inDhammaSchool ?? '', inSchool: existing?.inSchool ?? '', other: existing?.other ?? '' });
  }

  function closeDetail() {
    setEditingType(null);
    setDetail({});
  }

  function saveDetail() {
    if (!editingType) return;
    const next = { ...(data.specialTalents ?? {}) };
    next[editingType] = { inDhammaSchool: detail.inDhammaSchool ?? '', inSchool: detail.inSchool ?? '', other: detail.other ?? '' };
    onChange('specialTalents', next as any);
    setEditingType(null);
    setDetail({});
  }

  function renderTick(type: string) {
    return data.specialTalents && data.specialTalents[type] ? (
      <span className="ml-2 text-green-600" aria-hidden>✓</span>
    ) : null;
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-700">{t('announcing_form.title')}</div>

      <div className="grid grid-cols-1 gap-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-black">{t('announcing_form_specialtalents.title')}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {talentKeys.map((k) => (
            <button key={k} type="button" onClick={() => openDetailFor(k)} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
              <div className="text-sm text-black">{t(`announcing_form_specialtalents.types.${k}`)}</div>
              <div>{renderTick(k)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Type list modal (simple) */}
      

      {/* Detail popup for a selected type */}
      {editingType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="font-semibold text-black">{t(`announcing_form_specialtalents.types.${editingType}`)}</div>
              <button type="button" onClick={closeDetail} className="text-gray-600">x</button>
            </div>

            <div className="grid gap-4 overflow-y-auto px-5 py-4">
              <label className="block">
                <div className="text-sm text-gray-700">{t('announcing_form_specialtalents.inDhammaSchool')}</div>
                <textarea value={detail.inDhammaSchool ?? ''} onChange={(e) => setDetail((s) => ({ ...s, inDhammaSchool: e.target.value }))} rows={5} className="mt-2 block min-h-32 w-full resize-y rounded border px-3 py-2 text-black" />
              </label>

              <label className="block">
                <div className="text-sm text-gray-700">{t('announcing_form_specialtalents.inSchool')}</div>
                <textarea value={detail.inSchool ?? ''} onChange={(e) => setDetail((s) => ({ ...s, inSchool: e.target.value }))} rows={5} className="mt-2 block min-h-32 w-full resize-y rounded border px-3 py-2 text-black" />
              </label>

              <label className="block">
                <div className="text-sm text-gray-700">{t('announcing_form_specialtalents.other')}</div>
                <textarea value={detail.other ?? ''} onChange={(e) => setDetail((s) => ({ ...s, other: e.target.value }))} rows={5} className="mt-2 block min-h-32 w-full resize-y rounded border px-3 py-2 text-black" />
              </label>

            </div>

            <div className="flex justify-end gap-2 border-t px-5 py-4">
              <button type="button" onClick={closeDetail} className="rounded-full border px-4 py-2">{t('announcing_form_specialtalents.close')}</button>
              <button type="button" onClick={saveDetail} className="rounded-full bg-sky-500 px-4 py-2 text-white">{t('announcing_form_specialtalents.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
