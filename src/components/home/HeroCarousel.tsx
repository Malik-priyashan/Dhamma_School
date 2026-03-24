"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

type Props = { images?: string[] };

export default function HeroCarousel({
  images = [
    "/hero/download%20(1).jpg",
    "/hero/download.jpg",
    "/hero/Lord%20Buddha.jpg",
  ],
}: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), 4000);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <div className="w-full relative overflow-hidden h-screen">
      <div className="relative w-full h-full">
        {images.map((src, i) => (
          <div
            key={src}
            className={`absolute inset-0 transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0'}`}>
            <Image src={src} alt={`slide-${i}`} fill style={{ objectFit: 'cover' }} priority />
            <div className="absolute inset-0 bg-black/60" />
          </div>
        ))}
      </div>

      <div className="absolute left-0 right-0 bottom-8 flex items-center justify-center">
        <div className="bg-black/30 backdrop-blur-sm px-1 py-0.5 rounded-full border border-white/10">
          <div className="flex gap-2 items-center justify-center">
            {images.map((_, i) => {
              const isActive = i === index;
              const indicatorClass = isActive
                ? 'w-9 h-1 rounded-full bg-white'
                : 'w-2 h-1 rounded-full bg-white/60';

              return (
                <button
                  key={i}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className="p-0.5 focus:outline-none"
                >
                  <span className={`block transition-all duration-300 ease-in-out ${indicatorClass}`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
