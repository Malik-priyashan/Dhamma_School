"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { loginUser } from "../../features/auth/api/authApi";
import { locales } from "../../../config";

export default function LoginPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function changeLocale(next: string) {
    try {
      const path = pathname || '/';
      const parts = path.split('/');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    try {
      setLoading(true);
      const res = await loginUser({ email, password }) as any;
      console.log("Login response:", res);

      // Attempt to save token to cookies if backend sends it in JSON
      const token = res?.accessToken || res?.access_token || res?.token || res?.tokens?.access?.token;        if (res?.user?.role) {
          document.cookie = `userRole=${res.user.role}; path=/;`;
          localStorage.setItem('userRole', res.user.role);
        }      if (token) {
        document.cookie = `accessToken=${token}; path=/;`;
        document.cookie = `auth_token=true; path=/;`; // for other components
      } else {
        // Fallback marker for frontend if HttpOnly is used
        document.cookie = `auth_token=true; path=/;`;
      }
      
      setSuccess(true);
      setTimeout(() => {
        router.push(`/${locale}`);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 pt-24 pb-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 relative overflow-hidden mt-12">
        <div className="absolute top-4 right-4 flex items-center gap-1 bg-black rounded-full p-0.5 shadow-md">
          <button
            onClick={() => changeLocale('en')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${locale === 'en' ? 'bg-white text-black' : 'text-white hover:text-gray-200'}`}
            aria-pressed={locale === 'en'}
          >
            EN
          </button>
          <button
            onClick={() => changeLocale('si')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${locale === 'si' ? 'bg-white text-black' : 'text-white hover:text-gray-200'}`}
            aria-pressed={locale === 'si'}
          >
            සි
          </button>
        </div>
        <div className="absolute top-0 left-0 right-0 h-2 bg-blue-600"></div>
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg bg-white p-1">
            <Image src="/Screenshot%20(801).png" alt="Logo" width={60} height={60} />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center text-slate-800 mb-2">{t('login_title')}</h1>
        <p className="text-center text-slate-500 mb-8 text-sm">{t('login_subtitle')}</p>

        {error && (
          <div className={`${error.includes('inactive') ? 'bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl' : 'text-red-500 text-sm'} mb-6 text-center animate-in fade-in slide-in-from-top-2 duration-300`}>
            {error.includes('inactive') ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mb-1">
                  <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-base">Account Pending Approval</h3>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Your teacher account has been registered successfully but is currently waiting for administrator approval. 
                  Please check back later or contact the administration.
                </p>
              </div>
            ) : (
              error
            )}
          </div>
        )}
        {success && <div className="text-green-500 text-sm mb-4 text-center">Successfully logged in! Returning to home...</div>}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('email')}</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('password')}</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md hover:shadow-lg mt-4 disabled:opacity-50"
          >
            {loading ? "Signing in..." : t('sign_in')}
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm text-slate-600">
          <span>{t('not_registered')} </span>
          <Link href={`/${locale}/register`} className="text-blue-600 font-semibold hover:text-blue-800 transition-colors">
            {t('register')}
          </Link>
        </div>
      </div>
    </div>
  );
}