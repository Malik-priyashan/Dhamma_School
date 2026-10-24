import { fetchWithAuth } from '../../auth/api/authApi';

export type DashboardSummary = {
  grades: { grade: string; boys: number; girls: number; total: number }[];
  students: number;
  prefects: number;
  announcing: number;
  teachers: { id: string; fullName: string | null; email: string; isActive: boolean }[];
};

export async function fetchDashboard(): Promise<DashboardSummary> {
  const response = await fetchWithAuth('/api/proxy/student/dashboard', { cache: 'no-store', credentials: 'include' });
  if (!response.ok) throw new Error(`Dashboard request failed (${response.status})`);
  return response.json();
}
