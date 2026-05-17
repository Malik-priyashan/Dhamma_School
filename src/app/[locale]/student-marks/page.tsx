"use client";

import React from "react";
import { useTranslations } from "next-intl";

export default function StudentMarksPage() {
  const t = useTranslations();

  return (
    <main className="min-h-screen bg-slate-50 flex-1 ml-64 p-8 pt-12">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-slate-900 border-b border-slate-200 pb-4">
          {t('student_marks') || 'Student Marks'}
        </h1>
        <p className="text-slate-600">
          Manage and review student marks here.
        </p>
      </div>
    </main>
  );
}