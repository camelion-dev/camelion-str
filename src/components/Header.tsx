"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";

type SearchProduct = {
  name: string;
  slug: string;
  price: number;
  category?: string;
  description?: string;
  imageUrl?: string;
  visual?: string;
};

const defaultCategories = ["Batteries", "Chargers", "Extension Wires", "Flashlights", "Portable Devices", "Bundles"];

export function Header({ categories, searchProducts = [] }: { categories?: string[]; searchProducts?: SearchProduct[] }) {
  const { count: cartCount } = useCart();
  const { count: favoritesCount } = useFavorites();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSearchCategory, setSelectedSearchCategory] = useState("all");
  const [catalogSearchProducts, setCatalogSearchProducts] = useState(searchProducts);
  const [searchProductsLoaded, setSearchProductsLoaded] = useState(searchProducts.length > 0);
  const [searchProductsLoading, setSearchProductsLoading] = useState(false);
  const [searchProductsError, setSearchProductsError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuCloseButtonRef = useRef<HTMLButtonElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuCategories = categories?.length ? categories : defaultCategories;
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const desktopSearchMatches = normalizedSearchTerm.length > 1
    ? catalogSearchProducts.filter((product) => product.name.toLowerCase().includes(normalizedSearchTerm)).slice(0, 5)
    : [];
  const mobileSearchMatches = catalogSearchProducts.filter((product) => {
    const matchesCategory = selectedSearchCategory === "all" || product.category === selectedSearchCategory;
    const searchableText = `${product.name} ${product.category || ""} ${product.description || ""}`.toLowerCase();
    return matchesCategory && (!normalizedSearchTerm || searchableText.includes(normalizedSearchTerm));
  });
  const categorySuggestions = normalizedSearchTerm
    ? menuCategories.filter((category) => category.toLowerCase().includes(normalizedSearchTerm))
    : [];

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = searchTerm.trim();
    const params = new URLSearchParams();
    if (value) params.set("search", value);
    if (selectedSearchCategory !== "all") params.set("category", selectedSearchCategory);
    const query = params.toString();
    router.push(query ? `/?${query}#all-products` : "/#all-products");
    setMobileSearchOpen(false);
  };

  useEffect(() => {
    if (!mobileMenuOpen && !mobileSearchOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMobileMenuOpen(false);
      setMobileSearchOpen(false);
      (mobileSearchOpen ? searchButtonRef.current : menuButtonRef.current)?.focus({ preventScroll: true });
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    if (mobileMenuOpen) window.requestAnimationFrame(() => menuCloseButtonRef.current?.focus({ preventScroll: true }));
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileMenuOpen, mobileSearchOpen]);

  useEffect(() => {
    if (!mobileSearchOpen) return;
    window.requestAnimationFrame(() => searchInputRef.current?.focus({ preventScroll: true }));
  }, [mobileSearchOpen]);

  useEffect(() => {
    if (!mobileSearchOpen || searchProductsLoaded) return;
    let cancelled = false;
    setSearchProductsLoading(true);
    setSearchProductsError(false);
    fetch("/api/search")
      .then(async (response) => {
        if (!response.ok) throw new Error("Search products could not be loaded.");
        return response.json() as Promise<{ products: SearchProduct[] }>;
      })
      .then(({ products }) => {
        if (cancelled) return;
        setCatalogSearchProducts(products);
        setSearchProductsLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setSearchProductsError(true);
        setSearchProductsLoaded(true);
      })
      .finally(() => {
        if (!cancelled) setSearchProductsLoading(false);
      });
    return () => { cancelled = true; };
  }, [mobileSearchOpen, searchProductsLoaded]);

  const toggleMenu = () => {
    setMobileSearchOpen(false);
    setMobileMenuOpen((open) => !open);
  };

  const closeMenu = () => {
    setMobileMenuOpen(false);
    menuButtonRef.current?.focus({ preventScroll: true });
  };

  const closeSearch = () => {
    setMobileSearchOpen(false);
    searchButtonRef.current?.focus({ preventScroll: true });
  };

  return (
    <header className="site-header sticky top-0 z-40 border-b border-[var(--border)] bg-white md:static">
      <div className="site-header-inner section-shell relative flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-2 md:h-[72px] md:flex-nowrap md:gap-5 md:py-0">
        <button
          ref={menuButtonRef}
          type="button"
          className="mobile-header-menu flex h-11 w-11 items-center justify-center text-[var(--foreground)] md:hidden"
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-site-menu"
          onClick={toggleMenu}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d={mobileMenuOpen ? "M6 6l12 12M18 6L6 18" : "M3 6h18M3 12h18M3 18h18"} />
          </svg>
        </button>

        <Link href="/" className="site-header-logo flex shrink-0 items-center" aria-label="Camelion home">
          <img src="/brand-logo.avif" alt="Camelion" className="h-6 w-auto object-contain md:h-8" />
        </Link>

        <form
          id="mobile-header-search"
          onSubmit={submitSearch}
          className="site-search mobile-search-form relative order-last flex h-11 w-full min-w-0 basis-full items-center rounded-md bg-[var(--soft-gray)] px-3 py-0 text-sm text-[var(--muted)] md:order-none md:h-[44px] md:max-w-2xl md:flex-1 md:basis-auto md:px-4"
        >
          <button type="submit" className="mr-1 flex h-11 w-11 shrink-0 items-center justify-center text-lg text-[var(--muted)] md:mr-3 md:h-11 md:w-11 lg:h-8 lg:w-8" aria-label="Search products">⌕</button>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="site-search-input min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--muted)]"
            placeholder="Search batteries, chargers, flashlights..."
            aria-label="Search products"
          />
          {desktopSearchMatches.length > 0 && <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-lg border border-[var(--border)] bg-white p-2 text-[var(--foreground)] shadow-[0_18px_40px_rgb(17_17_17_/_12%)]">{desktopSearchMatches.map((product) => <Link key={product.slug} href={`/products/${product.slug}`} onClick={() => { setSearchTerm(""); setMobileSearchOpen(false); }} className="flex min-h-11 items-center justify-between gap-4 px-3 py-2 text-xs transition-colors hover:bg-[var(--soft-gray)]"><span className="truncate font-medium">{product.name}</span><span className="shrink-0 text-[10px] text-[var(--muted)]">Rs. {product.price.toLocaleString()}</span></Link>)}<button type="submit" className="mt-1 w-full border-t border-[var(--border)] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--red)]">View all results</button></div>}
        </form>

        <div className="mobile-header-actions ml-auto flex shrink-0 items-center gap-1 md:hidden">
          <button
            ref={searchButtonRef}
            type="button"
            className="flex h-11 w-11 items-center justify-center text-[var(--foreground)]"
            aria-label={mobileSearchOpen ? "Close search" : "Open search"}
            aria-expanded={mobileSearchOpen}
            aria-controls="mobile-search-layer"
            onClick={() => {
              setMobileMenuOpen(false);
              setMobileSearchOpen((open) => !open);
            }}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-[21px] w-[21px]" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="10.8" cy="10.8" r="6.6" />
              <path d="m16 16 4.5 4.5" />
            </svg>
          </button>
          <Link href="/cart" className="relative flex h-11 w-11 items-center justify-center text-[var(--foreground)]" aria-label={`Open cart, ${cartCount} items`}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-[22px] w-[22px]" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 3h2.3l2.1 12.1a2 2 0 0 0 2 1.7h8.7a2 2 0 0 0 1.9-1.5L21 8H6" />
              <circle cx="9.3" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>
            <span className="absolute right-0.5 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[var(--red)] px-1 text-[9px] font-bold leading-none text-white">{cartCount}</span>
          </Link>
        </div>

        <div className="desktop-header-actions ml-auto hidden shrink-0 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.04em] md:flex md:gap-4 md:text-xs md:tracking-wider">
          <Link href="/account" className="flex h-11 items-center hover:text-[var(--red)] md:h-auto" aria-label="Open account">Account</Link>
          <Link href="/favorites" className="hidden items-center gap-2 text-lg hover:text-[var(--red)] md:flex" aria-label={`Open wishlist, ${favoritesCount} items`}>
            ♡{favoritesCount > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--red)] text-[10px] text-white">{favoritesCount}</span>}
          </Link>
          <Link href="/cart" className="flex h-11 items-center gap-1.5 hover:text-[var(--red)] md:h-auto md:gap-2" aria-label={`Open cart, ${cartCount} items`}>Cart <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--red)] text-[10px] text-white">{cartCount}</span></Link>
        </div>
      </div>

      {mobileSearchOpen && <div className="mobile-search-layer" id="mobile-search-layer">
        <button type="button" className="mobile-search-backdrop" onClick={closeSearch} aria-label="Close search" />
        <section className="mobile-search-panel" role="dialog" aria-modal="true" aria-label="Search Camelion">
          <div className="mobile-search-panel-top">
            <label className="sr-only" htmlFor="mobile-search-category">Search category</label>
            <select id="mobile-search-category" value={selectedSearchCategory} onChange={(event) => setSelectedSearchCategory(event.target.value)} className="mobile-search-category-select">
              <option value="all">All Tags</option>
              {menuCategories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <button type="button" onClick={closeSearch} className="mobile-search-close" aria-label="Close search">×</button>
          </div>

          <form onSubmit={submitSearch} className="mobile-search-panel-form">
            <button type="submit" className="mobile-search-submit" aria-label="Search products">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <circle cx="10.8" cy="10.8" r="6.6" />
                <path d="m16 16 4.5 4.5" />
              </svg>
            </button>
            <input ref={searchInputRef} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search our store" aria-label="Search our store" />
            {searchTerm && <button type="button" className="mobile-search-clear" onClick={() => setSearchTerm("")} aria-label="Clear search">×</button>}
          </form>

          <div className="mobile-search-panel-content">
            {categorySuggestions.length > 0 && selectedSearchCategory === "all" && <section className="mobile-search-suggestions" aria-label="Search suggestions">
              <p className="mobile-search-overline">Suggestions</p>
              {categorySuggestions.map((category) => <button type="button" key={category} onClick={() => { setSelectedSearchCategory(category); setSearchTerm(""); }}>{category}</button>)}
            </section>}

            {(normalizedSearchTerm || selectedSearchCategory !== "all") && <section className="mobile-search-results" aria-label="Matching products" aria-live="polite">
              <p className="mobile-search-overline">Products <span>({mobileSearchMatches.length})</span></p>
              {searchProductsLoading && <p className="mobile-search-status">Loading products…</p>}
              {searchProductsError && <div className="mobile-search-status"><p>Products couldn’t be loaded.</p><button type="button" onClick={() => { setSearchProductsLoaded(false); setSearchProductsError(false); }}>Try again</button></div>}
              {!searchProductsLoading && !searchProductsError && mobileSearchMatches.length > 0 && mobileSearchMatches.map((product) => <Link key={product.slug} href={`/products/${product.slug}`} className="mobile-search-product" onClick={closeSearch}>
                <span className="mobile-search-product-image">{product.imageUrl ? <img src={product.imageUrl} alt="" /> : <span>{product.name.slice(0, 1)}</span>}</span>
                <span className="mobile-search-product-info"><span className="mobile-search-product-name">{product.name}</span><span className="mobile-search-product-price">Rs. {product.price.toLocaleString()}</span></span>
              </Link>)}
              {!searchProductsLoading && !searchProductsError && mobileSearchMatches.length === 0 && <p className="mobile-search-status">No matching products found.</p>}
            </section>}
          </div>
        </section>
      </div>}

      {mobileMenuOpen && <div className="mobile-site-menu" id="mobile-site-menu" role="dialog" aria-modal="true" aria-label="Navigation menu">
        <div className="mobile-site-menu-header">
          <Link href="/" onClick={closeMenu} aria-label="Camelion home"><img src="/brand-logo.avif" alt="Camelion" className="h-7 w-auto object-contain" /></Link>
          <div className="mobile-site-menu-actions">
            <Link href="/account" onClick={closeMenu} className="mobile-menu-account" aria-label="Account: sign in or register" title="Sign in or register">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-[22px] w-[22px]" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 20a7 7 0 0 1 14 0" />
              </svg>
            </Link>
            <button ref={menuCloseButtonRef} type="button" onClick={closeMenu} className="flex h-11 w-11 items-center justify-center text-3xl font-light text-[var(--foreground)]" aria-label="Close navigation menu">×</button>
          </div>
        </div>
        <nav aria-label="Mobile navigation" className="mobile-site-menu-links">
          <Link href="/" onClick={closeMenu}>Home</Link>
          <Link href="/#all-products" onClick={closeMenu}>Shop All</Link>
          {menuCategories.map((category) => <Link key={category} href={`/?category=${encodeURIComponent(category)}#all-products`} onClick={closeMenu}>{category}</Link>)}
          <Link href="/favorites" onClick={closeMenu} className="mobile-wishlist-link">
            <span>♡</span> Wishlist <span className="mobile-wishlist-count">{favoritesCount}</span>
          </Link>
        </nav>
      </div>}
    </header>
  );
}
