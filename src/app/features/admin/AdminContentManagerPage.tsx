"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { fetchCurrentUser } from "../auth/api/authApi";
import { getUserRole } from "../../../lib/authUtils";
import LoadingPage from "../../components/ui/LoadingPage";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "../../../config";

type AdminContentManagerPageProps = {
  title: string;
  description: string;
  endpoint: "/news" | "/events";
  accentClassName: string;
  accentLabel: string;
  addButtonLabel: string;
};

type RawContentRecord = Record<string, unknown>;

type AdminContentItem = {
  id: string;
  topic: string;
  topicSi: string;
  description: string;
  descriptionSi: string;
  image: string;
  images: string[];
  happenedDate: string;
  happenedDateLabel: string;
};

type ContentFormValues = {
  topic: string;
  topicSi: string;
  description: string;
  descriptionSi: string;
  happenedDate: string;
  imageFile: File | null;
  existingImage: string;
  galleryFiles: File[];
  existingImages: string[];
};

type GalleryImageSelection = {
  key: string;
  previewUrl: string;
  file?: File;
};

function toText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function pickText(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    const text = toText(value);
    if (text) return text;
  }

  return "";
}

function parseDateValue(value: unknown) {
  const text = toText(value).trim();
  if (!text) return null;

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]) - 1;
    const day = Number(dateOnlyMatch[3]);
    return new Date(year, month, day);
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateInputValue(value: unknown) {
  const parsed = parseDateValue(value);
  if (!parsed) return "";

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeImageUrl(value: unknown) {
  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  return trimmed.replace(/\s/g, "%20");
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
        // Fall through and treat the value as a single URL.
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

function collectImageUrls(record: Record<string, unknown>) {
  const sourceValues = [
    record.images,
    record.galleryImages,
    record.gallery_images,
    record.gallery,
    record.photos,
    record.eventGallery,
  ];

  const collected = sourceValues.flatMap((value) => normalizeImageList(value));
  return Array.from(new Set(collected));
}

function formatDateLabel(value: unknown, locale: string) {
  const parsed = parseDateValue(value);
  if (!parsed) return "";

  return parsed.toLocaleDateString(locale === "si" ? "si-LK" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeList(payload: unknown): RawContentRecord[] {
  if (Array.isArray(payload)) return payload as RawContentRecord[];
  if (!payload || typeof payload !== "object") return [];

  const record = payload as Record<string, unknown>;
  const possibleLists = [record.data, record.items, record.results, record.news, record.events];

  for (const candidate of possibleLists) {
    if (Array.isArray(candidate)) return candidate as RawContentRecord[];
  }

  return [];
}

function normalizeContentItems(payload: unknown, locale: string): AdminContentItem[] {
  return normalizeList(payload).map((item, index) => {
    const topic = pickText(item, ["topic", "title", "name", "topicSi", "topic_si", "topicSinhala", "topicSI"]) || `Item ${index + 1}`;
    const topicSi = pickText(item, ["topicSi", "topic_si", "topicSinhala", "topicSI"]);
    const description = pickText(item, ["description", "content", "body", "summary", "descriptionSi", "description_si", "descriptionSinhala", "descriptionSI"]);
    const descriptionSi = pickText(item, ["descriptionSi", "description_si", "descriptionSinhala", "descriptionSI"]);
    const images = collectImageUrls(item);
    const image = pickText(item, ["image", "imageUrl", "bannerImage", "thumbnail", "photo"]) || images[0] || "";
    const happenedDate = pickText(item, ["happenedDate", "date", "createdAt"]);
    const happenedDateLabel = formatDateLabel(happenedDate, locale);

    return {
      id: toText(item.id || item._id || item.uuid || `${topic}-${index}`),
      topic,
      topicSi,
      description,
      descriptionSi,
      image,
      images,
      happenedDate,
      happenedDateLabel,
    };
  });
}

async function uploadImageToCloudinary(file: File) {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Cloudinary is not configured.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;
  const response = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  const rawText = await response.text().catch(() => "");
  let parsed: Record<string, unknown> | null = null;

  try {
    parsed = rawText ? JSON.parse(rawText) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const message = typeof parsed?.error === "object" && parsed.error !== null && "message" in parsed.error
      ? String((parsed.error as Record<string, unknown>).message)
      : (typeof parsed?.message === "string" ? parsed.message : rawText);
    throw new Error(message || "Cloudinary upload failed.");
  }

  const secureUrl = typeof parsed?.secure_url === "string" ? parsed.secure_url : null;
  if (!secureUrl) {
    throw new Error("Cloudinary upload did not return an image URL.");
  }

  return secureUrl;
}

function ContentEditorModal({
  isOpen,
  mode,
  title,
  item,
  endpoint,
  accentClassName,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  mode: "create" | "edit";
  title: string;
  item: AdminContentItem | null;
  endpoint: "/news" | "/events";
  accentClassName: string;
  onClose: () => void;
  onSubmit: (values: ContentFormValues) => Promise<void>;
}) {
  const initialMainImage = item?.image || item?.images?.[0] || "";
  const initialGalleryImages = item?.images ? item.images.filter((image) => image !== initialMainImage) : [];
  const [topic, setTopic] = useState(item?.topic || "");
  const [topicSinhala, setTopicSinhala] = useState(item?.topicSi || "");
  const [description, setDescription] = useState(item?.description || "");
  const [descriptionSinhala, setDescriptionSinhala] = useState(item?.descriptionSi || "");
  const [happenedDate, setHappenedDate] = useState(item?.happenedDate ? toDateInputValue(item.happenedDate) : "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(initialMainImage);
  const [galleryItems, setGalleryItems] = useState<GalleryImageSelection[]>(
    initialGalleryImages.map((previewUrl, index) => ({
      key: `existing-${index}-${previewUrl}`,
      previewUrl,
    }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Defer state updates to avoid synchronous setState calls inside the effect
    const handle = setTimeout(() => {
      setTopic(item?.topic || "");
      setTopicSinhala(item?.topicSi || "");
      setDescription(item?.description || "");
      setDescriptionSinhala(item?.descriptionSi || "");
      setHappenedDate(item?.happenedDate ? toDateInputValue(item.happenedDate) : "");
      setImageFile(null);
      setImagePreview(item?.image || item?.images?.[0] || "");
      setGalleryItems(
        (item?.images || [])
          .filter((image) => image !== (item?.image || item?.images?.[0] || ""))
          .map((previewUrl, index) => ({
            key: `existing-${index}-${previewUrl}`,
            previewUrl,
          }))
      );
      setError(null);
    }, 0);

    return () => clearTimeout(handle);
  }, [isOpen, item]);

  if (!isOpen) return null;

  const handleImageChange = (nextFile: File | null) => {
    setImageFile(nextFile);

    if (!nextFile) {
      setImagePreview(item?.image || "");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(typeof reader.result === "string" ? reader.result : item?.image || "");
    };
    reader.readAsDataURL(nextFile);
  };

  const handleGalleryChange = (nextFiles: FileList | null) => {
    const incomingFiles = nextFiles ? Array.from(nextFiles) : [];

    if (!incomingFiles.length) {
      return;
    }

    const existingKeys = new Set(galleryItems.map((item) => item.key));
    const fileEntries = incomingFiles.map((file) => ({
      file,
      key: `file-${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
    }));

    const previewReaders = fileEntries.map(
      (entry) =>
        new Promise<GalleryImageSelection>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              key: entry.key,
              file: entry.file,
              previewUrl: typeof reader.result === "string" ? reader.result : "",
            });
          };
          reader.readAsDataURL(entry.file);
        })
    );

    void Promise.all(previewReaders).then((results) => {
      setGalleryItems((currentItems) => [
        ...currentItems,
        ...results.filter((entry) => entry.previewUrl && !existingKeys.has(entry.key)),
      ]);
    });
  };

  const removeGalleryItem = (key: string) => {
    setGalleryItems((currentItems) => currentItems.filter((item) => item.key !== key));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        topic,
        topicSi: topicSinhala,
        description,
        descriptionSi: descriptionSinhala,
        happenedDate,
        imageFile,
        existingImage: item?.image || "",
        galleryFiles: galleryItems.flatMap((item) => (item.file ? [item.file] : [])),
        existingImages: galleryItems.flatMap((item) => (!item.file ? [item.previewUrl] : [])),
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save item.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm" onClick={() => !isSubmitting && onClose()} />
      <div className="relative w-full max-w-3xl overflow-hidden rounded-4xl border border-white/70 bg-white shadow-2xl shadow-slate-900/20">
        <div className={`h-1.5 ${accentClassName}`} />
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6 sm:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-500">{mode === "edit" ? "Edit entry" : "Create entry"}</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{mode === "edit" ? `Edit ${title}` : `Add ${title}`}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{mode === "edit" ? "Update the selected content item and save the changes." : "Add a new content item for the admin panel."}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-50"
            aria-label="Close modal"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto p-6 space-y-6 sm:p-8">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="topic" className="block text-sm font-semibold text-slate-700">Topic</label>
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter a headline"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100 transition"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="topicSinhala" className="block text-sm font-semibold text-slate-700">Topic SI</label>
              <input
                id="topicSinhala"
                type="text"
                value={topicSinhala}
                onChange={(e) => setTopicSinhala(e.target.value)}
                placeholder="Enter topic_si"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100 transition"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="happenedDate" className="block text-sm font-semibold text-slate-700">Date</label>
              <input
                id="happenedDate"
                type="date"
                value={happenedDate}
                onChange={(e) => setHappenedDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100 transition"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="image" className="block text-sm font-semibold text-slate-700">Main Image</label>
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
                className="block w-full cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
              />
              <p className="text-xs text-slate-400">Optional. Upload a new image to replace the current one.</p>
            </div>

            {endpoint === "/events" && (
              <div className="space-y-2">
                <label htmlFor="galleryImages" className="block text-sm font-semibold text-slate-700">More Images</label>
                <input
                  id="galleryImages"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleGalleryChange(e.target.files)}
                  className="block w-full cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
                />
                <p className="text-xs text-slate-400">Select one or more additional images for the event gallery.</p>
              </div>
            )}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-semibold text-slate-700">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                placeholder="Write the full event or news description"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100 transition resize-y"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="descriptionSinhala" className="block text-sm font-semibold text-slate-700">Description SI</label>
              <textarea
                id="descriptionSinhala"
                value={descriptionSinhala}
                onChange={(e) => setDescriptionSinhala(e.target.value)}
                rows={6}
                placeholder="Enter description_si"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100 transition resize-y"
                required
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-3">
              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
                  {error}
                </div>
              )}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                The form keeps the current image if you do not upload a replacement.
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg transition active:scale-[0.98] ${isSubmitting ? "bg-slate-400 shadow-none" : "bg-sky-600 hover:bg-sky-700 shadow-sky-600/20"}`}
                >
                  {isSubmitting ? "Saving..." : mode === "edit" ? `Update ${title}` : `Save ${title}`}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Preview</div>
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="aspect-16/10 bg-slate-100">
                  {imagePreview ? (
                    <img src={imagePreview} alt={topic || title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-medium text-slate-400">
                      No image selected
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <div className="text-sm font-bold text-slate-900">{topic || `${title} title preview`}</div>
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">{happenedDate || "No date selected"}</div>
                </div>
              </div>

              {endpoint === "/events" && (() => {
                const totalGalleryImages = galleryItems.length;

                if (!totalGalleryImages) return null;

                return (
                  <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Gallery Preview</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {totalGalleryImages} selected image{totalGalleryImages === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {galleryItems.slice(0, 4).map((image, index) => (
                        <div key={image.key} className="group relative overflow-hidden rounded-2xl bg-slate-100">
                          <img src={image.previewUrl} alt={`${title} gallery preview ${index + 1}`} className="h-28 w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeGalleryItem(image.key)}
                            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 text-white opacity-100 transition hover:bg-rose-600"
                            aria-label={`Remove gallery image ${index + 1}`}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    {galleryItems.length > 4 && (
                      <div className="text-xs font-medium text-slate-500">+{galleryItems.length - 4} more image{galleryItems.length - 4 === 1 ? "" : "s"} selected</div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminContentManagerPage({
  title,
  description,
  endpoint,
  accentClassName,
  accentLabel,
  addButtonLabel,
}: AdminContentManagerPageProps) {
  const router = useRouter();
  const locale = useLocale();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [items, setItems] = useState<AdminContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{ success?: string; error?: string } | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminContentItem | null>(null);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<AdminContentItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function syncAuth() {
      try {
        await fetchCurrentUser();
        const role = getUserRole();

        if (role !== "ADMIN") {
          router.push(`/${locale}`);
          return;
        }

        if (isMounted) {
          setIsAuthenticated(true);
        }
      } catch {
        if (isMounted) {
          setIsAuthenticated(false);
          router.push(`/${locale}/login`);
        }
      }
    }

    syncAuth();

    return () => {
      isMounted = false;
    };
  }, [locale, router]);

  const sortedItems = useMemo(() => {
    return [...items].sort((left, right) => {
      const leftTime = left.happenedDate ? new Date(left.happenedDate).getTime() : 0;
      const rightTime = right.happenedDate ? new Date(right.happenedDate).getTime() : 0;
      return rightTime - leftTime;
    });
  }, [items]);

  const loadItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/proxy${endpoint}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      const rawText = await response.text().catch(() => "");

      if (!response.ok) {
        throw new Error(rawText || `Failed to load ${title.toLowerCase()} with status ${response.status}`);
      }

      let payload: unknown = null;
      try {
        payload = rawText ? JSON.parse(rawText) : null;
      } catch {
        payload = null;
      }

      const nextItems = normalizeContentItems(payload, locale);
      setItems(nextItems);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : `Failed to load ${title.toLowerCase()}.`);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, [endpoint, locale]);

  const openCreate = () => {
    setEditingItem(null);
    setStatus(null);
    setEditorOpen(true);
  };

  const openEdit = (item: AdminContentItem) => {
    setEditingItem(item);
    setStatus(null);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingItem(null);
  };

  const submitContent = async (values: ContentFormValues) => {
    setIsRefreshing(true);
    setStatus(null);

    try {
      const [imageUrl, galleryUrls] = await Promise.all([
        values.imageFile ? uploadImageToCloudinary(values.imageFile) : Promise.resolve(values.existingImage),
        values.galleryFiles.length
          ? Promise.all(values.galleryFiles.map((file) => uploadImageToCloudinary(file)))
          : Promise.resolve([] as string[]),
      ]);

      const imageCandidates = [imageUrl, ...values.existingImages, ...galleryUrls].filter((value): value is string => Boolean(value));
      const resolvedImage = imageUrl || values.existingImage || imageCandidates[0] || "";
      const images = Array.from(new Set([resolvedImage, ...imageCandidates].filter(Boolean)));

      const formData = new FormData();
      formData.append("topic", values.topic.trim());
      formData.append("topicSi", values.topicSi.trim());
      formData.append("description", values.description.trim());
      formData.append("descriptionSi", values.descriptionSi.trim());
      formData.append("happenedDate", values.happenedDate);

      if (resolvedImage) {
        formData.append("image", resolvedImage);
      }

      if (images.length) {
        formData.append("images", JSON.stringify(images));
      }

      const isEditing = Boolean(editingItem);
      const targetUrl = isEditing ? `/api/proxy${endpoint}/${editingItem?.id}` : `/api/proxy${endpoint}`;

      const response = await fetch(targetUrl, {
        method: isEditing ? "PATCH" : "POST",
        credentials: "include",
        cache: "no-store",
        body: formData,
      });

      const rawText = await response.text().catch(() => "");
      let responseData: any = null;

      try {
        responseData = rawText ? JSON.parse(rawText) : null;
      } catch {
        responseData = null;
      }

      if (!response.ok) {
        const message = typeof responseData?.message === "string" ? responseData.message : rawText;
        throw new Error(message || `Failed to save ${title.toLowerCase()} with status ${response.status}`);
      }

      setStatus({ success: responseData?.message || `${title} saved successfully.` });
      closeEditor();
      await loadItems();
    } finally {
      setIsRefreshing(false);
    }
  };

  const deleteItem = async (item: AdminContentItem) => {
    setIsRefreshing(true);
    setStatus(null);

    try {
      const response = await fetch(`/api/proxy${endpoint}/${item.id}`, {
        method: "DELETE",
        credentials: "include",
        cache: "no-store",
      });

      const rawText = await response.text().catch(() => "");
      if (!response.ok) {
        throw new Error(rawText || `Failed to delete ${title.toLowerCase()} with status ${response.status}`);
      }

      setStatus({ success: `${title} deleted successfully.` });
      await loadItems();
    } catch (deleteError) {
      setStatus({ error: deleteError instanceof Error ? deleteError.message : `Failed to delete ${title.toLowerCase()}.` });
    } finally {
      setIsRefreshing(false);
      setPendingDeleteItem(null);
    }
  };

  if (isAuthenticated === null) return <LoadingPage />;
  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-4 pt-20 md:ml-64 md:p-8 md:pt-12">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm">
          <div className={`h-1.5 ${accentClassName}`} />
          <div className="flex flex-col gap-5 border-b border-slate-100 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${accentLabel}`}>
                Admin content manager
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800 active:scale-[0.98]"
              >
                {addButtonLabel}
              </button>
              <button
                type="button"
                onClick={() => void loadItems()}
                disabled={isRefreshing || loading}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {status?.error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {status.error}
          </div>
        )}

        {status?.success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {status.success}
          </div>
        )}

        <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Records</p>
              <h2 className="mt-1 text-lg font-black text-slate-900">{loading ? `Loading ${title.toLowerCase()}...` : `${sortedItems.length} item${sortedItems.length === 1 ? "" : "s"}`}</h2>
            </div>
            {isRefreshing && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Updating</span>}
          </div>

          {error && !loading && (
            <div className="px-6 py-4 text-sm text-slate-500">{error}</div>
          )}

          {!error && !loading && sortedItems.length === 0 && (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto max-w-md rounded-4xl border border-dashed border-slate-200 bg-slate-50 px-8 py-10">
                <p className="text-lg font-black text-slate-900">No {title.toLowerCase()} yet</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">Use {addButtonLabel.toLowerCase()} to create the first entry.</p>
              </div>
            </div>
          )}

          {sortedItems.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Topic</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Image</th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {sortedItems.map((item) => (
                    <tr key={item.id} className="align-top transition hover:bg-slate-50/70">
                      <td className="px-6 py-5">
                        <div className="max-w-lg space-y-2">
                          <div className="text-sm font-bold text-slate-900">{item.topic}</div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-14 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
                            {item.image ? (
                              <img src={item.image} alt={item.topic} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400">No image</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-slate-500">Image preview</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="inline-flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-bold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteItem(item)}
                            className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ContentEditorModal
        isOpen={editorOpen}
        mode={editingItem ? "edit" : "create"}
        title={title}
        item={editingItem}
        endpoint={endpoint}
        accentClassName={accentClassName}
        onClose={closeEditor}
        onSubmit={submitContent}
      />

      {pendingDeleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm" onClick={() => !isRefreshing && setPendingDeleteItem(null)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-4xl border border-white/70 bg-white shadow-2xl shadow-slate-900/20">
            <div className="h-1.5 bg-linear-to-r from-rose-500 via-red-500 to-orange-500" />
            <div className="p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-rose-600">Confirm delete</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Are you sure you want to delete this {title.toLowerCase()} item?</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                This action cannot be undone. The item will be removed from the admin list and the public content feed.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    if (!pendingDeleteItem) return;
                    await deleteItem(pendingDeleteItem);
                  }}
                  disabled={isRefreshing}
                  className="inline-flex items-center justify-center rounded-full bg-rose-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-700 disabled:opacity-50"
                >
                  Yes, delete
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDeleteItem(null)}
                  disabled={isRefreshing}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}