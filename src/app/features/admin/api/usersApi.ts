const USERS_PROXY_BASE = '/api/proxy/users';

function usersApi(path = '') {
  return `${USERS_PROXY_BASE}${path}`;
}

export async function fetchAllTeachers() {
  const target = usersApi('/teachers');

  try {
    const res = await fetch(target, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch teachers: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error('fetchAllTeachers error', err);
    throw err;
  }
}

export async function updateTeacherStatus(id: string, isActive: boolean) {
  const target = usersApi(`/${id}/status`);

  try {
    const res = await fetch(target, {
      method: 'PATCH',
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    });

    if (!res.ok) {
      throw new Error(`Failed to update teacher status: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error('updateTeacherStatus error', err);
    throw err;
  }
}

export async function deleteUser(id: string) {
  const target = usersApi(`/${id}`);

  try {
    const res = await fetch(target, {
      method: 'DELETE',
      credentials: 'include',
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Failed to delete user: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error('deleteUser error', err);
    throw err;
  }
}
