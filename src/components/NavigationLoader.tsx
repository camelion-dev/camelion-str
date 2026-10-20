"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { NAVIGATION_LOADING_EVENT } from "@/lib/navigation-loading";

type PendingLoad = {
  sourceKey: string;
  targetKey: string | null;
  startedAt: number;
  minimumVisibleMs: number;
};

type NavigationLoadingDetail = {
  href?: string;
  minimumVisibleMs?: number;
};

function toRouteKey(href: string) {
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

export function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const routeKey = `${pathname ?? ""}${queryString ? `?${queryString}` : ""}`;
  const routeKeyRef = useRef(routeKey);
  const pendingRef = useRef<PendingLoad | null>(null);
  const finishRef = useRef<((pending: PendingLoad) => void) | null>(null);
  const timerRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  routeKeyRef.current = routeKey;

  useEffect(() => {
    const clearTimers = () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      if (exitTimerRef.current !== null) window.clearTimeout(exitTimerRef.current);
      timerRef.current = null;
      exitTimerRef.current = null;
    };

    const finishAfterMinimum = (pending: PendingLoad) => {
      if (pendingRef.current !== pending) return;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      const remaining = Math.max(0, pending.minimumVisibleMs - (performance.now() - pending.startedAt));
      timerRef.current = window.setTimeout(() => {
        if (pendingRef.current !== pending) return;
        setLeaving(true);
        exitTimerRef.current = window.setTimeout(() => {
          if (pendingRef.current !== pending) return;
          pendingRef.current = null;
          setVisible(false);
          setLeaving(false);
          document.documentElement.removeAttribute("aria-busy");
        }, 240);
      }, remaining);
    };
    finishRef.current = finishAfterMinimum;

    const beginLoading = (detail: NavigationLoadingDetail = {}) => {
      const sourceKey = routeKeyRef.current;
      const targetKey = detail.href ? toRouteKey(detail.href) : null;
      if (targetKey && targetKey === sourceKey) return;

      clearTimers();
      const pending: PendingLoad = {
        sourceKey,
        targetKey,
        startedAt: performance.now(),
        minimumVisibleMs: detail.minimumVisibleMs ?? 650,
      };
      pendingRef.current = pending;
      setLeaving(false);
      setVisible(true);
      document.documentElement.setAttribute("aria-busy", "true");

      if (!targetKey) {
        finishAfterMinimum(pending);
      } else {
        timerRef.current = window.setTimeout(() => finishAfterMinimum(pending), 15000);
      }
    };

    const onLoadingEvent = (event: Event) => {
      beginLoading((event as CustomEvent<NavigationLoadingDetail>).detail);
    };

    const onPopState = () => {
      const targetKey = toRouteKey(window.location.href);
      if (targetKey && targetKey !== routeKeyRef.current) beginLoading({ href: window.location.href });
    };

    window.addEventListener(NAVIGATION_LOADING_EVENT, onLoadingEvent);
    window.addEventListener("popstate", onPopState);
    return () => {
      clearTimers();
      finishRef.current = null;
      window.removeEventListener(NAVIGATION_LOADING_EVENT, onLoadingEvent);
      window.removeEventListener("popstate", onPopState);
      document.documentElement.removeAttribute("aria-busy");
    };
  }, []);

  useEffect(() => {
    const pending = pendingRef.current;
    if (pending && routeKey !== pending.sourceKey) {
      finishRef.current?.(pending);
    }
  }, [routeKey]);

  if (!visible) return null;

  return (
    <div className={`site-navigation-loader${leaving ? " is-leaving" : ""}`} role="status" aria-live="polite" aria-label="Loading page">
      <div className="site-navigation-loader-content">
        <img src="/brand-logo.avif" alt="Camelion" className="site-navigation-loader-logo" />
        <span className="site-navigation-loader-spinner" aria-hidden="true" />
        <span className="site-navigation-loader-label">Loading</span>
      </div>
    </div>
  );
}
