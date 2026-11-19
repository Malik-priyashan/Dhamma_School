"use client";

import { useLocale, useTranslations } from "next-intl";
import { rulesContent } from "./rulesContent";

export default function RulesReader({ studentName = "", onBack, embedded = false }: {
  studentName?: string;
  onBack: () => void;
  embedded?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("form");
  const content = locale === "si" ? rulesContent.si : rulesContent.en;

  return (
    <main className={`min-h-screen bg-[radial-gradient(circle_at_top_left,#e0f2fe_0,#f8fafc_38%,#fff7ed_100%)] px-4 pb-20 text-slate-900 sm:px-6 ${embedded ? "pt-8" : "pt-28"}`}>
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={onBack}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600"
        >
          <span aria-hidden="true" className="text-lg leading-none">←</span>
          {t("backToForm")}
        </button>
        <header className="overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-xl shadow-slate-900/5">
          <div className="h-2 bg-gradient-to-r from-sky-500 via-teal-500 to-amber-400" />
          <div className="p-6 sm:p-10">
            <p className="text-sm font-bold uppercase tracking-widest text-sky-700">{content.school}</p>
            <p className="mt-1 text-sm text-slate-600">{content.location}</p>
            <h1 className="mt-7 max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
              {t("rulesTitle")}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700">{content.introduction}</p>
          </div>
        </header>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <nav aria-label={content.contents} className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">{content.contents}</h2>
            <ol className="mt-4 space-y-1">
              {content.sections.map((section) => (
                <li key={section.number}>
                  <a href={`#rule-${section.number}`} className="flex gap-3 rounded-lg px-2 py-2 text-sm leading-5 text-slate-700 transition hover:bg-sky-50 hover:text-sky-800 focus-visible:outline-2 focus-visible:outline-sky-600">
                    <span className="font-bold text-sky-700">{section.number}</span>
                    <span>{section.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="space-y-6">
            {content.sections.map((section) => (
              <section key={section.number} id={`rule-${section.number}`} className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-start gap-4 border-b border-slate-100 pb-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sm font-black text-sky-800">{section.number}</span>
                  <h2 className="pt-1 text-xl font-bold leading-8 text-slate-950 sm:text-2xl">{section.title}</h2>
                </div>
                <div className="mt-6 space-y-6">
                  {section.rules.map((rule) => (
                    <div key={rule.number || section.number} className="grid gap-2 sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-4">
                      {rule.number && <span className="font-bold text-sky-700">{rule.number}</span>}
                      <div className={rule.number ? "" : "sm:col-span-2"}>
                        <p className="text-[15px] leading-8 text-slate-700 sm:text-base">{rule.text}</p>
                        {rule.items && (
                          <ol className="mt-4 space-y-2 border-l-2 border-sky-100 pl-4">
                            {rule.items.map((item, index) => (
                              <li key={item} className="flex gap-3 text-[15px] leading-7 text-slate-700">
                                <span className="shrink-0 font-semibold text-sky-700">4.1.{index + 1}</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <section className="rounded-2xl border border-teal-200 bg-teal-50/90 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-teal-950">{content.declarationTitle}</h2>
              <p className="mt-4 text-[15px] leading-8 text-teal-950 sm:text-base">
                {content.declarationBeforeName}
                <span className="inline-block min-w-40 border-b border-dotted border-teal-700 px-1 font-semibold text-teal-950">
                  {studentName || "………………"}
                </span>
                {content.declarationAfterName}
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
