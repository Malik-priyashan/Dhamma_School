"use client";

import React, { useEffect, useState } from "react";
import { StudentDTO } from "../../../studentform/types/types";
import { fetchMarksByStudentAndYear, createMark, updateMark } from "../api/marksApi";
import { MarkDTO } from "../types/marks.types";

interface StudentMarkCardProps {
  student: StudentDTO;
  academicYear: string;
  teacherName: string;
  grade: string;
  allowUpdate?: boolean;
}

export default function StudentMarkCard({ student, academicYear, teacherName, grade, allowUpdate = false }: StudentMarkCardProps) {
  const [markId, setMarkId] = useState<string | number | undefined>(undefined);
  const [firstTerm, setFirstTerm] = useState<string>("");
  const [secondTerm, setSecondTerm] = useState<string>("");
  const [thirdTerm, setThirdTerm] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    let active = true;
    async function loadMarks() {
      if (!student.id || !academicYear) return;
      const data = await fetchMarksByStudentAndYear(student.id, academicYear);
      if (active) {
        if (data) {
          setMarkId(data.id);
          setFirstTerm(data.firstTerm !== undefined && data.firstTerm !== null ? data.firstTerm.toString() : "");
          setSecondTerm(data.secondTerm !== undefined && data.secondTerm !== null ? data.secondTerm.toString() : "");
          setThirdTerm(data.thirdTerm !== undefined && data.thirdTerm !== null ? data.thirdTerm.toString() : "");
        } else {
          setMarkId(undefined);
          setFirstTerm("");
          setSecondTerm("");
          setThirdTerm("");
        }
      }
    }
    loadMarks();
    return () => { active = false; };
  }, [student.id, academicYear]);

  const handleSave = async () => {
    if (!academicYear.trim()) {
       setMessage({ text: "Academic Year is required", type: "error" });
       return;
    }
    
    setIsSaving(true);
    setMessage(null);

    const payload: Partial<MarkDTO> = {
      studentId: student.id,
      academicYear,
      teacherName,
      grade,
      firstTerm: firstTerm ? Number(firstTerm) : undefined,
      secondTerm: secondTerm ? Number(secondTerm) : undefined,
      thirdTerm: thirdTerm ? Number(thirdTerm) : undefined,
    };

    try {
      if (markId) {
        await updateMark(markId, payload);
        setMessage({ text: "Updated successfully", type: "success" });
      } else {
        const newMark = await createMark(payload);
        if (newMark.id) setMarkId(newMark.id);
        setMessage({ text: "Saved successfully", type: "success" });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ text: "Failed to save: " + (err.message || 'Unknown error'), type: "error" });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300 p-6 flex flex-col justify-between animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-start justify-between">
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
                    <h4 className="font-bold text-slate-900 truncate leading-tight">{student.nameWithInitials || student.fullNameWithSurname || 'N/A'}</h4>
                    <p className="text-slate-500 text-xs font-medium mt-1 truncate">Index: {student.indexNo || 'N/A'}</p>
                </div>
            </div>
        </div>

        {/* Marks Entry Section */}
        <div className="mt-5 pt-5 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-600">First Term</span>
                <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={firstTerm}
                    onChange={(e) => setFirstTerm(e.target.value)}
                    placeholder="0-100" 
                    disabled={!allowUpdate && !!markId}
                    className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                />
            </div>
            <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-600">Second Term</span>
                <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={secondTerm}
                    onChange={(e) => setSecondTerm(e.target.value)}
                    placeholder="0-100" 
                    disabled={!allowUpdate && !!markId}
                    className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                />
            </div>
            <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-600">Third Term</span>
                <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={thirdTerm}
                    onChange={(e) => setThirdTerm(e.target.value)}
                    placeholder="0-100" 
                    disabled={!allowUpdate && !!markId}
                    className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                />
            </div>
            
            {message && (
                <div className={`text-xs text-center font-bold ${message.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                    {message.text}
                </div>
            )}
            
            <button 
                onClick={handleSave}
                disabled={isSaving || (!allowUpdate && !!markId)}
                className="w-full mt-2 py-2.5 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-colors border border-blue-100 hover:border-blue-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSaving ? 'Saving...' : (markId ? (allowUpdate ? 'Update Marks' : 'Marks Saved') : 'Save Marks')}
            </button>
        </div>
    </div>
  );
}
