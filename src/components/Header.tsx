"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";

type SearchProduct = { name: string; slug: string; price: number };

export function Header({ categories, searchProducts = [] }: { categories?: string[]; searchProducts?: SearchProduct[] }) {
  const { count: cartCount } = useCart();
  const { count: favoritesCount } = useFavorites();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const searchMatches = searchTerm.trim().length > 1
    ? searchProducts.filter((product) => product.name.toLowerCase().includes(searchTerm.trim().toLowerCase())).slice(0, 5)
    : [];

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = searchTerm.trim();
    router.push(value ? `/?search=${encodeURIComponent(value)}#all-products` : "/#all-products");
  };

  return (
    <header className="border-b border-[var(--border)] bg-white">
      <div className="section-shell flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-2 md:h-[72px] md:flex-nowrap md:gap-5 md:py-0">
        <Link href="/" className="flex shrink-0 items-center" aria-label="Camelion home"><img src="/brand-logo.avif" alt="Camelion" className="h-6 w-auto object-contain md:h-8" /></Link>
        <form onSubmit={submitSearch} className="site-search relative order-last flex h-11 w-full min-w-0 basis-full items-center rounded-md bg-[var(--soft-gray)] px-3 py-0 text-sm text-[var(--muted)] md:order-none md:h-[44px] md:max-w-2xl md:flex-1 md:basis-auto md:px-4"><button type="submit" className="mr-1 flex h-11 w-11 shrink-0 items-center justify-center text-lg text-[var(--muted)] md:mr-3 md:h-11 md:w-11 lg:h-8 lg:w-8" aria-label="Search products">⌕</button><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="site-search-input min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--muted)]" placeholder="Search batteries, chargers, flashlights..." aria-label="Search products" />{searchMatches.length > 0 && <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-lg border border-[var(--border)] bg-white p-2 text-[var(--foreground)] shadow-[0_18px_40px_rgb(17_17_17_/_12%)]">{searchMatches.map((product) => <Link key={product.slug} href={`/products/${product.slug}`} onClick={() => setSearchTerm("")} className="flex min-h-11 items-center justify-between gap-4 px-3 py-2 text-xs transition-colors hover:bg-[var(--soft-gray)]"><span className="truncate font-medium">{product.name}</span><span className="shrink-0 text-[10px] text-[var(--muted)]">Rs. {product.price.toLocaleString()}</span></Link>)}<button type="submit" className="mt-1 w-full border-t border-[var(--border)] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--red)]">View all results</button></div>}</form>
        <div className="ml-auto flex shrink-0 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.04em] md:gap-4 md:text-xs md:tracking-wider">
          <Link href="/account" className="flex h-11 items-center hover:text-[var(--red)] md:h-auto" aria-label="Open account">Account</Link>
          <Link href="/favorites" className="flex h-11 w-11 items-center justify-center text-xl hover:text-[var(--red)] md:hidden" aria-label="Open wishlist">
            ♡{favoritesCount > 0 && <span className="sr-only"> {favoritesCount}</span>}
          </Link>
          <Link href="/favorites" className="hidden items-center gap-2 text-lg hover:text-[var(--red)] md:flex" aria-label="Open wishlist">
            ♡{favoritesCount > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--red)] text-[10px] text-white">{favoritesCount}</span>}
          </Link>
          <Link href="/cart" className="flex h-11 items-center gap-1.5 hover:text-[var(--red)] md:h-auto md:gap-2" aria-label="Open cart">Cart <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--red)] text-[10px] text-white">{cartCount}</span></Link>
        </div>
      </div>
      {categories && categories.length > 0 && (
        <nav aria-label="Shop categories" className="site-category-nav section-shell flex gap-7 overflow-x-auto border-t border-[var(--border)] py-0 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
          <Link href="/#all-products" className="text-[var(--red)]">Shop all</Link>
          {categories.map((category) => <a key={category} href={`/?category=${encodeURIComponent(category)}#all-products`}>{category}</a>)}
        </nav>
      )}
    </header>
  );
}
