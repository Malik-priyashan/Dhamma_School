"use client";

import { useEffect, useState } from 'react';
import { DashboardSummary, fetchDashboard } from './api/dashboardApi';

export default function DashboardOverview({ refreshKey = 0 }: { refreshKey?: number }) {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [selectedGrade, setSelectedGrade] = useState('1');

  useEffect(() => {
    fetchDashboard().then((summary) => { setData(summary); setError(''); })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not load dashboard'));
  }, [refreshKey, retry]);

  if (error) return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">{error} <button className="ml-3 font-semibold underline" onClick={() => setRetry((value) => value + 1)}>Retry</button></div>;
  if (!data) return <p className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 text-slate-500">Loading dashboard…</p>;

  const max = Math.max(1, ...data.grades.flatMap(({ boys, girls, total }) => [boys, girls, total - boys - girls]));
  const boys = data.grades.reduce((sum, grade) => sum + grade.boys, 0);
  const girls = data.grades.reduce((sum, grade) => sum + grade.girls, 0);
  const cards = [
    { label: 'Teachers', count: data.teachers.length, detail: 'Registered accounts', letter: 'T' },
    { label: 'Approved prefects', count: data.prefects, detail: 'Selected students', letter: 'P' },
    { label: 'Approved announcing', count: data.announcing, detail: 'Selected students', letter: 'A' },
  ];

  return <div className="space-y-6">
    <section className="grid gap-4 sm:grid-cols-3" aria-label="Student totals">
      {[
        { label: 'Total students', count: data.students, bar: 'bg-slate-700', note: 'Grades 1–11' },
        { label: 'Total boys', count: boys, bar: 'bg-blue-500', note: 'Recorded as boys' },
        { label: 'Total girls', count: girls, bar: 'bg-pink-400', note: 'Recorded as girls' },
      ].map(({ label, count, bar, note }) => <div key={label} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className={`h-1 ${bar}`} /><div className="p-6"><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-3 text-4xl font-black tracking-tight text-slate-900">{count.toLocaleString()}</p><p className="mt-1 text-xs text-slate-400">{note}</p></div>
      </div>)}
    </section>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="relative flex min-h-48 flex-col justify-between overflow-hidden rounded-[28px] border border-blue-200 bg-blue-50 p-6 text-slate-900 shadow-sm">
        <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full border-[18px] border-blue-100" aria-hidden="true" />
        <div className="relative flex items-start justify-between gap-3"><label htmlFor="dashboard-grade" className="text-sm font-semibold text-blue-700">Students in grade</label><span className="rounded-xl bg-white px-2.5 py-1 text-xs font-bold text-blue-700">01–11</span></div>
        <select id="dashboard-grade" value={selectedGrade} onChange={(event) => setSelectedGrade(event.target.value)}
          className="relative mt-3 w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-200">
          {data.grades.map(({ grade }) => <option key={grade} value={grade}>Grade {grade}</option>)}
        </select>
        <div className="relative mt-3 flex items-end justify-between"><p aria-live="polite" className="text-4xl font-black tracking-tight">{data.grades.find(({ grade }) => grade === selectedGrade)?.total ?? 0}</p><p className="pb-1 text-xs font-medium text-slate-500">enrolled students</p></div>
      </div>
      {cards.map(({ label, count, detail, letter }) => <div key={label} className="flex min-h-48 flex-col justify-between rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold text-slate-500">{label}</p><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-black text-slate-700">{letter}</span></div>
        <div><p className="text-4xl font-black tracking-tight text-slate-900">{count}</p><p className="mt-1 text-xs font-medium text-slate-400">{detail}</p></div>
      </div>)}
    </div>
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-label="Students by grade and gender">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Student distribution</p><h2 className="mt-1 text-xl font-bold text-slate-900">Students by grade</h2><p className="mt-1 text-sm text-slate-500">Girls, boys, and records awaiting gender details across Grades 1–11.</p></div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-pink-50 px-3 py-1.5 text-pink-700">● Girls</span><span className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-700">● Boys</span><span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">● Unrecorded</span></div>
      </div>
      <div className="mt-6 overflow-x-auto rounded-2xl bg-slate-50/80 px-3 pt-6"><div className="grid min-w-[660px] grid-cols-11 gap-2 border-b border-slate-200 pb-4">
        {data.grades.map(({ grade, girls, boys, total }) => <div key={grade} className="text-center" role="img" aria-label={`Grade ${grade}: ${girls} girls, ${boys} boys, ${total - girls - boys} unrecorded, ${total} total`} title={`Grade ${grade}: ${girls} girls, ${boys} boys, ${total - girls - boys} unrecorded`}>
          <div className="flex h-44 items-end justify-center gap-1 border-b border-slate-200">
            <div className="w-1/3 rounded-t-md bg-pink-400" style={{ height: `${girls ? Math.max(4, girls / max * 100) : 0}%` }} aria-label={`${girls} girls`} />
            <div className="w-1/3 rounded-t-md bg-blue-500" style={{ height: `${boys ? Math.max(4, boys / max * 100) : 0}%` }} aria-label={`${boys} boys`} />
            <div className="w-1/3 rounded-t-md bg-slate-300" style={{ height: `${total > girls + boys ? Math.max(4, (total - girls - boys) / max * 100) : 0}%` }} aria-label={`${total - girls - boys} unrecorded`} />
          </div>
          <p className="mt-3 text-xs font-bold text-slate-800">G{grade}</p>
          <p className="mt-1 text-[10px] font-semibold"><span className="text-pink-600">{girls} G</span> · <span className="text-blue-600">{boys} B</span></p>
          <p className="mt-0.5 text-[10px] text-slate-500">{total} total</p>
        </div>)}
      </div></div>
      <p className="mt-4 text-xs text-slate-500">Unrecorded bars show students approved before gender was added.</p>
    </section>
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-5"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Team directory</p><h2 className="mt-1 text-xl font-bold text-slate-900">Teachers</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{data.teachers.length} total</span></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.teachers.map((teacher) => <div key={teacher.id} className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-sm font-bold text-slate-700">{(teacher.fullName || teacher.email).charAt(0).toUpperCase()}</span>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{teacher.fullName || teacher.email}</p>{teacher.fullName && <p className="truncate text-xs text-slate-500">{teacher.email}</p>}</div>
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${teacher.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`} title={teacher.isActive ? 'Approved' : 'Not approved'} aria-label={teacher.isActive ? 'Approved' : 'Not approved'}>{teacher.isActive ? '✓' : '✕'}</span>
        </div>)}
        {!data.teachers.length && <p className="text-sm text-slate-500">No teachers yet.</p>}
      </div>
    </section>
  </div>;
}
