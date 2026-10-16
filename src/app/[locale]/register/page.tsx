"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { registerUser, sendRegistrationCode, verifyRegistrationCode } from "../../features/auth/api/authApi";
import { locales } from "../../../config";

export default function RegisterPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [verificationToken, setVerificationToken] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const codeInputs = useRef<Array<HTMLInputElement | null>>([]);
  const passwordChecks = [
    { label: t("password_rule_length"), passed: password.length >= 8 },
    { label: t("password_rule_uppercase"), passed: /[A-Z]/.test(password) },
    { label: t("password_rule_lowercase"), passed: /[a-z]/.test(password) },
    { label: t("password_rule_number"), passed: /[0-9]/.test(password) },
    { label: t("password_rule_symbol"), passed: /[^A-Za-z0-9\s]/.test(password) },
  ];
  const passwordStrength = passwordChecks.filter(check => check.passed).length;
  const isPasswordStrong = passwordStrength === passwordChecks.length;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendSeconds(resendSeconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  const sendCode = async () => {
    setError("");
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t("verification_invalid_email"));
      return;
    }
    try {
      setSendingCode(true);
      await sendRegistrationCode(email.trim().toLowerCase());
      setCodeSent(true);
      setCode(Array(6).fill(""));
      setVerificationToken("");
      setResendSeconds(60);
      window.setTimeout(() => codeInputs.current[0]?.focus(), 50);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("verification_send_failed"));
    } finally {
      setSendingCode(false);
    }
  };

  const updateCode = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) {
      setCode(current => current.map((digit, i) => i === index ? "" : digit));
      return;
    }
    const next = [...code];
    digits.slice(0, 6 - index).split("").forEach((digit, offset) => { next[index + offset] = digit; });
    setCode(next);
    codeInputs.current[Math.min(index + digits.length, 5)]?.focus();
  };

  const confirmCode = async () => {
    if (code.some(digit => !digit)) {
      setError(t("verification_incomplete"));
      return;
    }
    setError("");
    try {
      setVerifyingCode(true);
      const result = await verifyRegistrationCode(email.trim().toLowerCase(), code.join(""));
      setVerificationToken(result.verificationToken);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("verification_failed"));
    } finally {
      setVerifyingCode(false);
    }
  };

  function changeLocale(next: string) {
    try {
      const path = pathname || "/";
      const parts = path.split("/");
      if (parts[1] && (locales as readonly string[]).includes(parts[1])) {
        parts[1] = next;
      } else {
        parts.splice(1, 0, next);
      }
      router.push(parts.join("/") || `/${next}`);
    } catch {
      router.push(`/${next}`);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!isPasswordStrong) {
      setError(t("password_requirements_error"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("passwords_do_not_match"));
      return;
    }

    if (!verificationToken) {
      setError(t("verification_required"));
      return;
    }

    try {
      setLoading(true);
      await registerUser({ name, fullName: name, email: email.trim().toLowerCase(), role, password, verificationToken });
      setSuccess(true);
      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, role === 'TEACHER' ? 5000 : 2000);
    } catch (err: any) {
      setError(err.message || t("registration_failed"));
      if (String(err.message || "").includes("Confirm your email")) {
        setVerificationToken("");
        setCodeSent(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row-reverse bg-neutral-950 font-sans selection:bg-neutral-900 selection:text-white">
      {/* Right side panel - Dark branding panel (desktop only, displays on right due to flex-row-reverse) */}
      <motion.div 
        layoutId="auth-branding-panel"
        transition={{ type: "spring", stiffness: 90, damping: 18 }}
        className="hidden lg:flex lg:w-1/2 bg-black text-white p-10 xl:p-16 flex-col justify-between relative overflow-hidden"
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

      {/* Left side panel - Light register container (takes full space on mobile, displays on left due to flex-row-reverse) */}
      <motion.div 
        layoutId="auth-form-card-container"
        transition={{ type: "spring", stiffness: 90, damping: 18 }}
        className="w-full min-w-0 lg:w-1/2 bg-neutral-50 flex items-center justify-center px-3 pb-6 pt-20 sm:px-6 lg:p-8 xl:p-12 relative min-h-screen"
      >
        {/* Language switch button at top right */}
        {/* Note: Kept as static switcher layout matching the login component */}
        <motion.div 
          layoutId="auth-lang-pill"
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-1 bg-white rounded-full p-1 border border-neutral-200/80 shadow-sm z-20"
        >
          <button
            onClick={() => changeLocale("en")}
            className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 cursor-pointer ${locale === "en" ? "bg-neutral-900 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-900"}`}
            aria-pressed={locale === "en"}
          >
            EN
          </button>
          <button
            onClick={() => changeLocale("si")}
            className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 cursor-pointer ${locale === "si" ? "bg-neutral-900 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-900"}`}
            aria-pressed={locale === "si"}
          >
            සි
          </button>
        </motion.div>

        {/* Register form card */}
        <motion.div
          layoutId="auth-form-card"
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
          className="w-full min-w-0 max-w-md bg-white border border-neutral-200/80 rounded-2xl sm:rounded-3xl p-5 sm:p-8 xl:p-10 shadow-xl relative my-4"
        >
          {/* Logo visible only on mobile/stacked layouts */}
          <div className="lg:hidden flex justify-center mb-6">
            <div className="w-24 h-28 rounded-[12px] overflow-hidden bg-white/50 border border-white/70 p-1 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur-md">
              <Image src="/logo/logo.jpeg" alt="Logo" width={96} height={112} className="h-full w-full rounded-[8px] object-contain" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-950 mb-2">
              {t('register_title')}
            </h1>
            <p className="text-neutral-500 text-sm font-light">
              {t('register_subtitle')}
            </p>
          </div>

          {/* Messages: Success & Error */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 text-sm"
                role="alert"
              >
                <div className="bg-neutral-50 border border-neutral-200 text-neutral-800 px-4 py-3.5 rounded-xl flex items-center gap-3">
                  <div className="w-5 h-5 bg-neutral-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <span className="text-xs text-neutral-600 font-medium leading-tight">{error}</span>
                </div>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-neutral-900 border border-neutral-800 text-white p-5 rounded-2xl text-center mb-6 shadow-sm"
              >
                <div className="flex flex-col items-center gap-2.5">
                  <div className="w-9 h-9 bg-neutral-800 rounded-full flex items-center justify-center mb-1">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white text-sm">{t("registration_successful")}</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed max-w-xs">
                    {role === 'TEACHER' 
                      ? t("teacher_registration_pending")
                      : t("registration_redirecting")}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                {t('name')}
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white text-sm text-neutral-900 placeholder-neutral-400"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                {t('email')}
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white text-sm text-neutral-900 placeholder-neutral-400"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setCodeSent(false);
                  setCode(Array(6).fill(""));
                  setVerificationToken("");
                  setResendSeconds(0);
                }}
                placeholder="you@example.com"
              />
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{t("verification_title")}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{t("verification_description")}</p>
                </div>
                {verificationToken && (
                  <span role="status" className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">✓ {t("verification_confirmed")}</span>
                )}
                {!verificationToken && (
                  <button type="button" onClick={sendCode} disabled={sendingCode || resendSeconds > 0}
                    className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50">
                    {sendingCode ? t("verification_sending") : resendSeconds > 0 ? `${t("verification_resend")} (${resendSeconds}s)` : codeSent ? t("verification_resend") : t("verification_send")}
                  </button>
                )}
              </div>
              {codeSent && !verificationToken && (
                <div className="mt-5 border-t border-neutral-200 pt-4">
                  <p className="mb-3 text-xs text-neutral-600">{t("verification_enter_code")}</p>
                  <div className="flex items-center gap-2 sm:gap-3" role="group" aria-label={t("verification_enter_code")}>
                    {code.map((digit, index) => (
                      <input key={index} ref={element => { codeInputs.current[index] = element; }}
                        type="text" inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"}
                        aria-label={`${t("verification_digit")} ${index + 1}`}
                        value={digit} onChange={event => updateCode(index, event.target.value)}
                        onKeyDown={event => {
                          if (event.key === "Backspace" && !digit && index > 0) codeInputs.current[index - 1]?.focus();
                          if (event.key === "ArrowLeft" && index > 0) codeInputs.current[index - 1]?.focus();
                          if (event.key === "ArrowRight" && index < 5) codeInputs.current[index + 1]?.focus();
                        }}
                        onPaste={event => {
                          const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                          if (!pasted) return;
                          event.preventDefault();
                          const next = Array(6).fill("");
                          pasted.split("").forEach((number, offset) => { next[offset] = number; });
                          setCode(next);
                          codeInputs.current[Math.min(pasted.length, 5)]?.focus();
                        }}
                        className="h-12 w-10 min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white text-center text-xl font-semibold text-neutral-900 shadow-sm outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 sm:max-w-12" />
                    ))}
                  </div>
                  <button type="button" onClick={confirmCode} disabled={verifyingCode || code.some(digit => !digit)}
                    className="mt-4 rounded-xl border border-neutral-900 bg-white px-5 py-2 text-xs font-semibold text-neutral-900 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40">
                    {verifyingCode ? t("verification_checking") : t("verification_confirm")}
                  </button>
                </div>
              )}
            </div>

            {/* Role Select */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                {t('role')}
              </label>
              <div className="relative">
                <select
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white text-sm text-neutral-900 appearance-none cursor-pointer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="STUDENT">{t('role_student')}</option>
                  <option value="TEACHER">{t('role_teacher')}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                {t('password')}
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                aria-describedby="password-strength-label password-requirements"
                aria-invalid={password.length > 0 && !isPasswordStrong}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white text-sm text-neutral-900 placeholder-neutral-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <div className="pt-2.5">
                <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                  <span id="password-strength-label" className="font-semibold text-neutral-600">{t("password_strength_label")}</span>
                  {password && (
                    <span className={`font-semibold ${isPasswordStrong ? "text-emerald-700" : "text-rose-600"}`} role="status">
                      {isPasswordStrong ? t("password_strength_strong") : t("password_strength_weak")}
                    </span>
                  )}
                </div>
                <div role="progressbar" aria-label={t("password_strength_label")} aria-valuemin={0} aria-valuemax={passwordChecks.length} aria-valuenow={passwordStrength}
                  className="h-2.5 overflow-hidden rounded-full bg-neutral-100 ring-1 ring-inset ring-neutral-200">
                  <div className={`h-full rounded-full transition-[width,background-color] duration-300 ${isPasswordStrong ? "bg-emerald-500" : "bg-rose-500"}`}
                    style={{ width: `${(passwordStrength / passwordChecks.length) * 100}%` }} />
                </div>
                <ul id="password-requirements" className="mt-3 grid grid-cols-1 gap-x-3 gap-y-1.5 text-[11px] sm:grid-cols-2">
                  {passwordChecks.map(check => (
                    <li key={check.label} className={`flex items-center gap-1.5 ${check.passed ? "text-emerald-700" : "text-neutral-500"}`}>
                      <span aria-hidden="true" className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${check.passed ? "bg-emerald-100" : "bg-neutral-100"}`}>
                        {check.passed ? "✓" : "·"}
                      </span>
                      {check.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                {t('confirm_password')}
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white text-sm text-neutral-900 placeholder-neutral-400"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
              {confirmPassword && (
                <p role="status" className={`pt-1 text-xs font-medium ${passwordsMatch ? "text-emerald-700" : "text-rose-600"}`}>
                  {passwordsMatch ? t("passwords_match") : t("passwords_do_not_match")}
                </p>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !verificationToken || !isPasswordStrong || !passwordsMatch}
              className="w-full bg-neutral-950 hover:bg-black text-white font-semibold text-sm py-3 px-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow active:scale-[0.985] mt-6 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{t("registering")}</span>
                </>
              ) : (
                t('sign_up')
              )}
            </motion.button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-xs text-neutral-500 font-light">
            <span>{t('already_registered')}{" "}</span>
            <Link href={`/${locale}/login`} className="text-neutral-900 font-semibold underline underline-offset-4 hover:text-black transition-colors">
              {t('sign_in')}
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
