"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "camelion:favorites";

type FavoritesContextValue = {
  hydrated: boolean;
  ids: string[];
  count: number;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function readStoredFavorites(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is string => typeof entry === "string");
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setIds(readStoredFavorites());
      setHydrated(true);
    });
    fetch("/api/account/me")
      .then((response) => response.json())
      .then((data: { favoriteIds?: string[] }) => {
        if (Array.isArray(data.favoriteIds)) setIds((current) => Array.from(new Set([...current, ...data.favoriteIds!])));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Storage unavailable -- favorites still work for this session.
    }
  }, [ids, hydrated]);

  const isFavorite = useCallback((productId: string) => ids.includes(productId), [ids]);

  const toggleFavorite = useCallback((productId: string) => {
    setIds((current) => {
      const removing = current.includes(productId);
      void fetch(`/api/account/favorites${removing ? `?productId=${encodeURIComponent(productId)}` : ""}`, {
        method: removing ? "DELETE" : "POST",
        headers: removing ? undefined : { "Content-Type": "application/json" },
        body: removing ? undefined : JSON.stringify({ productId }),
      }).catch(() => undefined);
      return removing ? current.filter((id) => id !== productId) : [...current, productId];
    });
  }, []);

  const value = useMemo(
    () => ({ hydrated, ids, count: ids.length, isFavorite, toggleFavorite }),
    [hydrated, ids, isFavorite, toggleFavorite]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used within a FavoritesProvider.");
  return context;
}
