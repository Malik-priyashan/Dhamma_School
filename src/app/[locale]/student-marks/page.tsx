"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { fetchCurrentUser } from "../../features/auth/api/authApi";
import { getUserRole } from "../../../lib/authUtils";
import LoadingPage from "../../components/ui/LoadingPage";

export default function StudentMarksPage() {
  const router = useRouter();
  const locale = useLocale();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const t = useTranslations();

  useEffect(() => {
    let isMounted = true;

    async function syncAuth() {
      try {
        await fetchCurrentUser();
        const role = getUserRole();

        if (role !== 'TEACHER') {
          router.push(`/${locale}`);
          return;
        }

        if (isMounted) {
          setIsAuthenticated(true);
        }
      } catch {
        if (isMounted) {
          setIsAuthenticated(false);
          router.push(`/${locale}/login`);
        }
      }
    }

    syncAuth();

    return () => {
      isMounted = false;
    };
  }, [locale, router]);

  if (isAuthenticated === null) return <LoadingPage />;
  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-slate-50 flex-1 ml-0 md:ml-64 p-4 md:p-8 pt-20 md:pt-12">
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