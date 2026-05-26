"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { fetchHomeNews, HomeNewsApiItem } from "./api/newsApi";

type HomeContentItem = {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
  dateLabel: string;
  dateMs: number;
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

const DEFAULT_NEWS: HomeContentItem[] = [
  {
    id: "news-1",
    title: "Weekly Dhamma class highlights",
    description: "A short recap of the latest lessons, reflections, and student participation from this week.",
    image: "/hero/download.jpg",
    href: "/student/announcing",
    dateLabel: "",
    dateMs: 0,
  },
  {
    id: "news-2",
    title: "Community notice board",
    description: "Important announcements and updates for parents, students, and teachers in one place.",
    image: "/hero/download%20(1).jpg",
    href: "/student/announcing",
    dateLabel: "",
    dateMs: 0,
  },
  {
    id: "news-3",
    title: "School community update",
    description: "A short highlight from the latest school update and shared community note.",
    image: "/hero/Lord%20Buddha.jpg",
    href: "/student/announcing",
    dateLabel: "",
    dateMs: 0,
  },
];

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

export default function NewsSection({ mode = "preview" }: NewsSectionProps) {
  const locale = useLocale();
  const t = useTranslations();
  const [items, setItems] = useState<HomeContentItem[]>(DEFAULT_NEWS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

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

        return {
          id: String(item.id || item._id || `news-${index}-${title}`),
          title,
          description,
          image: image || "/hero/download.jpg",
          href: toLocalizedHref(String(item.href || item.slug || "/student/announcing")),
          dateLabel,
          dateMs,
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
        setItems(nextItems.length ? nextItems : DEFAULT_NEWS);
      } catch (fetchError) {
        if ((fetchError as Error).name === "AbortError") return;
        setError(t("news_section_error"));
        setItems(DEFAULT_NEWS);
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

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => (current.includes(id) ? current.filter((currentId) => currentId !== id) : [...current, id]));
  };

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

      <div className="mt-5 space-y-4">
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className="group flex min-h-52 gap-4 rounded-3xl bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_35px_rgba(0,0,0,0.08)]"
          >
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-black/5 sm:h-40 sm:w-40">
              <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/10" />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-base font-bold text-black sm:text-lg">{item.title}</h4>
              {item.dateLabel && <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-black/70">{item.dateLabel}</p>}
              <p className={`mt-2 text-sm leading-6 text-black/70 ${expandedIds.includes(item.id) ? "" : "line-clamp-3"}`}>
                {item.description}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold text-black">
                <button type="button" onClick={() => toggleExpanded(item.id)} className="inline-flex items-center gap-2">
                  <span>{expandedIds.includes(item.id) ? t("news_section_show_less") : t("news_section_see_more")}</span>
                  <span className={`transition-transform duration-300 ${expandedIds.includes(item.id) ? "rotate-180" : "group-hover:translate-x-1"}`}>→</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

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
