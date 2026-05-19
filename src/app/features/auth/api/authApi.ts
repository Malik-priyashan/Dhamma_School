export async function registerUser(payload: unknown) {
  const base = (process.env.NEXT_PUBLIC_BACKEND_URL as string) || '';
  const target = `${base.replace(/\/$/, '')}/auth/register`;

  try {
    const res = await fetch(target, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();

    if (!res.ok) {
      throw new Error(`Request failed ${res.status}: ${text}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }

    return { result: text };
  } catch (err) {
    console.error('registerUser error', err);
    throw err;
  }
}

export async function loginUser(payload: unknown) {
  const base = (process.env.NEXT_PUBLIC_BACKEND_URL as string) || '';
  const target = `${base.replace(/\/$/, '')}/auth/login`;

  try {
    const res = await fetch(target, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(typeof navigator !== 'undefined' ? { 'user-agent': navigator.userAgent } : {})
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();

    if (!res.ok) {
      let errorMessage = text;
      try {
        const errorJson = JSON.parse(text);
        if (Array.isArray(errorJson.message)) {
          errorMessage = errorJson.message.join(', ');
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch {}
      throw new Error(errorMessage || `Request failed ${res.status}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }

    return { result: text };
  } catch (err) {
    console.error('loginUser error', err);
    throw err;
  }
}

export async function fetchCurrentUser() {
  const base = (process.env.NEXT_PUBLIC_BACKEND_URL as string) || '';
  const target = `${base.replace(/\/$/, '')}/auth/me`;

  try {
    const res = await fetch(target, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!res.ok) {
      throw new Error('Not logged in or cookie expired');
    }
    
    return await res.json();
  } catch (err) {
    throw err;
  }
}

export async function logoutUser() {
  const base = (process.env.NEXT_PUBLIC_BACKEND_URL as string) || '';
  const target = `${base.replace(/\/$/, '')}/auth/logout`;

  try {
    const res = await fetch(target, {
      method: 'POST',
      credentials: 'include',
    });
    
    if (!res.ok) {
      throw new Error(`Logout failed ${res.status}`);
    }
    
    return await res.json();
  } catch (err) {
    console.error('logoutUser error', err);
    throw err;
  }
}
