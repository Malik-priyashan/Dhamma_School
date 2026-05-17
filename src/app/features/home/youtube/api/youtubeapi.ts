export async function fetchYouTubeVideos() {
  const res = await fetch('/api/youtube/videos');
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown' }));
    throw new Error(err?.error || 'Failed to fetch videos');
  }
  const data = await res.json();
  return data.videos?.map((v: any) => ({ id: v.id, title: v.title })) || [];
}
