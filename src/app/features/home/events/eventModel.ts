import { HomeEventsApiItem } from "./api/eventsApi";

export type HomeContentItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  href: string;
  dateLabel: string;
  dateMs: number;
  galleryImages: string[];
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

function normalizeList(payload: unknown): HomeEventsApiItem[] {
  if (Array.isArray(payload)) return payload as HomeEventsApiItem[];
  if (!payload || typeof payload !== "object") return [];

  const record = payload as Record<string, unknown>;
  const possibleLists = [record.data, record.items, record.results, record.events];

  for (const candidate of possibleLists) {
    if (Array.isArray(candidate)) return candidate as HomeEventsApiItem[];
  }

  return [];
}

export function getDateMs(value: unknown) {
  if (!value || typeof value !== "string") return 0;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

export function getDateLabel(value: unknown, locale: string) {
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
}

function normalizeImageUrl(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.replace(/\s/g, "%20");
}

function createEventSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "") || "event";
}

function normalizeImageList(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    const collected: string[] = [];

    for (const entry of value) {
      if (typeof entry === "string") {
        const normalized = normalizeImageUrl(entry);
        if (normalized) collected.push(normalized);
        continue;
      }

      if (entry && typeof entry === "object") {
        const record = entry as Record<string, unknown>;
        const normalized = normalizeImageUrl(record.url || record.image || record.imageUrl || record.src);
        if (normalized) collected.push(normalized);
      }
    }

    return Array.from(new Set(collected));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return normalizeImageList(parsed);
        }
      } catch {
        // Treat the string as a single URL below.
      }
    }

    const normalized = normalizeImageUrl(trimmed);
    return normalized ? [normalized] : [];
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return normalizeImageList(record.url || record.image || record.imageUrl || record.src);
  }

  return [];
}

function extractGalleryImages(item: HomeEventsApiItem) {
  const possibleSources = [
    item.images,
    item.gallery,
    item.galleryImages,
    item.gallery_images,
    item.photos,
    item.eventGallery,
  ];

  const collected: string[] = [];

  for (const source of possibleSources) {
    collected.push(...normalizeImageList(source));
  }

  if (collected.length) {
    return Array.from(new Set(collected));
  }

  return [];
}

function getMainImage(item: HomeEventsApiItem, galleryImages: string[]) {
  const explicitImage =
    normalizeImageUrl(item.image || item.imageUrl || item.bannerImage || item.thumbnail || item.photo) || "";

  if (explicitImage) return explicitImage;

  return galleryImages[0] || "/hero/Lord%20Buddha.jpg";
}

function toLocalizedHref(locale: string, href: string) {
  if (href.startsWith(`/${locale}/`)) return href;
  if (href.startsWith("/")) return `/${locale}${href}`;
  return `/${locale}/${href}`;
}

export function normalizeHomeEvents(payload: unknown, locale: string): HomeContentItem[] {
  return normalizeList(payload).map((item, index) => {
    const gallerySourceImages = extractGalleryImages(item);
    const image = getMainImage(item, gallerySourceImages);
    const galleryImages = Array.from(new Set(gallerySourceImages.filter((galleryImage) => galleryImage !== image)));

    const title = String(
      locale === "si"
        ? (item as Record<string, unknown>).topicSi ||
            (item as Record<string, unknown>).topic_si ||
            item.topic ||
            item.title ||
            item.name ||
            `Event ${index + 1}`
        : item.topic || item.title || item.name || `Event ${index + 1}`
    );

    const description = String(
      locale === "si"
        ? (item as Record<string, unknown>).descriptionSi ||
            (item as Record<string, unknown>).description_si ||
            item.description ||
            item.content ||
            item.body ||
            item.summary ||
            ""
        : item.description || item.content || item.body || item.summary || ""
    );

    const dateSource = item.happenedDate || item.createdAt || item.date;
    const dateLabel = getDateLabel(dateSource, locale);
    const dateMs = getDateMs(dateSource);
    const slug = String(item.slug || item.eventSlug || item.id || item._id || createEventSlug(title));

    return {
      id: String(item.id || item._id || `event-${index}-${title}`),
      slug,
      title,
      description,
      image,
      href: toLocalizedHref(locale, String(item.href || item.slug || "/join-us")),
      dateLabel,
      dateMs,
      galleryImages,
    } satisfies HomeContentItem;
  });
}

export function getEventDetailPath(locale: string, eventId: string) {
  return `/${locale}/events/${encodeURIComponent(eventId)}`;
}

export function getEventPhase(item: HomeContentItem, now: number) {
  return item.dateMs > 0 && item.dateMs < now ? "past" : "upcoming";
}

export function getDateBadgeParts(dateMs: number, locale: string) {
  if (!dateMs) {
    return { month: "", day: "" };
  }

  const parsed = new Date(dateMs);
  if (Number.isNaN(parsed.getTime())) {
    return { month: "", day: "" };
  }

  const formatterLocale = locale === "si" ? "si-LK" : "en-US";
  const month = new Intl.DateTimeFormat(formatterLocale, { month: "short" }).format(parsed);
  const day = new Intl.DateTimeFormat(formatterLocale, { day: "numeric" }).format(parsed);

  return {
    month: locale === "en" ? month.toUpperCase() : month,
    day,
  };
}