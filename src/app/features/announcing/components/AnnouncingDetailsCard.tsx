"use client";

import React, { useState, useEffect } from "react";
import { updateAnnouncing } from "../api/announcingApi";

interface AnnouncingDetailsCardProps {
  announcing: any;
  onClose: () => void;
  onSave: (id?: string) => void;
}

export default function AnnouncingDetailsCard({ announcing, onClose, onSave }: AnnouncingDetailsCardProps) {
  // Mode toggler state
  const [isEditing, setIsEditing] = useState(false);
  
  // Local form state for all fields
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  const talentKeys = [
    { key: "announcing", label: "Announcing" },
    { key: "kathika", label: "Kathika" },
    { key: "padyagayana", label: "Padyagayana" },
    { key: "debate", label: "Debate" },
    { key: "acting", label: "Acting" },
    { key: "singing", label: "Singing" },
    { key: "dancing", label: "Dancing" },
    { key: "prefectOrClassLeader", label: "Prefect Or Class Leader" },
    { key: "committee", label: "Committee" },
    { key: "other", label: "Other" }
  ];

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSpecialChange = (talentKey: string, field: string, value: any) => {
    setFormData((prev) => {
      const existingSpecial = prev.special || {};
      const existingTalent = existingSpecial[talentKey] || { earlierSchool: null, school: null, other: null };
      return {
        ...prev,
        special: {
          ...existingSpecial,
          [talentKey]: {
            ...existingTalent,
            [field]: value === "" ? null : value,
          }
        }
      };
    });
  };

  const initFormData = () => {
    if (announcing) {
      // Format birthday date as YYYY-MM-DD for standard date input
      let formattedBirthday = "";
      if (announcing.birthday) {
        try {
          formattedBirthday = new Date(announcing.birthday).toISOString().split("T")[0];
        } catch {}
      }

      const specialData: Record<string, any> = {};
      if (announcing.special) {
        talentKeys.forEach(({ key }) => {
          const raw = announcing.special[key];
          if (raw) {
            specialData[key] = {
              earlierSchool: raw.earlierSchool || null,
              school: raw.school || null,
              other: raw.other || null,
            };
          }
        });
      }

      setFormData({
        fullNameWithSurname: announcing.fullNameWithSurname || "",
        birthday: formattedBirthday,
        address: announcing.address || "",
        phoneLand: announcing.phoneLand || "",
        phoneMobile: announcing.phoneMobile || "",
        school: announcing.school || "",
        guardianName: announcing.guardianName || "",
        guardianAddress: announcing.guardianAddress || "",
        studentAgreement: !!announcing.studentAgreement,
        status: announcing.status || "PENDING",
        marks: announcing.marks !== undefined && announcing.marks !== null ? String(announcing.marks) : "",
        special: specialData,
      });
    }
  };

  useEffect(() => {
    initFormData();
  }, [announcing]);

  if (!announcing) return null;

  const a = announcing;

  const handleSaveForm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!a.id) return;

    setIsSaving(true);
    try {
      const getTrimmedOrNull = (val: unknown): string | null => {
        if (val === undefined || val === null) return null;
        const str = String(val).trim();
        return str === "" ? null : str;
      };

      const payload = {
        fullNameWithSurname: getTrimmedOrNull(formData.fullNameWithSurname) || a.fullNameWithSurname,
        birthday: getTrimmedOrNull(formData.birthday),
        address: getTrimmedOrNull(formData.address),
        phoneLand: getTrimmedOrNull(formData.phoneLand),
        phoneMobile: getTrimmedOrNull(formData.phoneMobile),
        school: getTrimmedOrNull(formData.school),
        guardianName: getTrimmedOrNull(formData.guardianName),
        guardianAddress: getTrimmedOrNull(formData.guardianAddress),
        studentAgreement: !!formData.studentAgreement,
        status: formData.status || "PENDING",
        marks: formData.marks === "" || formData.marks === undefined || formData.marks === null ? null : Number(formData.marks),
        special: formData.special,
      };

      await updateAnnouncing(a.id as string, payload);

      alert("Announcing application details updated successfully!");
      setIsEditing(false);
      onSave(a.id as string); // Refresh the parent dashboard list
    } catch (err: any) {
      alert("Failed to update details: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Static detail formatting helpers
  const formatValue = (key: string, value: unknown): string => {
    if (value === undefined || value === null || String(value).trim() === "") return "N/A";

    if (key === "birthday" || key === "createdAt") {
      try {
        return new Date(String(value)).toLocaleDateString("en-CA");
      } catch {
        return String(value);
      }
    }
    return String(value);
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

  const renderTalentDetails = (talentKey: string, label: string) => {
    const talent = a.special?.[talentKey];
    const hasTalent = talent && (talent.earlierSchool || talent.school || talent.other);

    return (
      <div className="flex flex-col p-4 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-sm transition-all duration-200 gap-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-700 text-sm">{label}</span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
            hasTalent ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
          }`}>
            {hasTalent ? "Yes" : "No"}
          </span>
        </div>
        {hasTalent && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
            <div className="flex flex-col p-2.5 bg-white rounded-lg border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 mb-1 block">In Dhamma School</span>
              <div className="text-xs text-slate-800 font-semibold break-words whitespace-pre-wrap leading-relaxed">{talent.earlierSchool || "—"}</div>
            </div>
            <div className="flex flex-col p-2.5 bg-white rounded-lg border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 mb-1 block">In Regular School</span>
              <div className="text-xs text-slate-800 font-semibold break-words whitespace-pre-wrap leading-relaxed">{talent.school || "—"}</div>
            </div>
            <div className="flex flex-col p-2.5 bg-white rounded-lg border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 mb-1 block">Other achievements</span>
              <div className="text-xs text-slate-800 font-semibold break-words whitespace-pre-wrap leading-relaxed">{talent.other || "—"}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderEditableTalentDetails = (talentKey: string, label: string) => {
    const talent = formData.special?.[talentKey] || { earlierSchool: null, school: null, other: null };
    const hasTalent = !!(talent.earlierSchool || talent.school || talent.other);

    return (
      <div className="flex flex-col p-4 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-sm transition-all duration-200 gap-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-700 text-sm">{label}</span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
            hasTalent ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
          }`}>
            {hasTalent ? "Active" : "Inactive"}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
          <div className="flex flex-col p-2.5 bg-white rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-blue-100">
            <span className="text-[9px] font-bold text-slate-500 mb-1.5 block">In Dhamma School</span>
            <textarea
              rows={3}
              value={talent.earlierSchool || ""}
              onChange={(e) => handleSpecialChange(talentKey, "earlierSchool", e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-slate-900 border-none outline-none focus:ring-0 p-0 resize-y min-h-[4rem]"
              placeholder="Achievements..."
            />
          </div>
          <div className="flex flex-col p-2.5 bg-white rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-blue-100">
            <span className="text-[9px] font-bold text-slate-500 mb-1.5 block">In Regular School</span>
            <textarea
              rows={3}
              value={talent.school || ""}
              onChange={(e) => handleSpecialChange(talentKey, "school", e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-slate-900 border-none outline-none focus:ring-0 p-0 resize-y min-h-[4rem]"
              placeholder="Achievements..."
            />
          </div>
          <div className="flex flex-col p-2.5 bg-white rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-blue-100">
            <span className="text-[9px] font-bold text-slate-500 mb-1.5 block">Other Achievements</span>
            <textarea
              rows={3}
              value={talent.other || ""}
              onChange={(e) => handleSpecialChange(talentKey, "other", e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-slate-900 border-none outline-none focus:ring-0 p-0 resize-y min-h-[4rem]"
              placeholder="Achievements..."
            />
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none mb-2">
                {isEditing ? (formData.fullNameWithSurname || a.fullNameWithSurname) : a.fullNameWithSurname}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Announcing Application Card</span>
                <span className="text-slate-300">•</span>
                {getStatusBadge(isEditing ? (formData.status || a.status) : a.status)}
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
                  <div className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-150 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-150 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.fullNameWithSurname || ""}
                      onChange={(e) => handleChange("fullNameWithSurname", e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-slate-850 border-none outline-none focus:ring-0 p-0"
                    />
                  </div>

                  {/* Birthday */}
                  <div className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-150 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-150">
                    <label className="text-[10px] font-bold text-slate-500 mb-1">Birthday</label>
                    <input
                      type="date"
                      value={formData.birthday || ""}
                      onChange={(e) => handleChange("birthday", e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-slate-850 border-none outline-none focus:ring-0 p-0 cursor-pointer"
                    />
                  </div>

                  {/* Address */}
                  <div className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-150 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-150 md:col-span-3">
                    <label className="text-[10px] font-bold text-slate-500 mb-1">Address</label>
                    <input
                      type="text"
                      value={formData.address || ""}
                      onChange={(e) => handleChange("address", e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-slate-850 border-none outline-none focus:ring-0 p-0"
                    />
                  </div>

                  {/* Phone Mobile */}
                  <div className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-150 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-150">
                    <label className="text-[10px] font-bold text-slate-500 mb-1">Mobile No</label>
                    <input
                      type="text"
                      value={formData.phoneMobile || ""}
                      onChange={(e) => handleChange("phoneMobile", e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-slate-850 border-none outline-none focus:ring-0 p-0"
                    />
                  </div>

                  {/* Phone Landline */}
                  <div className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-150 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-150">
                    <label className="text-[10px] font-bold text-slate-500 mb-1">Landline No</label>
                    <input
                      type="text"
                      value={formData.phoneLand || ""}
                      onChange={(e) => handleChange("phoneLand", e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-slate-850 border-none outline-none focus:ring-0 p-0"
                    />
                  </div>

                  {/* School */}
                  <div className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-150 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-150">
                    <label className="text-[10px] font-bold text-slate-500 mb-1">School</label>
                    <input
                      type="text"
                      value={formData.school || ""}
                      onChange={(e) => handleChange("school", e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-slate-850 border-none outline-none focus:ring-0 p-0"
                    />
                  </div>

                  {/* Student Agreement Checkbox */}
                  <label className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition-colors duration-150 cursor-pointer focus-within:ring-2 focus-within:ring-blue-100 md:col-span-3">
                    <input
                      type="checkbox"
                      checked={!!formData.studentAgreement}
                      onChange={(e) => handleChange("studentAgreement", e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer mt-0.5"
                    />
                    <div className="flex flex-col select-none cursor-pointer flex-1">
                      <span className="text-xs font-bold text-slate-800">Student Agreement Signed</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">Tick to verify and confirm that student agreement has been signed and approved.</span>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {renderDetailField("Full Name", a.fullNameWithSurname)}
                  {renderDetailField("Birthday", a.birthday, "birthday")}
                  {renderDetailField("Address", a.address)}
                  {renderDetailField("Mobile No", a.phoneMobile)}
                  {renderDetailField("Landline No", a.phoneLand)}
                  {renderDetailField("School", a.school)}
                  
                  {/* Student Agreement Readonly box */}
                  <div className="flex flex-col p-3 rounded-lg bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                    <span className="text-xs font-medium text-slate-500 mb-1.5">Student Agreement</span>
                    <div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        a.studentAgreement ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}>
                        {a.studentAgreement ? "Agreed" : "Not Agreed"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Section: Parent / Guardian Information */}
            <section className="space-y-4">
              <h3 className="text-md font-bold text-slate-800 border-l-4 border-blue-600 pl-3">
                Parent / Guardian Information
              </h3>
              
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Guardian Name */}
                  <div className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-150 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-150">
                    <label className="text-[10px] font-bold text-slate-500 mb-1">Parent/Guardian Name</label>
                    <input
                      type="text"
                      value={formData.guardianName || ""}
                      onChange={(e) => handleChange("guardianName", e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-slate-850 border-none outline-none focus:ring-0 p-0"
                    />
                  </div>

                  {/* Guardian Address */}
                  <div className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-150 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-150">
                    <label className="text-[10px] font-bold text-slate-500 mb-1">Parent/Guardian Address</label>
                    <input
                      type="text"
                      value={formData.guardianAddress || ""}
                      onChange={(e) => handleChange("guardianAddress", e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-slate-850 border-none outline-none focus:ring-0 p-0"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderDetailField("Parent/Guardian Name", a.guardianName)}
                  {renderDetailField("Parent/Guardian Address", a.guardianAddress)}
                </div>
              )}
            </section>

            {/* Section: Special Talents */}
            <section className="space-y-4">
              <h3 className="text-md font-bold text-slate-800 border-l-4 border-blue-600 pl-3">
                Special Talents & Achievements
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                {talentKeys.map(({ key, label }) => (
                  isEditing 
                    ? renderEditableTalentDetails(key, label)
                    : renderTalentDetails(key, label)
                ))}
              </div>
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

              {isEditing || a.status === "PENDING" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex justify-end pt-2 gap-3">
                    {a.status !== "PENDING" && (
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
                      {isSaving ? "Saving..." : (a.status === "PENDING" ? "Save Administration Details" : "Save All Changes")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Status Display */}
                    <div className="flex flex-col p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Application Status</span>
                      <div>{getStatusBadge(a.status)}</div>
                    </div>

                    {/* Marks Display */}
                    <div className="flex flex-col p-4 rounded-xl bg-white border border-slate-200 shadow-sm justify-between gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Evaluation Marks</span>
                      <span className="text-lg font-extrabold text-blue-700">
                        {a.marks !== null && a.marks !== undefined ? `${a.marks} / 100` : "N/A"}
                      </span>
                    </div>
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
    </div>
  );
}
