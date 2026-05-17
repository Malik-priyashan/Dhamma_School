"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { fetchCurrentUser } from "../../../features/auth/api/authApi";
import { getUserRole } from "../../../../lib/authUtils";
import { useStudentRequests } from "../../../features/studentrequest/hooks/useStudentRequests";
import StudentRequestCard from "../../../features/studentrequest/components/StudentRequestCard";
import { StudentRequest } from "../../../features/studentrequest/types/types";
import { acceptStudentRequest, rejectStudentRequest, updateStudent } from "../../../features/studentrequest/api/studentRequestsApi";

export default function StudentRequestsPage() {
  const router = useRouter();
  const locale = useLocale();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

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

  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  // Keep hook call unconditional to preserve hooks order; enable fetching only when authenticated
  const { data, total, totalPages, loading, error, refetch } = useStudentRequests(
    !!isAuthenticated,
    currentPage,
    15,
    statusFilter,
    dateFilter
  );
  const [selected, setSelected] = useState<StudentRequest | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [studentIdsByRequestId, setStudentIdsByRequestId] = useState<Record<string, string>>({});

  const parseStudentId = (response: any, fallbackRequestId: string) => {
    return response?.student?.id || response?.studentId || response?.id || fallbackRequestId;
  };

  const openRequest = (request: StudentRequest) => {
    const studentId = studentIdsByRequestId[request.id] || request.studentId;
    setSelected(studentId ? { ...request, studentId } : request);
  };

  const handleAccept = async (e: React.MouseEvent, req: StudentRequest) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to accept this student request and save to the student table?")) return;
    
    setProcessingId(req.id || null);
    try {
      if (req.id) {
        // First accept the request to trigger student creation on the backend
        const acceptResponse = await acceptStudentRequest(req.id);
        
        // Use the new student's ID (or fallback to req.id if the ID is preserved)
        const newStudentId = parseStudentId(acceptResponse, req.id);
        setStudentIdsByRequestId((current) => ({ ...current, [req.id]: newStudentId }));
        
        // Extract admin details added from the card
        const adminDetails = {
          indexNo: (req as any).indexNo,
          libraryNo: (req as any).libraryNo,
          house: (req as any).house,
          grade: (req as any).grade,
          registrationDate: (req as any).registrationDate,
          studentActiveMonitor: (req as any).studentActiveMonitor,
        };
        
        // Update the student in the database with the admin details
        await updateStudent(newStudentId, adminDetails);
      }
      alert("Student accepted and successfully saved to student database!");
      refetch();
    } catch (err: any) {
      alert("Error accepting student: " + err.message);
    } finally {
      setProcessingId(null);
      setSelected(null);
    }
  };

  const handleReject = async (e: React.MouseEvent, req: StudentRequest) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to reject this student request?")) return;
    
    setProcessingId(req.id || null);
    try {
      if (req.id) {
        await rejectStudentRequest(req.id);
        alert("Student request rejected.");
        refetch();
      }
    } catch (err: any) {
      alert("Error rejecting student: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-slate-50 flex-1 ml-64 p-8 pt-12">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 border-b border-slate-200 pb-4">
              Student Requests
            </h1>
            <p className="text-slate-600">Review and manage student requests here.</p>
          </div>
          <div>
            <button
              onClick={() => refetch()}
              className="px-3 py-2 bg-sky-600 text-white rounded"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
          <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
            {/* Status Filter */}
            <div className="flex flex-col gap-1 w-full sm:w-48">
              <label htmlFor="status-filter" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Created Date Filter */}
            <div className="flex flex-col gap-1 w-full sm:w-56">
              <label htmlFor="date-filter" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Created Date</label>
              <div className="relative flex items-center">
                <input
                  id="date-filter"
                  type="date"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-slate-700 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all cursor-pointer"
                />
                {dateFilter && (
                  <button
                    onClick={() => {
                      setDateFilter("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors text-xs font-semibold"
                    title="Clear date"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Reset Filters / Stats Info */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {(statusFilter || dateFilter) && (
              <button
                onClick={() => {
                  setStatusFilter("");
                  setDateFilter("");
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-sm rounded-xl transition-colors"
              >
                Clear All Filters
              </button>
            )}
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
              Total: <span className="text-slate-700 font-bold">{total}</span> Requests
            </div>
          </div>
        </div>

        {loading && <p className="text-slate-600">Loading requests…</p>}
        {error && <p className="text-red-600">Failed to load requests: {error.message}</p>}

        {!loading && data.length === 0 && (
          <p className="text-slate-600">No student requests found.</p>
        )}

        {!loading && data.length > 0 && (
          <>
            <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-slate-200">
              <table className="w-full text-left">
                <thead className="bg-gradient-to-r from-sky-50 to-blue-50 border-b-2 border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Name</th>
                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Address</th>
                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Phone 1</th>
                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Birthday</th>
                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Request Date</th>
                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Status</th>
                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-sky-50 cursor-pointer transition-colors duration-200"
                      onClick={() => openRequest(r)}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{r.fullNameWithSurname || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{r.address || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{r.phone1 || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {r.dob ? new Date(r.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          r.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                          r.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {r.status || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex gap-2 justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openRequest(r);
                          }}
                          className="px-4 py-2 bg-sky-100 text-sky-700 hover:bg-sky-200 rounded-md font-medium text-sm transition-colors"
                          title="View Details"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border border-slate-205 bg-white px-6 py-4.5 rounded-3xl shadow-sm mt-4">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">
                      Showing <span className="text-slate-800 font-semibold">{Math.min((currentPage - 1) * 15 + 1, total)}</span> to{' '}
                      <span className="text-slate-800 font-semibold">{Math.min(currentPage * 15, total)}</span> of{' '}
                      <span className="text-slate-800 font-semibold">{total}</span> requests
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-xl shadow-sm border border-slate-200 overflow-hidden" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-3 py-2 text-slate-400 hover:bg-slate-50 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 border-r border-slate-200"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          aria-current={p === currentPage ? 'page' : undefined}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold border-r border-slate-200 last:border-r-0 transition-colors duration-150 ${
                            p === currentPage
                              ? 'z-10 bg-sky-600 text-white'
                              : 'text-slate-900 bg-white hover:bg-slate-50'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-3 py-2 text-slate-400 hover:bg-slate-50 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {selected && (
          <StudentRequestCard
            request={selected}
            onClose={() => setSelected(null)}
            onAccept={handleAccept}
            onReject={handleReject}
            processingId={processingId}
          />
        )}
      </div>
    </main>
  );
}
