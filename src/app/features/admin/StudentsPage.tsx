"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { fetchCurrentUser } from "../auth/api/authApi";
import { getUserRole } from "../../../lib/authUtils";
import { useStudents } from "../students/hooks/useStudents";
import StudentCard from "../students/components/StudentCard";
import { StudentDTO } from "../studentform/types/types";
import LoadingPage from "../../components/ui/LoadingPage";
import { promoteStudentGrades } from "../students/api/studentsApi";


export default function StudentsPage() {
  const router = useRouter();
  const locale = useLocale();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  // Selection states
  const [filterGrade, setFilterGrade] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedName, setDebouncedName] = useState("");

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

  // Debounce search term - reduced to 300ms for snappier feel
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedName(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const { data, loading, error, refetch } = useStudents(!!isAuthenticated && !!filterGrade, filterGrade, debouncedName);
  const [selectedStudent, setSelectedStudent] = useState<StudentDTO | null>(null);

  if (isAuthenticated === null) return <LoadingPage />;
  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-slate-50 flex-1 ml-0 md:ml-64 p-4 md:p-8 pt-20 md:pt-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header with Stats & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-500">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Student Directory</h1>
                <p className="text-slate-500 mt-1 font-medium">Manage and view all registered students</p>
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setShowPromoteConfirm(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl font-bold hover:from-red-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg active:scale-95 border border-transparent"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                    Promote Grades
                </button>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-700 rounded-2xl font-bold hover:bg-slate-100 transition-all border border-slate-200 active:scale-95"
                >
                    <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Refresh
                </button>
            </div>
        </div>

        {/* Integrated Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-200 sticky top-4 z-20 backdrop-blur-md bg-white/90">
            <div className="md:col-span-4 relative group">
                <label className="absolute left-4 -top-2.5 px-2 bg-white text-[10px] font-bold text-blue-600 uppercase tracking-widest z-10">Select Grade</label>
                <div className="relative">
                    <select
                        value={filterGrade}
                        onChange={(e) => setFilterGrade(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-slate-700 font-bold appearance-none cursor-pointer group-hover:bg-white"
                    >
                        <option value="">All Grades (Select one)</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((grade) => (
                            <option key={grade} value={grade.toString()}>Grade {grade}</option>
                        ))}
                    </select>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                        </svg>
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </div>
                </div>
            </div>

            <div className="md:col-span-8 relative group">
                <label className="absolute left-4 -top-2.5 px-2 bg-white text-[10px] font-bold text-slate-400 uppercase tracking-widest z-10">Search Student</label>
                <div className="relative">
                    <input
                        type="text"
                        disabled={!filterGrade}
                        placeholder={filterGrade ? "Search by name or initials..." : "Select a grade first to search"}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-12 pr-4 py-4 border rounded-2xl transition-all outline-none font-medium ${
                            !filterGrade 
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                            : 'bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-700 group-hover:bg-white'
                        }`}
                    />
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${filterGrade ? 'text-blue-500' : 'text-slate-300'}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                </div>
            </div>
        </div>

        {/* Content Area */}
        <div className="relative min-h-[500px]">
            {!filterGrade ? (
                /* Empty State / Prompt to select grade */
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 text-blue-500">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">No Grade Selected</h3>
                    <p className="text-slate-500 max-w-sm text-center font-medium">Please select a grade from the dropdown above to view and search for students.</p>
                </div>
            ) : (
                /* Results Table */
                <>
                    {loading && data.length === 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="h-48 bg-white rounded-3xl border border-slate-100 shadow-sm"></div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 p-8 rounded-3xl text-red-700 flex items-start gap-4 animate-in slide-in-from-top-4">
                            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Error Loading Students</h3>
                                <p className="opacity-90">{error.message}</p>
                            </div>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="bg-white p-20 rounded-[2rem] border border-slate-200 text-center animate-in zoom-in-95">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-1">No Results Found</h3>
                            <p className="text-slate-500 font-medium">We couldn&apos;t find any students in Grade {filterGrade} matching &quot;{searchTerm}&quot;.</p>
                        </div>
                    ) : (
                        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300 ${loading ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                            {data.map((student) => (
                                <div 
                                    key={student.id} 
                                    className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300 p-6 flex flex-col justify-between animate-in fade-in slide-in-from-bottom-4"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                {student.studentImage ? (
                                                    <img
                                                        src={typeof student.studentImage === 'string' ? student.studentImage : undefined}
                                                        alt={student.fullNameWithSurname || ''}
                                                        className="w-16 h-16 rounded-2xl object-cover ring-4 ring-slate-50 border border-slate-100"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 border border-slate-200">
                                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                                        </svg>
                                                    </div>
                                                )}
                                                <div className="absolute -right-2 -bottom-2 bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg border-2 border-white">
                                                    G{student.grade}
                                                </div>
                                            </div>
                                            <div className="overflow-hidden">
                                                <h4 className="font-bold text-slate-900 truncate leading-tight">{student.fullNameWithSurname || 'N/A'}</h4>
                                                <p className="text-slate-500 text-xs font-medium mt-1 truncate">{student.nameWithInitials || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5 mb-6">
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                                            </svg>
                                            <span className="text-xs font-bold">{student.phone1 || 'No Phone'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                            </svg>
                                            <span className="text-xs font-bold">{student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setSelectedStudent(student)}
                                        className="w-full py-3 bg-blue-50 text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all active:scale-[0.98] border border-blue-100 hover:border-blue-600 shadow-sm"
                                    >
                                        View Profile
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>

        {selectedStudent && (
          <StudentCard
            student={selectedStudent}
            onClose={() => setSelectedStudent(null)}
            onUpdate={() => {
                refetch();
                setSelectedStudent(null);
            }}
          />
        )}

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
                        refetch();
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

