import { NextResponse } from 'next/server';

async function resolveChannelId(identifier: string) {
  if (!identifier) return null;

  // Trim and normalize
  const id = identifier.trim();

  // If it already looks like a channel id (UC...), return as-is
  if (/^UC[0-9A-Za-z_-]{20,}$/.test(id)) return id;

  // Try several strategies by fetching the public channel/handle page
  const path = id.startsWith('@') ? id : id;
  const url = `https://www.youtube.com/${path}`;
  try {
    // Use a browser-like user-agent to increase chance of full HTML being returned
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' } });
    if (!res.ok) return null;
    const txt = await res.text();

    // 1) Look for explicit channelId JSON pattern
    const m1 = txt.match(/"channelId"\s*:\s*"(UC[0-9A-Za-z_-]+)"/);
    if (m1) return m1[1];

    // 2) Look for canonical link to /channel/UC...
    const m2 = txt.match(/<link[^>]+rel="canonical"[^>]+href="https?:\/\/www\.youtube\.com\/channel\/(UC[0-9A-Za-z_-]+)"/i);
    if (m2) return m2[1];

    // 3) Look for any /channel/UC... occurrence
    const m3 = txt.match(/\/channel\/(UC[0-9A-Za-z_-]{20,})/i);
    if (m3) return m3[1];

    // 4) As a fallback, try to find microdata attribute data-channel-external-id or similar
    const m4 = txt.match(/data-channel-external-id="(UC[0-9A-Za-z_-]+)"/i);
    if (m4) return m4[1];
  } catch {
    // ignore
  }

  // If all strategies failed, return null
  return null;
}

async function fetchRssVideos(channelId: string) {
  // First try the simple RSS feed
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  try {
    const res = await fetch(feedUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      const xml = await res.text();
      const entries = Array.from(xml.matchAll(/<entry>[\s\S]*?<\/entry>/g)).map((m) => m[0]);
      const videos = entries.map((entry) => {
        const idMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
        const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
        return {
          id: idMatch ? idMatch[1] : null,
          title: titleMatch ? titleMatch[1] : null,
        };
      }).filter(v => v.id);
      if (videos.length) return videos;
    }
  } catch {
    // fall through to HTML parsing
  }

  // Fallback: fetch the channel's /videos page and parse ytInitialData JSON
  const videosPage = `https://www.youtube.com/channel/${channelId}/videos`;
  const res2 = await fetch(videosPage, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  if (!res2.ok) throw new Error('Failed to fetch channel videos page');
  const txt = await res2.text();

  const idx = txt.indexOf('ytInitialData');
  if (idx === -1) throw new Error('ytInitialData not found');

  // Find the JSON object starting at the first '{' after ytInitialData
  const braceStart = txt.indexOf('{', idx);
  if (braceStart === -1) throw new Error('Initial data JSON not found');

  let i = braceStart;
  let depth = 0;
  let inString = false;
  let prevChar = '';
  for (; i < txt.length; i++) {
    const ch = txt[i];
    if (ch === '"' && prevChar !== '\\') inString = !inString;
    if (!inString) {
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) break;
      }
    }
    prevChar = ch;
  }
  if (depth !== 0) throw new Error('Failed to parse initial JSON');
  const jsonStr = txt.slice(braceStart, i + 1);
  let data: any;
  try {
    data = JSON.parse(jsonStr);
  } catch {
    throw new Error('Failed to JSON.parse ytInitialData');
  }

  // Recursively walk the object to find videoRenderer entries
  const found: Array<{ id: string; title: string }> = [];
  function walk(obj: any) {
    if (!obj || typeof obj !== 'object') return;
    if (obj.videoRenderer && obj.videoRenderer.videoId) {
      const vr = obj.videoRenderer;
      const title = vr.title?.runs?.[0]?.text || vr.title || '';
      found.push({ id: vr.videoId, title });
      return;
    }
    for (const k of Object.keys(obj)) {
      try { walk(obj[k]); } catch { /* ignore */ }
    }
  }
  walk(data);

  if (!found.length) throw new Error('No videos found in initial data');
  return found;
}

export async function GET() {
  const identifier = process.env.YOUTUBE_CHANNEL_ID || process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID || '';
  if (!identifier) return NextResponse.json({ error: 'YOUTUBE_CHANNEL_ID not configured' }, { status: 400 });

  const channelId = await resolveChannelId(identifier);
  if (!channelId) return NextResponse.json({ error: 'Unable to resolve channel id' }, { status: 500 });

  try {
    const videos = await fetchRssVideos(channelId);
    return NextResponse.json({ videos });
  } catch (err) {
    console.error('[youtube] fetchRssVideos error:', err);
    return NextResponse.json({ error: (err as Error).message || 'Failed to fetch videos' }, { status: 500 });
  }
}
