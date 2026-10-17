import { NextResponse } from 'next/server';

const FALLBACK_CHANNEL_ID = 'UCV7toQqmX3zL8pdBeV0Oxcg';
const FALLBACK_VIDEOS = [
  { id: 'I0vUq-5spfc', title: 'සිසු නයනුවන් අභිසෙස් 2026 ස්තුති කතාව' },
  { id: 'UfuT9y_j6_k', title: 'සිසු නයනුවන් අභිසෙස් 2026' },
  { id: 'BPQfd2vn2F4', title: 'සිසු නයනුවන් අභිසෙස් 2026 කනිෂ්ඨ ශිෂ්‍ය නායක නායිකා මණ්ඩලය දිවුරුම් දීම' },
  { id: 'wRowrFo_HH8', title: 'සිසු නයනුවන් අභිසෙස් 2026 ජ්‍යෙෂ්ඨ ශිෂ්‍ය නායක නායිකා මණ්ඩලය දිවුරුම් දීම' },
  { id: 'qsz_fNNdKSY', title: 'සිසු නයනුවන් අභිසෙස් 2026 බද්දේගම කුසල හාමුදුරුවන්ගේ මූලාසනයේ අනුශාසනාව' },
  { id: 'ztv2cCs1OWo', title: 'සිසු නයනුවන් අභිසෙස් 2026 ප්‍රධාන උපප්‍රධාන ශිෂ්‍ය නායක නායිකා මණ්ඩලය දිවුරුම් දීම' },
  { id: 'kc7_t7vuIm4', title: 'සිසු නයනුවන් අභිසෙස් 2026  දේවාලයගම සුමනරතන හිමියන්ගේ පැවිදි අනුශාසනාව' },
  { id: 'eHvvw1phTJQ', title: 'සිසු නයනුවන් අභිසෙස් 2026' },
];

async function resolveChannelId(identifier: string) {
  const id = identifier.trim();
  if (/^UC[0-9A-Za-z_-]{20,}$/.test(id)) return id;

  try {
    const res = await fetch(`https://www.youtube.com/${id}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const html = await res.text();
    return html.match(/"channelId"\s*:\s*"(UC[0-9A-Za-z_-]+)"/)?.[1]
      || html.match(/<link[^>]+rel="canonical"[^>]+href="https?:\/\/www\.youtube\.com\/channel\/(UC[0-9A-Za-z_-]+)"/i)?.[1]
      || html.match(/\/channel\/(UC[0-9A-Za-z_-]{20,})/i)?.[1]
      || html.match(/data-channel-external-id="(UC[0-9A-Za-z_-]+)"/i)?.[1]
      || null;
  } catch {
    return null;
  }
}

async function fetchRssVideos(channelId: string) {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        ...(attempt === 0 ? { next: { revalidate: 300 } } : { cache: 'no-store' as const }),
      });
      if (!res.ok) continue;

      const xml = await res.text();
      const videos = Array.from(xml.matchAll(/<entry>[\s\S]*?<\/entry>/g), ([entry]) => ({
        id: entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] || '',
        title: entry.match(/<title>([^<]+)<\/title>/)?.[1] || '',
      })).filter((video) => video.id);
      if (videos.length) return videos;
    } catch {
      // Retry without the fetch cache if YouTube temporarily fails.
    }
  }

  throw new Error('YouTube RSS feed unavailable');
}

export async function GET() {
  const identifier = process.env.YOUTUBE_CHANNEL_ID || process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID || '';
  if (!identifier) return NextResponse.json({ error: 'YOUTUBE_CHANNEL_ID not configured' }, { status: 400 });

  const channelId = await resolveChannelId(identifier);
  if (!channelId) return NextResponse.json({ error: 'Unable to resolve channel id' }, { status: 500 });

  try {
    const videos = await fetchRssVideos(channelId);
    return NextResponse.json({ videos }, {
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error('[youtube] RSS feed unavailable:', error);
    if (channelId === FALLBACK_CHANNEL_ID) {
      return NextResponse.json({ videos: FALLBACK_VIDEOS }, {
        headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' },
      });
    }
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 502 });
  }
}
