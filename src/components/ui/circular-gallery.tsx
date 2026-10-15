import React, { useEffect, useRef, useState, HTMLAttributes } from 'react';

const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

export interface GalleryItem {
  id?: string;
  common: string;
  binomial: string;
  photo: {
    url: string;
    text: string;
    pos?: string;
    by: string;
  };
}

interface CircularGalleryProps extends HTMLAttributes<HTMLDivElement> {
  items: GalleryItem[];
  radius?: number;
  autoRotateSpeed?: number;
}

const CircularGallery = React.forwardRef<HTMLDivElement, CircularGalleryProps>(
  ({ items, className, radius = 410, autoRotateSpeed = 0.04, ...props }, ref) => {
    const [rotation, setRotation] = useState(0);
    const [isInteracting, setIsInteracting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isPageVisible, setIsPageVisible] = useState(true);

    // Keep track of current dimensions for responsiveness
    const [dimensions, setDimensions] = useState({ cardWidth: 240, cardHeight: 320, radius: 410 });

    const containerRef = useRef<HTMLDivElement>(null);
    const targetRotationRef = useRef(0);
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const interactTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Drag-specific refs
    const isDraggingRef = useRef(false);
    const pointerStartXRef = useRef(0);
    const rotationStartXRef = useRef(0);
    const dragDistanceRef = useRef(0);
    const lastPointerXRef = useRef(0);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      if (!('IntersectionObserver' in window)) {
        const frame = requestAnimationFrame(() => setIsVisible(true));
        return () => cancelAnimationFrame(frame);
      }

      const observer = new IntersectionObserver(([entry]) => {
        setIsVisible(entry.isIntersecting);
      });
      observer.observe(container);

      const handleVisibilityChange = () => setIsPageVisible(!document.hidden);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      handleVisibilityChange();

      return () => {
        observer.disconnect();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }, []);

    // Handle Resize to make the gallery fully responsive
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const handleResize = (entries: ResizeObserverEntry[]) => {
        for (const entry of entries) {
          const width = entry.contentRect.width;
          let cardWidth = 240;
          let cardHeight = 320;
          let computedRadius = radius;

          if (width < 480) {
            // Mobile (phones)
            cardWidth = 140;
            cardHeight = 190;
            // Increase radius slightly on small screens to create spacing
    computedRadius = Math.max(radius * 1.08, 210);
          } else if (width < 768) {
            // Tablets / large phones
            cardWidth = 185;
            cardHeight = 250;
            computedRadius = Math.max(radius * 1.05, 250);
          } else if (width < 1024) {
            // Large tablets / small laptops
            cardWidth = 210;
            cardHeight = 280;
            computedRadius = Math.max(radius * 1.03, 290);
          } else {
            // Desktop – keep original radius
            cardWidth = 240;
            cardHeight = 320;
            computedRadius = radius;
          }

          setDimensions({ cardWidth, cardHeight, radius: computedRadius });
        }
      };

      const observer = new ResizeObserver(handleResize);
      observer.observe(container);
      return () => observer.disconnect();
    }, [radius]);

    // Handle scroll to rotate the carousel
    useEffect(() => {
      if (!isVisible) return;
      const handleScroll = () => {
        if (isDraggingRef.current) return;

        setIsInteracting(true);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
        targetRotationRef.current = scrollProgress * 360;

        scrollTimeoutRef.current = setTimeout(() => {
          setIsInteracting(false);
        }, 1500); // Resume auto-rotate after 1.5s of no scroll
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', handleScroll);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }, [isVisible]);

    // Animation Loop
    useEffect(() => {
      if (!isVisible || !isPageVisible) return;
      const autoRotate = () => {
        let nextTarget = targetRotationRef.current;
        if (!isInteracting) {
          nextTarget += autoRotateSpeed;
        }
        targetRotationRef.current = nextTarget;

        // Custom easing for different states (smooth interpolation)
        let easing = 0.05; // standard smooth drift
        if (isDraggingRef.current) {
          easing = 0.25; // instant drag response
        } else if (isInteracting) {
          easing = 0.1; // responsive scroll catchup
        }

        setRotation((current) => current + (targetRotationRef.current - current) * easing);
        animationFrameRef.current = requestAnimationFrame(autoRotate);
      };

      animationFrameRef.current = requestAnimationFrame(autoRotate);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [isInteracting, autoRotateSpeed, isVisible, isPageVisible]);

    // Pointer Interaction Handlers for drag/swipe support
    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;

      isDraggingRef.current = true;
      setIsDragging(true);
      pointerStartXRef.current = e.clientX;
      lastPointerXRef.current = e.clientX;
      rotationStartXRef.current = targetRotationRef.current;
      dragDistanceRef.current = 0;
      setIsInteracting(true);

      if (interactTimeoutRef.current) {
        clearTimeout(interactTimeoutRef.current);
      }
      e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return;

      const currentX = e.clientX;
      const deltaX = currentX - pointerStartXRef.current;
      dragDistanceRef.current += Math.abs(currentX - lastPointerXRef.current);
      lastPointerXRef.current = currentX;

      // Adjust sensitivity for custom feel
      const sensitivity = 0.45;
      targetRotationRef.current = rotationStartXRef.current - deltaX * sensitivity;
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);
      e.currentTarget.releasePointerCapture(e.pointerId);

      // Start/reset timer to resume auto-rotation
      if (interactTimeoutRef.current) {
        clearTimeout(interactTimeoutRef.current);
      }
      interactTimeoutRef.current = setTimeout(() => {
        setIsInteracting(false);
      }, 3000);
    };

    // Rotate selected card to front when clicked
    const handleCardClick = (itemAngle: number) => {
      const currentTarget = targetRotationRef.current;
      const targetBase = Math.round(currentTarget / 360) * 360;
      let newTarget = targetBase - itemAngle;

      // Ensure shortest path rotation
      while (newTarget - currentTarget > 180) newTarget -= 360;
      while (newTarget - currentTarget < -180) newTarget += 360;

      targetRotationRef.current = newTarget;
      setIsInteracting(true);

      if (interactTimeoutRef.current) {
        clearTimeout(interactTimeoutRef.current);
      }
      interactTimeoutRef.current = setTimeout(() => {
        setIsInteracting(false);
      }, 3000);
    };

    const anglePerItem = items.length ? 360 / items.length : 0;

    return (
      <div
        ref={(el) => {
          // Bind both internal ref and external ref if provided
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          if (typeof ref === 'function') ref(el);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
        role="region"
        aria-label="Circular Gallery"
        className={cn(
          "relative w-full h-full flex items-center justify-center select-none active:cursor-grabbing",
          isDragging ? "cursor-grabbing" : "cursor-grab",
          className
        )}
        style={{ perspective: '1800px', touchAction: 'pan-y' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        {...props}
      >
        <div
          className="relative w-full h-full transition-transform duration-75"
          style={{
            transform: `rotateY(${rotation}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {items.map((item, i) => {
            const itemAngle = i * anglePerItem;
            const totalRotation = rotation % 360;
            const relativeAngle = (itemAngle + totalRotation + 360) % 360;
            const normalizedAngle = Math.abs(relativeAngle > 180 ? 360 - relativeAngle : relativeAngle);

            // Hide back-facing cards cleanly to avoid clutter
            let opacity = 1;
            if (normalizedAngle > 90) {
              opacity = Math.max(0, 1 - (normalizedAngle - 90) / 35) * 0.8;
            } else {
              opacity = Math.max(0.15, 1 - normalizedAngle / 90);
            }

            // Disable pointer interactions for cards that are far at the back
            const pointerEvents = normalizedAngle > 80 ? 'none' : 'auto';

            return (
              <div
                key={item.id || `${item.common}-${i}`}
                role="button"
                aria-label={item.common}
                tabIndex={0}
                onClick={(_)=>{
                  if (dragDistanceRef.current > 8) {
                    // Ignore clicks on drag release
                    return;
                  }
                  handleCardClick(itemAngle);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleCardClick(itemAngle);
                  }
                }}
                className="absolute transition-all duration-300 ease-out hover:scale-105 hover:shadow-sky-200/50 hover:shadow-2xl group"
                style={{
                  width: `${dimensions.cardWidth}px`,
                  height: `${dimensions.cardHeight}px`,
                  transform: `rotateY(${itemAngle}deg) translateZ(${dimensions.radius}px)`,
                  left: '50%',
                  top: '50%',
                  marginLeft: `-${dimensions.cardWidth / 2}px`,
                  marginTop: `-${dimensions.cardHeight / 2}px`,
                  opacity,
                  pointerEvents,
                  // Let CSS handle normal hover transition, but disable transition on transform during active dragging
                  transition: isDragging ? 'opacity 0.2s linear' : 'opacity 0.3s linear, transform 0.3s ease-out, margin 0.3s ease-out, width 0.3s ease-out, height 0.3s ease-out',
                }}
              >
                <div className="relative h-full w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-50 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/40">
                  <img
                    src={item.photo.url}
                    alt={item.photo.text}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                    style={{ objectPosition: item.photo.pos || 'center' }}
                  />

                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

CircularGallery.displayName = 'CircularGallery';

export { CircularGallery };
