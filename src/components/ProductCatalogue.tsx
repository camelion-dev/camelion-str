"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { CatalogProduct } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";

const PAGE_SIZE = 12;
const MOBILE_FILTER_TRANSITION_MS = 280;

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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileFilterDialogMounted, setMobileFilterDialogMounted] = useState(false);
  const [recommendationMarquee, setRecommendationMarquee] = useState({ loopWidth: 0, copyCount: 2 });
  const catalogueRef = useRef<HTMLElement>(null);
  const filterPanelRef = useRef<HTMLElement>(null);
  const mobileFilterButtonRef = useRef<HTMLButtonElement>(null);
  const mobileFilterCloseTimerRef = useRef<number | null>(null);
  const recommendationViewportRef = useRef<HTMLDivElement>(null);
  const recommendationSetRef = useRef<HTMLDivElement>(null);

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
  const recommendationCount = recommendations.length;
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
  const activeFilterCount = Number(selectedCategory !== "all")
    + Number(availability !== "all")
    + Number(minPrice > 0 || maxPrice < maximumPrice);

  const closeMobileFilters = useCallback(() => {
    setMobileFiltersOpen(false);
    if (mobileFilterCloseTimerRef.current !== null) return;
    mobileFilterCloseTimerRef.current = window.setTimeout(() => {
      mobileFilterCloseTimerRef.current = null;
      setMobileFilterDialogMounted(false);
    }, MOBILE_FILTER_TRANSITION_MS);
  }, []);

  const openMobileFilters = useCallback(() => {
    if (mobileFilterCloseTimerRef.current !== null) {
      window.clearTimeout(mobileFilterCloseTimerRef.current);
      mobileFilterCloseTimerRef.current = null;
    }
    setMobileFilterDialogMounted(true);
    setMobileFiltersOpen(true);
  }, []);

  const resetFilters = () => {
    router.replace("/#all-products", { scroll: false });
    setMinPrice(0);
    setMaxPrice(maximumPrice);
    setAvailability("all");
    setCurrentPage(1);
  };

  useEffect(() => {
    if (!mobileFilterDialogMounted) return;

    const mobileBreakpoint = window.matchMedia("(max-width: 767px)");
    if (!mobileBreakpoint.matches) {
      setMobileFiltersOpen(false);
      setMobileFilterDialogMounted(false);
      return;
    }

    const scrollY = window.scrollY;
    const bodyStyle = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    };
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    const panel = filterPanelRef.current;
    const focusableSelector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
    window.requestAnimationFrame(() => panel?.querySelector<HTMLElement>("[data-mobile-filter-close]")?.focus({ preventScroll: true }));

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMobileFilters();
        return;
      }
      if (event.key !== "Tab" || !panel) return;

      const focusableElements = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector));
      if (!focusableElements.length) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && (document.activeElement === firstElement || !panel.contains(document.activeElement))) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && (document.activeElement === lastElement || !panel.contains(document.activeElement))) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    const handleBreakpointChange = (event: MediaQueryListEvent) => {
      if (!event.matches) {
        if (mobileFilterCloseTimerRef.current !== null) window.clearTimeout(mobileFilterCloseTimerRef.current);
        mobileFilterCloseTimerRef.current = null;
        setMobileFiltersOpen(false);
        setMobileFilterDialogMounted(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    mobileBreakpoint.addEventListener("change", handleBreakpointChange);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      mobileBreakpoint.removeEventListener("change", handleBreakpointChange);
      if (mobileFilterCloseTimerRef.current !== null) {
        window.clearTimeout(mobileFilterCloseTimerRef.current);
        mobileFilterCloseTimerRef.current = null;
      }
      Object.assign(document.body.style, bodyStyle);
      window.scrollTo(0, scrollY);
      window.requestAnimationFrame(() => mobileFilterButtonRef.current?.focus({ preventScroll: true }));
    };
  }, [closeMobileFilters, mobileFilterDialogMounted]);

  useEffect(() => {
    const viewport = recommendationViewportRef.current;
    const firstSet = recommendationSetRef.current;
    if (!viewport || !firstSet || recommendationCount === 0) return;

    const measureMarquee = () => {
      const loopWidth = firstSet.getBoundingClientRect().width;
      const viewportWidth = viewport.getBoundingClientRect().width;
      if (loopWidth <= 0 || viewportWidth <= 0) return;

      // One set includes a trailing gap, so the next copy starts at this exact offset.
      // Keep enough copies on the track to cover the viewport throughout each cycle.
      const copyCount = Math.max(2, Math.ceil(viewportWidth / loopWidth) + 1);
      setRecommendationMarquee((current) => (
        Math.abs(current.loopWidth - loopWidth) < 0.5 && current.copyCount === copyCount
          ? current
          : { loopWidth, copyCount }
      ));
    };

    const observer = new ResizeObserver(measureMarquee);
    observer.observe(viewport);
    observer.observe(firstSet);
    return () => observer.disconnect();
  }, [recommendationCount]);

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
      <section id="all-products" ref={catalogueRef} className="catalogue-stage border-y border-[var(--border)] py-5 md:py-28">
        <div className="section-shell">
          <div className="flex flex-col justify-between gap-8 border-b border-[var(--border)] pb-2 md:flex-row md:items-end md:pb-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--red)]">The complete range</p>
              <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-start">
                <h2 className="mt-2 max-w-5xl text-4xl font-black uppercase leading-none tracking-[-0.06em] md:mt-3 md:text-6xl">Shop All</h2>
                <button
                  ref={mobileFilterButtonRef}
                  type="button"
                  aria-expanded={mobileFilterDialogMounted}
                  aria-controls="catalogue-filter-panel"
                  aria-label={`Open filters${activeFilterCount ? `, ${activeFilterCount} active` : ""}`}
                  onClick={openMobileFilters}
                  className="relative mt-2 inline-flex h-11 w-11 shrink-0 items-center justify-center border-0 bg-transparent p-0 text-[var(--red)] shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--red)] md:hidden"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7h9M17 7h3M4 17h3m4 0h9" />
                    <circle cx="15" cy="7" r="2" />
                    <circle cx="9" cy="17" r="2" />
                  </svg>
                  {activeFilterCount > 0 && <span aria-hidden="true" className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--red-dark)] ring-2 ring-white" />}
                </button>
              </div>
            </div>
            <p className="hidden max-w-[15rem] text-right text-xs leading-5 text-[var(--body-gray)] md:block">{filteredProducts.length} products{searchTerm ? ` matching "${searchParams.get("search")}"` : ", selected for daily power and practical movement."}</p>
          </div>
          {mobileFilterDialogMounted && <button type="button" data-open={mobileFiltersOpen} aria-label="Close filters" onClick={closeMobileFilters} className="mobile-filter-backdrop" />}
          <div className="catalogue-content-grid mt-2 grid min-w-0 gap-8 md:mt-10 lg:grid-cols-[200px_1fr]">
            <aside
              id="catalogue-filter-panel"
              ref={filterPanelRef}
              data-open={mobileFiltersOpen}
              role={mobileFilterDialogMounted ? "dialog" : undefined}
              aria-modal={mobileFilterDialogMounted ? true : undefined}
              aria-labelledby="catalogue-filter-title"
              className="glass-filter-panel mobile-filter-panel h-fit p-5 lg:sticky lg:top-6"
            >
              <div className="mobile-filter-header flex items-center justify-between">
                <h3 id="catalogue-filter-title" className="text-[11px] font-bold uppercase tracking-[0.16em]"><span className="md:hidden">Filters</span><span className="hidden md:inline">Filter</span></h3>
                <div className="flex items-center gap-3">
                  {hasFilters && <button onClick={resetFilters} className="text-[10px] font-bold uppercase tracking-wider text-[var(--red)]">Reset</button>}
                  <button type="button" data-mobile-filter-close onClick={closeMobileFilters} aria-label="Close filters" className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] text-xl text-[var(--foreground)] md:hidden">×</button>
                </div>
              </div>
              <div className="mobile-filter-controls">
                <div className="mt-6 border-t border-[var(--border)] pt-5"><label htmlFor="catalogue-category" className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Collection</label><select id="catalogue-category" value={selectedCategory} onChange={(event) => updateUrl("category", event.target.value)} className="catalogue-category-select mt-3 w-full appearance-none px-3 py-2 text-[11px] font-medium text-[var(--foreground)] outline-none transition duration-200 focus:border-[var(--red)] focus:ring-2 focus:ring-[var(--red)]/10"><option value="all">All products ({products.length})</option>{categories.map((category) => <option key={category} value={category}>{category} ({products.filter((product) => product.category === category).length})</option>)}</select></div>
                <div className="mt-6 border-t border-[var(--border)] pt-5"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Availability</p><div className="mt-3 grid gap-3">{([{ value: "in-stock", label: "In stock", count: products.filter((product) => product.stock > 0).length }, { value: "out-of-stock", label: "Out of stock", count: products.filter((product) => product.stock <= 0).length }] as const).map((option) => <button key={option.value} onClick={() => { setAvailability(availability === option.value ? "all" : option.value); setCurrentPage(1); }} className={`flex items-center justify-between text-left text-[11px] ${availability === option.value ? "font-bold text-[var(--foreground)]" : "text-[var(--body-gray)] hover:text-[var(--red)]"}`}><span className="flex items-center gap-2"><span className={`h-3 w-3 border border-[var(--border)] ${availability === option.value ? "bg-[var(--red)]" : "bg-white/70"}`} />{option.label}</span><span className="text-[10px] text-[var(--muted)]">{option.count}</span></button>)}</div></div>
                <div className="mt-6 border-t border-[var(--border)] pt-5"><div className="flex justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Price</p><span className="text-[10px] text-[var(--body-gray)]">Rs. {maxPrice.toLocaleString()}</span></div><input aria-label="Maximum price" type="range" min="0" max={maximumPrice} step="100" value={maxPrice} onChange={(event) => { setMaxPrice(Number(event.target.value)); setCurrentPage(1); }} className="mt-5 w-full accent-[var(--red)]" /><div className="mt-2 flex justify-between text-[10px] text-[var(--muted)]"><span>Rs. 0</span><span>Rs. {maximumPrice.toLocaleString()}</span></div></div>
              </div>
              <div className="mobile-filter-actions md:hidden">
                <button type="button" onClick={closeMobileFilters} className="flex h-12 w-full items-center justify-center rounded-xl bg-[var(--red)] px-5 text-sm font-bold text-white transition-colors hover:bg-[var(--red-dark)]">Show {filteredProducts.length} results</button>
              </div>
            </aside>
            <div className="catalogue-results min-w-0">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-2 md:mb-6 md:pb-4"><span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Showing {visibleProducts.length} of {filteredProducts.length}</span><label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em]">Sort by<select value={selectedSort} onChange={(event) => updateUrl("sort", event.target.value)} className="border-0 bg-transparent py-1 text-[10px] font-bold normal-case tracking-normal outline-none"><option value="featured">Featured</option><option value="newest">Newest</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option><option value="name-az">Name: A to Z</option><option value="name-za">Name: Z to A</option></select></label></div>
              {visibleProducts.length ? <div className="catalogue-product-grid grid gap-4 sm:gap-5">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} plain />)}</div> : <div className="border border-dashed border-[var(--border)] bg-white/70 px-6 py-20 text-center"><h3 className="text-xl font-black uppercase">No products found</h3><p className="mt-2 text-sm text-[var(--body-gray)]">Try widening your price range or clearing the category filter.</p><button onClick={resetFilters} className="mt-5 bg-[var(--red)] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white">Reset filters</button></div>}
              {totalPages > 1 && <nav aria-label="Product pages" className="mt-12 flex items-center justify-center gap-6 text-[10px] font-medium"><button type="button" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="flex h-11 w-11 items-center justify-center text-[var(--muted)] disabled:opacity-30">‹</button>{Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => <button type="button" key={page} onClick={() => setCurrentPage(page)} aria-current={currentPage === page ? "page" : undefined} className={`flex h-11 w-11 items-center justify-center rounded-full ${currentPage === page ? "bg-[var(--red)] font-bold text-white" : "text-[var(--foreground)]"}`}>{page}</button>)}<button type="button" aria-label="Next page" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} className="flex h-11 w-11 items-center justify-center text-[var(--muted)] disabled:opacity-30">›</button></nav>}
            </div>
          </div>
          {recommendations.length > 0 && (<section className="mt-20 border-t border-[var(--border)] pt-12">
            <h2 className="text-center text-2xl font-bold tracking-[-0.04em]">You may also like</h2>
            <div ref={recommendationViewportRef} className="recommendation-marquee mt-10 overflow-hidden pb-8">
              <div
                className="recommendation-marquee-track flex w-max"
                data-loop-ready={recommendationMarquee.loopWidth > 0}
                style={{ "--recommendation-loop-offset": `-${recommendationMarquee.loopWidth}px` } as CSSProperties}
              >
                {Array.from({ length: recommendationMarquee.copyCount }, (_, copyIndex) => (
                  <div
                    key={`recommendation-set-${copyIndex}`}
                    ref={copyIndex === 0 ? recommendationSetRef : undefined}
                    className="flex w-max shrink-0 gap-5 pr-5"
                    aria-hidden={copyIndex > 0}
                  >
                    {recommendations.map((product) => (
                      <div key={product.id} className="w-[190px] shrink-0 sm:w-[220px] lg:w-[240px]">
                        <ProductCard product={product} plain marquee />
                      </div>
                    ))}
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
