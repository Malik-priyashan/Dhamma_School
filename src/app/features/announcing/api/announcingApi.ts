import { fetchWithAuth } from '../../auth/api/authApi';

export async function createAnnouncing(payload: unknown) {
  const url = '/api/proxy/announcing';

  try {
    const res = await fetchWithAuth(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Request failed ${res.status}: ${text}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return res.json();
    }

    // If backend returned HTML (e.g. 404 page), surface it as an error
    const text = await res.text();
    throw new Error(`Expected JSON response but received: ${text.slice(0, 1000)}`);
  } catch (err) {
    console.error('createAnnouncing error', err);
    throw err;
  }
}

export async function fetchAllAnnouncing(filters?: { name?: string; status?: string; page?: number; limit?: number }): Promise<any> {
  
  const params = new URLSearchParams();
  if (filters) {
    if (filters.name) params.append('name', filters.name);
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
  }
  
  const queryStr = params.toString();
  const url = `/api/proxy/announcing${queryStr ? `?${queryStr}` : ''}`;

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

export async function updateAnnouncing(id: string, data: any): Promise<any> {
  const url = `/api/proxy/announcing/${id}`;

  const res = await fetchWithAuth(url, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Failed to update announcing with status ${res.status}`);
  }

  return res.json();
}

