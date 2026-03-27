"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { fetchYouTubeVideos } from './api/youtubeapi';

type Video = { id: string; title: string };

export default function YouTubeVideos() {
  const t = useTranslations();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const vids = await fetchYouTubeVideos();
        setVideos(vids || []);
      } catch (err) {
        setError((err as Error).message || 'Unknown error');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false };
  }, []);

  return (
    <section id="videos" className="w-full mt-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Heading */}
          <div className="flex flex-col items-center text-center gap-2 mb-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-black">{t('videos_title')}</h2>
            <div className="space-y-1">
              <p className="text-slate-700">{t('subheading')}</p>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="inline-flex items-center gap-3 px-5 py-3 bg-white rounded-lg shadow">
                <svg className="animate-spin h-6 w-6 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                <span className="text-slate-700">{t('loading_videos')}</span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && <p className="text-red-600 text-center">{error}</p>}

          {/* Videos Grid */}
          {!loading && !error && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
                {(showAll ? videos : videos.slice(0, 6)).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setPlaying(v.id)}
                    className="group text-left w-full rounded-xl overflow-hidden bg-white/80 backdrop-blur-sm shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                  >
                    <div className="relative w-full">
                      <Image
                        src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`}
                        alt={v.title || 'Video thumbnail'}
                        width={1280}
                        height={720}
                        className="w-full h-56 object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-gradient-to-br from-black/30 to-black/10 rounded-full p-4 scale-100 transition-transform group-hover:scale-105">
                          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="white">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-t from-white/70 to-transparent">
                      <div className="text-sm font-semibold text-slate-900 line-clamp-2">{v.title}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* See More Button */}
              {!showAll && videos.length > 6 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowAll(true)}
                    className="inline-flex items-center px-6 py-2 bg-sky-600 text-white rounded-full shadow hover:bg-sky-700 transition"
                  >
                    {t('see_more')}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Lightbox / Video Playback */}
          {playing && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
              onClick={() => setPlaying(null)}
            >
              <div className="w-full max-w-4xl mx-4" onClick={(e) => e.stopPropagation()}>
                <div className="relative pb-[56.25%] rounded-lg overflow-hidden shadow-lg">
                  <iframe
                    src={`https://www.youtube.com/embed/${playing}?autoplay=1&rel=0`}
                    title="YouTube video player"
                    allow="autoplay; encrypted-media"
                    className="absolute left-0 top-0 w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                  />
                </div>
                <div className="mt-3 text-right">
                  <button
                    className="px-4 py-2 bg-white rounded shadow"
                    onClick={() => setPlaying(null)}
                  >
                    {t('close')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}