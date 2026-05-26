"use client";

import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";

export default function Hero() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();

  return (
    <div className="absolute inset-0 flex min-h-screen items-center justify-center px-4 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-black/18 backdrop-blur-[2px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.14),transparent_48%)]" />

      <div className="relative w-full max-w-5xl translate-y-12 text-center text-white sm:translate-y-14">
        <div className="mx-auto mb-6 flex aspect-4/5 w-24 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/10 px-1.5 py-2 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:w-32 sm:mb-8">
          <Image
            src="/logo/logo.jpeg"
            alt="Siri Sumanathissa Dhamma School logo"
            width={240}
            height={240}
            className="h-full w-full rounded-xl object-contain drop-shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
            priority
          />
        </div>

        <div className="mx-auto max-w-4xl rounded-4xl border border-white/15 bg-black/16 px-5 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-[2px] sm:px-10 sm:py-8">
          <p className="text-[0.58rem] sm:text-[0.7rem] font-semibold uppercase tracking-[0.4em] text-white/70">
            {t('dhamma_school')}
          </p>

          <h1 className="mt-3 text-2xl font-black leading-tight sm:text-4xl lg:text-5xl">
            {t('welcome_school')}
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-white/80">
            {t('subheading')}
          </p>

          <div className="mt-7 flex items-center justify-center pointer-events-auto">
            <button
              onClick={() => router.push(`/${locale}/join-us`)}
              className="group inline-flex items-center justify-center rounded-full bg-amber-300 px-6 py-2.5 text-xs font-semibold text-slate-900 shadow-[0_14px_35px_rgba(251,191,36,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-200 hover:shadow-[0_18px_42px_rgba(251,191,36,0.45)] sm:px-7 sm:py-3 sm:text-sm"
            >
              {t('cta')}
              <span className="ml-2 transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col items-center justify-center pointer-events-auto">
          <button
            onClick={() => document.getElementById('home-content')?.scrollIntoView({ behavior: 'smooth' })}
            aria-label={t('scroll_down')}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white shadow-[0_12px_30px_rgba(0,0,0,0.2)] backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white/15"
          >
            <span className="text-lg leading-none">↓</span>
          </button>
          <span className={`mt-2 text-[0.6rem] font-medium uppercase tracking-[0.35em] text-white/70 sm:text-[0.65rem] ${locale === 'si' ? 'mt-4 sm:mt-5' : ''}`}>
            {t('scroll_down')}
          </span>
        </div>
      </div>
    </div>
  );
}
