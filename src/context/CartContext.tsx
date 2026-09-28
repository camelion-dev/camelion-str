"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartLine = { productId: string; quantity: number };

const STORAGE_KEY = "camelion:cart";

type CartContextValue = {
  /** True once the cart has been read from localStorage. Use this to avoid
   * rendering a "0" or "empty cart" flash before the real data loads. */
  hydrated: boolean;
  items: CartLine[];
  /** Total number of units across all lines, for the header badge. */
  count: number;
  /** Adds `quantity` units of a product. If it's already in the cart, the
   * quantities are merged (never duplicated as a second line). Clamps to
   * `maxQuantity` (the product's current stock) when provided. */
  addItem: (productId: string, quantity: number, maxQuantity?: number) => void;
  /** Sets a line to an exact quantity (used by the +/- stepper on the cart
   * page). Clamps between 1 and maxQuantity; removes the line if set below 1. */
  setQuantity: (productId: string, quantity: number, maxQuantity?: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is CartLine => typeof entry?.productId === "string" && Number.isFinite(entry?.quantity))
      .map((entry) => ({ productId: entry.productId, quantity: Math.max(1, Math.floor(entry.quantity)) }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Read localStorage only on the client, after mount, so the server-rendered
  // HTML and the first client render always match (no hydration mismatch).
  useEffect(() => {
    // Deferred via queueMicrotask so this is a callback (reacting to the
    // external localStorage read), not a synchronous setState directly in
    // the effect body -- same timing (runs right after mount, before
    // paint's done), just structured the way React's lint rules expect for
    // "sync state from an external system" effects.
    queueMicrotask(() => {
      setItems(readStoredCart());
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // localStorage can fail (private browsing, storage full) -- the cart
      // still works for this session, it just won't persist across reloads.
    }
  }, [items, hydrated]);

  const addItem = useCallback((productId: string, quantity: number, maxQuantity?: number) => {
    setItems((current) => {
      const existing = current.find((line) => line.productId === productId);
      const cap = maxQuantity ?? Infinity;
      if (existing) {
        const nextQuantity = Math.min(existing.quantity + quantity, cap);
        return current.map((line) => (line.productId === productId ? { ...line, quantity: nextQuantity } : line));
      }
      return [...current, { productId, quantity: Math.min(Math.max(1, quantity), cap) }];
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number, maxQuantity?: number) => {
    setItems((current) => {
      if (quantity < 1) return current.filter((line) => line.productId !== productId);
      const cap = maxQuantity ?? Infinity;
      const clamped = Math.min(quantity, cap);
      const exists = current.some((line) => line.productId === productId);
      if (!exists) return [...current, { productId, quantity: clamped }];
      return current.map((line) => (line.productId === productId ? { ...line, quantity: clamped } : line));
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((current) => current.filter((line) => line.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((total, line) => total + line.quantity, 0), [items]);

  const value = useMemo(
    () => ({ hydrated, items, count, addItem, setQuantity, removeItem, clearCart }),
    [hydrated, items, count, addItem, setQuantity, removeItem, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider.");
  return context;
}
