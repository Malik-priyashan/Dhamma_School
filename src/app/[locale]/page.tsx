"use client";

import { useMessages } from "next-intl";
import HeroCarousel from "../../components/home/HeroCarousel";
import Hero from "../../components/home/Hero";

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
        <section id="about" className="mt-8 bg-white rounded-lg p-6 shadow-sm">
          <h1 className="text-3xl font-semibold mb-2">{messages?.welcome_school ?? "..."}</h1>
          <p className="text-slate-600">{messages?.subheading ?? ''}</p>
        </section>
      </main>
    </div>
  );
}
