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
  const [loadOtherSlides, setLoadOtherSlides] = useState(false);

  useEffect(() => {
    // Let the first, visible image finish loading before requesting the slides
    // behind it. The carousel does not advance for another four seconds.
    const id = window.setTimeout(() => setLoadOtherSlides(true), 1000);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), 4000);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <div className="w-full relative overflow-hidden h-screen">
      <div className="relative w-full h-full">
        {images.map((src, i) => (i === 0 || loadOtherSlides) && (
          <div
            key={src}
            className={`absolute inset-0 transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0'}`}>
            <Image
              src={src}
              alt={`slide-${i}`}
              fill
              sizes="100vw"
              className="object-cover"
              preload={i === 0}
              loading={i === 0 ? undefined : "lazy"}
            />
            <div className="absolute inset-0 bg-black/60" />
          </div>
        ))}
      </div>

    </div>
  );
}
