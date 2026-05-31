import { MarkDTO } from "../types/marks.types";

const getBaseUrl = () => {
  return '/api/proxy/marks';
};

function mapToFrontend(item: any): MarkDTO {
  return {
    id: item.id,
    studentId: item.studentId,
    academicYear: item.year?.toString() || '',
    teacherName: item.teacherName || '',
    grade: item.student?.grade || '',
    firstTerm: item.term1Marks ?? undefined,
    secondTerm: item.term2Marks ?? undefined,
    thirdTerm: item.term3Marks ?? undefined,
  };
}

function mapToBackend(payload: Partial<MarkDTO>): any {
  const backendPayload: any = {};
  if (payload.studentId !== undefined) {
    backendPayload.studentId = payload.studentId.toString();
  }
  if (payload.academicYear !== undefined) {
    backendPayload.year = parseInt(payload.academicYear, 10);
  }
  if (payload.teacherName !== undefined) {
    backendPayload.teacherName = payload.teacherName;
  }
  
  if (payload.hasOwnProperty('firstTerm')) {
    backendPayload.term1Marks = payload.firstTerm !== undefined ? payload.firstTerm : null;
  }
  if (payload.hasOwnProperty('secondTerm')) {
    backendPayload.term2Marks = payload.secondTerm !== undefined ? payload.secondTerm : null;
  }
  if (payload.hasOwnProperty('thirdTerm')) {
    backendPayload.term3Marks = payload.thirdTerm !== undefined ? payload.thirdTerm : null;
  }
  return backendPayload;
}

export async function fetchMarksByStudentAndYear(studentId: number | string, academicYear: string): Promise<MarkDTO | null> {
  try {
    const res = await fetch(`${getBaseUrl()}?studentId=${studentId}&year=${academicYear}`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error('Failed to fetch marks');
    }
    const data = await res.json();
    return data.length > 0 ? mapToFrontend(data[0]) : null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function fetchMarksByStudent(studentId: number | string): Promise<MarkDTO[]> {
  try {
    const res = await fetch(`${getBaseUrl()}?studentId=${studentId}`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) {
      if (res.status === 404) return [];
      throw new Error('Failed to fetch marks');
    }
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapToFrontend) : [];
  } catch (error) {
    console.error(error);
    return [];
  }
}


export async function createMark(payload: Partial<MarkDTO>): Promise<MarkDTO> {
  const res = await fetch(getBaseUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify(mapToBackend(payload)),
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(errorText || 'Failed to save marks');
  }
  const data = await res.json();
  return mapToFrontend(data);
}

export async function updateMark(id: number | string, payload: Partial<MarkDTO>): Promise<MarkDTO> {
  const res = await fetch(`${getBaseUrl()}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify(mapToBackend(payload)),
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(errorText || 'Failed to update marks');
  }
  const data = await res.json();
  return mapToFrontend(data);
}
