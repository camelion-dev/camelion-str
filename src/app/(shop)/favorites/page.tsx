"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useFavorites } from "@/context/FavoritesContext";
import type { CatalogProduct } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";

export default function FavoritesPage() {
  const { ids, hydrated } = useFavorites();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const idsKey = useMemo(() => [...ids].sort().join(","), [ids]);

  useEffect(() => {
    if (!hydrated) return;
    if (ids.length === 0) {
      queueMicrotask(() => {
        setProducts([]);
        setLoading(false);
      });
      return;
    }
    let cancelled = false;
    queueMicrotask(() => setLoading(true));
    fetch(`/api/products?ids=${ids.map(encodeURIComponent).join(",")}`)
      .then((response) => response.json())
      .then((data: { products: CatalogProduct[] }) => {
        if (!cancelled) setProducts(data.products || []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, idsKey]);

  if (!hydrated || loading) {
    return <p className="section-shell py-24 text-center text-sm text-[var(--muted)]">Loading favorites...</p>;
  }

  if (ids.length === 0) {
    return (
      <div className="section-shell flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--red)]">Your favorites</p>
        <h1 className="text-3xl font-black uppercase tracking-[-0.03em]">No favorites yet</h1>
        <p className="max-w-md text-sm text-[var(--body-gray)]">Save products you love so you can easily find them later.</p>
        <Link href="/" className="mt-2 bg-[var(--red)] px-6 py-4 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[var(--red-dark)]">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="section-shell py-10 md:py-16">
      <div className="mb-8 border-b border-[var(--border)] pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--red)]">Saved for later</p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-[-0.03em]">Your favorites</h1>
      </div>
      <div className="favorites-product-grid grid gap-4 sm:gap-5">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </div>
  );
}
