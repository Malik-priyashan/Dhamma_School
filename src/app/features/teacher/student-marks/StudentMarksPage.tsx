"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { fetchCurrentUser } from "../../auth/api/authApi";
import { getUserRole } from "../../../../lib/authUtils";
import { useStudents } from "../../students/hooks/useStudents";
import LoadingPage from "../../../components/ui/LoadingPage";
import StudentMarkCard from "./components/StudentMarkCard";
import { fetchMarksByStudentAndYear } from "./api/marksApi";

export default function StudentMarksPage() {
  const router = useRouter();
  const locale = useLocale();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [teacherName, setTeacherName] = useState<string>("Loading...");
  
  // Info state
  const [academicYear, setAcademicYear] = useState<string>(new Date().getFullYear().toString());
  const [isInfoSaved, setIsInfoSaved] = useState<boolean>(false);
  
  // Selection states
  const [filterGrade, setFilterGrade] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedName, setDebouncedName] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function syncAuth() {
      try {
        const user = await fetchCurrentUser();
        const role = getUserRole();

        if (role !== 'TEACHER') {
          router.push(`/${locale}`);
          return;
        }

        if (isMounted) {
          setIsAuthenticated(true);
          const name = user?.name || user?.fullName || (user?.firstName ? `${user.firstName} ${user.lastName || ''}` : "Teacher");
          setTeacherName(name.trim() || "Teacher");
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

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedName(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

    const { data, loading, error, refetch } = useStudents(!!isAuthenticated && !!filterGrade, filterGrade, debouncedName);
    const [anyMarksFound, setAnyMarksFound] = useState<boolean | null>(null);

    // Check whether any marks exist for the returned students in the selected academic year
    useEffect(() => {
        let active = true;
        async function checkAnyMarks() {
            if (!academicYear || loading) return;
            if (!data || data.length === 0) {
                if (active) setAnyMarksFound(null);
                return;
            }

            // Reset to null while checking
            if (active) setAnyMarksFound(null);

            for (const student of data) {
                try {
                    if (!student.id) continue;

                    const mark = await fetchMarksByStudentAndYear(student.id, academicYear);
                    if (!active) return;
                    if (mark) {
                        if (active) setAnyMarksFound(true);
                        return;
                    }
                } catch (err) {
                    console.error(err);
                }
            }

            if (active) setAnyMarksFound(false);
        }

        checkAnyMarks();
        return () => { active = false; };
    }, [data, academicYear, loading]);

  if (isAuthenticated === null) return <LoadingPage />;
  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-slate-50 flex-1 ml-0 md:ml-64 p-4 md:p-8 pt-20 md:pt-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header with Stats & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-500">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Student Marks</h1>
                <p className="text-slate-500 mt-1 font-medium">Select a grade and view students to manage marks.</p>
            </div>
            <div className="flex items-center gap-3">
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

        {/* Teacher Info */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-slate-500 font-medium whitespace-nowrap min-w-[120px]">Teacher Name:</span>
                    <input 
                        type="text" 
                        value={teacherName}
                        readOnly
                        disabled
                        className="w-64 px-3 py-1.5 border border-slate-200 rounded-xl font-bold outline-none bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-slate-500 font-medium whitespace-nowrap min-w-[120px]">Academic Year:</span>
                    <input 
                        type="text" 
                        value={academicYear}
                        onChange={(e) => {
                            setAcademicYear(e.target.value);
                            setIsInfoSaved(false);
                            if (filterGrade !== '') setFilterGrade('');
                        }}
                        disabled={isInfoSaved}
                        className={`w-64 px-3 py-1.5 border rounded-xl font-bold outline-none transition-all ${isInfoSaved ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-500'}`}
                        placeholder="e.g. 2024"
                    />
                </div>
                
                <div className="mt-2">
                    {!isInfoSaved ? (
                        <button 
                            onClick={() => { if(academicYear.trim() && teacherName.trim()) setIsInfoSaved(true); }}
                            disabled={!academicYear.trim() || !teacherName.trim()}
                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save Info First
                        </button>
                    ) : (
                        <button 
                            onClick={() => {
                                setIsInfoSaved(false);
                                setFilterGrade('');
                            }}
                            className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors border border-slate-200"
                        >
                            Edit Info
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* Integrated Filter Bar */}
        <div className={`grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-200 sticky top-4 z-20 backdrop-blur-md bg-white/90 transition-opacity ${!isInfoSaved ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
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
            {!isInfoSaved ? (
                 <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 text-blue-500">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Save Teacher Info First</h3>
                    <p className="text-slate-500 max-w-sm text-center font-medium">Please enter and save both your Name and Academic Year above to start entering marks.</p>
                </div>
            ) : !filterGrade ? (
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
                                <div key={i} className="h-28 bg-white rounded-3xl border border-slate-100 shadow-sm"></div>
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
                            <div className="max-w-md mx-auto text-center py-12 space-y-4">
                                <div className="w-20 h-20 bg-gradient-to-br from-white to-slate-50 rounded-2xl flex items-center justify-center mx-auto text-blue-600 shadow-lg">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-extrabold text-slate-900 mb-1">No Results Found</h3>
                                <p className="text-slate-500 text-sm">We couldn&apos;t find any students in Grade {filterGrade} matching &quot;{searchTerm}&quot;.</p>
                            </div>
                    ) : anyMarksFound === false ? (
                        <div className="max-w-md mx-auto text-center py-12 space-y-4">
                            <div className="w-20 h-20 bg-gradient-to-br from-white to-slate-50 rounded-2xl flex items-center justify-center mx-auto text-blue-600 shadow-lg">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <h3 className="text-lg font-extrabold text-slate-900 mb-1">No Marks Found</h3>
                            <p className="text-slate-500 text-sm">No marks have been recorded for students in Grade {filterGrade} for {academicYear}.</p>
                        </div>
                    ) : (
                        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300 ${loading ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                            {data.map((student) => (
                                <StudentMarkCard 
                                    key={student.id} 
                                    student={student} 
                                    academicYear={academicYear} 
                                    teacherName={teacherName} 
                                    grade={filterGrade} 
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
      </div>
    </main>
  );
}
