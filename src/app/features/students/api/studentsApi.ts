import { StudentDTO } from "../../studentform/types/types";

export async function fetchAllStudents(grade?: string, name?: string): Promise<StudentDTO[]> {
  const base = ((process.env.NEXT_PUBLIC_BACKEND_URL) || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');
  
  let queryString = 'limit=1000&';
  if (grade && grade.trim()) queryString += `grade=${encodeURIComponent(grade.trim())}&`;
  if (name && name.trim()) queryString += `name=${encodeURIComponent(name.trim())}&`;
  
  const url = `${base}/student${queryString ? `?${queryString.slice(0, -1)}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Failed to fetch students with status ${res.status}`);
  }

  const data = await res.json();
  if (data && Array.isArray(data.data)) {
    return data.data;
  }
  return Array.isArray(data) ? data : [];
}

export async function getStudentById(id: string): Promise<StudentDTO | null> {
  const base = ((process.env.NEXT_PUBLIC_BACKEND_URL) || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');
  const url = `${base}/student/${id}`;

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    const text = await res.text().catch(() => null);
    throw new Error(text || `Failed to fetch student with status ${res.status}`);
  }

  return res.json();
}

export async function updateStudent(id: string, data: any): Promise<StudentDTO> {
  const base = ((process.env.NEXT_PUBLIC_BACKEND_URL) || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');
  const url = `${base}/student/${id}`;

  const isFormData = data instanceof FormData;

  const res = await fetch(url, {
    method: 'PATCH',
    credentials: 'include',
    headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    body: isFormData ? data : JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Failed to update student with status ${res.status}`);
  }

  return res.json();
}
