"use client";

import { useMessages } from "next-intl";
import HeroCarousel from "../components/home/HeroCarousel";
import Hero from "../components/home/Hero";
import YouTubeVideos from "../components/home/youtube/YouTubeVideos";

export default function LocalePage() {
  const messages = useMessages();

  return (
    <div className="flex flex-col min-h-screen items-center justify-start bg-white font-sans">
      {/* Full-width hero */}
      <div className="w-full">
        <div className="relative w-full">
          <HeroCarousel />
          <Hero />
        </div>
      </div>

      {/* Constrained content */}
      <main className="w-full max-w-6xl py-8 px-6">
        {/* Constrained content (other sections can go here) */}
      </main>

      {/* Videos section should span full width */}
      <div className="w-full">
        <YouTubeVideos />
      </div>
    </div>
  );
}
