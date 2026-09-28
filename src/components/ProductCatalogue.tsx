"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { CatalogProduct } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";

const PAGE_SIZE = 8;

type SortOption = "featured" | "newest" | "price-low" | "price-high" | "name-az" | "name-za";

export function ProductCatalogue({ products }: { products: CatalogProduct[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categories = Array.from(new Set(products.map((product) => product.category))).sort();
  const prices = products.map((product) => product.price);
  const maximumPrice = Math.max(...prices, 0);
  const selectedCategory = searchParams.get("category") || "all";
  const selectedSort = (searchParams.get("sort") as SortOption | null) || "featured";
  const [maxPrice, setMaxPrice] = useState(maximumPrice);
  const [minPrice, setMinPrice] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const updateUrl = (key: "category" | "sort", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "featured") params.delete(key);
    else params.set(key, value);
    router.replace(`/?${params.toString()}#all-products`, { scroll: false });
    setVisibleCount(PAGE_SIZE);
  };

  const filteredProducts = products
    .filter((product) => selectedCategory === "all" || product.category === selectedCategory)
    .filter((product) => product.price >= minPrice && product.price <= maxPrice)
    .sort((first, second) => {
      if (selectedSort === "price-low") return first.price - second.price;
      if (selectedSort === "price-high") return second.price - first.price;
      if (selectedSort === "name-az") return first.name.localeCompare(second.name);
      if (selectedSort === "name-za") return second.name.localeCompare(first.name);
      return 0;
    });
  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasFilters = selectedCategory !== "all" || selectedSort !== "featured" || minPrice > 0 || maxPrice < maximumPrice;

  const resetFilters = () => {
    router.replace("/#all-products", { scroll: false });
    setMinPrice(0);
    setMaxPrice(maximumPrice);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <section id="all-products" className="border-y border-[var(--border)] bg-[var(--soft-gray)] py-20">
      <div className="section-shell">
        <div className="flex flex-col justify-between gap-5 border-b border-[var(--border)] pb-8 md:flex-row md:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--red)]">The complete edit</p><h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.04em] md:text-5xl">All products</h2><p className="mt-3 max-w-lg text-sm text-[var(--body-gray)]">Explore our complete collection of power and charging essentials.</p></div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">{filteredProducts.length} products</p>
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-[210px_1fr]">
          <aside className="h-fit border border-[var(--border)] bg-white p-5 lg:sticky lg:top-6">
            <div className="flex items-center justify-between"><h3 className="text-xs font-black uppercase tracking-[0.16em]">Filters</h3>{hasFilters && <button onClick={resetFilters} className="text-[10px] font-bold uppercase tracking-wider text-[var(--red)]">Reset</button>}</div>
            <div className="mt-7"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Category</p><div className="mt-3 grid gap-2">{["all", ...categories].map((category) => <button key={category} onClick={() => updateUrl("category", category)} className={`flex justify-between py-1 text-left text-sm ${selectedCategory === category ? "font-bold text-[var(--red)]" : "text-[var(--body-gray)] hover:text-[var(--red)]"}`}><span>{category === "all" ? "All products" : category}</span><span>{category === "all" ? products.length : products.filter((product) => product.category === category).length}</span></button>)}</div></div>
            <div className="mt-8 border-t border-[var(--border)] pt-6"><div className="flex justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Price</p><span className="text-[10px] font-bold">Rs. {minPrice.toLocaleString()} - {maxPrice.toLocaleString()}</span></div><input aria-label="Minimum price" type="range" min="0" max={maximumPrice} step="100" value={minPrice} onChange={(event) => { setMinPrice(Math.min(Number(event.target.value), maxPrice)); setVisibleCount(PAGE_SIZE); }} className="mt-5 w-full accent-[var(--red)]" /><input aria-label="Maximum price" type="range" min="0" max={maximumPrice} step="100" value={maxPrice} onChange={(event) => { setMaxPrice(Math.max(Number(event.target.value), minPrice)); setVisibleCount(PAGE_SIZE); }} className="mt-2 w-full accent-[var(--red)]" /><div className="mt-2 flex justify-between text-[10px] text-[var(--muted)]"><span>Rs. 0</span><span>Rs. {maximumPrice.toLocaleString()}</span></div></div>
          </aside>
          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Showing {visibleProducts.length} of {filteredProducts.length}</span><label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em]">Sort by<select value={selectedSort} onChange={(event) => updateUrl("sort", event.target.value)} className="border border-[var(--border)] bg-white px-3 py-2 text-xs font-bold normal-case tracking-normal outline-none focus:border-[var(--red)]"><option value="featured">Featured</option><option value="newest">Newest</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option><option value="name-az">Name: A to Z</option><option value="name-za">Name: Z to A</option></select></label></div>
            {visibleProducts.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="border border-dashed border-[var(--border)] bg-white px-6 py-20 text-center"><h3 className="text-xl font-black uppercase">No products found</h3><p className="mt-2 text-sm text-[var(--body-gray)]">Try widening your price range or clearing the category filter.</p><button onClick={resetFilters} className="mt-5 bg-[var(--red)] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white">Reset filters</button></div>}
            {visibleCount < filteredProducts.length && <div className="mt-8 text-center"><button onClick={() => setVisibleCount((count) => count + PAGE_SIZE)} className="border border-[var(--foreground)] bg-white px-6 py-4 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-[var(--foreground)] hover:text-white">Load more products →</button></div>}
          </div>
        </div>
      </div>
    </section>
  );
}
