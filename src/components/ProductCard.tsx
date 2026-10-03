"use client";

import Link from "next/link";
import { useState } from "react";
import type { CatalogProduct } from "@/lib/catalog";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";

export function ProductCard({ product, compact = false, plain = false, marquee = false }: { product: CatalogProduct; compact?: boolean; plain?: boolean; marquee?: boolean }) {
  const { name, price, compareAtPrice, badge, visual, stock, active } = product;
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [justAdded, setJustAdded] = useState(false);

  const favorited = isFavorite(product.id);
  const outOfStock = stock <= 0 || !active;

  function handleFavoriteClick(event: React.MouseEvent) {
    // The card itself is a link (see the overlay below); this button sits on
    // top of it, so a click here should toggle the favorite, not navigate.
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(product.id);
  }

  function handleAddToCart() {
    if (outOfStock) return;
    addItem(product.id, 1, stock);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1500);
  }

  return (
    <article className={`group relative ${plain ? "glass-product-card" : ""} ${marquee ? "marquee-product-card" : ""} ${compact ? "" : "min-w-0"}`}>
      <div className={`product-card-visual product-visual isolate bg-white ${plain ? "plain-product-card rounded-[14px] border-0" : "aspect-[4/5] rounded-2xl border border-[var(--border)]"}`}>
        {badge && <span className="product-card-badge absolute left-3 top-3 z-10 px-2 py-1">{badge}</span>}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-lg shadow-sm transition-colors ${plain ? "hidden" : ""} ${favorited ? "bg-[var(--red)] text-white" : "bg-white hover:bg-[var(--red)] hover:text-white"}`}
          aria-label={favorited ? `Remove ${name} from favorites` : `Add ${name} to favorites`}
          aria-pressed={favorited}
        >
          {favorited ? "♥" : "♡"}
        </button>
        {/* Full-card "stretched link": makes the whole visual clickable/keyboard-focusable
            as a real link, without disturbing the media/details grid layout above (absolutely
            positioned elements are removed from grid flow) or the favorite button's own clicks
            (it sits at a higher z-index, so pointer hit-testing reaches it first). */}
        <Link 
          href={`/products/${product.slug}`} 
          aria-label={`View ${name}`} 
          className="absolute inset-0 z-[5] focus:outline-none"
        >
          <span className="sr-only">View {name}</span>
        </Link>
        <div className={`product-card-media z-0 ${plain ? "plain-card-media" : ""}`} onClick={(event) => { if (plain && !(event.target instanceof HTMLButtonElement)) window.location.href = `/products/${product.slug}`; }}>
          {product.imageUrl ? <div role="img" aria-label={name} className="absolute inset-0 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${product.imageUrl})` }} /> : <div className={`${visual} product-fallback-visual`} />}
          {plain && <button
            type="button"
            onClick={(event) => { event.preventDefault(); event.stopPropagation(); handleAddToCart(); }}
            disabled={outOfStock}
            className="product-card-cta plain-card-cta absolute bottom-0 left-0 z-10 flex w-full items-center justify-center gap-2 border-0 bg-[var(--red)] px-3 py-2 text-[10px] font-medium text-white transition-colors hover:bg-[var(--red-dark)] disabled:cursor-not-allowed disabled:bg-[var(--muted)]"
          >
            {outOfStock ? "Out of stock" : justAdded ? "Added ✓" : <>Add to cart</>}
          </button>}
        </div>
        <div className={`product-card-details z-10 px-0 py-3 ${plain ? "plain-card-details bg-white text-[var(--foreground)]" : "bg-[var(--red)] text-white"} ${marquee ? "marquee-card-details" : ""}`}>
          <p className={`product-card-brand ${plain ? "text-[9px] tracking-normal text-[var(--muted)]" : "text-white/65"}`}>Camelion</p>
          <div className={`mt-1 ${plain ? "block" : "flex items-end justify-between gap-3"}`}>
            <h3 className={`product-card-title line-clamp-2 ${plain ? "text-[13px] font-medium leading-[1.25]" : ""}`}>{name}</h3>
            <div className={`${plain ? "mt-1" : "shrink-0 text-right"} ${marquee ? "marquee-card-price" : ""}`}>
              <p className={`product-card-price ${plain ? "text-[10px] font-bold" : ""}`}>Rs. {price.toLocaleString()}</p>
              {compareAtPrice && <p className={`product-card-compare line-through ${plain ? "text-[var(--muted)]" : "text-white/65"}`}>Rs. {compareAtPrice.toLocaleString()}</p>}
            </div>
          </div>
        </div>
      </div>
      {!plain && <button
        type="button"
        onClick={handleAddToCart}
        disabled={outOfStock}
        className="product-card-cta relative z-10 mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--foreground)] px-4 py-3 transition-colors hover:bg-[var(--foreground)] hover:text-white disabled:cursor-not-allowed disabled:border-[var(--border)] disabled:text-[var(--muted)] disabled:hover:bg-transparent"
      >
        {outOfStock ? "Out of stock" : justAdded ? "Added ✓" : <>Add to cart <span aria-hidden="true">→</span></>}
      </button>}
    </article>
  );
}
