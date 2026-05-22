"use client";

import React, { useEffect } from "react";
import { StudentRequest } from "../types/types";
import { fetchAllStudents, getStudentById } from "../api/studentRequestsApi";

export default function StudentRequestCard({
  request,
  onClose,
  onAccept,
  onReject,
  processingId,
}: {
  request: StudentRequest | null;
  onClose: () => void;
  onAccept?: (e: React.MouseEvent, req: StudentRequest) => void;
  onReject?: (e: React.MouseEvent, req: StudentRequest) => void;
  processingId?: string | null;
}) {
  const [adminDetails, setAdminDetails] = React.useState({
    indexNo: (request?.indexNo as string) || "",
    libraryNo: (request?.libraryNo as string) || "",
    house: (request?.house as string) || "",
    grade: (request?.grade as string) || "",
    registrationDate: (request?.registrationDate as string) || "",
    registrationPayment: (request?.registrationPayment as string) || "",
    studentActiveMonitor: (request?.studentActiveMonitor as string) || "NOT_GIVEN",
  });

  const [studentData, setStudentData] = React.useState<any>(null);

  useEffect(() => {
    if (request) {
      Promise.resolve().then(() => {
        setAdminDetails({
          indexNo: (request as any).indexNo || "",
          libraryNo: (request as any).libraryNo || "",
          house: (request as any).house || "",
          grade: (request as any).grade || "",
          registrationDate: (request as any).registrationDate || "",
          registrationPayment: (request as any).registrationPayment || "",
          studentActiveMonitor: (request as any).studentActiveMonitor || "NOT_GIVEN",
        });
      });
    }
  }, [request]);

  useEffect(() => {
    if (!request) return;
    Promise.resolve().then(() => {
      setStudentData(null);
    });

    const req = request as any;
    const normalizedStudentName = String(req.fullNameWithSurname || "").trim().toLowerCase();
    const studentLookupId =
      req.studentId ||
      req.acceptedStudentId ||
      req.student?.id ||
      req.student?.studentId ||
      req.student?.uuid ||
      req.id;

    if (request.status !== 'PENDING') {
      const loadStudent = async () => {
        try {
          if (studentLookupId) {
            const directStudent = await getStudentById(studentLookupId);
            if (directStudent) {
              setStudentData(directStudent);
              return;
            }
          }

          const students = await fetchAllStudents();
          const matchedStudent = students.find((student: any) => {
            const studentName = String(student.fullNameWithSurname || student.fullName || "").trim().toLowerCase();
            const sameDob = !req.dob || !student.dob || String(student.dob) === String(req.dob);
            const samePhone = !req.phone1 || !student.phone1 || String(student.phone1) === String(req.phone1);
            const sameGrade = !req.grade || !student.grade || String(student.grade) === String(req.grade);

            return studentName === normalizedStudentName && sameDob && samePhone && sameGrade;
          });

          if (matchedStudent) {
            setStudentData(matchedStudent);
          }
        } catch (error) {
          console.error(error);
        }
      };

      void loadStudent();
    }
  }, [request]);

  if (!request) return null;

  const req = request as any;

  const handleAdminDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    let newAdminDetails = { ...adminDetails, [name]: value };
    
    if (name === "indexNo") {
      const indexNum = parseInt(value, 10);
      if (!isNaN(indexNum)) {
        const remainder = indexNum % 4;
        let house = "";
        if (remainder === 0) house = "METHTHA";
        else if (remainder === 1) house = "KARUNA";
        else if (remainder === 2) house = "MUDITHA";
        else if (remainder === 3) house = "UPEKSHA";
        
        newAdminDetails = { ...newAdminDetails, house };
      }
    }
    
    setAdminDetails(newAdminDetails);
  };


  const formatValue = (key: string, value: unknown): string => {
    if (!value) return "N/A";

    if (key === "dob" || key === "registrationDate") {
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
    return formatValue("", value);
  };

  const formatStudentActiveMonitor = (value: unknown): string => {
    if (!value) return "N/A";
    const strValue = String(value).toUpperCase();
    if (strValue === "NOT_GIVEN") return "Not Given";
    if (strValue === "GIVEN") return "Given";
    if (strValue === "OTHER") return "Other";
    return String(value);
  };

  const pick = (...values: unknown[]) => values.find((value) => value !== undefined && value !== null && String(value).trim() !== "");

  const displayField = (label: string, value: unknown, key = "") => {
    const displayValue = formatValue(key, value);

    return (
      <div className="flex flex-col">
        <label className="mb-2 text-sm font-semibold text-slate-700">{label}</label>
        <p className={`${displayValue === "N/A" ? "text-slate-400" : "text-slate-900"} rounded-lg bg-slate-50 p-3 text-sm`}>
          {displayValue}
        </p>
      </div>
    );
  };

  const displayYesNoField = (label: string, value: unknown) => {
    const displayValue = asYesNo(value);

    return (
      <div className="flex flex-col">
        <label className="mb-2 text-sm font-semibold text-slate-700">{label}</label>
        <p className={`${displayValue === "N/A" ? "text-slate-400" : "text-slate-900"} rounded-lg bg-slate-50 p-3 text-sm`}>
          {displayValue}
        </p>
      </div>
    );
  };

  const isPending = !request.status || request.status === 'PENDING';
  const adminSource = isPending ? req : (studentData || req);

  const siblingItems = Array.isArray(req.siblings) ? req.siblings : [];



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative max-h-[92vh] w-full max-w-6xl overflow-auto rounded-lg bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-md p-6 px-8 shadow-sm">
          <div className="flex items-center gap-6">
            {adminSource?.studentImage || request.studentImage ? (
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-white shadow-lg ring-1 ring-slate-200">
                <img
                  src={adminSource?.studentImage || request.studentImage}
                  alt="Student profile"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-slate-100 border-2 border-white shadow-inner">
                <svg className="h-10 w-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {request.fullNameWithSurname || "Student Request Details"}
              </h2>
              <div className="mt-1 flex items-center gap-3">
                {request.status && (
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                    request.status === 'ACCEPTED' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                    request.status === 'REJECTED' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                    'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
                  }`}>
                    {request.status}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-xl bg-slate-100 px-6 py-3 font-semibold text-slate-700 transition-all hover:bg-slate-200 active:scale-95"
          >
            Close
          </button>
        </div>

        <div className="space-y-8 p-10">

          <section>
            <h3 className="mb-6 border-b-2 border-slate-300 pb-3 text-xl font-bold text-slate-900">Main Information</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {displayField("Full Name", request.fullNameWithSurname, "fullNameWithSurname")}
              {displayField("Address", request.address, "address")}
              {displayField("Phone 1", request.phone1, "phone1")}
              {displayField("Phone 2", pick(req.phone2, req.phoneMobile), "phone2")}
              {displayField("Date of Birth", request.dob, "dob")}
            </div>
          </section>

          <section>
            <h3 className="mb-6 border-b-2 border-slate-300 pb-3 text-xl font-bold text-slate-900">Earlier School</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {displayYesNoField("Had Earlier School", req.earlierSchool)}
              {displayField("Reason for Leave", req.reasonForLeave, "reasonForLeave")}
              {displayField("Earlier School Reason", req.earlierSchoolReason, "earlierSchoolReason")}
            </div>
          </section>

          <section>
            <h3 className="mb-6 border-b-2 border-slate-300 pb-3 text-xl font-bold text-slate-900">Family Information</h3>

            <div className="space-y-8">
              <div>
                <h4 className="mb-4 font-semibold text-slate-800">Father&apos;s Details</h4>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {displayField("Father Name", pick(req.fatherFullName, req.fatherName), "fatherFullName")}
                  {displayField("Father Job", pick(req.fatherJob, req.fatherOccupation), "fatherJob")}
                  {displayField("Father Job Address", req.fatherJobAddress, "fatherJobAddress")}
                </div>
              </div>

              <div>
                <h4 className="mb-4 font-semibold text-slate-800">Mother&apos;s Details</h4>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {displayField("Mother Name", pick(req.motherFullName, req.motherName), "motherFullName")}
                  {displayField("Mother Job", pick(req.motherJob, req.motherOccupation), "motherJob")}
                  {displayField("Mother Job Address", req.motherJobAddress, "motherJobAddress")}
                </div>
              </div>

              <div>
                <h4 className="mb-4 font-semibold text-slate-800">Guardian&apos;s Details</h4>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {displayField("Guardian Name", pick(req.guardianFullName, req.guardianName), "guardianFullName")}
                  {displayField("Guardian Job", pick(req.guardianJob, req.guardianOccupation), "guardianJob")}
                  {displayField("Guardian Job Address", req.guardianJobAddress, "guardianJobAddress")}
                </div>
              </div>

              <div>
                <h4 className="mb-4 font-semibold text-slate-800">Siblings</h4>
                <div className="space-y-3">
                  {siblingItems.length > 0 ? (
                    siblingItems.map((sibling: any, index: number) => (
                      <div key={sibling.id ?? `${sibling.name ?? "sibling"}-${index}`} className="grid grid-cols-1 gap-4 rounded-lg bg-slate-50 p-4 md:grid-cols-2">
                        {displayField(`Sibling ${index + 1} Name`, sibling.name, "siblings")}
                        {displayField(`Sibling ${index + 1} Grade`, sibling.grade, "siblings")}
                      </div>
                    ))
                  ) : (
                    displayField("Siblings Details", req.siblingsDetails, "siblingsDetails")
                  )}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-6 border-b-2 border-slate-300 pb-3 text-xl font-bold text-slate-900">Emergency & Medical Information</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {displayField("Emergency Contact Name", pick(req.emergencyPersonName, req.emergencyContactName, req.emergencyContact), "emergencyPersonName")}
              {displayField("Emergency Address", req.emergencyPersonAddress, "emergencyPersonAddress")}
              {displayField("Emergency Number", pick(req.emergencyNumber, req.emergencyPhone), "emergencyNumber")}
              {displayYesNoField("Disabilities", req.disabilities)}
              {displayField("Disability Reason", req.disabilityReason, "disabilityReason")}
              {displayYesNoField("Medicated", req.medicated)}
              {displayField("Medicine", req.medicine, "medicine")}
            </div>
          </section>

          <section>
            <h3 className="mb-6 border-b-2 border-slate-300 pb-3 text-xl font-bold text-slate-900">Academic & Administrative Details</h3>
            <div className="space-y-8">
              <div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {isPending ? (
                      <>
                        <div className="flex flex-col">
                          <label className="mb-2 text-sm font-semibold text-slate-700">Index No</label>
                          <input type="text" name="indexNo" value={adminDetails.indexNo} onChange={handleAdminDetailsChange} className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none" />
                        </div>
                        <div className="flex flex-col">
                          <label className="mb-2 text-sm font-semibold text-slate-700">Library No</label>
                          <input type="text" name="libraryNo" value={adminDetails.libraryNo} onChange={handleAdminDetailsChange} className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none" />
                        </div>
                        <div className="flex flex-col">
                          <label className="mb-2 text-sm font-semibold text-slate-700">House</label>
                          <input type="text" name="house" value={adminDetails.house} onChange={handleAdminDetailsChange} className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none" />
                        </div>
                        <div className="flex flex-col">
                          <label className="mb-2 text-sm font-semibold text-slate-700">Grade</label>
                          <select name="grade" value={adminDetails.grade} onChange={handleAdminDetailsChange} className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none">
                            <option value="">Select Grade</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((grade) => (
                              <option key={grade} value={grade}>{grade}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col">
                          <label className="mb-2 text-sm font-semibold text-slate-700">Registration Date</label>
                          <input type="date" name="registrationDate" value={adminDetails.registrationDate} onChange={handleAdminDetailsChange} className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none" />
                        </div>
                        {displayField("Registration Payment", req.registrationPayment, "registrationPayment")}
                        <div className="flex flex-col">
                          <label className="mb-2 text-sm font-semibold text-slate-700">Student Active Monitor</label>
                          <select name="studentActiveMonitor" value={adminDetails.studentActiveMonitor} onChange={handleAdminDetailsChange} className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none">
                            <option value="NOT_GIVEN">Not Given</option>
                            <option value="GIVEN">Given</option>
                          </select>
                        </div>
                      </>
                    ) : (
                      <>
                        {studentData ? (
                          <>
                            {displayField("Index No", adminSource?.indexNo ?? studentData?.indexNo, "indexNo")}
                            {displayField("Library No", adminSource?.libraryNo ?? studentData?.libraryNo, "libraryNo")}
                            {displayField("House", adminSource?.house ?? studentData?.house, "house")}
                            {displayField("Grade", adminSource?.grade ?? studentData?.grade, "grade")}
                            {displayField("Registration Date", adminSource?.registrationDate ?? studentData?.registrationDate, "registrationDate")}
                          </>
                        ) : (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 md:col-span-3">
                            Student record not loaded yet. Loading from student table...
                          </div>
                        )}
                        {displayField("Registration Payment", adminSource?.registrationPayment ?? studentData?.registrationPayment, "registrationPayment")}
                        <div className="flex flex-col">
                          <label className="mb-2 text-sm font-semibold text-slate-700">Student Active Monitor</label>
                          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-900">{formatStudentActiveMonitor(studentData?.studentActiveMonitor ?? adminSource?.studentActiveMonitor)}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </section>

          {onAccept && onReject && (
            <section className="flex justify-end gap-4 border-t-2 border-slate-300 pt-6 mt-6">
              {processingId === request.id ? (
                <span className="text-sm font-medium text-slate-500 flex items-center px-4 py-2">Processing...</span>
              ) : (
                <>
                  <button
                    onClick={(e) => onAccept && onAccept(e, { ...request, ...adminDetails })}
                    disabled={!!request.status && request.status !== 'PENDING'}
                    className={`flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors shadow-sm
                      ${(!request.status || request.status === 'PENDING')
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed hidden'
                      }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Accept Student
                  </button>
                  <button
                    onClick={(e) => onReject(e, request)}
                    disabled={!!request.status && request.status !== 'PENDING'}
                    className={`flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors shadow-sm
                      ${(!request.status || request.status === 'PENDING')
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed hidden'
                      }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    Reject Student
                  </button>
                  {!!request.status && request.status !== 'PENDING' && (
                    <span className="flex items-center px-4 py-2 text-slate-500 font-medium bg-slate-100 rounded-lg">
                      Status: {request.status}
                    </span>
                  )}
                </>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
