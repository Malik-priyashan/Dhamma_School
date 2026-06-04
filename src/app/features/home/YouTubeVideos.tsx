"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { fetchYouTubeVideos } from './youtube/api/youtubeapi';
import { motion, AnimatePresence } from 'framer-motion';

type Video = { id: string; title: string };

function VideoCardSkeleton() {
  return (
    <div className="flex h-full min-h-[340px] w-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white/70 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-sm">
      <div className="relative aspect-video w-full overflow-hidden bg-slate-200 animate-pulse" />
      <div className="flex flex-1 flex-col justify-between p-6 space-y-4">
        <div className="space-y-3">
          <div className="h-4 w-12 rounded bg-slate-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-full rounded bg-slate-200 animate-pulse" />
            <div className="h-5 w-5/6 rounded bg-slate-200 animate-pulse" />
          </div>
        </div>
        <div className="h-4 w-20 rounded bg-slate-100/80 animate-pulse" />
      </div>
    </div>
  );
}

export default function YouTubeVideos() {
  const t = useTranslations();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  
  // Custom Video Player States
  const [player, setPlayer] = useState<any>(null);
  const [playerState, setPlayerState] = useState<number>(-1);
  const [currentSpeed, setCurrentSpeed] = useState<number>(1);
  const [currentQuality, setCurrentQuality] = useState<string>('default');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(80);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);

  const [visibleCount, setVisibleCount] = useState(6);
  const [loadingMore, setLoadingMore] = useState(false);
  const [copied, setCopied] = useState(false);

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

  // Dynamically load YouTube IFrame API script
  useEffect(() => {
    if (playing) {
      const hasScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!hasScript) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }
    }
  }, [playing]);

  // Hook into the YouTube Iframe when active
  useEffect(() => {
    if (!playing) {
      setPlayer(null);
      setPlayerState(-1);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    let ytPlayer: any;
    let checkInterval: any;

    const setupPlayer = () => {
      ytPlayer = new (window as any).YT.Player('youtube-player', {
        events: {
          onReady: (event: any) => {
            setPlayer(event.target);
            setDuration(event.target.getDuration() || 0);
            event.target.setVolume(volume);
            if (isMuted) event.target.mute();
            // sync settings
            setCurrentSpeed(event.target.getPlaybackRate() || 1);
          },
          onStateChange: (event: any) => {
            setPlayerState(event.data);
            setDuration(event.target.getDuration() || 0);
            // Handle when video completes playback
            if (event.data === 0) {
              setCurrentTime(0);
            }
          }
        }
      });
    };

    const tryInit = () => {
      if ((window as any).YT && (window as any).YT.Player) {
        setupPlayer();
      } else {
        checkInterval = setInterval(() => {
          if ((window as any).YT && (window as any).YT.Player) {
            setupPlayer();
            clearInterval(checkInterval);
          }
        }, 100);
      }
    };

    const timer = setTimeout(tryInit, 200);

    return () => {
      clearTimeout(timer);
      if (checkInterval) clearInterval(checkInterval);
      if (ytPlayer && typeof ytPlayer.destroy === 'function') {
        try {
          ytPlayer.destroy();
        } catch (e) {
          console.error("Player cleanup error:", e);
        }
      }
    };
  }, [playing]);

  // Keep track of current video timestamp when playing
  useEffect(() => {
    if (!player || playerState !== 1) return;
    const interval = setInterval(() => {
      try {
        setCurrentTime(player.getCurrentTime() || 0);
        setDuration(player.getDuration() || 0);
      } catch {
        // ignore errors during player transition
      }
    }, 450);
    return () => clearInterval(interval);
  }, [player, playerState]);

  // Manage body class to hide the website navbar during video playback
  useEffect(() => {
    if (playing) {
      document.body.classList.add('video-playing');
    } else {
      document.body.classList.remove('video-playing');
    }
    return () => {
      document.body.classList.remove('video-playing');
    };
  }, [playing]);

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + 6);
      setLoadingMore(false);
    }, 850);
  };

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Custom Video Player Handlers
  const handlePlayPause = () => {
    if (!player) return;
    if (playerState === 1) { // Playing
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const handleSkip = (seconds: number) => {
    if (!player) return;
    const current = player.getCurrentTime() || 0;
    const target = Math.max(0, Math.min(duration, current + seconds));
    player.seekTo(target, true);
    setCurrentTime(target);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!player) return;
    const seekVal = parseFloat(e.target.value);
    player.seekTo(seekVal, true);
    setCurrentTime(seekVal);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setVolume(val);
    if (player) {
      player.setVolume(val);
      if (val === 0) {
        player.mute();
        setIsMuted(true);
      } else {
        player.unMute();
        setIsMuted(false);
      }
    }
  };

  const toggleMute = () => {
    if (!player) return;
    if (isMuted) {
      player.unMute();
      player.setVolume(volume || 50);
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  };

  const speeds = [0.5, 1, 1.25, 1.5, 2];
  const handleSpeedSelect = (speed: number) => {
    if (player) {
      player.setPlaybackRate(speed);
      setCurrentSpeed(speed);
    }
    setShowSpeedMenu(false);
  };

  const qualities = [
    { label: 'Auto', value: 'default' },
    { label: '1085p', value: 'hd1080' },
    { label: '720p', value: 'hd720' },
    { label: '480p', value: 'large' },
    { label: '360p', value: 'medium' }
  ];
  const handleQualitySelect = (quality: string) => {
    if (player) {
      player.setPlaybackQuality(quality);
      setCurrentQuality(quality);
    }
    setShowQualityMenu(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 90,
        damping: 15
      }
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 110,
        damping: 20
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <section id="videos" className="w-full py-16 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
      {/* Decorative blurred backgrounds */}
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-7xl">
          {/* Heading */}
          <div className="flex flex-col items-center text-center gap-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-sky-600 bg-sky-50 px-4 py-1.5 rounded-full border border-sky-100">
              {t('dhamma_school')}
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mt-1">{t('videos_title')}</h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-sky-500 to-amber-400 rounded-full mt-2" />
            <p className="text-slate-600 max-w-xl text-base mt-2">{t('subheading')}</p>
          </div>

          {/* Initial Loading */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <VideoCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-2xl border border-red-100 max-w-md mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-red-700 text-center font-medium">{error}</p>
            </div>
          )}

          {/* Videos Grid */}
          {!loading && !error && (
            <>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch"
              >
                {videos.slice(0, visibleCount).map((v) => (
                  <motion.button
                    key={v.id}
                    variants={cardVariants}
                    onClick={() => setPlaying(v.id)}
                    className="group flex h-full min-h-[340px] w-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white text-left shadow-[0_15px_35px_rgba(15,23,42,0.03)] hover:shadow-[0_25px_50px_rgba(14,116,144,0.12)] transition-all duration-500 hover:-translate-y-1.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-200"
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                      <Image
                        src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`}
                        alt={v.title || 'Video thumbnail'}
                        width={1280}
                        height={720}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-900/10 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
                      
                      {/* Premium Play Button with pulsing ring */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative flex items-center justify-center">
                          <div className="absolute h-18 w-18 rounded-full bg-sky-500/25 animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="relative grid h-14 w-14 place-items-center rounded-full border border-white/20 bg-white/95 text-sky-600 shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:bg-sky-600 group-hover:text-white group-hover:border-sky-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="ml-1 transition-transform duration-300 group-hover:translate-x-0.5">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col justify-between border-t border-slate-50 bg-gradient-to-br from-white to-slate-50/50 p-6">
                      <div className="space-y-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md">
                          Video
                        </span>
                        <div className="text-base font-bold leading-snug text-slate-800 line-clamp-3 transition-colors duration-300 group-hover:text-sky-600">
                          {v.title}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-xs font-semibold text-sky-600 group-hover:text-sky-700">
                        Watch now
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </motion.button>
                ))}

                {/* Skeletons visible when loading more */}
                {loadingMore && Array.from({ length: Math.min(3, videos.length - visibleCount) }).map((_, i) => (
                  <motion.div
                    key={`skeleton-${i}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <VideoCardSkeleton />
                  </motion.div>
                ))}
              </motion.div>

              {/* See More Button */}
              {visibleCount < videos.length && (
                <div className="mt-14 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="group relative inline-flex items-center justify-center gap-3 rounded-full border border-sky-200 bg-white px-8 py-3.5 text-sm font-bold text-sky-700 shadow-[0_10px_30px_rgba(14,165,233,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-600 hover:text-white hover:shadow-[0_15px_40px_rgba(2,132,199,0.22)] focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 disabled:opacity-75 disabled:pointer-events-none"
                  >
                    {loadingMore ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-600 border-t-transparent group-hover:border-white" />
                        Loading...
                      </>
                    ) : (
                      <>
                        {t('see_more')}
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-sky-50 text-sky-700 transition group-hover:bg-white/20 group-hover:text-white">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14" />
                            <path d="m12 5 7 7-7 7" />
                          </svg>
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Lightbox / Video Playback Modal with Framer Motion */}
          <AnimatePresence>
            {playing && (
              <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                {/* Backdrop overlay */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={backdropVariants}
                  className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
                  onClick={() => setPlaying(null)}
                />

                {/* Modal Container */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={modalVariants}
                  className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Video & Floating Close Button (No Header Bar Row) */}
                  <div className="relative aspect-video w-full bg-black group/video">
                    <iframe
                      id="youtube-player"
                      src={`https://www.youtube.com/embed/${playing}?enablejsapi=1&autoplay=1&rel=0`}
                      title="YouTube video player"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      className="absolute left-0 top-0 w-full h-full border-0 pointer-events-auto"
                      allowFullScreen
                    />

                    {/* Floating Elegant Close Button */}
                    <button
                      onClick={() => setPlaying(null)}
                      className="absolute top-4 right-4 z-20 grid h-10 w-10 place-items-center rounded-full bg-slate-950/70 text-slate-300 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-slate-900 hover:text-white hover:scale-105 focus:outline-none"
                      aria-label="Close player"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Custom Controls Bar (Placed Below Video Player) */}
                  <div className="bg-slate-950 px-6 py-5 border-t border-white/5 flex flex-col gap-4 text-slate-200 select-none">
                    {/* Progress Slider */}
                    <div className="flex items-center gap-4 w-full">
                      <span className="text-xs font-mono text-slate-400">
                        {formatTime(currentTime)}
                      </span>
                      <div className="relative flex-1 h-5 flex items-center">
                        <input
                          type="range"
                          min={0}
                          max={duration || 100}
                          value={currentTime}
                          onChange={handleSeek}
                          className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-800 accent-sky-500 focus:outline-none"
                          style={{
                            background: `linear-gradient(to right, #0ea5e9 ${
                              duration ? (currentTime / duration) * 100 : 0
                            }%, #1e293b ${duration ? (currentTime / duration) * 100 : 0}%)`
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        {formatTime(duration)}
                      </span>
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      {/* Playback Controls Group */}
                      <div className="flex items-center gap-5">
                        {/* Rewind 10s */}
                        <button
                          onClick={() => handleSkip(-10)}
                          className="text-slate-400 hover:text-white transition-colors duration-200 focus:outline-none"
                          title="Rewind 10 seconds"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                          </svg>
                        </button>

                        {/* Play / Pause (Start / Stop) */}
                        <button
                          onClick={handlePlayPause}
                          className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-600 text-white hover:bg-sky-500 shadow-md shadow-sky-600/10 hover:scale-105 transition-all duration-200 focus:outline-none"
                          title={playerState === 1 ? "Pause" : "Play"}
                        >
                          {playerState === 1 ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                              <path fillRule="evenodd" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24" className="ml-0.5">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          )}
                        </button>

                        {/* Forward 10s */}
                        <button
                          onClick={() => handleSkip(10)}
                          className="text-slate-400 hover:text-white transition-colors duration-200 focus:outline-none"
                          title="Forward 10 seconds"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.934 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.334-4z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.934 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.334-4z" />
                          </svg>
                        </button>

                        {/* Volume controls */}
                        <div className="flex items-center gap-2 group/volume ml-2">
                          <button
                            onClick={toggleMute}
                            className="text-slate-400 hover:text-white transition-colors duration-200 focus:outline-none"
                          >
                            {isMuted || volume === 0 ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                              </svg>
                            ) : volume < 50 ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                              </svg>
                            )}
                          </button>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="w-0 opacity-0 group-hover/volume:w-20 group-hover/volume:opacity-100 h-1 rounded-full appearance-none cursor-pointer bg-slate-800 accent-sky-500 transition-all duration-300 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Speed, Quality, Share Controls Group */}
                      <div className="flex items-center gap-4 relative">
                        {/* Speed Toggle Menu */}
                        <div className="relative">
                          <button
                            onClick={() => {
                              setShowSpeedMenu(!showSpeedMenu);
                              setShowQualityMenu(false);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition duration-200 focus:outline-none"
                            title="Playback Speed"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {currentSpeed === 1 ? 'Normal' : `${currentSpeed}x`}
                          </button>
                          
                          <AnimatePresence>
                            {showSpeedMenu && (
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute bottom-full right-0 mb-2 w-28 rounded-xl bg-slate-900 border border-white/10 shadow-xl overflow-hidden z-30"
                              >
                                {speeds.map((s) => (
                                  <button
                                    key={s}
                                    onClick={() => handleSpeedSelect(s)}
                                    className={`w-full text-left px-4 py-2.5 text-xs transition duration-150 ${
                                      currentSpeed === s ? 'bg-sky-600 text-white font-bold' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                    }`}
                                  >
                                    {s === 1 ? 'Normal' : `${s}x`}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Quality Toggle Menu */}
                        <div className="relative">
                          <button
                            onClick={() => {
                              setShowQualityMenu(!showQualityMenu);
                              setShowSpeedMenu(false);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition duration-200 focus:outline-none"
                            title="Playback Quality"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {qualities.find(q => q.value === currentQuality)?.label || 'Quality'}
                          </button>

                          <AnimatePresence>
                            {showQualityMenu && (
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute bottom-full right-0 mb-2 w-28 rounded-xl bg-slate-900 border border-white/10 shadow-xl overflow-hidden z-30"
                              >
                                {qualities.map((q) => (
                                  <button
                                    key={q.value}
                                    onClick={() => handleQualitySelect(q.value)}
                                    className={`w-full text-left px-4 py-2.5 text-xs transition duration-150 ${
                                      currentQuality === q.value ? 'bg-sky-600 text-white font-bold' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                    }`}
                                  >
                                    {q.label}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Clipboard Copy Button */}
                        <button
                          onClick={() => copyLink(playing)}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200 border ${
                            copied
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {copied ? 'Copied!' : 'Share'}
                        </button>

                        {/* Direct YouTube Link */}
                        <a
                          href={`https://www.youtube.com/watch?v=${playing}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-white/5 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
                        >
                          YouTube
                        </a>

                        {/* Close Modal Button */}
                        <button
                          onClick={() => setPlaying(null)}
                          className="rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-sky-500 shadow-lg shadow-sky-600/20 focus:outline-none"
                        >
                          {t('close')}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
