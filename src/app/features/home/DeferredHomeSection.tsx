"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export default function DeferredHomeSection({
  children,
  placeholderClassName,
}: {
  children: ReactNode;
  placeholderClassName: string;
}) {
  const [isNearViewport, setIsNearViewport] = useState(false);
  const placeholderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = placeholderRef.current;
    if (!element || !('IntersectionObserver' in window)) {
      const frame = requestAnimationFrame(() => setIsNearViewport(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  if (isNearViewport) return <>{children}</>;

  return <div ref={placeholderRef} className={placeholderClassName} aria-hidden="true" />;
}
