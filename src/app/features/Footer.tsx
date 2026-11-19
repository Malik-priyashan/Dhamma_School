"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

// Coordinates from the school's shared Google Maps pin (Pushparamaya).
const mapQuery = encodeURIComponent("5.9555506,80.5374783");
const mapsEmbedKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY;
const mapSrc = mapsEmbedKey
  ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(mapsEmbedKey)}&q=${mapQuery}&zoom=17`
  : `https://www.google.com/maps?q=${mapQuery}&z=17&output=embed`;

function FooterArrow() {
  return (
    <span aria-hidden="true" className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-amber-300/30 bg-amber-300/10 text-amber-300 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
        <path d="M7 17 17 7M8 7h9v9" />
      </svg>
    </span>
  );
}

export default function Footer() {
  const locale = useLocale();
  const t = useTranslations();
  const pathname = usePathname();
  const section = pathname?.split("/").filter(Boolean)[1];

  if (["admin", "dashboard", "login", "register", "student", "student-marks"].includes(section)) {
    return null;
  }

  const links = [
    { href: `/${locale}`, label: t("home") },
    { href: `/${locale}/news`, label: t("news_section_label") },
    { href: `/${locale}/events`, label: t("events") },
    { href: `/${locale}/contact-us`, label: t("contact_us") },
  ];

  return (
    <footer className="relative mt-auto overflow-hidden border-t-2 border-amber-500/70 bg-[#090b0c] text-slate-300">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(217,161,72,0.09),transparent_35%)]" />
      <div className="relative mx-auto max-w-7xl px-6 pt-10 sm:px-10 lg:px-12">
        <div className="grid items-center gap-x-10 gap-y-10 pb-9 text-center sm:grid-cols-2 xl:grid-cols-[1.35fr_0.7fr_1.25fr_1.7fr] xl:gap-x-12">
          <div className="mx-auto flex max-w-xs flex-col items-center justify-center">
            <Link href={`/${locale}`} className="inline-flex items-center justify-center gap-4 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400">
              <span className="flex h-[84px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white p-1">
                <Image src="/logo/logo.jpeg" alt="Siri Sumanathissa Dhamma School logo" width={68} height={84} className="h-full w-full object-contain" />
              </span>
              <span className="text-lg font-extrabold leading-snug tracking-tight text-white">{t("school_name")}</span>
            </Link>
            <p className="mt-5 text-sm leading-6 text-slate-400">{t("footer_school_note")}</p>
          </div>

          <nav aria-label={t("footer_links")} className="flex h-full flex-col items-center justify-center">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">{t("footer_links")}</h2>
            <ul className="mt-5 space-y-3.5 text-sm font-medium">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="group inline-flex items-center gap-2.5 transition hover:text-white hover:underline hover:underline-offset-4 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"><span>{link.label}</span><FooterArrow /></Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex h-full min-w-0 flex-col items-center justify-center">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">{t("contact_us")}</h2>
            <ul className="mt-5 space-y-3.5 text-sm font-medium">
              <li><a href="tel:+94761002898" className="transition hover:text-white hover:underline hover:underline-offset-4 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400">0761002898</a></li>
              <li><a href="mailto:sirisumanathissadhammaschoolm@gmail.com" className="[overflow-wrap:anywhere] transition hover:text-white hover:underline hover:underline-offset-4 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400">sirisumanathissadhammaschoolm<wbr />@gmail.com</a></li>
              <li><a href="https://www.facebook.com/share/18iQa17iMa/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2.5 transition hover:text-white hover:underline hover:underline-offset-4 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"><span>Facebook</span><FooterArrow /></a></li>
              <li><a href="https://www.youtube.com/channel/UCV7toQqmX3zL8pdBeV0Oxcg" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2.5 transition hover:text-white hover:underline hover:underline-offset-4 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"><span>YouTube</span><FooterArrow /></a></li>
            </ul>
          </div>

          <div className="flex h-full min-w-0 flex-col items-center justify-center">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">{t("footer_location")}</h2>
            <div className="mt-5 w-full overflow-hidden rounded-xl border border-white/15 bg-slate-900">
              <iframe
                title={t("footer_map_title")}
                src={mapSrc}
                loading="lazy"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="block h-[220px] w-full border-0"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 py-5 text-center text-xs font-medium text-slate-500">
          <p>© {new Date().getFullYear()} {t("school_name")}. {t("footer_rights")}</p>
        </div>
      </div>
    </footer>
  );
}
