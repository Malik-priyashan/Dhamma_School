const CONTACT_PROXY_BASE = '/api/proxy/contact-us';

export function contactTarget(path = '') {
  return `${CONTACT_PROXY_BASE}${path}`;
}

export async function readResponsePayload(res: Response) {
  const text = await res.text().catch(() => '');

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
