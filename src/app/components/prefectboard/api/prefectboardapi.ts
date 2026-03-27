export async function registerPrefect(dto: Record<string, unknown>, teacherFile?: File | null) {
  const base = (process.env.NEXT_PUBLIC_BACKEND_URL) || (typeof window !== 'undefined' ? window.location.origin : '');
  const url = `${base}/prefect/register`;

    if (teacherFile) {
    const form = new FormData();

    // Append each dto field individually so backend receives flat fields
    Object.entries(dto || {}).forEach(([key, val]) => {
      if (val === null || val === undefined) return;
      if (Array.isArray(val) || typeof val === 'object') {
        form.append(key, JSON.stringify(val));
      } else {
        form.append(key, String(val));
      }
    });

    // backend expects the uploaded file under the 'teachersconfirmfile' field
    form.append('teachersconfirmfile', teacherFile, teacherFile.name);

    // Debug: list form entries (for client-side debugging only)
    try {
      const entries: Array<[string, unknown]> = [];
      form.forEach((v, k) => entries.push([k, v] as [string, unknown]));
      console.debug('Prefect FormData entries:', entries);
    } catch {}

    const res = await fetch(url, { method: 'POST', body: form });

    const raw = await res.text().catch(() => null);
    let parsed: unknown = null;
    try { parsed = raw ? JSON.parse(raw) : null; } catch { parsed = null; }

    if (!res.ok) {
      let msg = `Request failed with status ${res.status}`;
      if (typeof parsed === 'object' && parsed !== null) {
        const p = parsed as Record<string, unknown>;
        if (typeof p.message === 'string') msg = p.message;
      }
      throw Object.assign(new Error(msg), { status: res.status, body: parsed ?? raw });
    }

    try { return (parsed ?? JSON.parse(raw as string)); } catch { return raw; }
  }

  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) });

  const raw = await res.text().catch(() => null);
  let parsed: unknown = null;
  try { parsed = raw ? JSON.parse(raw) : null; } catch { parsed = null; }

  if (!res.ok) {
    let msg = `Request failed with status ${res.status}`;
    if (typeof parsed === 'object' && parsed !== null) {
      const p = parsed as Record<string, unknown>;
      if (typeof p.message === 'string') msg = p.message;
    }
    throw Object.assign(new Error(msg), { status: res.status, body: parsed ?? raw });
  }

  try { return (parsed ?? JSON.parse(raw as string)); } catch { return raw; }
}
