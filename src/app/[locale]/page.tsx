"use client";

// messages not needed here
import HeroCarousel from "../features/home/HeroCarousel";
import Hero from "../features/home/Hero";
import YouTubeVideos from "../features/home/YouTubeVideos";
import { useEffect, useState } from "react";
import { getUserRole } from "../../lib/authUtils";

export default function LocalePage() {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      Promise.resolve().then(() => {
        setUserRole(getUserRole());
      });
    }
  }, []);

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
      {userRole === 'STUDENT' && (
        <div className="w-full">
          <YouTubeVideos />
        </div>
      )}
    </div>
  );
}
