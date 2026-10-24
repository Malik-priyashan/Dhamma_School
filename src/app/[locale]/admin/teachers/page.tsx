"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { fetchCurrentUser } from "../../../features/auth/api/authApi";
import { getUserRole } from "../../../../lib/authUtils";
import { fetchAllTeachers, updateTeacherStatus, deleteUser } from "../../../features/admin/api/usersApi";
import LoadingPage from "../../../components/ui/LoadingPage";

interface Teacher {
  id: string;
  name?: string;
  fullName?: string;
  fullNameWithSurname?: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function TeachersPage() {
  const router = useRouter();
  const locale = useLocale();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const data = await fetchAllTeachers();
      setTeachers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load teachers.");
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

        if (role !== 'ADMIN') {
          router.push(`/${locale}`);
          return;
        }

        if (isMounted) {
          setIsAuthenticated(true);
          loadTeachers();
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

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'approve'} this teacher?`)) return;
    
    setProcessingId(id);
    try {
      await updateTeacherStatus(id, !currentStatus);
      await loadTeachers();
    } catch (err: any) {
      alert("Error updating status: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user account? This action cannot be undone.")) return;
    
    setProcessingId(id);
    try {
      await deleteUser(id);
      await loadTeachers();
    } catch (err: any) {
      alert("Error deleting user: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (isAuthenticated === null) return <LoadingPage />;
  if (!isAuthenticated) return null;

  return (
    <main className="admin-workspace min-h-screen bg-slate-50 flex-1 ml-0 md:ml-64 p-4 md:p-8 pt-20 md:pt-12">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between md:p-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Teacher Management
            </h1>
            <p className="mt-2 text-sm text-slate-500">Review and manage teacher account approvals.</p>
          </div>
          <div>
            <button
              onClick={loadTeachers}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading && <p className="text-slate-600">Loading teachers...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && teachers.length === 0 && (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center">
            <p className="text-slate-500">No teachers found in the system.</p>
          </div>
        )}

        {!loading && teachers.length > 0 && (
          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Name</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Email</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Joined</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Status</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {teacher.name || teacher.fullName || teacher.fullNameWithSurname || 'No Name'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{teacher.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(teacher.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        teacher.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {teacher.isActive ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(teacher.id, teacher.isActive)}
                          disabled={processingId === teacher.id}
                          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 ${teacher.isActive ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                        >
                          {teacher.isActive ? 'Deactivate' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleDelete(teacher.id)}
                          disabled={processingId === teacher.id}
                          className="rounded-lg bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
