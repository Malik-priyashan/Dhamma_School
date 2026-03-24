"use client";

import { useTranslations } from "next-intl";
import React from "react";

export default function Hero() {
  const t = useTranslations();

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="max-w-4xl text-center px-4">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white drop-shadow-lg leading-tight">
          {t('welcome_school')}
        </h1>

        <p className="mt-4 text-lg sm:text-xl text-white/90 drop-shadow-md">{t('subheading')}</p>

        <div className="mt-8 flex items-center justify-center gap-4 pointer-events-auto">
          <a
            href="#about"
            className="group relative inline-flex items-center justify-center px-6 py-3 rounded-full shadow-lg text-sm font-medium text-white bg-blue-600 overflow-hidden transform transition-all duration-200 hover:scale-95 hover:bg-orange-500 transition-colors"
          >
            {t('cta')}
            <span className="absolute left-0 -translate-x-full top-0 h-full w-1/2 bg-white/20 -skew-x-12 transform transition-transform duration-700 ease-out group-hover:translate-x-[250%]" />
          </a>

          <button
            onClick={() => { /* keep behavior as needed */ }}
            className="group relative inline-flex items-center justify-center px-6 py-3 rounded-full shadow-lg text-sm font-medium text-white bg-white/20 overflow-hidden transform transition-all duration-200 hover:scale-95"
          >
            {t('learn_more')}
            <span className="absolute left-0 -translate-x-full top-0 h-full w-1/2 bg-white/10 -skew-x-12 transform transition-transform duration-700 ease-out group-hover:translate-x-[250%]" />
          </button>
        </div>

        {/* Scroll hint removed per request */}
      </div>
    </div>
  );
}
