"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { locales } from "../../config";
import { clearClientAuthState, fetchCurrentUser, logoutUser } from "./auth/api/authApi";

const TeacherSidebar = dynamic(() => import("./teacher/TeacherSidebar"));
const AdminSidebar = dynamic(() => import("./admin/AdminSidebar"));

type CurrentUser = {
  id?: string | number;
  fullName?: string;
  name?: string;
  email?: string;
  role?: string;
  Role?: string;
  loginAt?: string;
  loggedInAt?: string;
  createdAt?: string;
};

function getLoginTimestamp(user: CurrentUser | null) {
  const directTimestamp = user?.loginAt || user?.loggedInAt || user?.createdAt;
  if (directTimestamp) return directTimestamp;

  if (typeof window !== 'undefined') {
    try {
      const storedLoginAt = localStorage.getItem('loginAt');
      if (storedLoginAt) return storedLoginAt;
    } catch {}
  }

  return null;
}

function formatTimestamp(value: string | null) {
  if (!value) return 'N/A';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Colombo',
  }).format(parsed);
}

export default function Header() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [verifiedPathname, setVerifiedPathname] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [loginAt, setLoginAt] = useState<string | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const [eventsMenuOpen, setEventsMenuOpen] = useState(false);
  const eventsMenuRef = useRef<HTMLLIElement | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileEventsMenuOpen, setMobileEventsMenuOpen] = useState(false);

  const displayInitial = useMemo(() => {
    const source = userName || userEmail || 'U';
    return source.trim().charAt(0).toUpperCase() || 'U';
  }, [userName, userEmail]);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await logoutUser();
    } catch (e) {
      console.error('Backend logout failed:', e);
    }

    try {
      await fetch('/api/frontend-logout', { method: 'POST' });
    } catch (e) {
      console.error('Frontend cookie native clear failed:', e);
    }

    document.cookie.split(';').forEach((c) => {
      const name = c.replace(/^ +/, '').split('=')[0];
      if (name) {
        document.cookie = name + '=;expires=' + new Date(0).toUTCString() + ';path=/';
        document.cookie = name + '=;expires=' + new Date(0).toUTCString() + ';path=/;domain=' + window.location.hostname;
      }
    });

    clearClientAuthState();
    setIsAuthenticated(false);
    setProfileMenuOpen(false);

    window.location.href = `/${locale}/login`;
  }

  useEffect(() => {
    if (pathname?.includes('/login') || pathname?.includes('/register')) return;
    let isMounted = true;

    async function syncAuth() {
      try {
        const user = (await fetchCurrentUser()) as CurrentUser;
        if (isMounted) {
          setIsAuthenticated(true);
          setUserName(user?.fullName || user?.name || 'User');
          setUserEmail(user?.email || '');
          setUserRole((user.role || user.Role || '').toUpperCase() || null);
          setLoginAt(getLoginTimestamp(user));
          setVerifiedPathname(pathname);
        }
      } catch {
        if (isMounted) {
          setIsAuthenticated(false);
          setUserRole(null);
          setUserName('');
          setUserEmail('');
          setLoginAt(null);
          setVerifiedPathname(pathname);
        }
      }
    }

    syncAuth();

    function handleOutsideClick(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (eventsMenuRef.current && !eventsMenuRef.current.contains(event.target as Node)) {
        setEventsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      isMounted = false;
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [pathname]);

  function changeLocale(next: string) {
    // Replace the locale segment in the current pathname so user stays on the same page
    try {
      const path = pathname || '/';
      const parts = path.split('/');

      // If the first path segment is a known locale, replace it; otherwise insert it after root
      if (parts[1] && (locales as readonly string[]).includes(parts[1])) {
        parts[1] = next;
      } else {
        parts.splice(1, 0, next);
      }

      const newPath = parts.join('/') || `/${next}`;
      router.push(newPath);
    } catch {
      router.push(`/${next}`);
    }
  }

  // No inline popup form here — navigation goes to the competitions page.
  const isAuthPage = pathname?.includes('/login') || pathname?.includes('/register');
  // Keep the confirmed session visible while the next pathname is revalidated.
  const hasVerifiedSession = isAuthenticated === true;
  const isSignedOut = isAuthenticated === false && verifiedPathname === pathname;
  if (isAuthPage) {
    return null;
  }

  if (hasVerifiedSession && userRole === 'ADMIN') {
    return <AdminSidebar setIsAuthenticated={setIsAuthenticated} />;
  }

  if (hasVerifiedSession && userRole === 'TEACHER') {
    return <TeacherSidebar setIsAuthenticated={setIsAuthenticated} />;
  }

  const navigationLinks = [
    { path: '/', label: t('home') },
    { path: '/news', label: t('news_section_label') || 'News' },
    { path: '/contact-us', label: t('contact_us') || 'Contact Us' },
    { path: '/events', label: t('events') || t('events_section_label') || 'Events', isDropdown: true, subPaths: [
      { path: '/events#upcoming', label: t('upcoming_events') || 'Upcoming Events' },
      { path: '/events#past', label: t('past_events') || 'Past Events' },
    ] },
    { path: '/student/prefect-board', label: t('prefect_board') || 'Prefect Board', studentOnly: true },
    { path: '/student/announcing', label: t('announcing') || 'Announcing', studentOnly: true },
    { path: '/student/marks', label: t('marks') || 'Marks', studentOnly: true },
  ].filter(link => !link.studentOnly || (hasVerifiedSession && userRole === 'STUDENT'));

  function isActiveLink(path: string) {
    const basePath = path.split('#')[0];
    const base = basePath === '/' ? `/${locale}` : `/${locale}${basePath}`;
    return basePath === '/'
      ? pathname === '/' || pathname === base
      : pathname === base || pathname?.startsWith(`${base}/`);
  }

  const desktopLinkClass = (active: boolean) => `group relative inline-flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
    active
      ? 'bg-slate-900 text-white shadow-[0_8px_18px_rgba(15,23,42,0.22)]'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
  }`;

  const mobileLinkClass = (active: boolean) => `flex min-h-11 w-full items-center justify-between rounded-2xl px-4 py-2.5 text-left text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
    active
      ? 'bg-slate-900 text-white shadow-[0_8px_20px_rgba(15,23,42,0.18)]'
      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
  }`;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-4 z-50 sm:top-5">
      <nav aria-label="Main navigation" className="pointer-events-auto mx-auto w-[calc(100%-1.5rem)] max-w-7xl rounded-[1.75rem] border border-white/80 bg-white/90 px-3 py-2.5 shadow-[0_16px_50px_rgba(15,23,42,0.13)] ring-1 ring-slate-200/70 backdrop-blur-2xl sm:w-[calc(100%-2rem)] sm:px-4 xl:rounded-full xl:px-5">
        <div className="flex items-center justify-between gap-3 xl:grid xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div className="flex items-center gap-2">
            {/* Mobile menu button */}
            <button 
              type="button"
              className="rounded-full border border-slate-200 bg-slate-50 p-2.5 text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 xl:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path></svg>
            </button>

            <Link href={`/${locale}`}
                      className="flex shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500" aria-label={t('home')}>
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm xl:h-11 xl:w-11">
                <Image src="/logo/logo.jpeg" alt="logo" width={50} height={50} className="w-full h-full object-contain" />
              </div>
            </Link>
          </div>

            <ul className="hidden items-center justify-self-center gap-0.5 rounded-full border border-slate-200/80 bg-slate-50/80 p-1 xl:flex">
              {navigationLinks
              .map(({ path, label, isDropdown, subPaths }) => {
                const isActive = isActiveLink(path);

                if (isDropdown) {
                  return (
                    <li key={path} className="relative" ref={path === '/events' ? eventsMenuRef : null} onMouseEnter={() => setEventsMenuOpen(true)} onMouseLeave={() => setEventsMenuOpen(false)}>
                      <button
                        type="button"
                        onClick={() => setEventsMenuOpen(!eventsMenuOpen)}
                        aria-current={isActive ? 'page' : undefined}
                        aria-expanded={eventsMenuOpen}
                        className={desktopLinkClass(isActive)}
                      >
                        {isActive && <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />}
                        <span>{label}</span>
                        <svg className={`h-4 w-4 transition-transform duration-200 ${isActive ? 'text-slate-300' : 'text-slate-400'} ${eventsMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                        </svg>
                      </button>
                      {eventsMenuOpen && (
                        <div className="absolute left-1/2 top-full z-50 w-52 -translate-x-1/2 pt-3">
                           <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.15)]">
                             {subPaths?.map((sub) => (
                                <Link key={sub.path} href={`/${locale}${sub.path}`} onClick={() => setEventsMenuOpen(false)} className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950">
                                  {sub.label}
                                </Link>
                             ))}
                           </div>
                        </div>
                      )}
                    </li>
                  );
                }

                return (
                  <li key={path}>
                    <Link
                      href={path === '/' ? `/${locale}` : `/${locale}${path}`}
                      aria-current={isActive ? 'page' : undefined}
                      className={desktopLinkClass(isActive)}
                    >
                      {isActive && <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />}
                      <span>{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

          <div className="flex shrink-0 items-center gap-2 justify-self-end sm:gap-3">
            <div className="block">
              {hasVerifiedSession ? (
                <div ref={profileMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((open) => !open)}
                    className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1.5 text-left transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 sm:gap-2"
                    aria-haspopup="menu"
                    aria-expanded={profileMenuOpen}
                    aria-label={userName || 'User account'}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white sm:h-9 sm:w-9">
                      {displayInitial}
                    </div>
                    <svg className={`mr-0.5 h-4 w-4 text-slate-400 transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 top-[calc(100%+0.75rem)] w-[calc(100vw-1.5rem)] max-w-64 overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-lg shadow-slate-100/60 sm:w-64">
                      <div className="bg-linear-to-r from-slate-50 to-sky-50 px-4 py-3 border-b border-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Account</p>
                        <h3 className="mt-1 text-base font-bold leading-tight truncate">{userName || 'User'}</h3>
                        <p className="mt-0.5 text-xs text-slate-500 truncate">{userEmail || 'N/A'}</p>
                      </div>

                      <div className="px-4 py-3 text-xs text-slate-600 space-y-3">
                        <div className="rounded-2xl bg-slate-50 px-3 py-2 border border-slate-100">
                          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Logged In</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{formatTimestamp(loginAt)}</p>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 p-3">
                        <button
                          onClick={handleLogout}
                          type="button"
                          disabled={isLoggingOut}
                          aria-busy={isLoggingOut}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition-all duration-300 hover:border-red-300 hover:bg-red-50 disabled:cursor-wait disabled:opacity-70"
                        >
                          {isLoggingOut ? (
                            <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                          ) : (
                            <span className="text-base">↪</span>
                          )}
                          {isLoggingOut ? 'Logging out...' : t('logout')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : isSignedOut ? (
                <Link
                  href={`/${locale}/login`}
                  className="min-h-10 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(15,23,42,0.2)] transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 sm:px-5"
                >
                  {t('login')}
                </Link>
              ) : null}
            </div>
            
            <div className="flex items-center gap-0.5 rounded-full border border-slate-200 bg-slate-100 p-1">
              <button
                onClick={() => changeLocale('en')}
                className={`rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 sm:px-3 ${
                  locale === 'en' 
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                aria-pressed={locale === 'en'}
              >
                EN
              </button>

              <button
                onClick={() => changeLocale('si')}
                className={`rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 sm:px-3 ${
                  locale === 'si' 
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                aria-pressed={locale === 'si'}
              >
                සි
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out xl:hidden ${mobileMenuOpen ? 'mt-3 max-h-[70vh] overflow-y-auto opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="flex flex-col gap-1 border-t border-slate-200 px-1 pb-1 pt-3">
              {[
                ...(isSignedOut ? [{ path: '/login', label: t('login') }] : []),
                ...navigationLinks,
              ]
            .map(({ path, label, isDropdown, subPaths }) => {
              const isActive = isActiveLink(path);

              if (isDropdown) {
                return (
                  <div key={path} className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => setMobileEventsMenuOpen(!mobileEventsMenuOpen)}
                      aria-current={isActive ? 'page' : undefined}
                      aria-expanded={mobileEventsMenuOpen}
                      className={mobileLinkClass(isActive)}
                    >
                      <span className="flex items-center gap-2.5">
                        {isActive && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-amber-300" />}
                        {label}
                      </span>
                      <svg className={`h-4 w-4 transition-transform duration-200 ${isActive ? 'text-slate-300' : 'text-slate-400'} ${mobileEventsMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {mobileEventsMenuOpen && (
                      <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-slate-200 py-1 pl-3">
                        {subPaths?.map((sub) => (
                           <Link
                             key={sub.path}
                             href={`/${locale}${sub.path}`}
                             onClick={() => { setMobileEventsMenuOpen(false); setMobileMenuOpen(false); }}
                             className="rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
                           >
                             {sub.label}
                           </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={path}
                  href={path === '/' ? `/${locale}` : `/${locale}${path}`}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={mobileLinkClass(isActive)}
                >
                  <span className="flex items-center gap-2.5">
                    {isActive && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-amber-300" />}
                    {label}
                  </span>
                </Link>
              );
            })}
            
          </div>
        </div>
      </nav>
    </header>
  );
}
