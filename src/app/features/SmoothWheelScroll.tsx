"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Adds a short easing tail to mouse-wheel scrolling without replacing native touch scrolling. */
export default function SmoothWheelScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let targetY = window.scrollY;
    let previousTime = 0;

    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      targetY = window.scrollY;
    };

    const animate = (time: number) => {
      const elapsed = previousTime ? Math.min(time - previousTime, 64) : 16;
      previousTime = time;
      targetY = Math.min(targetY, Math.max(0, document.documentElement.scrollHeight - window.innerHeight));
      const currentY = window.scrollY;
      const nextY = currentY + (targetY - currentY) * (1 - Math.exp(-elapsed / 150));

      if (Math.abs(targetY - nextY) < 0.5) {
        window.scrollTo(0, targetY);
        frame = 0;
        previousTime = 0;
        return;
      }

      window.scrollTo(0, nextY);
      frame = requestAnimationFrame(animate);
    };

    const hasNestedScroller = (target: EventTarget | null) => {
      let element = target instanceof Element ? target : null;
      while (element && element !== document.body && element !== document.documentElement) {
        if (element.scrollHeight > element.clientHeight + 1) {
          const style = window.getComputedStyle(element);
          if (/auto|scroll/.test(style.overflowY)) return true;
        }
        element = element.parentElement;
      }
      return false;
    };

    const onWheel = (event: WheelEvent) => {
      if (!finePointer.matches || reducedMotion.matches || event.defaultPrevented ||
          event.ctrlKey || event.metaKey || event.shiftKey ||
          Math.abs(event.deltaX) > Math.abs(event.deltaY) || hasNestedScroller(event.target)) {
        stop();
        return;
      }

      // Precision touchpads already provide their own momentum.
      if (event.deltaMode === WheelEvent.DOM_DELTA_PIXEL &&
          (Math.abs(event.deltaY) < 80 || !Number.isInteger(event.deltaY))) {
        stop();
        return;
      }

      const multiplier = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 :
        event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? window.innerHeight : 1;
      const delta = event.deltaY * multiplier;
      const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const nextTarget = Math.min(maxY, Math.max(0, (frame ? targetY : window.scrollY) + delta));
      if (nextTarget === window.scrollY && !frame) return;

      event.preventDefault();
      targetY = nextTarget;
      if (!frame) frame = requestAnimationFrame(animate);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("pointerdown", stop);
    window.addEventListener("keydown", stop);
    window.addEventListener("popstate", stop);
    window.addEventListener("hashchange", stop);
    reducedMotion.addEventListener("change", stop);

    return () => {
      stop();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("pointerdown", stop);
      window.removeEventListener("keydown", stop);
      window.removeEventListener("popstate", stop);
      window.removeEventListener("hashchange", stop);
      reducedMotion.removeEventListener("change", stop);
    };
  }, [pathname]);

  return null;
}
