"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { fetchHomeEvents } from "./api/eventsApi";
import {
  getDateBadgeParts,
  getEventDetailPath,
  getEventPhase,
  HomeContentItem,
  normalizeHomeEvents,
} from "./eventModel";

type EventsSectionProps = {
  mode?: "preview" | "full";
};

function LoadingCard({ mode }: { mode: "preview" | "full" }) {
  if (mode === "preview") {
    return (
      <div className="flex min-h-52 gap-4 rounded-3xl bg-white p-3.5 shadow-sm">
        <div className="h-28 w-28 shrink-0 rounded-2xl bg-black/10 sm:h-40 sm:w-40" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-4 w-3/4 rounded-full bg-black/10" />
          <div className="h-3 w-24 rounded-full bg-black/10" />
          <div className="space-y-2 pt-1">
            <div className="h-3 w-full rounded-full bg-black/10" />
            <div className="h-3 w-5/6 rounded-full bg-black/10" />
            <div className="h-3 w-2/3 rounded-full bg-black/10" />
          </div>
          <div className="h-3 w-24 rounded-full bg-black/10" />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_16px_36px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/70">
      <div className="h-56 w-full animate-pulse bg-slate-200 sm:h-60" />
      <div className="space-y-3 px-5 pb-5 pt-4 sm:px-6">
        <div className="h-4 w-3/4 rounded-full bg-slate-200" />
        <div className="h-3 w-24 rounded-full bg-slate-200" />
        <div className="space-y-2 pt-1">
          <div className="h-3 w-full rounded-full bg-slate-200" />
          <div className="h-3 w-5/6 rounded-full bg-slate-200" />
          <div className="h-3 w-2/3 rounded-full bg-slate-200" />
        </div>
        <div className="h-3 w-20 rounded-full bg-slate-200" />
      </div>
    </div>
  );
}

function getPreviewEvents(items: HomeContentItem[], now: number) {
  const pastEvents = items
    .filter((item) => item.dateMs > 0 && item.dateMs < now)
    .sort((left, right) => right.dateMs - left.dateMs);

  const upcomingEvents = items
    .filter((item) => item.dateMs === 0 || item.dateMs >= now)
    .sort((left, right) => left.dateMs - right.dateMs);

  const selected = [...pastEvents.slice(0, 2), ...upcomingEvents.slice(0, 1)];

  if (selected.length < 3) {
    const remaining = [...pastEvents, ...upcomingEvents].filter((item) => !selected.some((chosen) => chosen.id === item.id));
    selected.push(...remaining.slice(0, 3 - selected.length));
  }

  return selected;
}


export default function EventsSection({ mode = "preview" }: EventsSectionProps) {
  const locale = useLocale();
  const t = useTranslations();
  const [items, setItems] = useState<HomeContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const now = Date.now();

  useEffect(() => {
    const controller = new AbortController();

    const loadEvents = async () => {
      setLoading(true);
      setError(null);

      try {
        const payload = await fetchHomeEvents();
        const normalizedItems = normalizeHomeEvents(payload, locale);
        const currentTime = Date.now();
        const pastEvents = normalizedItems
          .filter((item) => item.dateMs > 0 && item.dateMs < currentTime)
          .sort((left, right) => right.dateMs - left.dateMs);

        const upcomingEvents = normalizedItems
          .filter((item) => item.dateMs === 0 || item.dateMs >= currentTime)
          .sort((left, right) => left.dateMs - right.dateMs);

        const chosenItems = mode === "preview"
          ? getPreviewEvents(normalizedItems, currentTime)
          : [...pastEvents, ...upcomingEvents];

        setItems(chosenItems.length ? chosenItems : []);
      } catch (fetchError) {
        if ((fetchError as Error).name === "AbortError") return;
        setError(t("events_section_error"));
        setItems([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadEvents();

    return () => controller.abort();
  }, [locale, mode, t]);

  const pastItems = items.filter(item => getEventPhase(item, now) === "past");
  const upcomingItems = items.filter(item => getEventPhase(item, now) === "upcoming");

  const renderCard = (item: HomeContentItem) => {
    const detailsHref = getEventDetailPath(locale, item.slug);

    if (mode === "preview") {
      return (
        <Link
          key={item.id}
          href={detailsHref}
          className="group flex min-h-52 cursor-pointer gap-4 rounded-3xl bg-white p-3.5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_35px_rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-black/5 sm:h-40 sm:w-40">
            <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/10" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-base font-bold text-black sm:text-lg">{item.title}</h4>
              <span className="rounded-full border border-black/10 bg-black/5 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.2em] text-black/70">
                {getEventPhase(item, now) === "past" ? t("events_section_phase_past") : t("events_section_phase_upcoming")}
              </span>
            </div>
            {item.dateLabel && <p className="mt-1 text-sm font-semibold text-black/70">{item.dateLabel}</p>}
            <p className={`mt-2 text-sm leading-6 text-black/70 ${item.description ? "line-clamp-3" : ""}`}>
              {item.description}
            </p>
            <span className="mt-3 inline-block text-sm font-semibold text-blue-600 transition group-hover:text-blue-700 group-hover:underline">
              {t("events_section_see_more")}
            </span>
          </div>
        </Link>
      );
    }

    const dateParts = getDateBadgeParts(item.dateMs, locale);

    return (
      <Link
        key={item.id}
        href={detailsHref}
        className="group cursor-pointer overflow-hidden rounded-[1.75rem] bg-white text-left shadow-[0_16px_36px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(15,23,42,0.14)] focus:outline-none focus:ring-2 focus:ring-blue-200"
      >
        <div className="relative overflow-hidden bg-slate-100">
          <img
            src={item.image}
            alt={item.title}
            className="h-56 w-full object-cover transition duration-300 group-hover:scale-[1.02] sm:h-60"
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-950/20 via-transparent to-transparent" />

          <div className="absolute left-4 top-4 rounded-2xl bg-orange-500 px-3 py-2 text-white shadow-[0_10px_24px_rgba(249,115,22,0.28)]">
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-white/80">
              {dateParts.month || t("events_section_phase_upcoming")}
            </div>
            <div className="text-2xl font-black leading-none">{dateParts.day || "--"}</div>
          </div>
        </div>

        <div className="px-5 pb-5 pt-4 sm:px-6">
          <div className="flex flex-wrap items-start gap-2">
            <h4 className="min-w-0 flex-1 text-[1.08rem] font-semibold leading-snug text-slate-900 sm:text-[1.12rem]">
              {item.title}
            </h4>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              {getEventPhase(item, now) === "past" ? t("events_section_phase_past") : t("events_section_phase_upcoming")}
            </span>
          </div>

          {item.dateLabel && <p className="mt-2 text-xs font-medium text-slate-500">{item.dateLabel}</p>}

          <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-500">
            {item.description || t("events_section_see_more")}
          </p>

          <div className="mt-6 flex items-center justify-start gap-3">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition group-hover:text-blue-700 group-hover:underline">
              <span>{t("see_more")}</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </span>
          </div>
        </div>
      </Link>
    );
  };

  if (mode === "preview") {
    return (
      <article className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_18px_50px_rgba(0,0,0,0.06)] sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/70">{t("events_section_label")}</p>
            <h3 className="mt-1 text-xl font-extrabold text-black">
              {mode === "preview" ? t("events_section_title_preview") : t("events_section_title_full")}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-black/10 bg-black px-3 py-1 text-xs font-semibold text-white">
              {loading ? t("events_section_loading") : t("events_section_latest")}
            </span>
          </div>
        </div>

        {error && <div className="mt-4 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black/70">{error}</div>}

        <div className="mt-5 space-y-4">
          {loading
            ? Array.from({ length: 3 }).map((_, index) => <LoadingCard key={`preview-loading-${index}`} mode="preview" />)
            : items.length
              ? items.slice(0, 3).map(renderCard)
              : <p className="rounded-2xl border border-dashed border-black/10 px-4 py-5 text-sm text-black/70">{t("no_upcoming_events") || "No upcoming events."}</p>}
        </div>

        <div className="mt-5 flex justify-end">
          <Link href={`/${locale}/events`} className="rounded-full border border-black px-4 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white">
            {t("events_section_all")}
          </Link>
        </div>
      </article>
    );
  }

  return (
    <section className="relative overflow-hidden bg-transparent px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.12),transparent_28%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.08),transparent_24%)]" />
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight text-black sm:text-4xl lg:text-[2.5rem]">
            {t("events_section_title_full")}
          </h1>
        </div>

        {error && <div className="mt-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black/70">{error}</div>}

        <div className="mt-8 space-y-12">
          <section id="upcoming" className="scroll-mt-32">
            <h4 className="mb-4 text-xl font-bold text-black">{t("upcoming_events") || "Upcoming Events"}</h4>
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => <LoadingCard key={`upcoming-loading-${index}`} mode="full" />)}
              </div>
            ) : upcomingItems.length ? (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {upcomingItems.map(renderCard)}
              </div>
            ) : (
              <p className="text-sm text-black/70">{t("no_upcoming_events") || "No upcoming events."}</p>
            )}
          </section>

          <section id="past" className="scroll-mt-32 border-t border-black/10 pt-8">
            <h4 className="mb-4 text-xl font-bold text-black">{t("past_events") || "Past Events"}</h4>
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => <LoadingCard key={`past-loading-${index}`} mode="full" />)}
              </div>
            ) : pastItems.length ? (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {pastItems.map(renderCard)}
              </div>
            ) : (
              <p className="text-sm text-black/70">{t("no_past_events") || "No past events."}</p>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
