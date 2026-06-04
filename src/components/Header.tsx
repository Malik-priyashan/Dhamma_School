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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  function toggleMobileMenu() {
    setMobileMenuOpen(!mobileMenuOpen);
  }

  return (
    <header className="fixed top-6 left-0 right-0 z-50 pointer-events-none overflow-x-hidden">
      <nav className="mx-auto max-w-full w-full pointer-events-auto bg-white/95 backdrop-blur-md shadow-xl rounded-full px-4 py-3">
        <div className="flex items-center justify-between px-3">
          {/* Mobile only: logo and icons */}
          <div className="flex items-center">
            {/* Logo button with styling */}
            <button onClick={() => go("/")} className="flex items-center gap-3 cursor-pointer bg-white border border-black shadow-md p-2 text-black" aria-label={t('home')}>
              <div className="w-20 h-20 overflow-hidden flex-shrink-0">
                <Image src="/logo/logo.jpeg" alt="logo" width={60} height={60} />
              </div>
            </button>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            {/* Login button (visible on mobile) */}
            <button className="bg-white text-black border border-black shadow-md px-3 py-1 rounded mr-2">
              Login
            </button>
            {/* Mobile menu toggle (hamburger) */}
            <button className="p-2 rounded bg-white border border-black shadow-md" onClick={toggleMobileMenu} aria-label="Open menu">
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => go('/prefect-board')}
              aria-label={t('prefect_board')}
              className={`ml-2 hidden md:inline-block ${userRole === 'STUDENT' ? 'inline-block' : 'hidden'} px-3 py-1 rounded-full text-sm text-slate-700 bg-white/90 shadow`}
            >
              {t('prefect_board')}
            </button>

            <ul className="hidden md:flex items-center text-sm text-slate-700 absolute left-1/2 transform -translate-x-1/2">
              {[
                { path: '/', label: t('home') },
                { path: '/prefect-board', label: t('prefect_board') || 'Prefect Board', studentOnly: true },
                { path: '/announcing', label: t('announcing') || 'Announcing', studentOnly: true },
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

          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-1 bg-black rounded-full p-0.5 shadow-md">
              <button onClick={() => changeLocale('en')}
                      className={`px-3 py-1 rounded-full text-sm transition ${locale === 'en' ? 'bg-white text-black' : 'text-white'}`}
                      aria-pressed={locale === 'en'}>
                EN
              </button>
              <button onClick={() => changeLocale('si')}
                      className={`px-3 py-1 rounded-full text-sm transition ${locale === 'si' ? 'bg-white text-black' : 'text-white'}`}
                      aria-pressed={locale === 'si'}>
                සි
              </button>
            </div>
            <button className="bg-white text-black border border-black shadow-md px-3 py-1 rounded">
              Login
            </button>
          </div>
        </div>
      </nav>
      {/* Mobile side panel with higher z-index */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 z-50 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
          aria-hidden={!mobileMenuOpen}>
        <button className="absolute top-4 right-4 p-2 rounded bg-gray-200" onClick={toggleMobileMenu} aria-label="Close menu">✕</button>
        <ul className="mt-12 space-y-4 px-4">
          {[
            { path: '/', label: t('home') },
            { path: '/prefect-board', label: t('prefect_board') || 'Prefect Board', studentOnly: true },
            { path: '/announcing', label: t('announcing') || 'Announcing', studentOnly: true },
          ]
            .filter(link => !link.studentOnly || userRole === 'STUDENT')
            .map(({ path, label }) => {
              const base = path === '/' ? `/${locale}` : `/${locale}${path}`;
              const isActive = pathname === base || pathname?.startsWith(base + '/');
              return (
                <li key={path}>
                  <button onClick={() => { go(path); toggleMobileMenu(); }}
                          className={`block w-full text-left px-3 py-2 rounded ${isActive ? 'bg-gray-200' : ''}`}> {label} </button>
                </li>
              );
            })}
        </ul>
      </div>
    </header>
  );
}
