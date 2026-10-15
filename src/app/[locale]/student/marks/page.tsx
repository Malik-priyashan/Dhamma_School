"use client";

import React, { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { fetchCurrentUser } from "../../../features/auth/api/authApi";
import { fetchMyStudents } from "../../../features/students/api/studentsApi";
import { fetchMarksByStudent } from "../../../features/teacher/student-marks/api/marksApi";

interface MarkRow {
  academicYear: string;
  firstTerm?: number;
  secondTerm?: number;
  thirdTerm?: number;
  teacherName?: string;
  grade?: string | number;
}

export default function StudentMarksPage() {
  const locale = useLocale();
  const t = useTranslations();
  
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>("");
  const [allMarks, setAllMarks] = useState<MarkRow[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [year, setYear] = useState<string>("");
  const [marks, setMarks] = useState<MarkRow | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load current user and students on mount
  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const user = await fetchCurrentUser();
        if (!active) return;
        if (user) {
          const myStudents = await fetchMyStudents();
          if (!active) return;
          setStudents(myStudents);

          if (myStudents.length > 0) {
            setSelectedStudent(myStudents[0]);
            setStudentId(myStudents[0].id ? String(myStudents[0].id) : null);
            setStudentName(myStudents[0].fullNameWithSurname || myStudents[0].nameWithInitials || user.fullName || "Student");
          } else {
            // Fallback if no student profile is created/accepted yet
            setStudentId(user.id.toString());
            setStudentName(user.fullName || "Student");
          }
        } else {
          setError(t('user_not_found') ?? 'User not found');
          setLoading(false);
        }
      } catch (e) {
        if (!active) return;
        console.error(e);
        setError(t('failed_to_load_user') ?? 'Failed to load user');
        setLoading(false);
      }
    }
    void loadData();
    return () => { active = false; };
  }, [t]);

  // Fetch marks whenever studentId changes
  useEffect(() => {
    if (!studentId) return;
    let active = true;
    fetchMarksByStudent(studentId)
      .then((data) => {
        if (!active) return;
        const mapped: MarkRow[] = data.map((item) => ({
          academicYear: item.academicYear,
          firstTerm: item.firstTerm,
          secondTerm: item.secondTerm,
          thirdTerm: item.thirdTerm,
          teacherName: item.teacherName,
          grade: item.grade,
        }));
        setAllMarks(mapped);

        // Extract unique academic years and sort descending
        const years = Array.from(new Set(mapped.map((m) => m.academicYear)))
          .filter(Boolean)
          .sort((a, b) => b.localeCompare(a));

        setAvailableYears(years);

        if (years.length > 0) {
          // Default to the first (most recent) year
          setYear(years[0]);
          const matched = mapped.find((m) => m.academicYear === years[0]) || null;
          setMarks(matched);
        } else {
          setYear("");
          setMarks(null);
        }
      })
      .catch((e) => {
        if (!active) return;
        console.error(e);
        setError(t('failed_to_load_marks') ?? 'Failed to load marks');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [studentId, t]);

  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sId = e.target.value;
    if (sId === studentId) return;
    const found = students.find((s) => String(s.id) === sId);
    if (found) {
      setLoading(true);
      setError(null);
      setMarks(null);
      setAllMarks([]);
      setAvailableYears([]);
      setYear("");
      setSelectedStudent(found);
      setStudentId(String(found.id));
      setStudentName(found.fullNameWithSurname || found.nameWithInitials || "Student");
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedYear = e.target.value;
    setYear(selectedYear);
    const matched = allMarks.find((m) => m.academicYear === selectedYear) || null;
    setMarks(matched);
  };

  // Dynamically calculate grade for target year
  const getCalculatedGradeForYear = () => {
    if (!selectedStudent || !selectedStudent.grade) return null;
    const currentGradeStr = selectedStudent.grade;
    
    // Extract integer from grade string, e.g. "Grade 10" -> 10, "10 ශ්‍රේණිය" -> 10
    const match = currentGradeStr.match(/\d+/);
    if (!match) return currentGradeStr; // fallback if no number found
    
    const currentGradeNum = parseInt(match[0], 10);
    const currentYear = new Date().getFullYear(); // e.g. 2026
    
    if (!year) return currentGradeStr;
    const targetYearNum = parseInt(year, 10);
    if (isNaN(targetYearNum)) return currentGradeStr;
    
    const yearDiff = targetYearNum - currentYear;
    const targetGradeNum = currentGradeNum + yearDiff;
    
    if (targetGradeNum <= 0) return null;
    
    return locale === 'si' ? `ශ්‍රේණිය ${targetGradeNum}` : `Grade ${targetGradeNum}`;
  };

  const calculatedGrade = getCalculatedGradeForYear();
  const hasRecordedMarks = Boolean(marks && [marks.firstTerm, marks.secondTerm, marks.thirdTerm].some((score) => score !== undefined && score !== null));

  // Calculate average score dynamically
  const getAverage = () => {
    if (!marks) return null;
    const scores = [marks.firstTerm, marks.secondTerm, marks.thirdTerm].filter(
      (s): s is number => s !== undefined && s !== null
    );
    if (scores.length === 0) return null;
    const sum = scores.reduce((a, b) => a + b, 0);
    return Math.round((sum / scores.length) * 10) / 10;
  };

  const avg = getAverage();
  const avgPassed = avg !== null && avg >= 35;

  const getFeedbackMessage = () => {
    if (avg === null) return "";
    if (avg >= 75) return locale === 'si' ? 'විශිෂ්ට ප්‍රගතියක්!' : 'Outstanding Performance!';
    if (avg >= 50) return locale === 'si' ? 'හොඳ ප්‍රගතියක්!' : 'Good Performance!';
    return locale === 'si' ? 'තවදුරටත් උත්සාහ කරන්න!' : 'Keep Practicing!';
  };

  const renderBarChart = () => {
    if (!marks) return null;
    
    const terms = [
      { labelSi: '1 වාරය', labelEn: '1st Term', value: marks.firstTerm },
      { labelSi: '2 වාරය', labelEn: '2nd Term', value: marks.secondTerm },
      { labelSi: '3 වාරය', labelEn: '3rd Term', value: marks.thirdTerm }
    ];

    const width = 500;
    const height = 180;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 15;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    
    const barWidth = 36;
    const barSpacing = chartWidth / terms.length;

    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-black/15 transition-all duration-300 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 bg-slate-900 rounded-full" />
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {locale === 'si' ? 'වාර ලකුණු සංසන්දනය' : 'Term-by-Term Comparison'}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[320px] h-auto overflow-visible">
            <defs>
              <linearGradient id="termBlackGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3f3f46" />
                <stop offset="100%" stopColor="#09090b" />
              </linearGradient>
            </defs>

            {[0, 50, 100].map((gridVal) => {
              const gridY = height - paddingBottom - (gridVal / 100) * chartHeight;
              return (
                <g key={gridVal}>
                  <line
                    x1={paddingLeft}
                    y1={gridY}
                    x2={width - paddingRight}
                    y2={gridY}
                    stroke="#f1f5f9"
                    strokeWidth="1.5"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={gridY + 3}
                    textAnchor="end"
                    className="fill-slate-400 font-semibold text-[9px]"
                  >
                    {gridVal}%
                  </text>
                </g>
              );
            })}

            {terms.map((term, index) => {
              const hasScore = term.value !== undefined && term.value !== null;
              
              const barX = paddingLeft + index * barSpacing + (barSpacing - barWidth) / 2;
              const barVal = hasScore ? term.value! : 0;
              const barH = (barVal / 100) * chartHeight;
              const barY = height - paddingBottom - barH;

              return (
                <g key={index} className="group cursor-pointer">
                  {hasScore ? (
                    <rect
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={barH}
                      rx="4"
                      fill="url(#termBlackGradient)"
                      className="transition-all duration-300 opacity-90 group-hover:opacity-100 hover:scale-y-[1.02] origin-bottom"
                    />
                  ) : (
                    <rect
                      x={barX}
                      y={height - paddingBottom - 16}
                      width={barWidth}
                      height="16"
                      rx="4"
                      fill="none"
                      stroke="#cbd5e1"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  )}

                  <text
                    x={barX + barWidth / 2}
                    y={hasScore ? barY - 6 : height - paddingBottom - 22}
                    textAnchor="middle"
                    className={`font-bold text-[10px] ${
                      hasScore ? 'fill-slate-800' : 'fill-slate-400'
                    }`}
                  >
                    {hasScore ? `${term.value}%` : 'N/A'}
                  </text>

                  <text
                    x={barX + barWidth / 2}
                    y={height - 8}
                    textAnchor="middle"
                    className="fill-slate-500 font-bold text-[9px]"
                  >
                    {locale === 'si' ? term.labelSi : term.labelEn}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  const renderYearlyBarChart = () => {
    const chartData = allMarks
      .map(m => {
        const scores = [m.firstTerm, m.secondTerm, m.thirdTerm].filter(
          (s): s is number => s !== undefined && s !== null
        );
        const avgVal = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
        return {
          year: m.academicYear,
          avg: avgVal
        };
      })
      .filter((d): d is { year: string; avg: number } => d.avg !== null)
      .sort((a, b) => a.year.localeCompare(b.year));

    if (chartData.length === 0) {
      return (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-black/10 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-slate-900 rounded-full" />
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {locale === 'si' ? 'වසර අනුව ලකුණු ප්‍රගතිය' : 'Year-over-Year Progress'}
            </h3>
          </div>
          <div className="flex flex-col justify-center items-center h-48 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-4 text-center">
            <span className="text-xs text-slate-400 font-medium">
              {locale === 'si' 
                ? 'ප්‍රගති ප්‍රස්ථාරය සඳහා අධ්‍යයන වර්ෂවල ලකුණු අවශ්‍ය වේ.' 
                : 'Need marks from academic years to display progress chart.'}
            </span>
          </div>
        </div>
      );
    }

    const width = 500;
    const height = 180;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 15;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    
    // Dynamic bar width calculations based on available data
    const maxBarWidth = 36;
    const barSpacing = chartWidth / chartData.length;
    const barWidth = Math.min(maxBarWidth, barSpacing * 0.5);

    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-black/15 transition-all duration-300 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 bg-slate-900 rounded-full" />
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {locale === 'si' ? 'වසර අනුව ලකුණු ප්‍රගතිය' : 'Year-over-Year Progress'}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[320px] h-auto overflow-visible">
            <defs>
              <linearGradient id="yearlyBlackGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3f3f46" />
                <stop offset="100%" stopColor="#09090b" />
              </linearGradient>
            </defs>

            {[0, 50, 100].map((gridVal) => {
              const gridY = height - paddingBottom - (gridVal / 100) * chartHeight;
              return (
                <g key={gridVal}>
                  <line
                    x1={paddingLeft}
                    y1={gridY}
                    x2={width - paddingRight}
                    y2={gridY}
                    stroke="#f1f5f9"
                    strokeWidth="1.5"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={gridY + 3}
                    textAnchor="end"
                    className="fill-slate-400 font-semibold text-[9px]"
                  >
                    {gridVal}%
                  </text>
                </g>
              );
            })}

            {chartData.map((d, index) => {
              const barX = paddingLeft + index * barSpacing + (barSpacing - barWidth) / 2;
              const barH = (d.avg / 100) * chartHeight;
              const barY = height - paddingBottom - barH;

              return (
                <g key={index} className="group cursor-pointer">
                  <rect
                    x={barX}
                    y={barY}
                    width={barWidth}
                    height={barH}
                    rx="4"
                    fill="url(#yearlyBlackGradient)"
                    className="transition-all duration-300 opacity-90 group-hover:opacity-100 hover:scale-y-[1.02] origin-bottom"
                  />

                  <text
                    x={barX + barWidth / 2}
                    y={barY - 6}
                    textAnchor="middle"
                    className="font-bold text-[10px] fill-slate-800"
                  >
                    {d.avg}%
                  </text>

                  <text
                    x={barX + barWidth / 2}
                    y={height - 8}
                    textAnchor="middle"
                    className="fill-slate-500 font-bold text-[9px]"
                  >
                    {d.year}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 pt-36 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        
        {/* Top Header Card */}
        <div className={`relative overflow-hidden rounded-3xl ${hasRecordedMarks ? 'border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-7' : 'px-1 py-2 sm:px-2'}`}>
          {hasRecordedMarks && (
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-sky-50/80 to-transparent" />
          )}
          <div className={`relative ${hasRecordedMarks ? 'grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start' : 'flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between'}`}>
            <div className="min-w-0">
              {hasRecordedMarks && marks ? (
                <div className="flex flex-wrap items-center gap-3">
                    <div aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white shadow-sm">
                      {studentName.trim().charAt(0).toUpperCase() || 'S'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700">
                        {locale === 'si' ? 'ලකුණු වාර්තාව' : 'Marks report'}
                      </p>
                      <h1 className="mt-0.5 break-words text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">
                        {studentName}
                      </h1>
                    </div>
                </div>
              ) : (
                <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950">{t('marks')}</h1>
              )}
            </div>

            {/* Dropdown Selectors */}
            {(students.length > 0 || availableYears.length > 0) && (
              <div className={`grid min-w-0 gap-3 ${availableYears.length > 0 && students.length > 0 ? 'sm:grid-cols-[minmax(0,1fr)_7rem]' : 'sm:grid-cols-1'}`}>
                {students.length > 0 && (
                  <div className="min-w-0">
                    <label htmlFor="studentSelect" className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      {hasRecordedMarks ? (locale === 'si' ? 'සිසුවා' : 'Student') : (locale === 'si' ? 'සිසුවා තෝරන්න' : 'Choose student')}
                    </label>
                    <select id="studentSelect" value={studentId || ""} onChange={handleStudentChange}
                      className="w-full min-w-0 cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none transition hover:border-slate-300 hover:bg-white focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100">
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.fullNameWithSurname || student.nameWithInitials}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {availableYears.length > 0 && (
                  <div className="min-w-0">
                    <label htmlFor="yearSelect" className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      {locale === 'si' ? 'වර්ෂය' : 'Year'}
                    </label>
                    <select id="yearSelect" value={year} onChange={handleYearChange}
                      className="w-full min-w-0 cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none transition hover:border-slate-300 hover:bg-white focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100">
                      {availableYears.map((availableYear) => (
                        <option key={availableYear} value={availableYear}>{availableYear}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
          {hasRecordedMarks && marks && (
            <dl tabIndex={0} className="relative mt-6 flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-2 [scrollbar-width:thin] sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0">
              <div className="min-w-36 flex-1 snap-start rounded-2xl border border-sky-200 bg-sky-50/80 px-3.5 py-3 sm:min-w-0">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-sky-700">{locale === 'si' ? 'වත්මන් ශ්‍රේණිය' : 'Current grade'}</dt>
                <dd className="mt-1 text-base font-extrabold text-slate-900">{selectedStudent?.grade || '—'}</dd>
              </div>
              <div className="min-w-36 flex-1 snap-start rounded-2xl border border-slate-200/80 bg-white/90 px-3.5 py-3 sm:min-w-0">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{locale === 'si' ? 'එම වර්ෂයේ ශ්‍රේණිය' : 'Grade that year'}</dt>
                <dd className="mt-1 text-base font-extrabold text-slate-900">{calculatedGrade || '—'}</dd>
              </div>
              <div className="min-w-36 flex-1 snap-start rounded-2xl border border-slate-200/80 bg-white/90 px-3.5 py-3 sm:min-w-0">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{locale === 'si' ? 'අධ්‍යයන වර්ෂය' : 'Academic year'}</dt>
                <dd className="mt-1 text-base font-extrabold text-slate-900">{marks.academicYear}</dd>
              </div>
              <div className="min-w-36 flex-1 snap-start rounded-2xl border border-slate-200/80 bg-white/90 px-3.5 py-3 sm:min-w-0">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{locale === 'si' ? 'ගුරුතුමා' : 'Teacher'}</dt>
                <dd className="mt-1 break-words text-sm font-bold text-slate-900">{marks.teacherName || (locale === 'si' ? 'සඳහන් කර නැත' : 'Not listed')}</dd>
              </div>
            </dl>
          )}
        </div>

        {/* Content Area */}
        {loading ? (
          <div role="status" aria-live="polite" className="relative min-h-[300px] overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-10 shadow-sm sm:px-10">
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-sky-100/60 blur-3xl" />
            <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-50 ring-1 ring-sky-100">
                <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-sky-200 border-t-sky-700 motion-reduce:animate-none" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{locale === 'si' ? 'ලකුණු පූරණය වෙමින්' : 'Loading marks'}</h2>
                <p className="mt-1 text-sm text-slate-500">{locale === 'si' ? 'ලකුණු වාර්තා පරීක්ෂා කරමින් සිටී.' : 'Checking the available results for this student.'}</p>
              </div>
            </div>
            <div aria-hidden="true" className="relative mt-8 grid gap-3 sm:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                  <div className="h-3 w-20 animate-pulse rounded-full bg-slate-200 motion-reduce:animate-none" />
                  <div className="mt-6 h-8 w-16 animate-pulse rounded-lg bg-slate-200 motion-reduce:animate-none" />
                  <div className="mt-6 h-2 w-full animate-pulse rounded-full bg-slate-200 motion-reduce:animate-none" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-sm font-semibold text-red-700 shadow-sm">
            {error}
          </div>
        ) : hasRecordedMarks && marks ? (
          <div className="space-y-8">
            
            {/* Term Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { termKey: 'firstTerm' as const, labelSi: 'පළමු වාරය', labelEn: '1st Term', value: marks.firstTerm },
                { termKey: 'secondTerm' as const, labelSi: 'දෙවන වාරය', labelEn: '2nd Term', value: marks.secondTerm },
                { termKey: 'thirdTerm' as const, labelSi: 'තෙවන වාරය', labelEn: '3rd Term', value: marks.thirdTerm }
              ].map((term) => {
                const hasScore = term.value !== undefined && term.value !== null;
                const isPassed = hasScore && term.value! >= 35;
                
                return (
                  <div 
                    key={term.termKey} 
                    className={`bg-white rounded-2xl p-6 shadow-sm border flex flex-col justify-between min-h-48 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
                      hasScore 
                        ? (isPassed ? 'border-emerald-200' : 'border-red-200') 
                        : 'border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {locale === 'si' ? term.labelSi : term.labelEn}
                      </span>
                      {hasScore ? (
                        isPassed ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {locale === 'si' ? 'සමත්' : 'Passed'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-red-50 text-red-700 border border-red-200">
                            {locale === 'si' ? 'අසමත්' : 'Not Passed'}
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-50 text-slate-400 border border-slate-100">
                          {locale === 'si' ? 'නොමැත' : 'Pending'}
                        </span>
                      )}
                    </div>

                    <div className="my-3 flex items-baseline gap-1.5">
                      <span className={`text-4xl font-extrabold tracking-tight ${
                        hasScore 
                          ? (isPassed ? 'text-emerald-700' : 'text-red-700') 
                          : 'text-neutral-300'
                      }`}>
                        {hasScore ? term.value : '-'}
                      </span>
                      {hasScore && <span className="text-neutral-500 font-semibold text-sm">/ 100</span>}
                    </div>

                    <div className="space-y-2">
                      <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${hasScore ? (isPassed ? 'bg-emerald-600' : 'bg-red-600') : 'bg-neutral-200'}`}
                          style={{ width: `${hasScore ? Math.min(Math.max(term.value!, 0), 100) : 0}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-neutral-500 font-medium">
                        {hasScore 
                          ? (isPassed 
                              ? (locale === 'si' ? 'නියමිත මට්ටම ඉක්මවා ඇත' : 'Pass mark reached')
                              : (locale === 'si' ? 'අමතර සහාය අවශ්‍යයි' : 'Below pass mark')
                            )
                          : (locale === 'si' ? 'ලකුණු ඇතුළත් කර නොමැත' : 'No marks recorded yet')
                        }
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Average Marks Card */}
            {avg !== null && (
              <div className={`relative overflow-hidden bg-white rounded-2xl p-6 sm:p-8 text-neutral-900 shadow-sm border transition-all duration-300 hover:shadow-md ${
                avgPassed ? 'border-emerald-200' : 'border-red-200'
              }`}>
                <div className="relative flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                      {locale === 'si' ? 'සාමාන්‍යය ප්‍රතිඵලය' : 'Overall Term Average'}
                    </p>
                    <h2 className="text-xl font-extrabold tracking-tight text-neutral-950">
                      {getFeedbackMessage()}
                    </h2>
                    <p className="text-[11px] text-neutral-500 max-w-md">
                      {locale === 'si' 
                        ? 'මෙම අධ්‍යයන වර්ෂයේ සාමාන්‍ය ලකුණ මත පදනම්ව ගණනය කරන ලදී.' 
                        : 'Calculated based on the recorded term results for this academic year.'}
                    </p>
                  </div>
                  <div className={`flex flex-col items-center justify-center rounded-2xl px-5 py-3.5 text-white ${
                    avgPassed ? 'bg-emerald-700' : 'bg-red-700'
                  }`}>
                    <span className="text-3xl font-black tracking-tight text-white">{avg}%</span>
                    <span className="text-[9px] font-bold text-white/75 uppercase tracking-widest mt-1">
                      {avgPassed ? (locale === 'si' ? 'සමත්' : 'Passed') : (locale === 'si' ? 'අසමත්' : 'Not Passed')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Pass Mark Note */}
            <div className="text-[10px] text-slate-400 font-medium px-1">
              * {locale === 'si' ? 'සමත් ලකුණ 35 වේ' : 'Pass mark is 35'}
            </div>

            {/* Visual Charts section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
              {renderBarChart()}
              {renderYearlyBarChart()}
            </div>

          </div>
        ) : (
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm sm:py-16">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-sky-50 to-transparent" />
            <div className="relative mx-auto max-w-md">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-sky-700 shadow-[0_12px_32px_rgba(14,165,233,0.12)] ring-1 ring-sky-100">
                <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h2 className="mt-6 text-xl font-extrabold tracking-tight text-slate-900">{t('no_marks_available')}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {year
                  ? (locale === 'si' ? `${year} වසර සඳහා තවමත් කිසිදු ලකුණක් සටහන් කර නොමැත.` : `No marks have been recorded for ${year} yet.`)
                  : t('no_marks_desc')}
              </p>
              {students.length > 1 && (
                <p className="mt-4 text-xs font-medium text-slate-400">
                  {locale === 'si' ? 'වෙනත් සිසුවෙකුගේ ප්‍රතිඵල බැලීමට ඉහළින් තෝරන්න.' : 'Choose another student above to check their results.'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
