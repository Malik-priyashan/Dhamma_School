"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { clearClientAuthState, logoutUser } from "../auth/api/authApi";

interface AdminSidebarProps {
  setIsAuthenticated: (val: boolean) => void;
}

const navGroups = [
  { label: 'Overview', links: [
    { path: '/admin', label: 'Dashboard', icon: 'M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z' },
    { path: '/admin/messages', label: 'Messages', icon: 'M4 5h16v12H8l-4 3V5z' },
  ] },
  { label: 'People', links: [
    { path: '/admin/students', label: 'Students', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
    { path: '/admin/student-requests', label: 'Student Requests', icon: 'M8 3h8l5 5v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4zM8 13h8M8 17h5M16 3v5h5' },
    { path: '/admin/teachers', label: 'Teachers', icon: 'M12 3 2 8l10 5 10-5-10-5zM5 11v5c0 2 3 4 7 4s7-2 7-4v-5' },
  ] },
  { label: 'Administration', links: [
    { path: '/admin/registration-payment', label: 'Registration Payment', icon: 'M3 6h18v12H3zM3 10h18M7 15h4' },
    { path: '/admin/student-marks', label: 'Student Marks', icon: 'M4 20V4h16v16H4zM8 15l3-3 2 2 3-4' },
    { path: '/admin/prefects', label: 'Prefect Board', icon: 'm12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3z' },
    { path: '/admin/announcing', label: 'Announcing', icon: 'M3 10v4h4l10 5V5L7 10H3zM7 14l2 6h3M20 9a4 4 0 0 1 0 6' },
  ] },
  { label: 'Content', links: [
    { path: '/admin/events', label: 'Events', icon: 'M4 5h16v16H4zM8 3v4M16 3v4M4 10h16' },
    { path: '/admin/news', label: 'News', icon: 'M4 4h16v16H4zM8 8h8M8 12h8M8 16h5' },
  ] },
];

export default function AdminSidebar({ setIsAuthenticated }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'en';
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  function go(path: string) {
    setIsOpen(false);
    router.push(`/${locale}${path}`);
  }

  const logout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await logoutUser();
    } catch (e) {
      console.error("Backend logout failed:", e);
    }

    try {
      await fetch('/api/frontend-logout', {
        method: 'POST',
        cache: 'no-store',
      });
    } catch (e) {
      console.error("Frontend cookie native clear failed:", e);
    }
    
    clearClientAuthState();
    setIsAuthenticated(false);
    
    // Hard refresh to login page
    window.location.replace(`/${locale}/login`);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} aria-label="Open admin menu"
        className="fixed left-4 top-4 z-40 rounded-xl border border-slate-200 bg-white p-3 text-slate-800 shadow-md md:hidden">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>
      {isOpen && <button aria-label="Close admin menu" onClick={() => setIsOpen(false)} className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-hidden border-r border-slate-300 bg-slate-100 text-slate-700 shadow-xl shadow-slate-900/5 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="relative border-b border-slate-200 bg-slate-50 px-5 pb-5 pt-6">
          <button onClick={() => setIsOpen(false)} aria-label="Close admin menu" className="absolute right-4 top-5 rounded-lg p-1 text-slate-500 hover:bg-slate-100 md:hidden">✕</button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
              <Image src="/logo/logo.jpeg" alt="Dhamma School" width={40} height={40} className="rounded-xl object-cover" />
            </div>
            <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">Dhamma School</p><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Admin workspace</p></div>
          </div>
        </div>

        <nav aria-label="Admin navigation" className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-5">
          {navGroups.map(({ label, links }) => <div key={label}>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
            <div className="space-y-1">{links.map(({ path, label: linkLabel, icon }) => {
              const base = `/${locale}${path}`;
              const isActive = pathname === base || (path !== '/admin' && pathname?.startsWith(base + '/'));
              return <button key={path} type="button" onClick={() => go(path)} aria-current={isActive ? 'page' : undefined}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isActive ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'}`}>
                <svg aria-hidden="true" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24"><path d={icon} /></svg>
                <span className="min-w-0 flex-1 truncate">{linkLabel}</span>{isActive && <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
              </button>;
            })}</div>
          </div>)}
        </nav>

        <div className="border-t border-slate-300 bg-slate-200/60 p-4">
          <p className="mb-3 flex items-center gap-2 px-2 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-blue-600" /> Administrator session</p>
          <button onClick={logout} type="button" disabled={isLoggingOut} aria-busy={isLoggingOut}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60">
            <span>{isLoggingOut ? 'Logging out…' : 'Log out'}</span><span aria-hidden="true">↗</span>
          </button>
        </div>
      </aside>
    </>
  );
}
