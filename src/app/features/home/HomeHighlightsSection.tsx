"use client";

import { useTranslations } from "next-intl";
import { CircularGallery, type GalleryItem } from "@/components/ui/circular-gallery";

export default function HomeHighlightsSection() {
  const t = useTranslations();

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
    <section className="relative mx-auto max-w-6xl overflow-hidden rounded-4xl border border-slate-200/80 bg-white px-5 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:px-7 sm:py-8 lg:px-10 lg:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.08),transparent_30%)]" />
      <div className="relative">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-700">{t("home_gallery_label")}</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{t("gallery")}</h2>
        </div>

        <div className="mt-8">
          <div className="h-[58vh] w-full overflow-hidden rounded-4xl bg-white">
            <CircularGallery items={items} radius={410} autoRotateSpeed={0.04} aria-label={t("home_gallery_title")} />
          </div>
        </div>
      </div>
    </section>
  );
}