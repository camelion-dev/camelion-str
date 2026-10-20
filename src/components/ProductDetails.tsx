"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import type { CatalogProduct } from "@/lib/catalog";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";

export function ProductDetails({ product }: { product: CatalogProduct }) {
  const router = useRouter();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const favorited = isFavorite(product.id);
  const outOfStock = product.stock <= 0 || !product.active;
  const gallery = product.images.length ? product.images : undefined;
  const discountPercent = product.compareAtPrice && product.compareAtPrice > product.price ? Math.round((1 - product.price / product.compareAtPrice) * 100) : null;

  function changeQuantity(next: number) {
    if (Number.isNaN(next)) return;
    setQuantity(Math.min(Math.max(1, Math.floor(next)), Math.max(1, product.stock)));
  }

  function handleAddToCart() {
    if (outOfStock) return;
    addItem(product.id, quantity, product.stock);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1800);
  }

  function handleBuyNow() {
    if (outOfStock) return;
    addItem(product.id, quantity, product.stock);
    startTransition(() => router.push("/checkout"));
  }

  return (
    <div className="section-shell py-10 md:py-16">
      <div className="grid gap-10 md:grid-cols-2 md:gap-14">
      {/* Image gallery */}
      <div>
        <div className="product-visual product-detail-visual overflow-hidden rounded-2xl border-0">
          {gallery ? (
            <div role="img" aria-label={product.name} className="absolute inset-0 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${gallery[activeImage]?.url})` }} />
          ) : (
            <div className={`${product.visual} product-fallback-visual`} />
          )}
        </div>
        {gallery && gallery.length > 1 && (
          <div className="mt-4 flex gap-3 overflow-x-auto">
            {gallery.map((image, index) => (
              <button
                key={image.url + index}
                type="button"
                onClick={() => setActiveImage(index)}
                aria-label={`Show image ${index + 1} of ${product.name}`}
                aria-current={activeImage === index}
                className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-[var(--soft-gray)] transition-colors ${activeImage === index ? "border-[var(--red)]" : "border-[var(--border)] hover:border-[var(--muted)]"}`}
              >
                <div className="h-full w-full bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${image.url})` }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--red)]">{product.category}</p>
        <div className="mt-2 flex items-start justify-between gap-4">
          <h1 className="min-w-0 break-words text-3xl font-black uppercase tracking-[-0.03em] md:text-4xl">{product.name}</h1>
          <button
            type="button"
            onClick={() => toggleFavorite(product.id)}
            aria-label={favorited ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`}
            aria-pressed={favorited}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-xl transition-colors ${favorited ? "border-[var(--red)] bg-[var(--red)] text-white" : "border-[var(--border)] hover:border-[var(--red)] hover:text-[var(--red)]"}`}
          >
            {favorited ? "♥" : "♡"}
          </button>
        </div>

        {product.badge && <span className={`mt-3 inline-block px-2 py-1 text-xs font-bold uppercase tracking-wider ${product.badge.startsWith("SAVE") ? "bg-[var(--red)] text-white" : "bg-[var(--foreground)] text-white"}`}>{product.badge}</span>}

        <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1">
          <p className="text-3xl font-black">Rs. {product.price.toLocaleString()}</p>
          {product.compareAtPrice && <p className="text-lg text-[var(--muted)] line-through">Rs. {product.compareAtPrice.toLocaleString()}</p>}
          {discountPercent !== null && <span className="mb-1 text-sm font-bold text-[var(--red)]">Save {discountPercent}%</span>}
        </div>

        <p className="mt-6 max-w-prose text-sm leading-6 text-[var(--body-gray)]">{product.description || "No description available for this product yet."}</p>

        <div className="mt-6">
          {outOfStock ? (
            <p className="text-sm font-bold uppercase tracking-wider text-[var(--red)]">Out of stock</p>
          ) : product.stock <= 5 ? (
            <p className="text-sm font-bold uppercase tracking-wider text-[var(--red)]">Only {product.stock} left in stock</p>
          ) : (
            <p className="text-sm font-bold uppercase tracking-wider text-[var(--body-gray)]">In stock</p>
          )}
        </div>

        {!outOfStock && (
          <div className="mt-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Quantity</p>
            <div className="inline-flex items-center rounded-xl border border-[var(--foreground)]">
              <button type="button" onClick={() => changeQuantity(quantity - 1)} disabled={quantity <= 1} aria-label="Decrease quantity" className="flex h-11 w-11 items-center justify-center text-lg font-bold disabled:text-[var(--muted)]">−</button>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={product.stock}
                value={quantity}
                onChange={(event) => changeQuantity(Number(event.target.value))}
                aria-label="Quantity"
                className="h-11 w-14 border-x border-[var(--foreground)] text-center outline-none"
              />
              <button type="button" onClick={() => changeQuantity(quantity + 1)} disabled={quantity >= product.stock} aria-label="Increase quantity" className="flex h-11 w-11 items-center justify-center text-lg font-bold disabled:text-[var(--muted)]">+</button>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="flex-1 bg-[var(--red)] px-6 py-4 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[var(--red-dark)] disabled:cursor-not-allowed disabled:bg-[var(--border)] disabled:text-[var(--muted)] sm:min-w-[220px] sm:flex-none"
          >
            {outOfStock ? "Out of stock" : justAdded ? "Added to cart ✓" : "Add to cart"}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={outOfStock}
            className="flex-1 border border-[var(--foreground)] px-6 py-4 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-[var(--foreground)] hover:text-white disabled:cursor-not-allowed disabled:border-[var(--border)] disabled:text-[var(--muted)] sm:min-w-[180px] sm:flex-none"
          >
            Buy now
          </button>
        </div>

        <p className="mt-4 text-xs text-[var(--muted)]">Cash on Delivery — pay when your order arrives.</p>
      </div>
      </div>
      {product.detailedDescription && (
        <section aria-labelledby="detailed-product-description-title" className="mt-12 border-t border-[var(--border)] pt-9 md:mt-16 md:pt-12">
          <h2 id="detailed-product-description-title" className="text-2xl font-black uppercase tracking-[-0.03em] md:text-3xl">Product details</h2>
          <div
            className="product-rich-description mt-5 max-w-4xl text-sm leading-7 text-[var(--body-gray)] [&_a]:text-[var(--red)] [&_a]:underline [&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--red)] [&_blockquote]:pl-4 [&_h1]:my-5 [&_h1]:text-3xl [&_h1]:font-black [&_h2]:my-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:my-3 [&_h3]:text-xl [&_h3]:font-bold [&_hr]:my-6 [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-[var(--soft-gray)] [&_pre]:p-4 [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-[var(--border)] [&_td]:p-2 [&_th]:border [&_th]:border-[var(--border)] [&_th]:p-2 [&_th]:text-left [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6]"
            dangerouslySetInnerHTML={{ __html: product.detailedDescription }}
          />
        </section>
      )}
    </div>
  );
}
