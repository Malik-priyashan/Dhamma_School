type Video = { id: string; title: string };

export async function fetchYouTubeVideos(): Promise<Video[]> {
  const backend = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const url = `${backend}/youtube`;

  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const text = await res.text();

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON response from backend');
  }

  if (!res.ok) {
    let errMsg = `Request failed with status ${res.status}`;
    if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>;
      if (typeof obj.error === 'string') errMsg = obj.error;
    }
    throw new Error(errMsg);
  }

  if (Array.isArray(data)) return data as Video[];
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.videos)) return obj.videos as Video[];
  }

  throw new Error('Unexpected response shape from backend');
}
