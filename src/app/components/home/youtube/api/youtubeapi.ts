type Video = { id: string; title: string };

export async function fetchYouTubeVideos(): Promise<Video[]> {
  const backend = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const url = `${backend}/youtube`;

  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const text = await res.text();

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON response from backend');
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed with status ${res.status}`);
  }

  if (Array.isArray(data)) return data;
  if (data?.videos && Array.isArray(data.videos)) return data.videos;

  throw new Error('Unexpected response shape from backend');
}
