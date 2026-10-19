"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pageRef = useRef<HTMLDivElement>(null);
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;

    const page = pageRef.current;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!page || !isMobile || prefersReducedMotion || typeof page.animate !== "function") return;

    const animation = page.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 700, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)" },
    );
    return () => animation.cancel();
  }, [pathname]);

  return (
    <div ref={pageRef} className="site-page-transition">
      {children}
    </div>
  );
}
