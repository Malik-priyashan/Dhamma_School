export async function fetchAllTeachers() {
  const base = (process.env.NEXT_PUBLIC_BACKEND_URL as string) || '';
  const target = `${base.replace(/\/$/, '')}/users/teachers`;

  try {
    const res = await fetch(target, {
      method: 'GET',
      credentials: 'include',
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
  const base = (process.env.NEXT_PUBLIC_BACKEND_URL as string) || '';
  const target = `${base.replace(/\/$/, '')}/users/${id}/status`;

  try {
    const res = await fetch(target, {
      method: 'PATCH',
      credentials: 'include',
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
  const base = (process.env.NEXT_PUBLIC_BACKEND_URL as string) || '';
  const target = `${base.replace(/\/$/, '')}/users/${id}`;

  try {
    const res = await fetch(target, {
      method: 'DELETE',
      credentials: 'include',
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
