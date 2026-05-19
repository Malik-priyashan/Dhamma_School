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
      <nav className="mx-auto max-w-7xl w-[calc(100%-1.5rem)] md:w-[calc(100%-2rem)] pointer-events-auto bg-white/95 backdrop-blur-md shadow-xl rounded-3xl md:rounded-full px-4 md:px-6 py-3">
        <div className="flex items-center justify-between px-1 md:px-3">
          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2 text-slate-700 bg-slate-100 rounded-full"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path></svg>
            </button>

            <button onClick={() => go("/")}
                    className="flex items-center gap-3 cursor-pointer" aria-label={t('home')}>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden flex-shrink-0 shadow bg-white p-1">
                <Image src="/Screenshot%20(801).png" alt="logo" width={44} height={44} />
              </div>
            </button>

            <ul className="hidden md:flex items-center text-sm text-slate-700 absolute left-1/2 transform -translate-x-1/2">
              {[
                { path: '/', label: t('home') },
                { path: '/student/prefect-board', label: t('prefect_board') || 'Prefect Board', studentOnly: true },
                { path: '/student/announcing', label: t('announcing') || 'Announcing', studentOnly: true },
                { path: '/student/gallery', label: t('gallery'), studentOnly: true },
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

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden sm:block">
              {isAuthenticated ? (
                <button
                  onClick={async () => {
                    try {
                      await logoutUser();
                    } catch (e) {
                      console.error("Backend logout failed:", e);
                    }
                    
                    // Clear all cookies
                    document.cookie.split(";").forEach((c) => {
                      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                    });
                    
                    localStorage.clear();
                    sessionStorage.clear();
                    setIsAuthenticated(false);
                    
                    // Hard refresh to login page preserving locale
                    window.location.href = `/${locale}/login`;
                  }}
                  className="bg-red-600 text-white px-4 md:px-5 py-1.5 rounded-full text-xs md:text-sm font-medium hover:bg-red-700 transition"
                >
                  {t('logout')}
                </button>
              ) : (
                <button
                  onClick={() => go('/login')}
                  className="bg-blue-600 text-white px-4 md:px-5 py-1.5 rounded-full text-xs md:text-sm font-medium hover:bg-blue-700 transition"
                >
                  {t('login')}
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-1 bg-black rounded-full p-0.5 shadow-md">
              <button
                onClick={() => changeLocale('en')}
                className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm transition ${locale === 'en' ? 'bg-white text-black' : 'text-white'}`}
                aria-pressed={locale === 'en'}
              >
                EN
              </button>

              <button
                onClick={() => changeLocale('si')}
                className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm transition ${locale === 'si' ? 'bg-white text-black' : 'text-white'}`}
                aria-pressed={locale === 'si'}
              >
                සි
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-96 mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 pb-2">
            {[
              { path: '/login', label: t('login'), authOnly: false, hideAuth: true },
              { path: '/', label: t('home'), authOnly: false, hideAuth: false },
              { path: '/student/prefect-board', label: t('prefect_board') || 'Prefect Board', studentOnly: true },
              { path: '/student/announcing', label: t('announcing') || 'Announcing', studentOnly: true },
              { path: '/student/gallery', label: t('gallery'), studentOnly: true },
            ]
            .filter(link => {
              if (link.studentOnly && userRole !== 'STUDENT') return false;
              if (link.hideAuth && isAuthenticated) return false;
              return true;
            })
            .map(({ path, label }) => {
              const base = path === '/' ? `/${locale}` : `/${locale}${path}`;
              const isActive = pathname === base || pathname?.startsWith(base + '/');

              return (
                <button
                  key={path}
                  onClick={() => go(path)}
                  className={`px-4 py-2 text-sm text-left rounded-lg transition-colors ${
                    isActive ? 'bg-slate-100 font-medium text-black' : 'text-slate-600 hover:bg-slate-50'
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
                className="px-4 py-2 mt-2 text-sm text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100 font-medium"
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
