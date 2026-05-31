"use client";

import React from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

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

interface Props {
  item: HomeContentItem | null;
  onClose: () => void;
}

export default function NewsDetailsModal({ item, onClose }: Props) {
  const t = useTranslations();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!item || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        <div className="relative h-56 sm:h-72 shrink-0">
          <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
          <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md hover:bg-white transition-colors">
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">
            {item.title}
          </h2>

          <div className="text-sm sm:text-base leading-7 text-slate-700 whitespace-pre-wrap mb-8">
            {item.description}
          </div>

          <div className="flex justify-center border-t border-slate-100 pt-4 mt-auto">
            <button
              onClick={onClose}
              className="rounded-full bg-rose-500 px-6 py-2 text-white font-semibold hover:bg-rose-600 transition-colors"
            >
              {t("close" as any) || "Close"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
