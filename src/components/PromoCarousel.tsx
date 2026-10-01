"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

const slideCount = 3;

export function PromoCarousel({ children }: { children: ReactNode }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);

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
    setActiveSlide((current) => Math.max(0, Math.min(slideCount - 1, current + (deltaX < 0 ? 1 : -1))));
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
      setActiveSlide((current) => Math.max(0, current - 1));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setActiveSlide((current) => Math.min(slideCount - 1, current + 1));
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
          style={{ transform: `translateX(-${(activeSlide / slideCount) * 100}%)` }}
        >
          <div className="promo-carousel__slide" role="group" aria-roledescription="slide" aria-label="Slide 1 of 3">
            {children}
          </div>
          <div className="promo-carousel__slide" role="group" aria-roledescription="slide" aria-label="Slide 2 of 3">
            <div className="promo-carousel__image-slide">
              <img src="/assets/slide2.png" alt="Camelion promotional banner" />
            </div>
          </div>
          <div className="promo-carousel__slide" role="group" aria-roledescription="slide" aria-label="Slide 3 of 3">
            <div className="promo-carousel__placeholder-slide"><span>SLIDE 3 IMAGE</span></div>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="promo-carousel__control promo-carousel__control--previous"
        aria-label="Previous promotion"
        disabled={activeSlide === 0}
        onClick={() => setActiveSlide((current) => Math.max(0, current - 1))}
      >
        ‹
      </button>
      <button
        type="button"
        className="promo-carousel__control promo-carousel__control--next"
        aria-label="Next promotion"
        disabled={activeSlide === slideCount - 1}
        onClick={() => setActiveSlide((current) => Math.min(slideCount - 1, current + 1))}
      >
        ›
      </button>
    </section>
  );
}