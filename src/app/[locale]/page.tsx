"use client";

import HeroCarousel from "../features/home/HeroCarousel";
import Hero from "../features/home/Hero";
import YouTubeVideos from "../features/home/YouTubeVideos";
import { useTranslations } from "next-intl";
import NewsSection from "../features/home/news/NewsSection";
import EventsSection from "../features/home/events/EventsSection";
import HomeHighlightsSection from "../features/home/HomeHighlightsSection";

export default function LocalePage() {
  const t = useTranslations();

  return (
    <div className="flex flex-col min-h-screen items-center justify-start bg-white font-sans">
      {/* Full-width hero */}
      <div className="w-full">
        <div className="relative w-full">
          <HeroCarousel />
          <Hero />
        </div>
      </div>

      {/* Constrained content */}
      <main id="home-content" className="w-full px-4 pb-14 pt-6 sm:px-6 lg:px-8">
        <section className="relative mx-auto max-w-6xl overflow-hidden rounded-4xl border border-slate-200/80 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.16),transparent_32%)]" />
          <div className="relative px-5 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-700">{t("home_updates_label")}</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{t("home_updates_title")}</h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-600">
                {t("home_updates_subtitle")}
              </p>
            </div>
            <div className="mt-7 grid gap-5 lg:grid-cols-2">
              <NewsSection />
              <EventsSection />
            </div>
            <div className="mt-8">
              <HomeHighlightsSection />
            </div>
          </div>
        </section>
      </main>

      {/* Videos section should span full width */}
      <div className="w-full">
        <YouTubeVideos />
      </div>
    </div>
  );
}
