const AUTH_PROXY_BASE = '/api/proxy/auth';
const AUTH_COOKIE_NAMES = ['accessToken', 'auth_token', 'userRole', 'loginAt'] as const;
const ADMIN_CONTACT_THREAD_READ_STORAGE_KEY_PREFIX = 'dhamma_school_admin_contact_thread_read_v1';

export type AuthPayload = Record<string, unknown>;

function authTarget(path: string) {
  return `${AUTH_PROXY_BASE}/${path}`;
}

export function clearClientAuthState() {
  if (typeof window === 'undefined') return;

  const cookieNames = new Set<string>(AUTH_COOKIE_NAMES);
  document.cookie.split(';').forEach((chunk) => {
    const name = chunk.trim().split('=')[0];
    if (name) cookieNames.add(name);
  });

  const expired = 'Thu, 01 Jan 1970 00:00:00 GMT';
  cookieNames.forEach((name) => {
    document.cookie = `${name}=; expires=${expired}; path=/`;
    document.cookie = `${name}=; Max-Age=0; path=/`;
  });

  try {
    localStorage.removeItem('userRole');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('loginAt');

    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key && key.startsWith(ADMIN_CONTACT_THREAD_READ_STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  } catch {}

  try {
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('loginAt');
  } catch {}
}

export async function registerUser(payload: AuthPayload) {
  const target = authTarget('register');

  try {
    const res = await fetch(target, {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
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

export async function loginUser(payload: AuthPayload) {
  const target = authTarget('login');

  try {
    const res = await fetch(target, {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
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
  const target = authTarget('me');

  try {
    const res = await fetch(target, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
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
  const target = authTarget('logout');

  try {
    const res = await fetch(target, {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
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
