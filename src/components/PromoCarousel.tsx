"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type TransitionEvent as ReactTransitionEvent } from "react";

const slideCount = 2;

export function PromoCarousel() {
  const [activeSlide, setActiveSlide] = useState(1);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);

  const snapToRealSlide = useCallback((clonedSlide: number) => {
    setTransitionEnabled(false);
    setActiveSlide(clonedSlide === 0 ? slideCount : 1);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setTransitionEnabled(true));
    });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActiveSlide((current) => Math.min(current + 1, slideCount + 1));
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [activeSlide]);

  useEffect(() => {
    if (activeSlide !== 0 && activeSlide !== slideCount + 1) return;
    const timer = window.setTimeout(() => snapToRealSlide(activeSlide), 860);
    return () => window.clearTimeout(timer);
  }, [activeSlide, snapToRealSlide]);

  const moveSlide = (direction: -1 | 1) => {
    setActiveSlide((current) => Math.max(0, Math.min(slideCount + 1, current + direction)));
  };

  const handleTrackTransitionEnd = (event: ReactTransitionEvent<HTMLDivElement>) => {
    if (event.propertyName !== "transform" || (activeSlide !== 0 && activeSlide !== slideCount + 1)) return;
    snapToRealSlide(activeSlide);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!event.isPrimary || event.button > 0 || (event.target instanceof HTMLElement && event.target.closest("button"))) return;
    pointerStart.current = { x: event.clientX, y: event.clientY };
    suppressClick.current = false;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    const start = pointerStart.current;
    if (!start) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    pointerStart.current = null;
    setIsDragging(false);

    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    suppressClick.current = true;
    moveSlide(deltaX < 0 ? 1 : -1);
  };

  const handlePointerCancel = () => {
    pointerStart.current = null;
    setIsDragging(false);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    event.currentTarget.style.setProperty("--promo-glow-x", `${x}%`);
    event.currentTarget.style.setProperty("--promo-glow-y", `${y}%`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveSlide(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      moveSlide(1);
    }
  };

  return (
    <section
      className={`promo-carousel section-shell${isDragging ? " is-dragging" : ""}`}
      aria-label="Promotions"
      aria-roledescription="carousel"
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClickCapture={(event) => {
        if (suppressClick.current) {
          event.preventDefault();
          event.stopPropagation();
          suppressClick.current = false;
        }
      }}
      onKeyDown={handleKeyDown}
    >
      <span className="promo-carousel__glow" aria-hidden="true" />
      <div className="promo-carousel__viewport">
        <div
          className="promo-carousel__track"
          style={{ transform: `translateX(-${activeSlide * 25}%)`, transition: transitionEnabled ? undefined : "none" }}
          onTransitionEnd={handleTrackTransitionEnd}
        >
          <div className="promo-carousel__slide" aria-hidden="true" inert>
            <div className="promo-carousel__image-slide">
              <img src="/assets/slide3.png" alt="" />
            </div>
          </div>
          <div className="promo-carousel__slide" role="group" aria-roledescription="slide" aria-label="Slide 1 of 2">
            <div className="promo-carousel__image-slide">
              <img src="/assets/slide2.png" alt="Camelion promotional banner" />
            </div>
          </div>
          <div className="promo-carousel__slide" role="group" aria-roledescription="slide" aria-label="Slide 2 of 2">
            <div className="promo-carousel__image-slide">
              <img src="/assets/slide3.png" alt="Camelion promotional banner" />
            </div>
          </div>
          <div className="promo-carousel__slide" aria-hidden="true" inert>
            <div className="promo-carousel__image-slide">
              <img src="/assets/slide2.png" alt="" />
            </div>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="promo-carousel__control promo-carousel__control--previous"
        aria-label="Previous promotion"
        onClick={() => moveSlide(-1)}
      >
        ‹
      </button>
      <button
        type="button"
        className="promo-carousel__control promo-carousel__control--next"
        aria-label="Next promotion"
        onClick={() => moveSlide(1)}
      >
        ›
      </button>
    </section>
  );
}