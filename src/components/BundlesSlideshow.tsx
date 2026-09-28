"use client";

import { useEffect, useRef, useState } from "react";

type Slide = { eyebrow: string; heading: string; body: string; ctaLabel: string; ctaHref: string };

const slides: Slide[] = [
  { eyebrow: "Better together", heading: "Save more with Camelion bundles.", body: "Everything you need for your setup, packed together at a better value.", ctaLabel: "Explore bundles", ctaHref: "/#new-arrivals" },
  { eyebrow: "Free delivery", heading: "Free shipping on orders over Rs. 5,000.", body: "Shop more, save on delivery — applied automatically at checkout.", ctaLabel: "Start shopping", ctaHref: "/#collection" },
  { eyebrow: "Flexible payment", heading: "Pay when it arrives.", body: "Cash on Delivery available on every order — no card, no hassle.", ctaLabel: "Browse products", ctaHref: "/#all-products" },
  { eyebrow: "Peace of mind", heading: "30 days to change your mind.", body: "Simple exchanges, no friction, no questions asked.", ctaLabel: "See all products", ctaHref: "/#all-products" },
];

const ANIMATION_DURATION_MS = 6000;

export function BundlesSlideshow() {
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => 
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
  );
  const [position, setPosition] = useState(0);
  const [loopWidth, setLoopWidth] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const firstSlideRef = useRef<HTMLDivElement>(null);
  const loopStartRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measureLoopWidth = () => {
      const firstSlide = firstSlideRef.current;
      const loopStart = loopStartRef.current;
      if (firstSlide && loopStart) {
        setLoopWidth(loopStart.getBoundingClientRect().left - firstSlide.getBoundingClientRect().left);
      }
    };

    measureLoopWidth();
    const observer = new ResizeObserver(measureLoopWidth);
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Intersection Observer for scroll-triggered animation
  useEffect(() => {
    if (!sectionRef.current || prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  // Smooth continuous animation
  useEffect(() => {
    if (!isVisible || prefersReducedMotion || loopWidth === 0) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    lastTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      // Calculate progress (0 to 1 over animation duration)
      const distance = (deltaTime / ANIMATION_DURATION_MS) * (loopWidth / slides.length);
      setPosition((prev) => {
        return (prev + distance) % loopWidth;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, prefersReducedMotion, loopWidth]);

  // Duplicate slides for infinite loop effect
  // Use 4 sets to ensure seamless looping
  const duplicatedSlides = [...slides, ...slides, ...slides, ...slides];

  return (
    <section
      id="bundles"
      ref={sectionRef}
      aria-label="Promotions"
      className="hero-red relative w-full overflow-hidden bg-[var(--red)] text-white"
    >
      <div className="section-shell relative py-12 md:py-16">
        {/* Static header */}
        <div className="mb-8 text-center md:mb-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">Special offers</p>
          <h2 className="mt-2 text-2xl font-black uppercase leading-[0.95] tracking-[-0.04em] md:text-3xl">Shop promotions</h2>
        </div>

        {/* Continuous horizontal slider */}
        <div className="relative overflow-hidden">
          <div
            ref={trackRef}
            className="flex gap-6 will-change-transform"
            style={{
              transform: prefersReducedMotion ? 'none' : `translateX(-${position}px)`,
            }}
          >
            {duplicatedSlides.map((slide, index) => (
              <div
                key={`${slide.heading}-${index}`}
                ref={index === 0 ? firstSlideRef : index === slides.length ? loopStartRef : undefined}
                className="flex-shrink-0 w-[360px] md:w-[400px] rounded-xl bg-white/10 backdrop-blur-sm p-6 md:p-8"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">{slide.eyebrow}</p>
                <h3 className="mt-2 text-sm font-black uppercase leading-tight tracking-wide md:text-base">{slide.heading}</h3>
                <p className="mt-3 text-xs text-white/80 md:text-sm">{slide.body}</p>
                <a
                  href={slide.ctaHref}
                  className="mt-4 inline-block bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--red)] transition-colors hover:bg-black hover:text-white md:text-xs"
                >
                  {slide.ctaLabel} →
                </a>
              </div>
            ))}
          </div>
        </div>


      </div>
    </section>
  );
}