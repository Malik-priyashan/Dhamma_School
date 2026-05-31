"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { fetchCurrentUser } from "../auth/api/authApi";
import { getUserRole } from "../../../lib/authUtils";
import LoadingPage from "../../components/ui/LoadingPage";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "../../../config";

type AdminContentCreatePageProps = {
  title: string;
  description: string;
  endpoint: string;
  accentClassName: string;
  accentLabel: string;
};

export default function AdminContentCreatePage({
  title,
  description,
  endpoint,
  accentClassName,
  accentLabel,
}: AdminContentCreatePageProps) {
  const router = useRouter();
  const locale = useLocale();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [topic, setTopic] = useState("");
  const [topicSinhala, setTopicSinhala] = useState("");
  const [content, setContent] = useState("");
  const [contentSinhala, setContentSinhala] = useState("");
  const [happenedDate, setHappenedDate] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ success?: string; error?: string } | null>(null);

  const baseUrl = useMemo(() => {
    return ((process.env.NEXT_PUBLIC_BACKEND_URL) || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, "");
  }, []);

  const uploadImageToCloudinary = async (file: File) => {
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
  };

    const normalizeDateForDb = (value: string) => value;

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

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!topic.trim() || !topicSinhala.trim() || !content.trim() || !contentSinhala.trim() || !happenedDate) return;

    setIsSubmitting(true);
    setStatus(null);

    try {
      let imageUrl = "";

      if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile);
      }

      const formData = new FormData();
      formData.append("topic", topic.trim());
      formData.append("topicSi", topicSinhala.trim());
      formData.append("description", content.trim());
      formData.append("descriptionSi", contentSinhala.trim());
      formData.append("happenedDate", normalizeDateForDb(happenedDate));

      if (imageUrl) {
        formData.append("image", imageUrl);
      }

      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const rawText = await res.text().catch(() => "");
      let parsed: any = null;
      try {
        parsed = rawText ? JSON.parse(rawText) : null;
      } catch {
        parsed = null;
      }

      if (!res.ok) {
        const message = (parsed && typeof parsed.message === "string" ? parsed.message : rawText) || `Request failed with status ${res.status}`;
        throw new Error(message);
      }

      setStatus({ success: parsed?.message || `${title} saved successfully.` });
      setTopic("");
      setTopicSinhala("");
      setContent("");
      setContentSinhala("");
      setHappenedDate("");
      setImageFile(null);
    } catch (err: any) {
      setStatus({ error: err?.message || `Failed to save ${title.toLowerCase()}.` });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated === null) return <LoadingPage />;
  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-slate-50 flex-1 ml-0 md:ml-64 p-4 md:p-8 pt-20 md:pt-12">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div className="rounded-4xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm overflow-hidden relative">
          <div className={`absolute inset-x-0 top-0 h-1 ${accentClassName}`} />
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${accentLabel}`}>
                Admin submission
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm md:text-base text-slate-500">{description}</p>
            </div>
            <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="rounded-4xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
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
              <label htmlFor="topicSinhala" className="block text-sm font-semibold text-slate-700">Topic Sinhala</label>
              <input
                id="topicSinhala"
                type="text"
                value={topicSinhala}
                onChange={(e) => setTopicSinhala(e.target.value)}
                placeholder="Enter the Sinhala headline"
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
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-semibold text-slate-700">Description</label>
            <textarea
              id="description"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="Write the full event or news description"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100 transition resize-y"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="descriptionSinhala" className="block text-sm font-semibold text-slate-700">Description Sinhala</label>
            <textarea
              id="descriptionSinhala"
              value={contentSinhala}
              onChange={(e) => setContentSinhala(e.target.value)}
              rows={6}
              placeholder="Write the full Sinhala event or news description"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100 transition resize-y"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="image" className="block text-sm font-semibold text-slate-700">Image</label>
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="block w-full cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
            />
            <p className="text-xs text-slate-400">Optional. Add a banner image for the {title.toLowerCase()} entry.</p>
          </div>

          {status?.error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
              {status.error}
            </div>
          )}

          {status?.success && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
              {status.success}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
            <p className="text-xs text-slate-400">This will create a new record in the backend {endpoint} endpoint.</p>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg transition active:scale-[0.98] ${isSubmitting ? "bg-slate-400 shadow-none" : "bg-sky-600 hover:bg-sky-700 shadow-sky-600/20"}`}
            >
              {isSubmitting ? "Saving..." : `Save ${title}`}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}