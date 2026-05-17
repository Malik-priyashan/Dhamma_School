export function getUserRole(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const lsRole = localStorage.getItem('userRole');
    if (lsRole) return lsRole.toUpperCase();
  } catch {}

  const roleMatch = document.cookie.match(new RegExp('(^| )userRole=([^;]+)'));
  if (roleMatch && roleMatch[2]) {
    return roleMatch[2].toUpperCase();
  }

  const match = document.cookie.match(new RegExp('(^| )accessToken=([^;]+)'));
  if (!match) return null;

  const token = match[2];
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const parsed = JSON.parse(jsonPayload);
    const role = parsed.role || parsed.Role;
    return role ? role.toUpperCase() : null;
  } catch {
    return null;
  }
}
