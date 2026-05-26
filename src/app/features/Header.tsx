"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { locales } from "../../config";
import { fetchCurrentUser, logoutUser } from "./auth/api/authApi";
import { getUserRole } from "../../lib/authUtils";
import TeacherSidebar from "./teacher/TeacherSidebar";
import AdminSidebar from "./admin/AdminSidebar";

export default function Header() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        const user = await fetchCurrentUser();
        if (isMounted) {
          setIsAuthenticated(true);
          if (user?.role || user?.Role) {
             setUserRole(user.role || user.Role);
          }
        }
      } catch {
        if (isMounted) {
          setIsAuthenticated(false);
          setUserRole(null);
        }
      }
    }

    syncAuth();

    return () => {
      isMounted = false;
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
      <nav className="mx-auto max-w-7xl w-[calc(100%-1.5rem)] md:w-[calc(100%-2rem)] pointer-events-auto bg-gradient-to-r from-white/95 via-blue-50/60 to-white/95 backdrop-blur-2xl backdrop-saturate-125 shadow-2xl shadow-blue-200/30 rounded-3xl md:rounded-full px-4 md:px-8 py-4 border border-white/30">
        <div className="flex items-center justify-between px-1 md:px-3">
          <div className="flex items-center gap-2 md:gap-6">
            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2.5 text-slate-700 bg-gradient-to-br from-blue-100 to-blue-50 hover:from-blue-200 hover:to-blue-100 rounded-full transition-all duration-300 shadow-sm hover:shadow-md"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path></svg>
            </button>

            <button onClick={() => go("/")}
                    className="flex items-center gap-3 cursor-pointer hover:opacity-95 transition-opacity transform-gpu hover:-translate-y-0.5 flex-shrink-0" aria-label={t('home')}>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden flex-shrink-0 shadow-lg bg-white border-2 border-slate-200/70 hover:shadow-2xl hover:shadow-blue-300/30 transition-all duration-300 ring-1 ring-white/60">
                <Image src="/logo/logo.jpeg" alt="logo" width={50} height={50} className="w-full h-full object-contain" />
              </div>
            </button>

            <ul className="hidden md:flex items-center text-sm font-medium absolute left-1/2 transform -translate-x-1/2 space-x-2">
              {[
                { path: '/', label: t('home') },
                { path: '/student/prefect-board', label: t('prefect_board') || 'Prefect Board', studentOnly: true },
                { path: '/student/announcing', label: t('announcing') || 'Announcing', studentOnly: true },
                { path: '/student/gallery', label: t('gallery'), studentOnly: true },
                { path: '/student/marks', label: t('marks') || 'Marks', studentOnly: true },
              ]
              .filter(link => !link.studentOnly || userRole === 'STUDENT')
              .map(({ path, label }) => {
                const base = path === '/' ? `/${locale}` : `/${locale}${path}`;
                const isActive = path === '/'
                  ? pathname === base
                  : (pathname === base || pathname?.startsWith(base + '/'));

                return (
                  <li key={path} className="mx-0.5">
                    <button
                      onClick={() => go(path)}
                      className={`relative px-3 py-2 rounded-full transition-all duration-300 flex items-center gap-2 ${
                        isActive 
                          ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 font-semibold shadow-md' 
                          : 'text-slate-700 hover:text-slate-900 hover:bg-white/40'
                      }`}
                    >
                      <span className="leading-none">{label}</span>
                      {isActive && (
                        <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full shadow-sm" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <div className="hidden sm:block">
              {isAuthenticated ? (
                <button
                  onClick={async () => {
                    try {
                      await logoutUser();
                    } catch (e) {
                      console.error("Backend logout failed:", e);
                    }
                    
                    try {
                      await fetch('/api/frontend-logout', { method: 'POST' });
                    } catch (e) {
                      console.error("Frontend cookie native clear failed:", e);
                    }
                    
                    // Clear all accessible JS cookies
                    document.cookie.split(";").forEach((c) => {
                      const name = c.replace(/^ +/, "").split("=")[0];
                      if (name) {
                        document.cookie = name + "=;expires=" + new Date(0).toUTCString() + ";path=/";
                        document.cookie = name + "=;expires=" + new Date(0).toUTCString() + ";path=/;domain=" + window.location.hostname;
                      }
                    });
                    
                    localStorage.clear();
                    sessionStorage.clear();
                    setIsAuthenticated(false);
                    
                    // Hard refresh to login page preserving locale
                    window.location.href = `/${locale}/login`;
                  }}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 md:px-5 py-1.5 rounded-full text-xs font-semibold hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-red-300/50 transition-all duration-300 hover:scale-105"
                >
                  {t('logout')}
                </button>
              ) : (
                <button
                  onClick={() => go('/login')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 md:px-5 py-1.5 rounded-full text-xs font-semibold hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-blue-400/50 transition-all duration-300 hover:scale-105"
                >
                  {t('login')}
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-1 bg-gradient-to-r from-slate-800 to-slate-900 rounded-full p-1 shadow-lg border-2 border-slate-600/60">
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
            .map(({ path, label }) => {
              const base = path === '/' ? `/${locale}` : `/${locale}${path}`;
              const isActive = path === '/'
                ? pathname === base
                : (pathname === base || pathname?.startsWith(base + '/'));

              return (
                <button
                  key={path}
                  onClick={() => go(path)}
                  className={`px-4 py-2.5 text-xs text-left rounded-lg transition-all duration-300 font-medium ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-100 to-blue-50 font-bold text-blue-700 border-l-4 border-blue-600' 
                      : 'text-slate-700 hover:bg-blue-50/60 hover:text-blue-600 border-l-4 border-transparent'
                  }`}
                >
                  {label}
                </button>
              );
            })}
            
            {isAuthenticated && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logoutUser().finally(() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    setIsAuthenticated(false);
                    window.location.href = `/${locale}/login`;
                  });
                }}
                className="px-4 py-2.5 mt-3 text-xs text-left text-white font-semibold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg transition-all border-l-4 border-red-700"
              >
                {t('logout')}
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
