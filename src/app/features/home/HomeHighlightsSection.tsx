"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { CircularGallery, type GalleryItem } from "@/components/ui/circular-gallery";

export default function HomeHighlightsSection() {
  const t = useTranslations();
  const photoStripRef = useRef<HTMLDivElement>(null);

  const scrollPhotos = (direction: -1 | 1) => {
    const strip = photoStripRef.current;
    const card = strip?.firstElementChild as HTMLElement | null;
    if (!strip || !card) return;

    const gap = Number.parseFloat(window.getComputedStyle(strip).columnGap) || 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    strip.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: reduceMotion ? "auto" : "smooth" });
  };

  const galleryImageSets = [
    "/hero/Lord Buddha.jpg",
    "/hero/download.jpg",
    "/hero/download (1).jpg",
    "/logo/logo.jpeg",
  ];

  const items: GalleryItem[] = Array.from({ length: 10 }, (_, index) => {
    const image = galleryImageSets[index % galleryImageSets.length];

    return {
      id: `home-gallery-${index + 1}`,
      common: t("gallery"),
      binomial: t("gallery"),
      photo: {
        url: image,
        text: t("home_gallery_tile_caption"),
        by: t("home_gallery_photo_by"),
      },
    } satisfies GalleryItem;
  });

  return (
    <section className="relative mx-auto max-w-6xl overflow-hidden rounded-4xl border border-slate-200/80 bg-white px-3 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:px-7 sm:py-8 lg:px-10 lg:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.08),transparent_30%)]" />
      <div className="relative">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-700">{t("home_gallery_label")}</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{t("gallery")}</h2>
          </div>
          <div className="flex shrink-0 gap-2 xl:hidden">
            <button type="button" onClick={() => scrollPhotos(-1)} aria-label={t("home_gallery_previous")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-700 shadow-sm transition hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 sm:h-10 sm:w-10">
              <span aria-hidden="true">‹</span>
            </button>
            <button type="button" onClick={() => scrollPhotos(1)} aria-label={t("home_gallery_next")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-700 shadow-sm transition hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 sm:h-10 sm:w-10">
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </div>

        <div ref={photoStripRef} role="region" aria-label={t("home_gallery_title")}
          className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-7 sm:gap-4 motion-reduce:scroll-auto xl:hidden">
          {items.map((item, index) => (
            <div key={item.id} className="w-[85%] flex-none snap-start overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm sm:w-[calc((100%_-_1rem)/2)] md:w-[calc((100%_-_2rem)/3)]">
              <img src={item.photo.url} alt={item.photo.text} loading="lazy" decoding="async" draggable={false}
                className="aspect-[4/5] w-full object-cover sm:aspect-[3/4]" />
              <div className="px-3 py-2 text-xs font-medium text-slate-500">
                {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 hidden xl:block">
          <div className="h-[58vh] w-full overflow-hidden rounded-4xl bg-white">
            <CircularGallery items={items} radius={410} autoRotateSpeed={0.04} aria-label={t("home_gallery_title")} />
          </div>
        </div>
      </div>
    </section>
  );
}
