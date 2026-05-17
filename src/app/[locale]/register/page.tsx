"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { registerUser } from "../../features/auth/api/authApi";

export default function RegisterPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      setLoading(true);
      // Backend might expect 'fullName', 'fullname', or 'name'. Sending both to be safe, 
      // or specifically 'fullName' if that's what the DTO uses for "Full Name".
      await registerUser({ name, fullName: name, email, role, password });
      setSuccess(true);
      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, role === 'TEACHER' ? 5000 : 2000);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 pt-24 pb-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-blue-600"></div>
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg bg-white p-1">
            <Image src="/Screenshot%20(801).png" alt="Logo" width={60} height={60} />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center text-slate-800 mb-2">{t('register_title')}</h1>
        <p className="text-center text-slate-500 mb-8 text-sm">{t('register_subtitle')}</p>
        
        {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}
        {success && (
          <div className="text-green-500 text-sm mb-4 text-center">
            {role === 'TEACHER' 
              ? "Registration successful! Your account is pending admin approval. Please wait for activation."
              : "Successfully registered! Redirecting to login..."}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('name')}</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white text-slate-900"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('email')}</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white text-slate-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('role')}</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white text-slate-900"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="STUDENT">{t('role_student')}</option>
              <option value="TEACHER">{t('role_teacher')}</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('password')}</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white text-slate-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('confirm_password')}</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white text-slate-900"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md hover:shadow-lg mt-4 disabled:opacity-50"
          >
            {loading ? "Registering..." : t('sign_up')}
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm text-slate-600">
          <span>{t('already_registered')} </span>
          <Link href={`/${locale}/login`} className="text-blue-600 font-semibold hover:text-blue-800 transition-colors">
            {t('sign_in')}
          </Link>
        </div>
      </div>
    </div>
  );
}