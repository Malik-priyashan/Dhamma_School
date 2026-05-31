"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { fetchHomeEvents } from "../../../features/home/events/api/eventsApi";
import {
  getDateBadgeParts,
  getEventPhase,
  HomeContentItem,
  normalizeHomeEvents,
} from "../../../features/home/events/eventModel";

type EventDetailsPageProps = {
  params: Promise<{
    locale: string;
    eventId: string;
  }>;
};

export default function EventDetailsPage({ params }: EventDetailsPageProps) {
  const { locale, eventId } = use(params);
  const t = useTranslations();

  const [items, setItems] = useState<HomeContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadEvent = async () => {
      setLoading(true);
      setError(null);

      try {
        const payload = await fetchHomeEvents();
        const normalized = normalizeHomeEvents(payload, locale);

        if (!mounted) return;
        setItems(normalized);
      } catch {
        if (!mounted) return;
        setError(t("events_section_error"));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadEvent();

    return () => {
      mounted = false;
    };
  }, [locale, t]);

  const selectedEvent = useMemo(
    () => {
      const decodedEventId = decodeURIComponent(eventId);
      return items.find((item) => item.id === decodedEventId || item.slug === decodedEventId);
    },
    [items, eventId]
  );

  const galleryImages = selectedEvent?.galleryImages?.length
    ? selectedEvent.galleryImages
    : [];
  const showGallerySection = galleryImages.length > 0;

  if (loading) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbe9ff_0%,#f4f8ff_34%,#d7e7ff_72%,#89b6ff_100%)] px-4 pb-10 pt-28 sm:px-6 sm:pt-32 lg:px-8 lg:pt-36">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl bg-white/85 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t("events_section_loading")}</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbe9ff_0%,#f4f8ff_34%,#d7e7ff_72%,#89b6ff_100%)] px-4 pb-10 pt-28 sm:px-6 sm:pt-32 lg:px-8 lg:pt-36">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            {error}
          </div>
        </div>
      </main>
    );
  }

  if (!selectedEvent) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbe9ff_0%,#f4f8ff_34%,#d7e7ff_72%,#89b6ff_100%)] px-4 pb-10 pt-28 sm:px-6 sm:pt-32 lg:px-8 lg:pt-36">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
            <p className="text-lg font-bold text-slate-900">{t("events_detail_not_found") || "Event not found."}</p>
            <Link
              href={`/${locale}/events`}
              className="mt-4 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {t("events_detail_back_to_events") || "Back to events"}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const phase = getEventPhase(selectedEvent, Date.now());
  const dateBadge = getDateBadgeParts(selectedEvent.dateMs, locale);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbe9ff_0%,#f4f8ff_34%,#d7e7ff_72%,#89b6ff_100%)] px-4 pb-12 pt-28 sm:px-6 sm:pt-32 lg:px-8 lg:pt-36">
      <div className="mx-auto max-w-6xl space-y-10">
        <section className="overflow-hidden rounded-4xl bg-white shadow-[0_28px_80px_rgba(15,23,42,0.14)] ring-1 ring-slate-200/70">
          <div className="relative">
            <img src={selectedEvent.image} alt={selectedEvent.title} className="h-65 w-full object-cover sm:h-85 lg:h-107.5" />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/70 via-slate-950/20 to-transparent" />

            <div className="absolute left-4 top-4 rounded-2xl bg-orange-500 px-3 py-2 text-white shadow-[0_10px_24px_rgba(249,115,22,0.35)] sm:left-6 sm:top-6">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/80">
                {dateBadge.month || t("events_section_phase_upcoming")}
              </div>
              <div className="text-2xl font-black leading-none">{dateBadge.day || "--"}</div>
            </div>

            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
              <div className="max-w-3xl rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-lg sm:p-5">
                <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white">
                  {phase === "past" ? t("events_section_phase_past") : t("events_section_phase_upcoming")}
                </span>
                <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl lg:text-4xl">
                  {selectedEvent.title}
                </h1>
                {selectedEvent.dateLabel && (
                  <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">
                    {selectedEvent.dateLabel}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5 px-5 py-6 sm:px-8 sm:py-8">
            <p className="text-base leading-8 text-slate-700 sm:text-lg">
              {selectedEvent.description || t("events_detail_default_description") || "More details about this event will be available soon."}
            </p>
          </div>
        </section>

        {showGallerySection && (
          <section className="rounded-4xl bg-white px-5 py-8 shadow-[0_20px_70px_rgba(15,23,42,0.11)] ring-1 ring-slate-200/70 sm:px-8 sm:py-10">
            <div className="text-center">
              <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
                {t("events_detail_gallery_title") || "Event Gallery"}
              </h2>
              <div className="mx-auto mt-4 h-1.5 w-24 rounded-full bg-slate-700/80" />
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {galleryImages.map((image, index) => (
                <article
                  key={`${selectedEvent.id}-${index}`}
                  className="group overflow-hidden rounded-3xl bg-slate-100 shadow-[0_12px_36px_rgba(15,23,42,0.15)]"
                >
                  <img
                    src={image}
                    alt={`${selectedEvent.title} gallery ${index + 1}`}
                    className="h-64 w-full object-cover transition duration-300 group-hover:scale-[1.03] sm:h-72"
                  />
                </article>
              ))}
            </div>
          </section>
        )}

        <div className="flex justify-center pt-2">
          <Link
            href={`/${locale}/events`}
            className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(15,23,42,0.2)] transition duration-300 hover:scale-105 hover:bg-slate-800 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            {t("events_detail_back_to_events") || "Back to events"}
          </Link>
        </div>
      </div>
    </main>
  );
}
