"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

export function CollectionCategoryCarousel({ children }: { children: ReactNode }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [canScrollBackward, setCanScrollBackward] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(true);

  const updateScrollControls = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    setCanScrollBackward(viewport.scrollLeft > 2);
    setCanScrollForward(viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    updateScrollControls();
    viewport.addEventListener("scroll", updateScrollControls, { passive: true });
    window.addEventListener("resize", updateScrollControls);
    return () => {
      viewport.removeEventListener("scroll", updateScrollControls);
      window.removeEventListener("resize", updateScrollControls);
    };
  }, [updateScrollControls]);

  const scrollByCard = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    const firstCard = viewport?.querySelector<HTMLElement>(".collection-category-card");
    if (!viewport || !firstCard) return;
    const gap = Number.parseFloat(window.getComputedStyle(viewport).columnGap) || 0;
    viewport.scrollBy({ left: direction * (firstCard.getBoundingClientRect().width + gap), behavior: "smooth" });
  };

  return (
    <div className="collection-category-carousel">
      <div ref={viewportRef} className="collection-category-viewport" role="region" aria-label="Shop categories" tabIndex={0}>
        {children}
      </div>
      <div className="collection-carousel-controls" aria-label="Category slider controls">
        <button
          type="button"
          onClick={() => scrollByCard(-1)}
          disabled={!canScrollBackward}
          aria-label="Previous categories"
          className="collection-carousel-arrow"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => scrollByCard(1)}
          disabled={!canScrollForward}
          aria-label="Next categories"
          className="collection-carousel-arrow"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
