"use client";

import React, { useState, useEffect, useRef } from "react";
import { StudentDTO, Sibling } from "../../studentform/types/types";
import { updateStudent } from "../api/studentsApi";

export default function StudentCard({
  student,
  onClose,
  onUpdate,
}: {
  student: StudentDTO | null;
  onClose: () => void;
  onUpdate?: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<StudentDTO>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (student) {
      setFormData({ ...student });
      setPreviewUrl(typeof student.studentImage === 'string' ? student.studentImage : null);
    }
  }, [student]);

  if (!student) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSiblingChange = (index: number, field: keyof Sibling, value: string) => {
    const newSiblings = [...(formData.siblings || [])];
    newSiblings[index] = { ...newSiblings[index], [field]: value };
    setFormData((prev) => ({ ...prev, siblings: newSiblings }));
  };

  const addSibling = () => {
    setFormData((prev) => ({
      ...prev,
      siblings: [...(prev.siblings || []), { name: "", grade: "" }],
    }));
  };

  const removeSibling = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      siblings: (prev.siblings || []).filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!student.id) return;
    setIsSaving(true);
    try {
      let dataToSubmit: any = formData;
      
      if (selectedFile) {
        const fd = new FormData();
        fd.append('studentImage', selectedFile);
        
        // Append other fields
        Object.entries(formData).forEach(([key, value]) => {
          if (key === 'registrationPayment') return; // Skip non-editable numeric field to avoid string validation error
          if (key === 'siblings') {
            fd.append(key, JSON.stringify(value));
          } else if (value !== null && value !== undefined) {
            fd.append(key, String(value));
          }
        });
        dataToSubmit = fd;
      } else {
        // For JSON submission, also exclude registrationPayment to avoid potential validation issues
        const { registrationPayment: _registrationPayment, ...rest } = formData;
        dataToSubmit = rest;
      }

      await updateStudent(student.id, dataToSubmit);
      setIsEditing(false);
      setSelectedFile(null);
      if (onUpdate) onUpdate();
      alert("Student details updated successfully!");
    } catch (error: any) {
      alert("Error updating student: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const formatValue = (key: string, value: any): string => {
    if (value === undefined || value === null || value === "") return "N/A";
    if (key === "dob" || key === "registrationDate") {
      try {
        return new Date(String(value)).toLocaleDateString("en-CA");
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  const asYesNo = (value: any): string => {
    if (value === true || value === "YES") return "Yes";
    if (value === false || value === "NO") return "No";
    return "N/A";
  };

  const renderField = (label: string, name: keyof StudentDTO, type: string = "text", options?: { label: string, value: any }[]) => {
    const value = formData[name] as any;
    
    if (isEditing && name !== "registrationPayment") {
      return (
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-semibold text-slate-700">{label}</label>
          {type === "select" ? (
            <select
              name={name}
              value={value || ""}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            >
              <option value="">Select {label}</option>
              {options?.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : type === "textarea" ? (
            <textarea
              name={name}
              value={value || ""}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          ) : (
            <input
              type={type}
              name={name}
              value={type === "date" && value ? new Date(value).toISOString().split('T')[0] : (value || "")}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          )}
        </div>
      );
    }

    const displayValue = formatValue(name as string, student[name]);
    return (
      <div className="flex flex-col">
        <label className="mb-2 text-sm font-semibold text-slate-700">{label}</label>
        <p className={`${displayValue === "N/A" ? "text-slate-400" : "text-slate-900"} rounded-lg bg-slate-50 p-3 text-sm border border-slate-100`}>
          {displayValue}
        </p>
      </div>
    );
  };

  const renderYesNoField = (label: string, name: keyof StudentDTO) => {
    const value = formData[name];
    
    if (isEditing) {
      return (
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-semibold text-slate-700">{label}</label>
          <select
            name={name}
            value={value === true || value === "YES" ? "YES" : value === false || value === "NO" ? "NO" : ""}
            onChange={(e) => {
                const val = e.target.value;
                setFormData(prev => ({ ...prev, [name]: val === "YES" }));
            }}
            className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
          >
            <option value="">Select</option>
            <option value="YES">Yes</option>
            <option value="NO">No</option>
          </select>
        </div>
      );
    }

    const displayValue = asYesNo(student[name]);
    return (
      <div className="flex flex-col">
        <label className="mb-2 text-sm font-semibold text-slate-700">{label}</label>
        <p className={`${displayValue === "N/A" ? "text-slate-400" : "text-slate-900"} rounded-lg bg-slate-50 p-3 text-sm border border-slate-100`}>
          {displayValue}
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative max-h-[90vh] w-full max-w-5xl overflow-auto rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur-md p-6 px-8 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="relative group">
                <div className={`h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-white shadow-md ring-1 ring-slate-200 bg-slate-50 flex items-center justify-center ${isEditing ? 'cursor-pointer hover:ring-blue-400' : ''}`}
                     onClick={() => isEditing && fileInputRef.current?.click()}>
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Student profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                        <svg className="h-10 w-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                    )}
                    {isEditing && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                        </div>
                    )}
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {student.fullNameWithSurname || "Student Details"}
              </h2>
              <p className="text-slate-500 text-sm mt-1">ID: {student.id}</p>
            </div>
          </div>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-xl bg-blue-600 px-6 py-2.5 font-bold text-white transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => {
                      setIsEditing(false);
                      setFormData({ ...student });
                      setSelectedFile(null);
                      setPreviewUrl(typeof student.studentImage === 'string' ? student.studentImage : null);
                  }}
                  className="rounded-xl bg-slate-100 px-6 py-2.5 font-bold text-slate-700 transition-all hover:bg-slate-200 active:scale-95"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="rounded-xl bg-blue-50 px-6 py-2.5 font-bold text-blue-600 transition-all hover:bg-blue-100 active:scale-95 border border-blue-100"
                >
                  Edit Details
                </button>
                <button
                  onClick={onClose}
                  className="rounded-xl bg-slate-100 px-6 py-2.5 font-bold text-slate-700 transition-all hover:bg-slate-200 active:scale-95"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-10 p-8">
          {/* Main Information */}
          <section>
            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
              <span className="h-6 w-1 bg-blue-600 rounded-full"></span>
              Main Information
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {renderField("Full Name", "fullNameWithSurname")}
              {renderField("Name with Initials", "nameWithInitials")}
              {renderField("Grade", "grade", "select", [1,2,3,4,5,6,7,8,9,10,11].map(g => ({ label: `Grade ${g}`, value: g.toString() })))}
              {renderField("Date of Birth", "dob", "date")}
              {renderField("Phone 1", "phone1")}
              {renderField("Phone 2", "phone2")}
              <div className="md:col-span-3">
                {renderField("Address", "address", "textarea")}
              </div>
            </div>
          </section>

          {/* Academic & Administrative */}
          <section>
            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
              <span className="h-6 w-1 bg-blue-600 rounded-full"></span>
              Academic & Administrative
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {renderField("Index No", "indexNo")}
              {renderField("Library No", "libraryNo")}
              {renderField("House", "house")}
              {renderField("Registration Date", "registrationDate", "date")}
              {renderField("Registration Payment", "registrationPayment", "number")}
              {renderField("Active Monitor", "studentActiveMonitor", "select", [
                  { label: "Not Given", value: "NOT_GIVEN" },
                  { label: "Given", value: "GIVEN" },
                  { label: "Other", value: "OTHER" }
              ])}
            </div>
          </section>

          {/* Family Information */}
          <section>
            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
              <span className="h-6 w-1 bg-blue-600 rounded-full"></span>
              Family Information
            </h3>
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {renderField("Father Name", "fatherFullName")}
                {renderField("Father Job", "fatherJob")}
                {renderField("Father Job Address", "fatherJobAddress")}
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {renderField("Mother Name", "motherFullName")}
                {renderField("Mother Job", "motherJob")}
                {renderField("Mother Job Address", "motherJobAddress")}
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3 border-t border-slate-100 pt-6">
                {renderField("Guardian Name", "guardianFullName")}
                {renderField("Guardian Job", "guardianJob")}
                {renderField("Guardian Job Address", "guardianJobAddress")}
              </div>
            </div>
          </section>

          {/* Siblings */}
          <section>
            <div className="flex items-center justify-between mb-6">
                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <span className="h-6 w-1 bg-blue-600 rounded-full"></span>
                    Siblings
                </h3>
                {isEditing && (
                    <button
                        onClick={addSibling}
                        className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        Add Sibling
                    </button>
                )}
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {isEditing ? (
                    (formData.siblings || []).map((sibling, idx) => (
                        <div key={idx} className="relative rounded-xl bg-slate-50 p-6 border border-slate-200 space-y-4">
                            <button
                                onClick={() => removeSibling(idx)}
                                className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                            <div className="grid grid-cols-1 gap-4">
                                <input
                                    placeholder="Sibling Name"
                                    value={sibling.name}
                                    onChange={(e) => handleSiblingChange(idx, 'name', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm"
                                />
                                <select
                                    value={sibling.grade || ""}
                                    onChange={(e) => handleSiblingChange(idx, 'grade', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm"
                                >
                                    <option value="">Select Grade</option>
                                    {[1,2,3,4,5,6,7,8,9,10,11].map(g => (
                                        <option key={g} value={g.toString()}>{g}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ))
                ) : (
                    (student.siblings || []).length > 0 ? (
                        (student.siblings || []).map((sibling: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center rounded-xl bg-slate-50 p-4 border border-slate-100">
                                <span className="font-medium text-slate-700">{sibling.name}</span>
                                <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">Grade {sibling.grade}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-400 text-sm italic">No siblings information available</p>
                    )
                )}
            </div>
          </section>

          {/* Medical & Emergency */}
          <section>
            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
              <span className="h-6 w-1 bg-blue-600 rounded-full"></span>
              Medical & Emergency
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {renderField("Emergency Person", "emergencyPersonName")}
              {renderField("Emergency Number", "emergencyNumber")}
              {renderField("Emergency Address", "emergencyPersonAddress")}
              {renderYesNoField("Disabilities", "disabilities")}
              {renderField("Disability Reason", "disabilityReason")}
              {renderYesNoField("Medicated", "medicated")}
              {renderField("Medicine", "medicine")}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
