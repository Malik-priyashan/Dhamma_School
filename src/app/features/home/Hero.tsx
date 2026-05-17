"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { getUserRole } from "../../../lib/authUtils";

export default function Hero() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      Promise.resolve().then(() => {
        setUserRole(getUserRole());
      });
    }
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="max-w-4xl text-center px-4">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white drop-shadow-lg leading-tight">
          {t('welcome_school')}
        </h1>

        <p className="mt-4 text-lg sm:text-xl text-white/90 drop-shadow-md">{t('subheading')}</p>

        <div className="mt-8 flex items-center justify-center gap-4 pointer-events-auto">
          {userRole === 'STUDENT' && (
            <button
              onClick={() => router.push(`/${locale}/join-us`)}
              className="group relative inline-flex items-center justify-center px-6 py-3 rounded-full shadow-lg text-sm font-medium text-white bg-sky-400 overflow-hidden transform transition-all duration-200 hover:scale-95 hover:bg-sky-500 transition-colors"
            >
              {t('cta')}
              <span className="absolute left-0 -translate-x-full top-0 h-full w-1/2 bg-white/20 -skew-x-12 transform transition-transform duration-700 ease-out group-hover:translate-x-[250%]" />
            </button>
          )}

          <button
            onClick={() => { /* keep behavior as needed */ }}
            className="group relative inline-flex items-center justify-center px-6 py-3 rounded-full shadow-lg text-sm font-medium text-white bg-white/20 overflow-hidden transform transition-all duration-200 hover:scale-95"
          >
            {t('learn_more')}
            <span className="absolute left-0 -translate-x-full top-0 h-full w-1/2 bg-white/10 -skew-x-12 transform transition-transform duration-700 ease-out group-hover:translate-x-[250%]" />
          </button>
        </div>
        </div>
      </div>
  );
}
