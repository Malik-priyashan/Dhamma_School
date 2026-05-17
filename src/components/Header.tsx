"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { getUserRole } from "../lib/authUtils";

export default function Header() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      Promise.resolve().then(() => {
        setUserRole(getUserRole());
      });
    }
  }, [pathname]);

  function go(path: string) {
    router.push(`/${locale}${path}`);
  }

  function changeLocale(next: string) {
    // Navigate to selected locale (go to home)
    router.push(`/${next}`);
  }

  return (
    <header className="fixed top-6 left-0 right-0 z-50 pointer-events-none">
      <nav className="mx-auto max-w-7xl w-[calc(100%-2rem)] pointer-events-auto bg-white/95 backdrop-blur-md shadow-xl rounded-full px-6 py-3">
        <div className="flex items-center justify-between px-3">
          <div className="flex items-center gap-4">
            <button onClick={() => go("/")}
                    className="flex items-center gap-3 cursor-pointer" aria-label={t('home')}>
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 shadow bg-white p-1">
                <Image src="/Screenshot%20(801).png" alt="logo" width={44} height={44} />
              </div>
            </button>

            <button
              onClick={() => go('/prefect-board')}
              aria-label={t('prefect_board')}
              className={`ml-2 md:hidden ${userRole === 'STUDENT' ? 'inline-block' : 'hidden'} px-3 py-1 rounded-full text-sm text-slate-700 bg-white/90 shadow`}
            >
              {t('prefect_board')}
            </button>

            <ul className="hidden md:flex items-center text-sm text-slate-700 absolute left-1/2 transform -translate-x-1/2">
              {[
                { path: '/', label: t('home') },
                { path: '/prefect-board', label: t('prefect_board') || 'Prefect Board', studentOnly: true },
                { path: '/announcing', label: t('announcing') || 'Announcing', studentOnly: true },
                { path: '/gallery', label: t('gallery'), studentOnly: true },
              ]
              .filter(link => !link.studentOnly || userRole === 'STUDENT')
              .map(({ path, label }) => {
                const base = path === '/' ? `/${locale}` : `/${locale}${path}`;
                const isActive = pathname === base || pathname?.startsWith(base + '/');

                return (
                  <li key={path} className="mx-4">
                    <button
                      onClick={() => go(path)}
                      className="relative group px-3 py-2 text-sm text-slate-700"
                    >
                      {label}
                      <span
                        className={`absolute left-0 -bottom-1 h-0.5 bg-black transition-all duration-300 ${
                          isActive ? 'w-full' : 'w-0 group-hover:w-full'
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-black rounded-full p-0.5 shadow-md">
              <button
                onClick={() => changeLocale('en')}
                className={`px-3 py-1 rounded-full text-sm transition ${locale === 'en' ? 'bg-white text-black' : 'text-white'}`}
                aria-pressed={locale === 'en'}
              >
                EN
              </button>

              <button
                onClick={() => changeLocale('si')}
                className={`px-3 py-1 rounded-full text-sm transition ${locale === 'si' ? 'bg-white text-black' : 'text-white'}`}
                aria-pressed={locale === 'si'}
              >
                සි
              </button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
