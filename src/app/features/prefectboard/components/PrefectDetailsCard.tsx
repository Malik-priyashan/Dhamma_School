"use client";

import React, { useState, useEffect } from "react";
import { PrefectFormData } from "../types";
import { updatePrefect } from "../api/prefectboardapi";

interface PrefectDetailsCardProps {
  prefect: PrefectFormData | null;
  onClose: () => void;
  onSave: (id?: string) => void;
}

export default function PrefectDetailsCard({ prefect, onClose, onSave }: PrefectDetailsCardProps) {
  // Mode toggler state
  const [isEditing, setIsEditing] = useState(false);
  
  // Local form state for all fields
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; label: string } | null>(null);

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const initFormData = () => {
    if (prefect) {
      // Format entranceDay date as YYYY-MM-DD for standard date input
      let formattedEntranceDay = "";
      if (prefect.entranceDay) {
        try {
          formattedEntranceDay = new Date(prefect.entranceDay).toISOString().split("T")[0];
        } catch {}
      }

      // Format evaluation date as YYYY-MM-DD for standard date input
      let formattedDate = "";
      if (prefect.date) {
        try {
          formattedDate = new Date(prefect.date).toISOString().split("T")[0];
        } catch {}
      }

      setFormData({
        fullName: prefect.fullName || "",
        entranceNo: prefect.entranceNo || "",
        grade: prefect.grade || "",
        address: prefect.address || "",
        entranceDay: formattedEntranceDay,
        
        firstTermPlace: prefect.firstTermPlace || "",
        firstTermMarks: prefect.firstTermMarks !== undefined && prefect.firstTermMarks !== null ? String(prefect.firstTermMarks) : "",
        secondTermPlace: prefect.secondTermPlace || "",
        secondTermMarks: prefect.secondTermMarks !== undefined && prefect.secondTermMarks !== null ? String(prefect.secondTermMarks) : "",
        thirdTermPlace: prefect.thirdTermPlace || "",
        thirdTermMarks: prefect.thirdTermMarks !== undefined && prefect.thirdTermMarks !== null ? String(prefect.thirdTermMarks) : "",
        
        absentDaysCount: prefect.absentDaysCount !== undefined && prefect.absentDaysCount !== null ? String(prefect.absentDaysCount) : "",
        poyaDayCount: prefect.poyaDayCount !== undefined && prefect.poyaDayCount !== null ? String(prefect.poyaDayCount) : "",
        
        isPrefect: !!prefect.isPrefect,
        isPrefectYears: Array.isArray(prefect.isPrefectYears) ? prefect.isPrefectYears.join(", ") : "",
        isClassLeader: !!prefect.isClassLeader,
        isClassLeaderYears: Array.isArray(prefect.isClassLeaderYears) ? prefect.isClassLeaderYears.join(", ") : "",
        participateForCompetitions: !!prefect.participateForCompetitions,
        participateForCompetitionsYears: Array.isArray(prefect.participateForCompetitionsYears) ? prefect.participateForCompetitionsYears.join(", ") : "",
        isInAnnouncingClub: !!prefect.isInAnnouncingClub,
        isInAnnouncingClubYears: Array.isArray(prefect.isInAnnouncingClubYears) ? prefect.isInAnnouncingClubYears.join(", ") : "",
        isOnStage: !!prefect.isOnStage,
        isOnStageYears: Array.isArray(prefect.isOnStageYears) ? prefect.isOnStageYears.join(", ") : "",
        participateToKatina: !!prefect.participateToKatina,
        participateToKatinaYears: Array.isArray(prefect.participateToKatinaYears) ? prefect.participateToKatinaYears.join(", ") : "",
        
        studentAgreement: !!prefect.studentAgreement,
        parentsName: prefect.parentsName || "",
        parentsAgreement: !!prefect.parentsAgreement,
        libraryStatus: prefect.libraryStatus || "",

        status: prefect.status || "PENDING",
        marks: prefect.marks !== undefined && prefect.marks !== null ? String(prefect.marks) : "",
        date: formattedDate,
        specialNote: prefect.specialNote || "",
        teachersAgreement: !!prefect.teachersAgreement,
      });
    }
  };

  useEffect(() => {
    initFormData();
  }, [prefect]);

  if (!prefect) return null;

  const p = prefect;

  const handleSaveForm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!p.id) return;

    setIsSaving(true);
    try {
      // Helper to parse comma-separated text into a sorted list of unique active years
      const parseYears = (val: string): number[] => {
        if (!val || typeof val !== "string") return [];
        return val
          .split(",")
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !Number.isNaN(n) && n > 0);
      };

      const getTrimmedOrNull = (val: unknown): string | null => {
        if (val === undefined || val === null) return null;
        const str = String(val).trim();
        return str === "" ? null : str;
      };

      const payload = {
        fullName: getTrimmedOrNull(formData.fullName) || p.fullName,
        entranceNo: getTrimmedOrNull(formData.entranceNo),
        grade: getTrimmedOrNull(formData.grade),
        address: getTrimmedOrNull(formData.address),
        entranceDay: getTrimmedOrNull(formData.entranceDay),
        
        firstTermPlace: getTrimmedOrNull(formData.firstTermPlace),
        firstTermMarks: formData.firstTermMarks === "" || formData.firstTermMarks === undefined || formData.firstTermMarks === null ? null : Number(formData.firstTermMarks),
        secondTermPlace: getTrimmedOrNull(formData.secondTermPlace),
        secondTermMarks: formData.secondTermMarks === "" || formData.secondTermMarks === undefined || formData.secondTermMarks === null ? null : Number(formData.secondTermMarks),
        thirdTermPlace: getTrimmedOrNull(formData.thirdTermPlace),
        thirdTermMarks: formData.thirdTermMarks === "" || formData.thirdTermMarks === undefined || formData.thirdTermMarks === null ? null : Number(formData.thirdTermMarks),
        
        absentDaysCount: formData.absentDaysCount === "" || formData.absentDaysCount === undefined || formData.absentDaysCount === null ? null : parseInt(formData.absentDaysCount, 10),
        poyaDayCount: formData.poyaDayCount === "" || formData.poyaDayCount === undefined || formData.poyaDayCount === null ? null : parseInt(formData.poyaDayCount, 10),
        
        isPrefect: !!formData.isPrefect,
        isPrefectYears: parseYears(formData.isPrefectYears),
        isClassLeader: !!formData.isClassLeader,
        isClassLeaderYears: parseYears(formData.isClassLeaderYears),
        participateForCompetitions: !!formData.participateForCompetitions,
        participateForCompetitionsYears: parseYears(formData.participateForCompetitionsYears),
        isInAnnouncingClub: !!formData.isInAnnouncingClub,
        isInAnnouncingClubYears: parseYears(formData.isInAnnouncingClubYears),
        isOnStage: !!formData.isOnStage,
        isOnStageYears: parseYears(formData.isOnStageYears),
        participateToKatina: !!formData.participateToKatina,
        participateToKatinaYears: parseYears(formData.participateToKatinaYears),
        
        studentAgreement: !!formData.studentAgreement,
        parentsName: getTrimmedOrNull(formData.parentsName),
        parentsAgreement: !!formData.parentsAgreement,
        libraryStatus: getTrimmedOrNull(formData.libraryStatus),
        
        status: formData.status || "PENDING",
        marks: formData.marks === "" || formData.marks === undefined || formData.marks === null ? null : Number(formData.marks),
        date: getTrimmedOrNull(formData.date),
        specialNote: getTrimmedOrNull(formData.specialNote),
        teachersAgreement: !!formData.teachersAgreement,
      };

      console.log("FRONTEND PREFECT SAVE PAYLOAD:", payload);

      await updatePrefect(p.id as string, payload);

      alert("Application details updated successfully!");
      setIsEditing(false);
      onSave(p.id as string); // Refresh the parent dashboard list
    } catch (err: any) {
      alert("Failed to update details: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Static detail formatting helpers
  const formatValue = (key: string, value: unknown): string => {
    if (value === undefined || value === null || String(value).trim() === "") return "N/A";

    if (key === "entranceDay" || key === "createdAt") {
      try {
        return new Date(String(value)).toLocaleDateString("en-CA");
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  const asYesNo = (value: unknown): string => {
    if (value === true || value === "YES") return "Yes";
    if (value === false || value === "NO") return "No";
    return "No";
  };

  const renderDetailField = (label: string, value: unknown, key = "") => {
    const strVal = formatValue(key, value);
    return (
      <div className="flex flex-col p-3 rounded-lg bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-colors duration-150">
        <span className="text-xs font-medium text-slate-500 mb-1">{label}</span>
        <span className={`text-sm font-semibold ${strVal === "N/A" ? "text-slate-400" : "text-slate-900"}`}>
          {strVal}
        </span>
      </div>
    );
  };

  const renderActivityRow = (label: string, isParticipant: unknown, years: unknown) => {
    const active = asYesNo(isParticipant) === "Yes";
    const yearsList = Array.isArray(years) ? years : [];

    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-sm transition-all duration-200 gap-3">
        <span className="font-semibold text-slate-700 text-sm">{label}</span>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
            active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
          }`}>
            {active ? "Yes" : "No"}
          </span>
          {active && yearsList.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {yearsList.map((y) => (
                <span key={String(y)} className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                  {String(y)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const getLibraryStatusBadge = (status: string | null | undefined) => {
    if (!status) return <span className="text-slate-400">N/A</span>;
    const colors: Record<string, string> = {
      VERY_GOOD: "bg-emerald-100 text-emerald-800 border-emerald-200",
      GOOD: "bg-blue-100 text-blue-800 border-blue-200",
      NORMAL: "bg-amber-100 text-amber-800 border-amber-200",
      WEAK: "bg-rose-100 text-rose-800 border-rose-200",
    };
    const displayNames: Record<string, string> = {
      VERY_GOOD: "Very Good",
      GOOD: "Good",
      NORMAL: "Normal",
      WEAK: "Weak",
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${colors[status] || "bg-slate-100 text-slate-800 border-slate-200"}`}>
        {displayNames[status] || status}
      </span>
    );
  };

  const getStatusBadge = (status: string | null | undefined) => {
    const s = status || "PENDING";
    const colors: Record<string, string> = {
      SELECTED: "bg-emerald-500 text-white shadow-emerald-500/20",
      NOT_SELECTED: "bg-rose-500 text-white shadow-rose-500/20",
      PENDING: "bg-amber-500 text-white shadow-amber-500/20",
    };
    const displayNames: Record<string, string> = {
      SELECTED: "Selected",
      NOT_SELECTED: "Not Selected",
      PENDING: "Pending",
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm uppercase tracking-wider ${colors[s] || "bg-slate-500 text-white"}`}>
        {displayNames[s] || s}
      </span>
    );
  };

  // Reusable Editable Activity component
  const renderEditableActivityRow = (label: string, isActiveKey: string, yearsKey: string) => {
    const active = !!formData[isActiveKey];
    const yearsVal = String(formData[yearsKey] || "");

    return (
      <div className="flex flex-col p-4 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-sm transition-all duration-200 gap-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-700 text-sm">{label}</span>
          <button
            type="button"
            onClick={() => handleChange(isActiveKey, !active)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              active ? "bg-emerald-500" : "bg-slate-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                active ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        {active && (
          <div className="flex flex-col p-2.5 bg-white rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <label className="text-[10px] font-bold text-slate-500 mb-0.5">Years Active (comma-separated, e.g. 2024, 2025)</label>
            <input
              type="text"
              value={yearsVal}
              placeholder="e.g. 2024, 2025"
              onChange={(e) => handleChange(yearsKey, e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-slate-900 border-none outline-none focus:ring-0 p-0"
            />
          </div>
        )}
      </div>
    );
  };

  // Reusable supporting files rendering
  const renderFileAsImage = (label: string, fileUrl: unknown) => {
    if (!fileUrl || typeof fileUrl !== "string") return null;

    const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
    const isAbsolute = fileUrl.startsWith("http://") || fileUrl.startsWith("https://") || fileUrl.startsWith("/");
    const fullUrl = isAbsolute ? fileUrl : `${base}/uploads/${fileUrl}`;

    return (
      <div className="flex flex-col p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          {label}
        </span>
        <div 
          onClick={() => setLightboxImage({ url: fullUrl, label })}
          className="relative rounded-xl overflow-hidden border border-slate-250 bg-white p-2.5 flex justify-center max-w-full hover:shadow-md transition-shadow duration-200 cursor-zoom-in group"
        >
          <img
            src={fullUrl}
            alt={label}
            className="max-h-80 w-auto object-contain rounded-lg transition-transform duration-200 group-hover:scale-[1.02]"
            onError={(e) => {
              // If image fails to load
              const imgEl = e.currentTarget;
              imgEl.style.display = "none";
              const parent = imgEl.parentElement;
              if (parent) {
                const textFallback = document.createElement("div");
                textFallback.className = "p-6 text-center text-slate-400 text-xs font-medium";
                textFallback.innerText = "Confirmation Attachment (Unable to display preview. Format may be PDF or document)";
                parent.appendChild(textFallback);
              }
            }}
          />
          <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 flex items-center justify-center transition-all duration-200">
            <span className="opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm border border-slate-200/50 flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              Click to Enlarge
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col my-8 max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-100 p-6 px-8 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-500 to-sky-400 text-white shadow-lg shadow-blue-500/20">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none mb-2">
                {isEditing ? (formData.fullName || p.fullName) : p.fullName}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Prefect Application Card</span>
                <span className="text-slate-300">•</span>
                {getStatusBadge(isEditing ? (formData.status || p.status) : p.status)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => handleSaveForm()}
                  disabled={isSaving}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    initFormData(); // Reset changes
                  }}
                  className="rounded-xl bg-slate-150 px-5 py-2.5 font-bold text-slate-700 hover:bg-slate-200 transition-all active:scale-95 text-sm"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 px-5 py-2.5 font-bold text-sm border border-blue-100 transition-all active:scale-95"
                >
                  Edit Details
                </button>
                <button
                  onClick={onClose}
                  className="rounded-xl bg-slate-100 px-5 py-2.5 font-bold text-slate-700 hover:bg-slate-200 transition-all active:scale-95 text-sm"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>

        {/* Scrollable Content Form */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          <form onSubmit={handleSaveForm} className="space-y-8">
            
            {/* Section: Basic Information */}
            <section className="space-y-4">
              <h3 className="text-md font-bold text-slate-800 border-l-4 border-blue-600 pl-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                Basic Information
              </h3>
              
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Full Name */}
                  <div className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-150 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-150">
                    <label className="text-[10px] font-bold text-slate-500 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName || ""}
                      onChange={(e) => handleChange("fullName", e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-slate-850 border-none outline-none focus:ring-0 p-0"
                    />
                  </div>

                  {/* Index No / Entrance No */}
                  <div className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-150 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-150">
                    <label className="text-[10px] font-bold text-slate-500 mb-1">Index No / Entrance No</label>
                    <input
                      type="text"
                      value={formData.entranceNo || ""}
                      onChange={(e) => handleChange("entranceNo", e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-slate-850 border-none outline-none focus:ring-0 p-0"
                    />
                  </div>

                  {/* Grade */}
                  <div className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-150 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-150">
                    <label className="text-[10px] font-bold text-slate-500 mb-1">Grade</label>
                    <select
                      value={formData.grade || ""}
                      onChange={(e) => handleChange("grade", e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-slate-850 border-none outline-none focus:ring-0 p-0 cursor-pointer"
                    >
                      <option value="">N/A</option>
                      {[7, 8, 9, 10, 11].map((g) => (
                        <option key={g} value={String(g)}>Grade {g}</option>
                      ))}
                    </select>
                  </div>

                  {/* Address */}
                  <div className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-150 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-150 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 mb-1">Address</label>
                    <input
                      type="text"
                      value={formData.address || ""}
                      onChange={(e) => handleChange("address", e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-slate-850 border-none outline-none focus:ring-0 p-0"
                    />
                  </div>

                  {/* Entrance Date */}
                  <div className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-150 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-150">
                    <label className="text-[10px] font-bold text-slate-500 mb-1">Entrance Date</label>
                    <input
                      type="date"
                      value={formData.entranceDay || ""}
                      onChange={(e) => handleChange("entranceDay", e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-slate-850 border-none outline-none focus:ring-0 p-0 cursor-pointer"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {renderDetailField("Full Name", p.fullName)}
                  {renderDetailField("Index No / Entrance No", p.entranceNo)}
                  {renderDetailField("Grade", p.grade)}
                  {renderDetailField("Address", p.address)}
                  {renderDetailField("Entrance Date", p.entranceDay, "entranceDay")}
                  {renderDetailField("Created At", p.createdAt, "createdAt")}
                </div>
              )}
            </section>

            {/* Section: Academic Term Progress */}
            <section className="space-y-4">
              <h3 className="text-md font-bold text-slate-800 border-l-4 border-blue-600 pl-3">
                Academic Performance & Attendance
              </h3>
              
              {isEditing ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 1st Term */}
                    <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
                      <span className="text-xs font-bold text-blue-700 block uppercase tracking-wider">1st Term</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col p-2 bg-white rounded-lg border border-blue-100 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
                          <label className="text-[9px] font-bold text-blue-600 mb-0.5">Place</label>
                          <input
                            type="text"
                            value={formData.firstTermPlace || ""}
                            onChange={(e) => handleChange("firstTermPlace", e.target.value)}
                            className="w-full bg-transparent text-xs font-semibold text-slate-850 border-none outline-none focus:ring-0 p-0"
                          />
                        </div>
                        <div className="flex flex-col p-2 bg-white rounded-lg border border-blue-100 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
                          <label className="text-[9px] font-bold text-blue-600 mb-0.5">Marks</label>
                          <input
                            type="number"
                            step="any"
                            value={formData.firstTermMarks || ""}
                            onChange={(e) => handleChange("firstTermMarks", e.target.value)}
                            className="w-full bg-transparent text-xs font-semibold text-slate-850 border-none outline-none focus:ring-0 p-0"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2nd Term */}
                    <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-3">
                      <span className="text-xs font-bold text-sky-700 block uppercase tracking-wider">2nd Term</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col p-2 bg-white rounded-lg border border-sky-100 focus-within:ring-2 focus-within:ring-sky-200 transition-all">
                          <label className="text-[9px] font-bold text-sky-600 mb-0.5">Place</label>
                          <input
                            type="text"
                            value={formData.secondTermPlace || ""}
                            onChange={(e) => handleChange("secondTermPlace", e.target.value)}
                            className="w-full bg-transparent text-xs font-semibold text-slate-850 border-none outline-none focus:ring-0 p-0"
                          />
                        </div>
                        <div className="flex flex-col p-2 bg-white rounded-lg border border-sky-100 focus-within:ring-2 focus-within:ring-sky-200 transition-all">
                          <label className="text-[9px] font-bold text-sky-600 mb-0.5">Marks</label>
                          <input
                            type="number"
                            step="any"
                            value={formData.secondTermMarks || ""}
                            onChange={(e) => handleChange("secondTermMarks", e.target.value)}
                            className="w-full bg-transparent text-xs font-semibold text-slate-850 border-none outline-none focus:ring-0 p-0"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 3rd Term */}
                    <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                      <span className="text-xs font-bold text-indigo-700 block uppercase tracking-wider">3rd Term</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col p-2 bg-white rounded-lg border border-indigo-100 focus-within:ring-2 focus-within:ring-indigo-200 transition-all">
                          <label className="text-[9px] font-bold text-indigo-600 mb-0.5">Place</label>
                          <input
                            type="text"
                            value={formData.thirdTermPlace || ""}
                            onChange={(e) => handleChange("thirdTermPlace", e.target.value)}
                            className="w-full bg-transparent text-xs font-semibold text-slate-850 border-none outline-none focus:ring-0 p-0"
                          />
                        </div>
                        <div className="flex flex-col p-2 bg-white rounded-lg border border-indigo-100 focus-within:ring-2 focus-within:ring-indigo-200 transition-all">
                          <label className="text-[9px] font-bold text-indigo-600 mb-0.5">Marks</label>
                          <input
                            type="number"
                            step="any"
                            value={formData.thirdTermMarks || ""}
                            onChange={(e) => handleChange("thirdTermMarks", e.target.value)}
                            className="w-full bg-transparent text-xs font-semibold text-slate-850 border-none outline-none focus:ring-0 p-0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Absent Days */}
                    <div className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-150 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-150">
                      <label className="text-[10px] font-bold text-slate-500 mb-1">Absent Days (Count)</label>
                      <input
                        type="number"
                        value={formData.absentDaysCount || ""}
                        onChange={(e) => handleChange("absentDaysCount", e.target.value)}
                        className="w-full bg-transparent text-sm font-semibold text-slate-850 border-none outline-none focus:ring-0 p-0"
                      />
                    </div>

                    {/* Poya Day Attendance */}
                    <div className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-150 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-150">
                      <label className="text-[10px] font-bold text-slate-500 mb-1">Poya Day Attendance (Count)</label>
                      <input
                        type="number"
                        value={formData.poyaDayCount || ""}
                        onChange={(e) => handleChange("poyaDayCount", e.target.value)}
                        className="w-full bg-transparent text-sm font-semibold text-slate-850 border-none outline-none focus:ring-0 p-0"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
                      <span className="text-xs font-bold text-blue-700 block uppercase tracking-wider">1st Term</span>
                      <div className="grid grid-cols-2 gap-2">
                        {renderDetailField("Place", p.firstTermPlace)}
                        {renderDetailField("Marks", p.firstTermMarks)}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-2">
                      <span className="text-xs font-bold text-sky-700 block uppercase tracking-wider">2nd Term</span>
                      <div className="grid grid-cols-2 gap-2">
                        {renderDetailField("Place", p.secondTermPlace)}
                        {renderDetailField("Marks", p.secondTermMarks)}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                      <span className="text-xs font-bold text-indigo-700 block uppercase tracking-wider">3rd Term</span>
                      <div className="grid grid-cols-2 gap-2">
                        {renderDetailField("Place", p.thirdTermPlace)}
                        {renderDetailField("Marks", p.thirdTermMarks)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderDetailField("Absent Days (Count)", p.absentDaysCount)}
                    {renderDetailField("Poya Day Attendance (Count)", p.poyaDayCount)}
                  </div>
                </>
              )}
            </section>

            {/* Section: Extra-Curricular & Leadership */}
            <section className="space-y-4">
              <h3 className="text-md font-bold text-slate-800 border-l-4 border-blue-600 pl-3">
                Extra-Curricular Activities & Leadership Roles
              </h3>
              
              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderEditableActivityRow("Served as Prefect", "isPrefect", "isPrefectYears")}
                  {renderEditableActivityRow("Class Leader", "isClassLeader", "isClassLeaderYears")}
                  {renderEditableActivityRow("Participated in Competitions", "participateForCompetitions", "participateForCompetitionsYears")}
                  {renderEditableActivityRow("In Announcing Club", "isInAnnouncingClub", "isInAnnouncingClubYears")}
                  {renderEditableActivityRow("Performed On Stage / Drama", "isOnStage", "isOnStageYears")}
                  {renderEditableActivityRow("Katina Festival Organizing", "participateToKatina", "participateToKatinaYears")}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderActivityRow("Served as Prefect", p.isPrefect, p.isPrefectYears)}
                  {renderActivityRow("Class Leader", p.isClassLeader, p.isClassLeaderYears)}
                  {renderActivityRow("Participated in Competitions", p.participateForCompetitions, p.participateForCompetitionsYears)}
                  {renderActivityRow("In Announcing Club", p.isInAnnouncingClub, p.isInAnnouncingClubYears)}
                  {renderActivityRow("Performed On Stage / Drama", p.isOnStage, p.isOnStageYears)}
                  {renderActivityRow("Katina Festival Organizing", p.participateToKatina, p.participateToKatinaYears)}
                </div>
              )}
            </section>

            {/* Section: Support Documents & Agreements */}
            <section className="space-y-4">
              <h3 className="text-md font-bold text-slate-800 border-l-4 border-blue-600 pl-3">
                Agreements & Supporting Documents
              </h3>
              
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Student Agreement */}
                  <div className="flex flex-col p-4 rounded-xl bg-slate-50 border border-slate-100 justify-between gap-3 shadow-sm">
                    <span className="font-semibold text-slate-700 text-sm">Student Agreement</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleChange("studentAgreement", !formData.studentAgreement)}
                        className={`px-4 py-1.5 rounded-full text-xs font-extrabold border transition-all active:scale-95 ${
                          formData.studentAgreement
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-rose-100 text-rose-800 border-rose-200"
                        }`}
                      >
                        {formData.studentAgreement ? "Agreed ✓" : "Not Agreed ✗"}
                      </button>
                    </div>
                  </div>

                  {/* Parent Agreement */}
                  <div className="flex flex-col p-4 rounded-xl bg-slate-50 border border-slate-100 gap-3 shadow-sm">
                    <span className="font-semibold text-slate-700 text-sm">Parent Agreement</span>
                    <div className="flex flex-col p-2 bg-white rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                      <label className="text-[10px] font-bold text-slate-500 mb-0.5">Parent Name</label>
                      <input
                        type="text"
                        value={formData.parentsName || ""}
                        onChange={(e) => handleChange("parentsName", e.target.value)}
                        className="w-full bg-transparent text-xs font-semibold text-slate-800 border-none outline-none focus:ring-0 p-0"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleChange("parentsAgreement", !formData.parentsAgreement)}
                        className={`px-4 py-1.5 rounded-full text-xs font-extrabold border transition-all active:scale-95 ${
                          formData.parentsAgreement
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-rose-100 text-rose-800 border-rose-200"
                        }`}
                      >
                        {formData.parentsAgreement ? "Agreed ✓" : "Not Agreed ✗"}
                      </button>
                    </div>
                  </div>

                  {/* Library Status */}
                  <div className="flex flex-col p-4 rounded-xl bg-slate-50 border border-slate-100 justify-between gap-3 shadow-sm">
                    <span className="font-semibold text-slate-700 text-sm">Library Status</span>
                    <div className="flex flex-col p-2 bg-white rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                      <label className="text-[10px] font-bold text-slate-500 mb-0.5">Evaluation Status</label>
                      <select
                        value={formData.libraryStatus || ""}
                        onChange={(e) => handleChange("libraryStatus", e.target.value)}
                        className="w-full bg-transparent text-xs font-semibold text-slate-800 border-none outline-none focus:ring-0 p-0 cursor-pointer"
                      >
                        <option value="">N/A</option>
                        <option value="VERY_GOOD">Very Good</option>
                        <option value="GOOD">Good</option>
                        <option value="NORMAL">Normal</option>
                        <option value="WEAK">Weak</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                    <span className="font-semibold text-slate-700 text-sm">Student Agreement</span>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        p.studentAgreement ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}>
                        {p.studentAgreement ? "Agreed" : "Not Agreed"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                    <span className="font-semibold text-slate-700 text-sm">Parent Agreement</span>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Parent Name:</span>
                        <span className="text-xs font-bold text-slate-850">{p.parentsName || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          p.parentsAgreement ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {p.parentsAgreement ? "Agreed" : "Not Agreed"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                    <span className="font-semibold text-slate-700 text-sm">Library Status</span>
                    <div className="flex items-center gap-2">
                      {getLibraryStatusBadge(p.libraryStatus as any)}
                    </div>
                  </div>
                </div>
              )}

              {/* Document Image Previews */}
              {(p.teachersConfirmFile || p.teachersAgreementFile || p.libraryStatusConfirmationFile) && (
                <div className="mt-4 p-5 rounded-2xl border border-slate-200 bg-slate-50/30 space-y-4">
                  <span className="text-xs font-bold text-slate-800 block uppercase tracking-wider">Verification Document Previews</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {renderFileAsImage("Teacher Confirmation File", p.teachersConfirmFile)}
                    {renderFileAsImage("Teacher Agreement / Sign Letter", p.teachersAgreementFile)}
                    {renderFileAsImage("Library Status Confirmation", p.libraryStatusConfirmationFile)}
                  </div>
                </div>
              )}
            </section>
            {/* Section: Administration Controls */}
            <section className="p-6 rounded-3xl bg-slate-100 border border-slate-200 shadow-inner space-y-5">
              <h3 className="text-md font-extrabold text-slate-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                Administration Controls
              </h3>
              
              {isEditing || p.status === "PENDING" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Status Dropdown */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-700 mb-1.5">Application Status</label>
                      <select
                        value={formData.status || "PENDING"}
                        onChange={(e) => handleChange("status", e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 shadow-sm cursor-pointer"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="SELECTED">Selected</option>
                        <option value="NOT_SELECTED">Not Selected</option>
                      </select>
                    </div>

                    {/* Marks Input */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-700 mb-1.5">Marks</label>
                      <input
                        type="number"
                        step="any"
                        value={formData.marks || ""}
                        placeholder="Enter selection marks..."
                        onChange={(e) => handleChange("marks", e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 shadow-sm"
                      />
                    </div>

                    {/* Date Input */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-700 mb-1.5">Date Submitted / Evaluation Date</label>
                      <input
                        type="date"
                        value={formData.date || ""}
                        onChange={(e) => handleChange("date", e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 shadow-sm cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Teacher Agreement Checkbox Card (Entire container is clickable) */}
                  <label className="flex items-start gap-3 p-4 bg-white border border-slate-300 rounded-xl shadow-sm hover:bg-slate-50 transition-colors duration-150 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formData.teachersAgreement}
                      onChange={(e) => handleChange("teachersAgreement", e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer mt-0.5"
                    />
                    <div className="flex flex-col select-none cursor-pointer flex-1">
                      <span className="text-sm font-bold text-slate-800">Teacher Agreement Signed / Approved</span>
                      <span className="text-xs text-slate-500 mt-0.5">Tick to verify and confirm that the teacher agreement has been signed and approved for this application.</span>
                    </div>
                  </label>

                  {/* Special Note Input */}
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-700 mb-1.5">Special Notes / Remarks</label>
                    <textarea
                      rows={3}
                      value={formData.specialNote || ""}
                      placeholder="Enter administrative notes or comments here..."
                      onChange={(e) => handleChange("specialNote", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 shadow-sm resize-y"
                    />
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex justify-end pt-2 gap-3">
                    {p.status !== "PENDING" && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          initFormData();
                        }}
                        className="px-5 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-all duration-150 active:scale-95 text-sm"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/10 font-bold transition-all duration-150 disabled:opacity-50 active:scale-95 text-sm"
                    >
                      {isSaving ? "Saving..." : (p.status === "PENDING" ? "Save Administration Details" : "Save All Changes")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Status Display */}
                    <div className="flex flex-col p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Application Status</span>
                      <div>{getStatusBadge(p.status)}</div>
                    </div>

                    {/* Marks Display */}
                    <div className="flex flex-col p-4 rounded-xl bg-white border border-slate-200 shadow-sm justify-between gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Evaluation Marks</span>
                      <span className="text-lg font-extrabold text-blue-700">
                        {p.marks !== null && p.marks !== undefined ? `${p.marks} / 100` : "N/A"}
                      </span>
                    </div>

                    {/* Date Display */}
                    <div className="flex flex-col p-4 rounded-xl bg-white border border-slate-200 shadow-sm justify-between gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Evaluation Date</span>
                      <span className="text-sm font-semibold text-slate-800">
                        {p.date ? new Date(p.date).toLocaleDateString("en-CA") : "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Teacher Agreement Status Display */}
                  <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      p.teachersAgreement ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    }`}>
                      {p.teachersAgreement ? "✓" : "✗"}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800">Teacher Agreement Signed / Approved</span>
                      <span className="text-xs text-slate-500 mt-0.5">
                        {p.teachersAgreement ? "Verified & Approved" : "Pending Signature / Verification"}
                      </span>
                    </div>
                  </div>

                  {/* Special Note Remarks Display */}
                  <div className="flex flex-col p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Special Notes / Remarks</span>
                    <p className="text-sm font-semibold text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {p.specialNote || "No notes or remarks entered."}
                    </p>
                  </div>

                  {/* Edit Details Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/10 font-bold transition-all duration-150 active:scale-95 text-sm flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                      Edit Details
                    </button>
                  </div>
                </div>
              )}
            </section>
            
          </form>

        </div>

      </div>

      {/* Lightbox / Image Preview Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md transition-opacity duration-200" onClick={() => setLightboxImage(null)} />
          
          {/* Lightbox Header */}
          <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between p-6 text-white max-w-6xl mx-auto w-full">
            <span className="font-extrabold text-lg tracking-wide uppercase drop-shadow">
              {lightboxImage.label}
            </span>
            <button
              onClick={() => setLightboxImage(null)}
              className="rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white p-2.5 transition-all duration-150 backdrop-blur-sm shadow-lg border border-white/10"
              title="Close Preview"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          {/* Lightbox Image Container */}
          <div className="relative max-w-5xl max-h-[80vh] flex items-center justify-center z-10">
            <img
              src={lightboxImage.url}
              alt={lightboxImage.label}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/5"
            />
          </div>
        </div>
      )}
    </div>
  );
}
