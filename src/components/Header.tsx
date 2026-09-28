"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";

export function Header({ categories }: { categories?: string[] }) {
  const { count: cartCount } = useCart();
  const { count: favoritesCount } = useFavorites();

  return (
    <header className="border-b border-[var(--border)] bg-white">
      <div className="section-shell flex h-[72px] items-center justify-between gap-5">
        <Link href="/" className="flex shrink-0 items-center" aria-label="Camelion home"><img src="/brand-logo.avif" alt="Camelion" className="h-8 w-auto object-contain" /></Link>
        <label className="hidden max-w-xl flex-1 items-center rounded-lg bg-[var(--soft-gray)] px-4 py-3 text-sm text-[var(--muted)] md:flex"><span className="mr-3 text-lg">⌕</span><input className="w-full bg-transparent outline-none placeholder:text-[var(--muted)]" placeholder="Search batteries, chargers, flashlights..." aria-label="Search products" /></label>
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
          <Link href="/account" className="hover:text-[var(--red)]" aria-label="Open account">Account</Link>
          <Link href="/favorites" className="hidden items-center gap-2 text-lg hover:text-[var(--red)] md:flex" aria-label="Open wishlist">
            ♡{favoritesCount > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--red)] text-[10px] text-white">{favoritesCount}</span>}
          </Link>
          <Link href="/cart" className="flex items-center gap-2 hover:text-[var(--red)]" aria-label="Open cart">Cart <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--red)] text-[10px] text-white">{cartCount}</span></Link>
        </div>
      </div>
      {categories && categories.length > 0 && (
        <div className="section-shell flex gap-7 overflow-x-auto border-t border-[var(--border)] py-3 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
          <Link href="/#all-products" className="text-[var(--red)]">Shop all</Link>
          {categories.map((category) => <a key={category} href={`/?category=${encodeURIComponent(category)}#all-products`}>{category}</a>)}
        </div>
      )}
    </header>
  );
}
