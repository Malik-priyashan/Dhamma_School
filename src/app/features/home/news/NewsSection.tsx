"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { fetchHomeNews, HomeNewsApiItem } from "./api/newsApi";
import NewsDetailsModal from "./NewsDetailsModal";

type HomeContentItem = {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
  dateLabel: string;
  dateMs: number;
  details: Array<{ label: string; value: string }>;
};

type NewsSectionProps = {
  mode?: "preview" | "full";
};

const SINHALA_MONTH_NAMES = [
  "ජනවාරි",
  "පෙබරවාරි",
  "මාර්තු",
  "අප්‍රේල්",
  "මැයි",
  "ජූනි",
  "ජූලි",
  "අගෝස්තු",
  "සැප්තැම්බර්",
  "ඔක්තෝබර්",
  "නොවැම්බර්",
  "දෙසැම්බර්",
];


function LoadingCard({ mode }: { mode: "preview" | "full" }) {
  if (mode === "preview") {
    return (
      <article className="flex min-h-52 gap-4 rounded-3xl bg-white p-3.5 shadow-sm">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-black/10 sm:h-40 sm:w-40" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-4 w-28 rounded-full bg-black/10" />
            <div className="h-5 w-24 rounded-full bg-black/10" />
          </div>
          <div className="mt-2 h-3 w-28 rounded-full bg-black/10" />
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full rounded-full bg-black/10" />
            <div className="h-3 w-5/6 rounded-full bg-black/10" />
            <div className="h-3 w-2/3 rounded-full bg-black/10" />
          </div>
          <div className="mt-4 h-3 w-24 rounded-full bg-black/10" />
        </div>
      </article>
    );
  }

  return (
    <article className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_16px_36px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/70">
      <div className="flex items-center gap-3 px-5 pt-5 sm:px-6">
        <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200 ring-4 ring-slate-100" />
        <div className="h-4 w-3/4 rounded-full bg-slate-200" />
      </div>
      <div className="mt-4 h-56 w-full bg-slate-200 sm:h-60" />
      <div className="space-y-3 px-5 pb-5 pt-4 sm:px-6">
        <div className="h-3 w-full rounded-full bg-slate-200" />
        <div className="h-3 w-5/6 rounded-full bg-slate-200" />
        <div className="h-3 w-2/3 rounded-full bg-slate-200" />
        <div className="mt-4 h-4 w-24 rounded-full bg-slate-200" />
      </div>
    </article>
  );
}

function normalizeList(payload: unknown): HomeNewsApiItem[] {
  if (Array.isArray(payload)) return payload as HomeNewsApiItem[];
  if (!payload || typeof payload !== "object") return [];

  const record = payload as Record<string, unknown>;
  const possibleLists = [record.data, record.items, record.results, record.news];

  for (const candidate of possibleLists) {
    if (Array.isArray(candidate)) return candidate as HomeNewsApiItem[];
  }

  return [];
}

function getDateMs(value: unknown) {
  if (!value || typeof value !== "string") return 0;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function humanizeKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();
}

function formatDetailValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value
      .map((entry) => formatDetailValue(entry))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }

  return String(value).trim();
}

function buildDetails(item: HomeNewsApiItem, locale: string, title: string, description: string, image: string, dateLabel: string) {
  const fields = Object.entries(item)
    .map(([key, value]) => ({ label: humanizeKey(key), value: formatDetailValue(value) }))
    .filter((entry) => entry.value.length > 0);

  const preferredDetails = [
    { label: locale === "si" ? "මාතෘකාව" : "Title", value: title },
    { label: locale === "si" ? "විස්තරය" : "Description", value: description },
    { label: locale === "si" ? "දිනය" : "Date", value: dateLabel },
    { label: locale === "si" ? "පින්තූරය" : "Image", value: image },
  ].filter((entry) => entry.value.length > 0);

  const merged = [...preferredDetails, ...fields].filter((entry, index, array) => {
    return index === array.findIndex((candidate) => candidate.label === entry.label && candidate.value === entry.value);
  });

  return merged;
}

export default function NewsSection({ mode = "preview" }: NewsSectionProps) {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [items, setItems] = useState<HomeContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<HomeContentItem | null>(null);
  const isCarouselMode = mode === "full";

  useEffect(() => {
    const controller = new AbortController();

    const toLocalizedHref = (href: string) => {
      if (href.startsWith(`/${locale}/`)) return href;
      if (href.startsWith("/")) return `/${locale}${href}`;
      return `/${locale}/${href}`;
    };

    const formatDateLabel = (value: unknown) => {
      if (!value || typeof value !== "string") return "";
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return "";

      if (locale === "si") {
        const monthName = SINHALA_MONTH_NAMES[parsed.getMonth()] || "";
        return `${parsed.getDate()} ${monthName} ${parsed.getFullYear()}`.trim();
      }

      return parsed.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };

    const normalizeContent = (payload: unknown) => {
      return normalizeList(payload).map((item, index) => {
        const title = String(
          locale === "si"
            ? (item as any).topicSi || (item as any).topic_si || item.topic || item.title || item.name || `News ${index + 1}`
            : item.topic || item.title || item.name || `News ${index + 1}`
        );

        const description = String(
          locale === "si"
            ? (item as any).descriptionSi || (item as any).description_si || item.description || item.content || item.body || item.summary || ""
            : item.description || item.content || item.body || item.summary || ""
        );
        const image = String(item.image || item.imageUrl || item.bannerImage || item.thumbnail || item.photo || "");
        const dateSource = item.happenedDate || item.createdAt || item.date;
        const dateLabel = formatDateLabel(dateSource);
        const dateMs = getDateMs(dateSource);
        const details = buildDetails(item, locale, title, description, image, dateLabel);

        return {
          id: String(item.id || item._id || `news-${index}-${title}`),
          title,
          description,
          image: image || "/hero/download.jpg",
          href: toLocalizedHref(String(item.href || item.slug || "/student/announcing")),
          dateLabel,
          dateMs,
          details,
        } satisfies HomeContentItem;
      });
    };

    const loadNews = async () => {
      setLoading(true);
      setError(null);

      try {
        const payload = await fetchHomeNews();
        const nextItems = normalizeContent(payload)
          .sort((left, right) => right.dateMs - left.dateMs)
          .slice(0, mode === "preview" ? 3 : undefined);
        setItems(nextItems.length ? nextItems : []);
      } catch (fetchError) {
        if ((fetchError as Error).name === "AbortError") return;
        setError(t("news_section_error"));
        setItems([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadNews();

    return () => controller.abort();
  }, [locale, mode, t]);

  const visibleItems = mode === "preview" ? items.slice(0, 3) : items;

  const scrollByCard = (direction: "left" | "right") => {
    const container = carouselRef.current;
    if (!container) return;

    const firstCard = container.querySelector<HTMLElement>("article");
    const cardWidth = firstCard?.getBoundingClientRect().width || 0;
    const styles = window.getComputedStyle(container);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
    const amount = cardWidth + gap;

    if (!amount) return;

    container.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => (current.includes(id) ? current.filter((currentId) => currentId !== id) : [...current, id]));
  };

  const renderPreviewCard = (item: HomeContentItem) => (
    <article
      key={item.id}
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/${locale}/news`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(`/${locale}/news`);
        }
      }}
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
            {t("news_section_label")}
          </span>
        </div>
        {item.dateLabel && <p className="mt-1 text-sm font-semibold text-black/70">{item.dateLabel}</p>}
        <p className={`mt-2 text-sm leading-6 text-black/70 ${expandedIds.includes(item.id) ? "" : "line-clamp-3"}`}>
          {item.description}
        </p>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            router.push(`/${locale}/news`);
          }}
          className="mt-3 text-sm font-semibold text-blue-600 transition hover:text-blue-700 hover:underline"
        >
          {t("see_more")}
        </button>
      </div>
    </article>
  );

  if (isCarouselMode) {
    return (
      <section className="relative overflow-hidden bg-transparent px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.12),transparent_28%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.08),transparent_24%)]" />
        <div className="mx-auto max-w-400">
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-tight text-black sm:text-4xl lg:text-[2.5rem]">
              {t("news_section_title_full")}
            </h1>
            <div className="mx-auto mt-3 inline-flex items-center gap-2.5 rounded-full bg-slate-50 px-3.5 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm sm:text-sm">
              <span aria-hidden="true">←</span>
              <span>Use arrow keys or swipe left/right to see more news</span>
              <span aria-hidden="true">→</span>
            </div>
          </div>

          {error && <div className="mt-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black/70">{error}</div>}

          {loading && (
            <div className="mt-5 flex items-center gap-4 overflow-visible">
              <div className="hidden shrink-0 rounded-full border border-white/70 bg-white/95 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.16)] lg:inline-flex">
                <span className="flex h-5 w-5 items-center justify-center text-2xl leading-none text-slate-300">‹</span>
              </div>

              <div className="flex min-w-0 flex-1 gap-3 overflow-hidden pb-3 pt-1">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`news-preview-loading-${index}`}
                    className="snap-start flex w-[calc((100%-1.5rem)/3)] min-w-[calc((100%-1.5rem)/3)] max-w-[calc((100%-1.5rem)/3)] shrink-0"
                  >
                    <LoadingCard mode="preview" />
                  </div>
                ))}
              </div>

              <div className="hidden shrink-0 rounded-full border border-white/70 bg-white/95 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.16)] lg:inline-flex">
                <span className="flex h-5 w-5 items-center justify-center text-2xl leading-none text-slate-300">›</span>
              </div>
            </div>
          )}

          {!loading && (
            <div className="mt-5 flex items-center gap-4 overflow-visible">
            {visibleItems.length > 1 && (
              <button
                type="button"
                onClick={() => scrollByCard("left")}
                className="hidden shrink-0 rounded-full border border-white/70 bg-white/95 p-3 text-slate-700 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:scale-105 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 lg:inline-flex"
                aria-label="Scroll news left"
              >
                <span className="flex h-5 w-5 items-center justify-center text-2xl leading-none">‹</span>
              </button>
            )}

            <div
              ref={carouselRef}
              tabIndex={0}
              className="flex min-w-0 flex-1 gap-3 overflow-x-auto scroll-smooth pb-3 pt-1 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  scrollByCard("left");
                }
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  scrollByCard("right");
                }
              }}
            >
              {visibleItems.map((item) => (
                <article
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedItem(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setSelectedItem(item);
                  }}
                  className="relative cursor-pointer snap-start flex w-[calc((100%-1.5rem)/3)] min-w-[calc((100%-1.5rem)/3)] max-w-[calc((100%-1.5rem)/3)] shrink-0 flex-col overflow-hidden rounded-[1.55rem] bg-white shadow-[0_14px_28px_rgba(37,99,235,0.10)] ring-1 ring-black/5"
                >
                  <div className="flex items-start gap-2 px-4 pt-3.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white shadow-sm">
                      {item.title.trim().charAt(0).toUpperCase() || "N"}
                    </div>
                    <h4 className="min-w-0 flex-1 text-[0.98rem] font-bold leading-snug text-slate-900 sm:text-[1rem]">
                      {item.title}
                    </h4>
                  </div>

                  <div className="mt-2.5 flex items-center justify-center overflow-hidden bg-white px-2.5">
                    <img src={item.image} alt={item.title} className="h-52 w-full object-contain sm:h-56" />
                  </div>

                  <div className="flex flex-1 flex-col px-4 pb-12 pt-2.5">
                    {item.dateLabel && <p className="text-xs font-medium text-slate-500">{item.dateLabel}</p>}
                    <p className="mt-1.5 line-clamp-3 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
                      {item.description}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItem(item);
                    }}
                    className="absolute left-4 bottom-4 text-sm font-semibold text-slate-900 transition hover:text-black"
                  >
                    {t("see_more")}
                  </button>
                  <span className="absolute right-4 bottom-4 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                    {t("news_section_label")}
                  </span>
                </article>
              ))}
            </div>

            {visibleItems.length > 1 && (
              <button
                type="button"
                onClick={() => scrollByCard("right")}
                className="hidden shrink-0 rounded-full border border-white/70 bg-white/95 p-3 text-slate-700 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:scale-105 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 lg:inline-flex"
                aria-label="Scroll news right"
              >
                <span className="flex h-5 w-5 items-center justify-center text-2xl leading-none">›</span>
              </button>
            )}
            </div>
          )}
        </div>
        <NewsDetailsModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      </section>
    );
  }

  return (
    <article className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_18px_50px_rgba(0,0,0,0.06)] sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/70">{t("news_section_label")}</p>
          <h3 className="mt-1 text-xl font-extrabold text-black">
            {mode === "preview" ? t("news_section_title_preview") : t("news_section_title_full")}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-black/10 bg-black px-3 py-1 text-xs font-semibold text-white">
            {loading ? t("news_section_loading") : t("news_section_latest")}
          </span>
        </div>
      </div>

      {error && <div className="mt-4 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black/70">{error}</div>}

      {mode === "preview" ? (
        <div className="mt-5 space-y-4">
          {loading
            ? Array.from({ length: 3 }).map((_, index) => <LoadingCard key={`news-preview-stack-loading-${index}`} mode="preview" />)
            : visibleItems.map(renderPreviewCard)}
        </div>
      ) : (
        <>
          {loading && (
            <div className="mt-5 grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => <LoadingCard key={`news-full-loading-${index}`} mode="full" />)}
            </div>
          )}
          {!loading && (
        <div className="mt-5 grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((item) => (
            <article
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedItem(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setSelectedItem(item);
              }}
              className="group cursor-pointer overflow-hidden rounded-[1.75rem] bg-white shadow-[0_16px_36px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(15,23,42,0.14)]"
            >
              <div className="flex items-center gap-3 px-5 pt-5 sm:px-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white shadow-sm ring-4 ring-blue-100">
                  {item.title.trim().charAt(0).toUpperCase() || "N"}
                </div>
                <h4 className="min-w-0 flex-1 text-[1.08rem] font-semibold leading-snug text-slate-900 sm:text-[1.12rem]">
                  {item.title}
                </h4>
              </div>

              <div className="mt-4 overflow-hidden bg-slate-100">
                <img src={item.image} alt={item.title} className="h-56 w-full object-cover transition duration-300 group-hover:scale-[1.02] sm:h-60" />
              </div>

              <div className="px-5 pb-5 pt-4 sm:px-6">
                <p className={`text-sm leading-7 text-slate-500 ${expandedIds.includes(item.id) ? "" : "line-clamp-3"}`}>
                  {item.description}
                </p>

                <div className="mt-6 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(item.id);
                    }}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-700"
                  >
                    <span>{expandedIds.includes(item.id) ? t("news_section_show_less") : t("news_section_see_more")}</span>
                    <span className={`transition-transform duration-300 ${expandedIds.includes(item.id) ? "rotate-180" : "group-hover:translate-x-1"}`}>→</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItem(item);
                    }}
                    className="text-sm font-semibold text-blue-600 transition hover:text-blue-700 hover:underline"
                  >
                    {t("see_more")}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
          )}
        </>
      )}

      {mode !== "preview" && <NewsDetailsModal item={selectedItem} onClose={() => setSelectedItem(null)} />}

      {mode === "preview" && (
        <div className="mt-5 flex justify-end">
          <Link href={`/${locale}/news`} className="rounded-full border border-black px-4 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white">
            {t("news_section_all")}
          </Link>
        </div>
      )}
    </article>
  );
}
