"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { CatalogProduct } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";

const PAGE_SIZE = 12;

type SortOption = "featured" | "newest" | "price-low" | "price-high" | "name-az" | "name-za";
type AvailabilityOption = "all" | "in-stock" | "out-of-stock";

export function ProductCatalogue({ products }: { products: CatalogProduct[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categories = Array.from(new Set(products.map((product) => product.category))).sort();
  const prices = products.map((product) => product.price);
  const maximumPrice = Math.max(...prices, 0);
  const selectedCategory = searchParams.get("category") || "all";
  const searchTerm = (searchParams.get("search") || "").trim().toLowerCase();
  const selectedSort = (searchParams.get("sort") as SortOption | null) || "featured";
  const [maxPrice, setMaxPrice] = useState(maximumPrice);
  const [minPrice, setMinPrice] = useState(0);
  const [availability, setAvailability] = useState<AvailabilityOption>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const catalogueRef = useRef<HTMLElement>(null);

  const updateUrl = (key: "category" | "sort", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "featured") params.delete(key);
    else params.set(key, value);
    router.replace(`/?${params.toString()}#all-products`, { scroll: false });
    setCurrentPage(1);
  };

  const filteredProducts = products
    .filter((product) => !searchTerm || [product.name, product.category, product.description].some((value) => value.toLowerCase().includes(searchTerm)))
    .filter((product) => selectedCategory === "all" || product.category === selectedCategory)
    .filter((product) => availability === "all" || (availability === "in-stock" ? product.stock > 0 : product.stock <= 0))
    .filter((product) => product.price >= minPrice && product.price <= maxPrice)
    .sort((first, second) => {
      if (selectedSort === "price-low") return first.price - second.price;
      if (selectedSort === "price-high") return second.price - first.price;
      if (selectedSort === "name-az") return first.name.localeCompare(second.name);
      if (selectedSort === "name-za") return second.name.localeCompare(first.name);
      return 0;
    });
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const visibleProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const recommendations = products.filter((product) => !visibleProducts.some((visibleProduct) => visibleProduct.id === product.id)).slice(-5);
  const shopPromotions = [
    {
      eyebrow: "Better together",
      title: "Save more with Camelion bundles.",
      text: "Everything you need for your setup, packed together at a better value.",
      href: "/#new-arrivals",
      cta: "Explore bundles",
    },
    {
      eyebrow: "Free delivery",
      title: "Free shipping on orders over Rs. 5,000.",
      text: "Shop more, save on delivery — applied automatically at checkout.",
      href: "/#collection",
      cta: "Start shopping",
    },
    {
      eyebrow: "Flexible payment",
      title: "Pay when it arrives.",
      text: "Cash on Delivery available on every order — no card, no hassle.",
      href: "/#all-products",
      cta: "Browse products",
    },
    {
      eyebrow: "Peace of mind",
      title: "30 days to change your mind.",
      text: "Simple exchanges, no friction, no questions asked.",
      href: "/#all-products",
      cta: "See all products",
    },
  ];
  const hasFilters = Boolean(searchTerm) || selectedCategory !== "all" || selectedSort !== "featured" || availability !== "all" || minPrice > 0 || maxPrice < maximumPrice;

  const resetFilters = () => {
    router.replace("/#all-products", { scroll: false });
    setMinPrice(0);
    setMaxPrice(maximumPrice);
    setAvailability("all");
    setCurrentPage(1);
  };

  useEffect(() => {
    if (!catalogueRef.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      gsap.fromTo(
        ".glass-product-card",
        { opacity: 0, y: 24, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.65,
          stagger: 0.045,
          ease: "power3.out",
          scrollTrigger: { trigger: catalogueRef.current, start: "top 82%", once: true },
        },
      );
    }, catalogueRef);
    return () => context.revert();
  }, [availability, currentPage, maxPrice, minPrice, searchTerm, selectedCategory, selectedSort]);

  return (
    <>
      <section id="all-products" ref={catalogueRef} className="catalogue-stage border-y border-[var(--border)] py-20 md:py-28">
        <div className="section-shell">
          <div className="flex flex-col justify-between gap-8 border-b border-[var(--border)] pb-8 md:flex-row md:items-end">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--red)]">The complete range</p><h2 className="mt-3 max-w-5xl text-4xl font-black uppercase leading-none tracking-[-0.06em] md:text-6xl">Shop All</h2></div>
            <p className="max-w-[15rem] text-right text-xs leading-5 text-[var(--body-gray)]">{filteredProducts.length} products{searchTerm ? ` matching "${searchParams.get("search")}"` : ", selected for daily power and practical movement."}</p>
          </div>
          <div className="mt-10 grid gap-8 lg:grid-cols-[200px_1fr]">
            <aside className="glass-filter-panel h-fit p-5 lg:sticky lg:top-6">
              <div className="flex items-center justify-between"><h3 className="text-[11px] font-bold uppercase tracking-[0.16em]">Filter</h3>{hasFilters && <button onClick={resetFilters} className="text-[10px] font-bold uppercase tracking-wider text-[var(--red)]">Reset</button>}</div>
              <div className="mt-6 border-t border-[var(--border)] pt-5"><label htmlFor="catalogue-category" className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Collection</label><select id="catalogue-category" value={selectedCategory} onChange={(event) => updateUrl("category", event.target.value)} className="catalogue-category-select mt-3 w-full appearance-none px-3 py-2 text-[11px] font-medium text-[var(--foreground)] outline-none transition duration-200 focus:border-[var(--red)] focus:ring-2 focus:ring-[var(--red)]/10"><option value="all">All products ({products.length})</option>{categories.map((category) => <option key={category} value={category}>{category} ({products.filter((product) => product.category === category).length})</option>)}</select></div>
              <div className="mt-6 border-t border-[var(--border)] pt-5"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Availability</p><div className="mt-3 grid gap-3">{([{ value: "in-stock", label: "In stock", count: products.filter((product) => product.stock > 0).length }, { value: "out-of-stock", label: "Out of stock", count: products.filter((product) => product.stock <= 0).length }] as const).map((option) => <button key={option.value} onClick={() => { setAvailability(availability === option.value ? "all" : option.value); setCurrentPage(1); }} className={`flex items-center justify-between text-left text-[11px] ${availability === option.value ? "font-bold text-[var(--foreground)]" : "text-[var(--body-gray)] hover:text-[var(--red)]"}`}><span className="flex items-center gap-2"><span className={`h-3 w-3 border border-[var(--border)] ${availability === option.value ? "bg-[var(--red)]" : "bg-white/70"}`} />{option.label}</span><span className="text-[10px] text-[var(--muted)]">{option.count}</span></button>)}</div></div>
              <div className="mt-6 border-t border-[var(--border)] pt-5"><div className="flex justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Price</p><span className="text-[10px] text-[var(--body-gray)]">Rs. {maxPrice.toLocaleString()}</span></div><input aria-label="Maximum price" type="range" min="0" max={maximumPrice} step="100" value={maxPrice} onChange={(event) => { setMaxPrice(Number(event.target.value)); setCurrentPage(1); }} className="mt-5 w-full accent-[var(--red)]" /><div className="mt-2 flex justify-between text-[10px] text-[var(--muted)]"><span>Rs. 0</span><span>Rs. {maximumPrice.toLocaleString()}</span></div></div>
            </aside>
            <div>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4"><span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Showing {visibleProducts.length} of {filteredProducts.length}</span><label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em]">Sort by<select value={selectedSort} onChange={(event) => updateUrl("sort", event.target.value)} className="border-0 bg-transparent py-1 text-[10px] font-bold normal-case tracking-normal outline-none"><option value="featured">Featured</option><option value="newest">Newest</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option><option value="name-az">Name: A to Z</option><option value="name-za">Name: Z to A</option></select></label></div>
              {visibleProducts.length ? <div className="grid grid-flow-dense gap-5 sm:grid-cols-2 lg:grid-cols-4">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} plain />)}</div> : <div className="border border-dashed border-[var(--border)] bg-white/70 px-6 py-20 text-center"><h3 className="text-xl font-black uppercase">No products found</h3><p className="mt-2 text-sm text-[var(--body-gray)]">Try widening your price range or clearing the category filter.</p><button onClick={resetFilters} className="mt-5 bg-[var(--red)] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white">Reset filters</button></div>}
              {totalPages > 1 && <nav aria-label="Product pages" className="mt-12 flex items-center justify-center gap-6 text-[10px] font-medium"><button type="button" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="text-[var(--muted)] disabled:opacity-30">‹</button>{Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => <button type="button" key={page} onClick={() => setCurrentPage(page)} aria-current={currentPage === page ? "page" : undefined} className={`flex h-8 w-8 items-center justify-center rounded-full ${currentPage === page ? "bg-[var(--red)] font-bold text-white" : "text-[var(--foreground)]"}`}>{page}</button>)}<button type="button" aria-label="Next page" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} className="text-[var(--muted)] disabled:opacity-30">›</button></nav>}
            </div>
          </div>
          {recommendations.length > 0 && (<section className="mt-20 border-t border-[var(--border)] pt-12">
            <h2 className="text-center text-2xl font-bold tracking-[-0.04em]">You may also like</h2>
            <div className="recommendation-marquee mt-10 overflow-hidden">
              <div className="recommendation-marquee-track flex w-max gap-5">
                {[...recommendations, ...recommendations].map((product, index) => (
                  <div key={`${product.id}-${index}`} className="w-[190px] shrink-0 sm:w-[220px] lg:w-[240px]">
                    <ProductCard product={product} plain marquee />
                  </div>
                ))}
              </div>
            </div>
          </section>)}
        </div>
      </section>

      <section id="bundles" aria-label="Promotions" className="hero-red relative mt-0 w-full overflow-hidden bg-[var(--red)] text-white">
        <div className="section-shell relative py-12 md:py-16">
          <div className="mb-8 text-center md:mb-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">Special offers</p>
            <h2 className="mt-2 text-2xl font-black uppercase leading-[0.95] tracking-[-0.04em] md:text-3xl">Shop promotions</h2>
          </div>

          <div className="relative overflow-hidden">
            <div className="promo-band-marquee flex w-max gap-6">
              {[...shopPromotions, ...shopPromotions].map((offer, index) => (
                <div key={`${offer.eyebrow}-${index}`} className="flex-shrink-0 w-[360px] rounded-xl bg-white/10 p-6 backdrop-blur-sm md:w-[400px] md:p-8">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">{offer.eyebrow}</p>
                  <h3 className="mt-2 text-sm font-black uppercase leading-tight tracking-wide md:text-base">{offer.title}</h3>
                  <p className="mt-3 text-xs text-white/80 md:text-sm">{offer.text}</p>
                  <a href={offer.href} className="mt-4 inline-block bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--red)] transition-colors hover:bg-black hover:text-white md:text-xs">
                    {offer.cta} →
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
