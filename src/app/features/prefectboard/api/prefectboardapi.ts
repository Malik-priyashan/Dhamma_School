import { buildPrefectFormData, postForm, postJson } from '../hooks/usePrefectForm';
import { fetchWithAuth } from '../../auth/api/authApi';

export async function registerPrefect(dto: Record<string, unknown>, teacherFile?: File | null, libraryFile?: File | null, teacherSignFile?: File | null) {
  const url = '/api/proxy/prefect/register';
  if (teacherFile || libraryFile || teacherSignFile) return postForm(url, buildPrefectFormData(dto, teacherFile, libraryFile, teacherSignFile));
  return postJson(url, dto);
}

export async function fetchAllPrefects(filters?: { grade?: string; name?: string; status?: string; page?: number; limit?: number }): Promise<any> {
  
  const params = new URLSearchParams();
  if (filters) {
    if (filters.grade) params.append('grade', filters.grade);
    if (filters.name) params.append('name', filters.name);
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
  }
  
  const queryStr = params.toString();
  const url = `/api/proxy/prefect${queryStr ? `?${queryStr}` : ''}`;

  const res = await fetchWithAuth(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export async function updatePrefect(id: string, data: any): Promise<any> {
  const url = `/api/proxy/prefect/${id}`;

  const res = await fetchWithAuth(url, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Failed to update prefect with status ${res.status}`);
  }

  return res.json();
}

