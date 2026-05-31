"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { fetchCurrentUser } from "../../../features/auth/api/authApi";
import { getUserRole } from "../../../../lib/authUtils";
import { fetchAllAnnouncing } from "../../../features/announcing/api/announcingApi";
import AnnouncingDetailsCard from "../../../features/announcing/components/AnnouncingDetailsCard";
import LoadingPage from "../../../components/ui/LoadingPage";

export default function AnnouncingAdminPage() {
  const router = useRouter();
  const locale = useLocale();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [announcingList, setAnnouncingList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnnouncing, setSelectedAnnouncing] = useState<any | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedName, setDebouncedName] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Debounce search term - 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedName(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const loadAnnouncing = async (updatedId?: string, pageNum: number = currentPage) => {
    try {
      setLoading(true);
      const res = await fetchAllAnnouncing({
        status: selectedStatus,
        name: debouncedName,
        page: pageNum,
        limit: 15,
      });
      setAnnouncingList(res.data || []);
      setTotalItems(res.total || 0);
      setTotalPages(res.totalPages || 1);
      setCurrentPage(res.page || 1);
      setError(null);

      // If a details card is active, update its state with the fresh database values
      const activeId = updatedId || (selectedAnnouncing ? selectedAnnouncing.id : undefined);
      if (activeId) {
        const freshRecord = (res.data || []).find((item: any) => item.id === activeId);
        if (freshRecord) {
          setSelectedAnnouncing(freshRecord);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load announcing applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function syncAuth() {
      try {
        await fetchCurrentUser();
        const role = getUserRole();

        if (role !== "ADMIN") {
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

  // Load announcing when filters change (reset to page 1)
  useEffect(() => {
    if (isAuthenticated) {
      loadAnnouncing(undefined, 1);
    }
  }, [debouncedName, selectedStatus, isAuthenticated]);

  const getStatusBadge = (status: string | null | undefined) => {
    const s = status || "PENDING";
    const colors: Record<string, string> = {
      SELECTED: "bg-emerald-100 text-emerald-800 border-emerald-200",
      NOT_SELECTED: "bg-rose-100 text-rose-800 border-rose-200",
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };
    const displayNames: Record<string, string> = {
      SELECTED: "Selected",
      NOT_SELECTED: "Not Selected",
      PENDING: "Pending",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${colors[s] || "bg-slate-100 text-slate-800 border-slate-200"}`}>
        {displayNames[s] || s}
      </span>
    );
  };

  if (isAuthenticated === null) return <LoadingPage />;
  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-slate-50 flex-1 ml-0 md:ml-64 p-4 md:p-8 pt-20 md:pt-12">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight border-b border-slate-200 pb-4 flex items-center gap-3">
              <span className="w-2.5 h-8 bg-blue-600 rounded-md"></span>
              Announcing Applications
            </h1>
            <p className="text-slate-500 mt-2">
              View and review student applications for the Announcing Club.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => loadAnnouncing()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/10 font-bold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-sm"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Filters/Search Bar card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-1/2 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by student name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all duration-150"
            />
          </div>
 
          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3 items-center">
            {/* Status Filter */}
            <div className="w-full sm:w-44">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-150"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="SELECTED">Selected</option>
                <option value="NOT_SELECTED">Not Selected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Loading and Error views */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-slate-500">Loading applications...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl text-rose-800 text-sm flex gap-3 items-center">
            <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Announcing List Table */}
        {!loading && !error && announcingList.length === 0 && (
          <div className="bg-white p-16 rounded-3xl shadow-sm border border-slate-150 text-center space-y-3">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v2m4 4h4m-6 4h6"></path>
              </svg>
            </div>
            <p className="text-md font-semibold text-slate-600">No applications matched your search filters.</p>
            <p className="text-sm text-slate-400">Try adjusting the search text or selecting different filters.</p>
          </div>
        )}

        {!loading && !error && announcingList.length > 0 && (
          <>
            <div className="overflow-hidden bg-white rounded-3xl border border-slate-150 shadow-sm transition-all duration-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4.5 font-bold text-slate-700 text-xs uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4.5 font-bold text-slate-700 text-xs uppercase tracking-wider">School</th>
                      <th className="px-6 py-4.5 font-bold text-slate-700 text-xs uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-4.5 font-bold text-slate-700 text-xs uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4.5 font-bold text-slate-700 text-xs uppercase tracking-wider text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {announcingList.map((a) => (
                      <tr
                        key={a.id as string}
                        onClick={() => setSelectedAnnouncing(a)}
                        className="hover:bg-slate-50/70 cursor-pointer transition-colors duration-150"
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                          {a.fullNameWithSurname}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {a.school || <span className="text-slate-400 font-medium italic">N/A</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                          {a.phoneMobile || a.phoneLand || <span className="text-slate-400 italic">N/A</span>}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(a.status as any)}
                        </td>
                        <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedAnnouncing(a)}
                            className="px-4.5 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-95 rounded-xl font-bold text-xs tracking-wide transition-all duration-150"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border border-slate-150 bg-white px-6 py-4.5 rounded-3xl shadow-sm mt-4">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => loadAnnouncing(undefined, currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => loadAnnouncing(undefined, currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">
                      Showing <span className="text-slate-800 font-semibold">{Math.min((currentPage - 1) * 15 + 1, totalItems)}</span> to{' '}
                      <span className="text-slate-800 font-semibold">{Math.min(currentPage * 15, totalItems)}</span> of{' '}
                      <span className="text-slate-800 font-semibold">{totalItems}</span> applications
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-xl shadow-sm border border-slate-200 overflow-hidden" aria-label="Pagination">
                      <button
                        onClick={() => loadAnnouncing(undefined, currentPage - 1)}
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
                          onClick={() => loadAnnouncing(undefined, p)}
                          aria-current={p === currentPage ? 'page' : undefined}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold border-r border-slate-200 last:border-r-0 transition-colors duration-150 ${
                            p === currentPage
                              ? 'z-10 bg-blue-600 text-white'
                              : 'text-slate-900 bg-white hover:bg-slate-50'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() => loadAnnouncing(undefined, currentPage + 1)}
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

        {/* Selected Announcing Details Modal Card */}
        {selectedAnnouncing && (
          <AnnouncingDetailsCard
            announcing={selectedAnnouncing}
            onClose={() => setSelectedAnnouncing(null)}
            onSave={(id) => loadAnnouncing(id)}
          />
        )}
      </div>
    </main>
  );
}
