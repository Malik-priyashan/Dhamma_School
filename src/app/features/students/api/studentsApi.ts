import { StudentDTO } from "../../studentform/types/types";

const STUDENT_PROXY_BASE = '/api/proxy/student';

function studentApi(path = '') {
  return `${STUDENT_PROXY_BASE}${path}`;
}

export async function fetchAllStudents(grade?: string, name?: string): Promise<StudentDTO[]> {
  let queryString = 'limit=1000&';
  if (grade && grade.trim()) queryString += `grade=${encodeURIComponent(grade.trim())}&`;
  if (name && name.trim()) queryString += `name=${encodeURIComponent(name.trim())}&`;

  const url = `${studentApi()}${queryString ? `?${queryString.slice(0, -1)}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
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
  const url = studentApi(`/${id}`);

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
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
  const url = studentApi(`/${id}`);

  const isFormData = data instanceof FormData;

  const res = await fetch(url, {
    method: 'PATCH',
    credentials: 'include',
    cache: 'no-store',
    headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    body: isFormData ? data : JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Failed to update student with status ${res.status}`);
  }

  return res.json();
}

export async function promoteStudentGrades(): Promise<{ message: string; graduatedCount: number }> {
  const url = studentApi('/promote-grades');

  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Failed to promote student grades with status ${res.status}`);
  }

  return res.json();
}

export async function fetchMyStudents(): Promise<StudentDTO[]> {
  const url = studentApi('/my-students');

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Failed to fetch my students with status ${res.status}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

