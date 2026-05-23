import { StudentDTO } from "../../studentform/types/types";

const STUDENT_REQUEST_PROXY_BASE = '/api/proxy/student-request';
const STUDENT_PROXY_BASE = '/api/proxy/student';

function studentRequestApi(path = '') {
  return `${STUDENT_REQUEST_PROXY_BASE}${path}`;
}

function studentApi(path = '') {
  return `${STUDENT_PROXY_BASE}${path}`;
}

export async function fetchAllStudentRequests(
  pageParam?: string | number,
  limitParam?: string | number,
  status?: string,
  createdDate?: string
): Promise<any> {
  const params = new URLSearchParams();
  if (pageParam) params.append('page', String(pageParam));
  if (limitParam) params.append('limit', String(limitParam));
  if (status) params.append('status', status);
  if (createdDate) params.append('createdDate', createdDate);
  
  const queryStr = params.toString();
  const url = `${studentRequestApi()}${queryStr ? `?${queryStr}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export async function acceptStudentRequest(id: string): Promise<any> {
  const url = studentRequestApi(`/${id}/accept`);

  const res = await fetch(url, {
    method: 'PATCH',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Failed to accept student request with status ${res.status}`);
  }

  return res.json();
}

export async function rejectStudentRequest(id: string): Promise<any> {
  const url = studentRequestApi(`/${id}/reject`);

  const res = await fetch(url, {
    method: 'PATCH',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Failed to reject student request with status ${res.status}`);
  }

  return res.json();
}

export async function createStudent(data: StudentDTO): Promise<any> {
  const url = studentApi();

  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Failed to create student with status ${res.status}`);
  }

  return res.json();
}

export async function updateStudent(id: string, data: any): Promise<any> {
  const url = studentApi(`/${id}`);

  const res = await fetch(url, {
    method: 'PATCH',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Failed to update student with status ${res.status}`);
  }

  return res.json();
}

export async function getStudentById(id: string): Promise<any> {
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

export async function fetchAllStudents(): Promise<any[]> {
  const url = `${studentApi()}?limit=1000`;

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
