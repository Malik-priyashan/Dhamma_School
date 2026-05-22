"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { logoutUser } from "../auth/api/authApi";

interface TeacherSidebarProps {
  setIsAuthenticated: (val: boolean) => void;
}

export default function TeacherSidebar({ setIsAuthenticated }: TeacherSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  function go(path: string) {
    setIsOpen(false);
    // English only navigation for teacher logic
    router.push(`/en${path}`);
  }

  const logout = async () => {
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
    
    // Hard refresh to login page
    window.location.href = '/en/login';
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/student-marks', label: 'Student Marks' }
  ];

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md text-slate-800"
        aria-label="Open Sidebar"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
      </button>

      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <aside className={`fixed top-0 left-0 h-screen w-64 bg-white/95 backdrop-blur-md shadow-2xl flex flex-col z-50 pointer-events-auto border-r border-slate-200 transform transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col items-center justify-center p-6 border-b border-slate-100 bg-white relative">
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          <div className="w-20 h-20 rounded-full overflow-hidden shadow-sm bg-white p-2 mb-4 border border-slate-100">
            <Image src="/logo/logo.jpeg" alt="logo" width={64} height={64} />
          </div>
          <h2 className="font-bold text-lg text-slate-800">Teacher Portal</h2>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-3 bg-slate-50/50">
          {navLinks.map(({ path, label }) => {
            const base = `/en${path}`;
            const isActive = pathname === base || pathname?.startsWith(base + '/');

            return (
              <button
                key={path}
                onClick={() => go(path)}
                className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-medium' 
                    : 'text-slate-600 hover:bg-white hover:shadow-sm hover:text-slate-900 border border-transparent hover:border-slate-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </nav>

        <div className="p-5 border-t border-slate-100 bg-white space-y-4">
          <button
            onClick={logout}
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-medium hover:bg-slate-100 hover:text-red-600 transition duration-200"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
