"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { locales } from "../../config";
import { clearClientAuthState, fetchCurrentUser, logoutUser } from "./auth/api/authApi";
import { getUserRole } from "../../lib/authUtils";
import TeacherSidebar from "./teacher/TeacherSidebar";
import AdminSidebar from "./admin/AdminSidebar";

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
  iat?: number;
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function getLoginTimestamp(user: CurrentUser | null) {
  const directTimestamp = user?.loginAt || user?.loggedInAt || user?.createdAt;
  if (directTimestamp) return directTimestamp;

  if (typeof window !== 'undefined') {
    try {
      const storedLoginAt = localStorage.getItem('loginAt');
      if (storedLoginAt) return storedLoginAt;
    } catch {}
  }

  if (typeof window === 'undefined') return null;

  try {
    const match = document.cookie.match(new RegExp('(^| )accessToken=([^;]+)'));
    if (!match?.[2]) return null;

    const payload = decodeJwtPayload(match[2]);
    const issuedAt = payload?.iat;
    if (typeof issuedAt === 'number') {
      return new Date(issuedAt * 1000).toISOString();
    }
  } catch {}

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [loginAt, setLoginAt] = useState<string | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
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
    let isMounted = true;

    // Immediately get role from token
    if (typeof window !== 'undefined') {
      Promise.resolve().then(() => {
        if (isMounted) {
          setUserRole(getUserRole());
        }
      });
    }

    async function syncAuth() {
      try {
        const user = (await fetchCurrentUser()) as CurrentUser;
        if (isMounted) {
          setIsAuthenticated(true);
          setUserName(user?.fullName || user?.name || 'User');
          setUserEmail(user?.email || '');
          if (user?.role || user?.Role) {
            setUserRole((user.role || user.Role) ?? null);
          }
          setLoginAt(getLoginTimestamp(user));
        }
      } catch {
        if (isMounted) {
          setIsAuthenticated(false);
          setUserRole(null);
          setUserName('');
          setUserEmail('');
          setLoginAt(null);
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

  function go(path: string) {
    setMobileMenuOpen(false);
    router.push(`/${locale}${path}`);
  }

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
  if (isAuthPage) {
    return null;
  }

  if (userRole === 'ADMIN') {
    return <AdminSidebar setIsAuthenticated={setIsAuthenticated} />;
  }

  if (userRole === 'TEACHER') {
    return <TeacherSidebar setIsAuthenticated={setIsAuthenticated} />;
  }
  return (
    <header className="fixed top-6 left-0 right-0 z-50 pointer-events-none">
      <nav className="mx-auto max-w-7xl w-[calc(100%-1.5rem)] md:w-[calc(100%-2rem)] pointer-events-auto bg-white/95 backdrop-blur-2xl backdrop-saturate-125 rounded-3xl md:rounded-full px-4 md:px-8 py-4 border border-slate-200/80">
        <div className="flex items-center justify-between px-1 md:px-3">
          <div className="flex items-center gap-2 md:gap-6">
            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2.5 text-slate-700 bg-linear-to-br from-blue-100 to-blue-50 hover:from-blue-200 hover:to-blue-100 rounded-full transition-all duration-300 shadow-sm hover:shadow-md"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path></svg>
            </button>

            <button onClick={() => go("/")}
                      className="flex items-center gap-3 cursor-pointer hover:opacity-95 transition-opacity transform-gpu hover:-translate-y-0.5 shrink-0" aria-label={t('home')}>
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden shrink-0 shadow-lg bg-white border-2 border-slate-200/70 hover:shadow-2xl hover:shadow-blue-300/30 transition-all duration-300 ring-1 ring-white/60">
                <Image src="/logo/logo.jpeg" alt="logo" width={50} height={50} className="w-full h-full object-contain" />
              </div>
            </button>

            <ul className="hidden md:flex items-center text-sm font-medium absolute left-1/2 transform -translate-x-1/2 space-x-2">
              {[
                { path: '/', label: t('home') },
                { path: '/news', label: t('news_section_label') || 'News' },
                { path: '/contact-us', label: t('contact_us') || 'Contact Us' },
                { path: '/events', label: t('events') || t('events_section_label') || 'Events', isDropdown: true, subPaths: [
                  { path: '/events#upcoming', label: t('upcoming_events') || 'Upcoming Events' },
                  { path: '/events#past', label: t('past_events') || 'Past Events' }
                ] },
                { path: '/student/prefect-board', label: t('prefect_board') || 'Prefect Board', studentOnly: true },
                { path: '/student/announcing', label: t('announcing') || 'Announcing', studentOnly: true },
                { path: '/student/gallery', label: t('gallery'), studentOnly: true },
                { path: '/student/marks', label: t('marks') || 'Marks', studentOnly: true },
              ]
              .filter(link => !link.studentOnly || userRole === 'STUDENT')
              .map(({ path, label, isDropdown, subPaths }) => {
                const basePath = path.split('#')[0];
                const base = basePath === '/' ? `/${locale}` : `/${locale}${basePath}`;
                const isActive = basePath === '/'
                  ? pathname === base
                  : (pathname === base || pathname?.startsWith(base + '/'));

                if (isDropdown) {
                  return (
                    <li key={path} className="mx-0.5 relative" ref={path === '/events' ? eventsMenuRef : null} onMouseEnter={() => setEventsMenuOpen(true)} onMouseLeave={() => setEventsMenuOpen(false)}>
                      <button
                        onClick={() => setEventsMenuOpen(!eventsMenuOpen)}
                        className={`relative px-3 py-2 rounded-full transition-all duration-300 flex items-center gap-2 ${
                          isActive || eventsMenuOpen
                            ? 'bg-linear-to-r from-blue-100 to-blue-50 text-blue-800 font-semibold shadow-md'
                            : 'text-slate-700 hover:text-slate-900 hover:bg-white/40'
                        }`}
                      >
                        <span className="leading-none">{label}</span>
                        <svg className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${eventsMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                        </svg>
                        {(isActive && !eventsMenuOpen) && (
                          <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-linear-to-r from-blue-500 to-blue-700 rounded-full shadow-sm" />
                        )}
                      </button>
                      {eventsMenuOpen && (
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 pt-2 w-48 z-50">
                           <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden py-2 flex flex-col">
                             {subPaths?.map((sub) => (
                                <button key={sub.path} onClick={() => { setEventsMenuOpen(false); go(sub.path); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-blue-700 transition-colors text-sm font-medium">
                                  {sub.label}
                                </button>
                             ))}
                           </div>
                        </div>
                      )}
                    </li>
                  );
                }

                return (
                  <li key={path} className="mx-0.5">
                    <button
                      onClick={() => go(path)}
                      className={`relative px-3 py-2 rounded-full transition-all duration-300 flex items-center gap-2 ${
                        isActive 
                          ? 'bg-linear-to-r from-blue-100 to-blue-50 text-blue-800 font-semibold shadow-md'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-white/40'
                      }`}
                    >
                      <span className="leading-none">{label}</span>
                      {isActive && (
                        <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-linear-to-r from-blue-500 to-blue-700 rounded-full shadow-sm" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <div className="block">
              {isAuthenticated ? (
                <div ref={profileMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((open) => !open)}
                    className="flex items-center gap-1 sm:gap-2 rounded-full border border-slate-200 bg-white px-1.5 py-1.5 sm:px-2 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                    aria-haspopup="menu"
                    aria-expanded={profileMenuOpen}
                    aria-label={userName || 'User account'}
                  >
                    <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-linear-to-br from-slate-900 to-slate-700 text-sm font-bold text-white shadow-sm">
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
                          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition-all duration-300 hover:bg-red-50 hover:border-red-300"
                        >
                          <span className="text-base">↪</span>
                          {t('logout')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => go('/login')}
                  className="bg-linear-to-r from-blue-600 to-blue-700 text-white px-4 md:px-5 py-1.5 rounded-full text-xs font-semibold hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-blue-400/50 transition-all duration-300 hover:scale-105"
                >
                  {t('login')}
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-1 bg-linear-to-r from-slate-800 to-slate-900 rounded-full p-1 shadow-lg border-2 border-slate-600/60">
              <button
                onClick={() => changeLocale('en')}
                className={`px-2 md:px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                  locale === 'en' 
                    ? 'bg-white text-slate-900 shadow-md' 
                    : 'text-white hover:text-blue-100'
                }`}
                aria-pressed={locale === 'en'}
              >
                EN
              </button>

              <button
                onClick={() => changeLocale('si')}
                className={`px-2 md:px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                  locale === 'si' 
                    ? 'bg-white text-slate-900 shadow-md' 
                    : 'text-white hover:text-blue-100'
                }`}
                aria-pressed={locale === 'si'}
              >
                සි
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-96 mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="flex flex-col gap-2 pt-4 border-t-2 border-slate-300/60 pb-2">
              {[
              { path: '/login', label: t('login'), authOnly: false, hideAuth: true },
              { path: '/', label: t('home'), authOnly: false, hideAuth: false },
              { path: '/news', label: t('news_section_label') || 'News' },
              { path: '/contact-us', label: t('contact_us') || 'Contact Us' },
              { path: '/events', label: t('events') || t('events_section_label') || 'Events', isDropdown: true, subPaths: [
                  { path: '/events#upcoming', label: t('upcoming_events') || 'Upcoming Events' },
                  { path: '/events#past', label: t('past_events') || 'Past Events' }
              ] },
              { path: '/student/prefect-board', label: t('prefect_board') || 'Prefect Board', studentOnly: true },
              { path: '/student/announcing', label: t('announcing') || 'Announcing', studentOnly: true },
              { path: '/student/gallery', label: t('gallery'), studentOnly: true },
              { path: '/student/marks', label: t('marks') || 'Marks', studentOnly: true },
            ]
            .filter(link => {
              if (link.studentOnly && userRole !== 'STUDENT') return false;
              if (link.hideAuth && isAuthenticated) return false;
              return true;
            })
            .map(({ path, label, isDropdown, subPaths }) => {
              const basePath = path.split('#')[0];
              const base = basePath === '/' ? `/${locale}` : `/${locale}${basePath}`;
              const isActive = basePath === '/'
                ? pathname === base
                : (pathname === base || pathname?.startsWith(base + '/'));

              if (isDropdown) {
                return (
                  <div key={path} className="flex flex-col">
                    <button
                      onClick={() => setMobileEventsMenuOpen(!mobileEventsMenuOpen)}
                      className={`px-4 py-2.5 text-xs text-left rounded-lg transition-all duration-300 font-medium flex items-center justify-between ${
                        isActive 
                          ? 'bg-linear-to-r from-blue-100 to-blue-50 font-bold text-blue-700 border-l-4 border-blue-600'
                          : 'text-slate-700 hover:bg-blue-50/60 hover:text-blue-600 border-l-4 border-transparent'
                      }`}
                    >
                      <span>{label}</span>
                      <svg className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${mobileEventsMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {mobileEventsMenuOpen && (
                      <div className="flex flex-col gap-1 pl-4 mt-1 border-l-2 border-slate-100 ml-4">
                        {subPaths?.map((sub) => (
                           <button
                             key={sub.path}
                             onClick={() => go(sub.path)}
                             className="px-4 py-2 text-xs text-left rounded-lg transition-all duration-300 font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50/50"
                           >
                             {sub.label}
                           </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={path}
                  onClick={() => go(path)}
                  className={`px-4 py-2.5 text-xs text-left rounded-lg transition-all duration-300 font-medium ${
                    isActive 
                      ? 'bg-linear-to-r from-blue-100 to-blue-50 font-bold text-blue-700 border-l-4 border-blue-600'
                      : 'text-slate-700 hover:bg-blue-50/60 hover:text-blue-600 border-l-4 border-transparent'
                  }`}
                >
                  {label}
                </button>
              );
            })}
            
          </div>
        </div>
      </nav>
    </header>
  );
}
