"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
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
      const token = res?.accessToken || res?.access_token || res?.token || res?.tokens?.access?.token;
      if (res?.user?.role) {
        document.cookie = `userRole=${res.user.role}; path=/;`;
        localStorage.setItem('userRole', res.user.role);
      }
      if (token) {
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
    <div className="min-h-screen flex flex-col md:flex-row bg-neutral-950 font-sans selection:bg-neutral-900 selection:text-white overflow-hidden">
      {/* Left side panel - Dark branding panel (desktop only) */}
      <motion.div 
        layoutId="auth-branding-panel"
        transition={{ type: "spring", stiffness: 90, damping: 18 }}
        className="hidden md:flex md:w-1/2 bg-black text-white p-16 flex-col justify-between relative overflow-hidden"
      >
        <Image
          src="/hero/Lord%20Buddha.jpg"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/65" />
        
        {/* Logo and title */}
        <motion.div 
          layoutId="auth-logo-row"
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
          className="flex items-center gap-3.5 z-10"
        >
          <div className="w-24 h-28 rounded-[12px] overflow-hidden bg-white/10 border border-white/30 p-1 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_10px_30px_rgba(255,255,255,0.08)] backdrop-blur-md">
            <Image src="/logo/logo.jpeg" alt="Logo" width={96} height={112} className="h-full w-full rounded-[8px] object-contain" />
          </div>
          <span className="max-w-xs text-sm font-semibold tracking-[0.18em] text-neutral-100 uppercase leading-relaxed">
            {t('school_name')}
          </span>
        </motion.div>

        <motion.div
          layoutId="auth-welcome-copy"
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
          className="my-auto z-10 mx-auto max-w-md text-center"
        >
          <h2 className="text-5xl font-semibold tracking-tight text-white leading-tight">
            {t('welcome_school')}
          </h2>
        </motion.div>

        {/* Center graphics and quote */}
        <motion.div 
          layoutId="auth-center-graphics"
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
          className="hidden"
        >
          <div className="relative flex items-center justify-center py-10">
            {/* Spinning Dharmachakra Wheel */}
            <motion.svg 
              layoutId="auth-wheel"
              transition={{ type: "spring", stiffness: 90, damping: 18 }}
              animate={{ rotate: 360 }}
              className="w-64 h-64 text-neutral-800/20" 
              viewBox="0 0 100 100" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.2"
            >
              <circle cx="50" cy="50" r="42" strokeDasharray="3 3" />
              <circle cx="50" cy="50" r="38" />
              <circle cx="50" cy="50" r="10" />
              <circle cx="50" cy="50" r="4" />
              {/* 8 Spokes */}
              <line x1="50" y1="12" x2="50" y2="40" />
              <line x1="50" y1="60" x2="50" y2="88" />
              <line x1="12" y1="50" x2="40" y2="50" />
              <line x1="60" y1="50" x2="88" y2="50" />
              <line x1="23.2" y1="23.2" x2="42.9" y2="42.9" />
              <line x1="57.1" y1="57.1" x2="76.8" y2="76.8" />
              <line x1="76.8" y1="23.2" x2="57.1" y2="42.9" />
              <line x1="42.9" y1="57.1" x2="23.2" y2="76.8" />
            </motion.svg>
          </div>

          <motion.div
            layoutId="auth-quote-text"
            transition={{ type: "spring", stiffness: 90, damping: 18 }}
            className="space-y-4"
          >
            <h2 className="text-3xl font-light tracking-tight text-white leading-relaxed">
              &quot;နတ္ထိ သန္တိပရံ သုခံ&quot;
              <span className="text-neutral-400 font-light text-xl mt-3 block tracking-wide">
                There is no happiness higher than peace.
              </span>
            </h2>
            <p className="text-sm text-neutral-500 font-light tracking-wide leading-relaxed">
              Welcome to the portal. Enter your credentials to access your dashboard and continue your journey in learning and discipline.
            </p>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          layoutId="auth-footer"
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
          className="hidden"
        >
          © {new Date().getFullYear()} DHAMMA SCHOOL. ALL RIGHTS RESERVED.
        </motion.div>
      </motion.div>

      {/* Right side panel - Light login container (takes full space on mobile) */}
      <motion.div 
        layoutId="auth-form-card-container"
        transition={{ type: "spring", stiffness: 90, damping: 18 }}
        className="w-full md:w-1/2 bg-neutral-50 flex items-center justify-center p-6 md:p-12 relative min-h-screen md:min-h-0"
      >
        {/* Language switch button at top right */}
        <motion.div 
          layoutId="auth-lang-pill"
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
          className="absolute top-6 right-6 flex items-center gap-1 bg-white rounded-full p-1 border border-neutral-200/80 shadow-sm z-20"
        >
          <button
            onClick={() => changeLocale('en')}
            className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 cursor-pointer ${locale === 'en' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
            aria-pressed={locale === 'en'}
          >
            EN
          </button>
          <button
            onClick={() => changeLocale('si')}
            className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 cursor-pointer ${locale === 'si' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
            aria-pressed={locale === 'si'}
          >
            සි
          </button>
        </motion.div>

        {/* Login form card */}
        <motion.div
          layoutId="auth-form-card"
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
          className="w-full max-w-lg bg-white border border-neutral-200/80 rounded-3xl p-9 md:p-12 shadow-xl relative"
        >
          {/* Logo visible only on mobile/stacked layouts */}
          <div className="md:hidden flex justify-center mb-6">
            <div className="w-24 h-28 rounded-[12px] overflow-hidden bg-white/50 border border-white/70 p-1 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur-md">
              <Image src="/logo/logo.jpeg" alt="Logo" width={96} height={112} className="h-full w-full rounded-[8px] object-contain" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-950 mb-2">
              {t('login_title')}
            </h1>
            <p className="text-neutral-500 text-sm font-light">
              {t('login_subtitle')}
            </p>
          </div>

          {/* Messages: Error */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 text-sm"
              >
                {error.includes('inactive') ? (
                  <div className="bg-neutral-50 border border-neutral-200 text-neutral-800 p-5 rounded-2xl text-center shadow-inner">
                    <div className="flex flex-col items-center gap-2.5">
                      <div className="w-9 h-9 bg-neutral-900 rounded-full flex items-center justify-center mb-1">
                        <svg className="w-4 h-4 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-neutral-900 text-sm">Account Pending Approval</h3>
                      <p className="text-xs text-neutral-500 leading-relaxed max-w-xs">
                        Your teacher account has been registered successfully but is currently waiting for administrator approval. 
                        Please check back later or contact the administration.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-neutral-50 border border-neutral-200 text-neutral-800 px-4 py-3.5 rounded-xl flex items-center gap-3">
                    <div className="w-5 h-5 bg-neutral-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <span className="text-xs text-neutral-600 font-medium leading-tight">{error}</span>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                {t('email')}
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white text-sm text-neutral-900 placeholder-neutral-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                {t('password')}
              </label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white text-sm text-neutral-900 placeholder-neutral-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || success}
              className="w-full bg-neutral-950 hover:bg-black text-white font-semibold text-sm py-3 px-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow active:scale-[0.985] mt-8 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {success ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Successfully logged in! Returning to home...</span>
                </>
              ) : loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                t('sign_in')
              )}
            </motion.button>
          </form>

          {/* Register Link */}
          <div className="mt-8 text-center text-xs text-neutral-500 font-light">
            <span>{t('not_registered')}{" "}</span>
            <Link href={`/${locale}/register`} className="text-neutral-900 font-semibold underline underline-offset-4 hover:text-black transition-colors">
              {t('register')}
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
