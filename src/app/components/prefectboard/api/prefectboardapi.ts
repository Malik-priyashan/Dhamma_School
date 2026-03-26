export async function registerPrefect(dto: any, teacherFile?: File | null) {
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
      const entries: any[] = [];
      (form as any).forEach((v: any, k: string) => entries.push([k, v]));
      console.debug('Prefect FormData entries:', entries);
    } catch (e) {}

    const res = await fetch(url, { method: 'POST', body: form });

    const raw = await res.text().catch(() => null);
    let parsed: any = null;
    try { parsed = raw ? JSON.parse(raw) : null; } catch (e) { parsed = null; }

    if (!res.ok) {
      const msg = parsed?.message || raw || `Request failed with status ${res.status}`;
      const err: any = new Error(msg);
      err.status = res.status;
      err.body = parsed ?? raw;
      throw err;
    }

    try { return parsed ?? JSON.parse(raw as string); } catch (e) { return raw; }
  }

  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) });

  const raw = await res.text().catch(() => null);
  let parsed: any = null;
  try { parsed = raw ? JSON.parse(raw) : null; } catch (e) { parsed = null; }

  if (!res.ok) {
    const msg = parsed?.message || raw || `Request failed with status ${res.status}`;
    const err: any = new Error(msg);
    err.status = res.status;
    err.body = parsed ?? raw;
    throw err;
  }

  try { return parsed ?? JSON.parse(raw as string); } catch (e) { return raw; }
}
