const AUTH_PROXY_BASE = '/api/proxy/auth';
const AUTH_COOKIE_NAMES = ['accessToken', 'auth_token', 'refreshToken', 'userRole', 'loginAt'] as const;
const ADMIN_CONTACT_THREAD_READ_STORAGE_KEY_PREFIX = 'dhamma_school_admin_contact_thread_read_v1';

export type AuthPayload = Record<string, unknown>;

async function readAuthResult(res: Response) {
  const text = await res.text();
  let result: unknown = text;
  try { result = JSON.parse(text); } catch {}
  if (!res.ok) {
    const error = result && typeof result === 'object' ? result as { message?: string | string[] } : null;
    const message = Array.isArray(error?.message) ? error.message.join(', ') : error?.message;
    throw new Error(message || `Request failed ${res.status}`);
  }
  return result;
}

export async function sendRegistrationCode(email: string) {
  return readAuthResult(await fetchAuthResponse('registration-email/send', {
    method: 'POST', credentials: 'include', cache: 'no-store',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
  }));
}

export async function verifyRegistrationCode(email: string, code: string): Promise<{ verificationToken: string }> {
  return readAuthResult(await fetchAuthResponse('registration-email/verify', {
    method: 'POST', credentials: 'include', cache: 'no-store',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }),
  })) as Promise<{ verificationToken: string }>;
}

let refreshInFlight: Promise<boolean> | null = null;
let currentUserInFlight: ReturnType<typeof requestCurrentUser> | null = null;

function authTarget(path: string) {
  return `${AUTH_PROXY_BASE}/${path}`;
}

async function fetchAuthResponse(path: string, init: RequestInit) {
  return fetch(authTarget(path), init);
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
  try {
    const res = await fetchAuthResponse('register', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return await readAuthResult(res);
  } catch (err) {
    console.error('registerUser error', err);
    throw err;
  }
}

export async function loginUser(payload: AuthPayload) {
  try {
    const res = await fetchAuthResponse('login', {
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

async function requestCurrentUser() {
  const getMe = () => fetchAuthResponse('me', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });

  let res = await getMe();
  // The backend returns 200 with null when the access cookie has expired.
  let user = res.ok ? await res.json() : null;
  if ((res.status === 401 || !user) && await refreshAccessToken()) {
    res = await getMe();
    user = res.ok ? await res.json() : null;
  }

  if (!res.ok || !user) throw new Error('Not logged in or session expired');
  return user;
}

export function fetchCurrentUser() {
  if (!currentUserInFlight) {
    const request = requestCurrentUser();
    const sharedRequest = request.finally(() => {
      if (currentUserInFlight === sharedRequest) currentUserInFlight = null;
    });
    currentUserInFlight = sharedRequest;
  }
  return currentUserInFlight;
}

function refreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(authTarget('refresh'), {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
    }).then((res) => res.ok).catch(() => false).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function fetchWithAuth(input: string, init: RequestInit = {}): Promise<Response> {
  const request = () => fetch(input, { ...init, credentials: 'include' });
  const response = await request();

  if (response.status !== 401 || !(await refreshAccessToken())) {
    return response;
  }

  return request();
}

export async function logoutUser() {
  try {
    const res = await fetchAuthResponse('logout', {
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
