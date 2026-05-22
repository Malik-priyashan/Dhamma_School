"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { fetchCurrentUser } from "../../features/auth/api/authApi";
import { getUserRole } from "../../../lib/authUtils";
import LoadingPage from "../../components/ui/LoadingPage";
import { promoteStudentGrades } from "../../features/students/api/studentsApi";

export default function AdminPage() {
  const router = useRouter();
  const locale = useLocale();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Grade promotion states
  const [showPromoteConfirm, setShowPromoteConfirm] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [promoteStatus, setPromoteStatus] = useState<{ success?: string; error?: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function syncAuth() {
      try {
        await fetchCurrentUser();
        const role = getUserRole();

        if (role !== 'ADMIN') {
          router.push(`/${locale}`);
          return;
        }

        if (isMounted) {
          setIsAuthenticated(true);
        }
      } catch {
        if (isMounted) {
          setIsAuthenticated(false);
          router.push(`/${locale}/login`);
        }
      }
    }

    syncAuth();

    return () => {
      isMounted = false;
    };
  }, [locale, router]);

  if (isAuthenticated === null) return <LoadingPage />;
  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-slate-50 flex-1 ml-0 md:ml-64 p-4 md:p-8 pt-20 md:pt-12">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900 border-b border-slate-200 pb-4">
          Admin Dashboard
        </h1>
        <p className="text-slate-600">
          Welcome to the Admin Dashboard.
        </p>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Promote Student Grades</h3>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                Promote all students by one grade level and automatically graduate (delete) Grade 11 students.
              </p>
            </div>
            <button
              onClick={() => setShowPromoteConfirm(true)}
              className="w-full mt-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl font-bold hover:from-red-600 hover:to-orange-600 transition-all active:scale-[0.98] shadow-md hover:shadow-lg"
            >
              Promote Grades
            </button>
          </div>
        </div>

        {/* Promote Grades Confirmation Modal */}
        {showPromoteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isPromoting && setShowPromoteConfirm(false)} />
            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-100">
              <div className="flex flex-col items-center text-center">
                {/* Warning Icon */}
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6">
                  <svg className="w-8 h-8 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                </div>

                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Promote Student Grades</h2>
                <p className="text-slate-500 font-medium text-sm mb-6 leading-relaxed">
                  You are about to promote all student grades by 1 level for the new school year. Please review the implications of this action:
                </p>

                {/* Warnings List */}
                <div className="w-full text-left space-y-3 bg-slate-50 rounded-2xl p-5 border border-slate-200/60 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 text-emerald-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                      All students in Grades 1 through 10 will be moved up by 1 level (e.g. Grade 10 to Grade 11).
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 text-red-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                      <strong className="text-red-600 font-extrabold">All students currently in Grade 11 will be permanently deleted</strong> from the database.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 text-amber-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                      </svg>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                      This action requires Admin credentials, is irreversible, and modifies the entire student directory.
                    </p>
                  </div>
                </div>

                {promoteStatus?.error && (
                  <div className="w-full bg-red-50 text-red-700 text-xs font-bold p-4 rounded-xl border border-red-200 text-left mb-6">
                    {promoteStatus.error}
                  </div>
                )}

                {promoteStatus?.success && (
                  <div className="w-full bg-emerald-50 text-emerald-700 text-xs font-bold p-4 rounded-xl border border-emerald-200 text-left mb-6">
                    {promoteStatus.success}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 w-full">
                  {promoteStatus?.success ? (
                    <button
                      onClick={() => {
                        setShowPromoteConfirm(false);
                        setPromoteStatus(null);
                      }}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all active:scale-[0.98]"
                    >
                      Done
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={async () => {
                          setIsPromoting(true);
                          setPromoteStatus(null);
                          try {
                            const res = await promoteStudentGrades();
                            setPromoteStatus({
                              success: `${res.message} ${res.graduatedCount} students graduated successfully.`,
                            });
                          } catch (err: any) {
                            setPromoteStatus({
                              error: err.message || "Failed to promote student grades.",
                            });
                          } finally {
                            setIsPromoting(false);
                          }
                        }}
                        disabled={isPromoting}
                        className="flex-1 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isPromoting ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Promoting...
                          </>
                        ) : (
                          "Yes, Promote Grades"
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowPromoteConfirm(false);
                          setPromoteStatus(null);
                        }}
                        disabled={isPromoting}
                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

