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

function toDateInputValue(value: unknown) {
  const text = toText(value);
  if (!text) return "";

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toISOString().slice(0, 10);
}

function formatDateLabel(value: unknown, locale: string) {
  const text = toText(value);
  if (!text) return "";

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "";

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
    const image = pickText(item, ["image", "imageUrl", "bannerImage", "thumbnail", "photo"]);
    const happenedDate = pickText(item, ["happenedDate", "date", "createdAt"]);
    const happenedDateLabel = formatDateLabel(happenedDate, locale);

    return {
      id: toText(item.id || item._id || item.uuid || `${topic}-${index}`),
      topic,
      topicSi,
      description,
      descriptionSi,
      image,
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
  accentClassName,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  mode: "create" | "edit";
  title: string;
  item: AdminContentItem | null;
  accentClassName: string;
  onClose: () => void;
  onSubmit: (values: ContentFormValues) => Promise<void>;
}) {
  const [topic, setTopic] = useState(item?.topic || "");
  const [topicSinhala, setTopicSinhala] = useState(item?.topicSi || "");
  const [description, setDescription] = useState(item?.description || "");
  const [descriptionSinhala, setDescriptionSinhala] = useState(item?.descriptionSi || "");
  const [happenedDate, setHappenedDate] = useState(item?.happenedDate ? toDateInputValue(item.happenedDate) : "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(item?.image || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
              <label htmlFor="image" className="block text-sm font-semibold text-slate-700">Image</label>
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
                className="block w-full cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
              />
              <p className="text-xs text-slate-400">Optional. Upload a new image to replace the current one.</p>
            </div>
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
      const imageUrl = values.imageFile
        ? await uploadImageToCloudinary(values.imageFile)
        : values.existingImage;

      const formData = new FormData();
      formData.append("topic", values.topic.trim());
      formData.append("topicSi", values.topicSi.trim());
      formData.append("description", values.description.trim());
      formData.append("descriptionSi", values.descriptionSi.trim());
      formData.append("happenedDate", new Date(`${values.happenedDate}T00:00:00`).toISOString());

      if (imageUrl) {
        formData.append("image", imageUrl);
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