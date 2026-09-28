"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import type { CatalogProduct } from "@/lib/catalog";
import { calculateDeliveryFee, calculateSubtotal, calculateTotal } from "@/lib/pricing";

export default function CartPage() {
  const { items, hydrated, setQuantity, removeItem } = useCart();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const productIds = useMemo(() => items.map((item) => item.productId), [items]);

  useEffect(() => {
    if (!hydrated) return;
    if (productIds.length === 0) {
      queueMicrotask(() => {
        setProducts([]);
        setLoading(false);
      });
      return;
    }
    let cancelled = false;
    queueMicrotask(() => {
      setLoading(true);
      setLoadError(false);
    });
    fetch(`/api/products?ids=${productIds.map(encodeURIComponent).join(",")}`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load cart");
        return response.json();
      })
      .then((data: { products: CatalogProduct[] }) => {
        if (!cancelled) setProducts(data.products || []);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // productIds is derived from items; re-running when its contents change
    // (not just its identity) is what we want here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, productIds.join(",")]);

  const lines = items
    .map((item) => ({ item, product: products.find((product) => product.id === item.productId) }))
    .filter((line): line is { item: (typeof items)[number]; product: CatalogProduct } => Boolean(line.product));

  const missingCount = items.length - lines.length;
  const unavailableLines = lines.filter((line) => !line.product.active || line.product.stock <= 0);
  const subtotal = calculateSubtotal(lines.map((line) => ({ price: line.product.price, quantity: line.item.quantity })));
  const deliveryFee = calculateDeliveryFee(subtotal);
  const total = calculateTotal(subtotal, deliveryFee);
  const canCheckout = lines.length > 0 && unavailableLines.length === 0 && missingCount === 0 && !loading;

  if (!hydrated || loading) {
    return <p className="section-shell py-24 text-center text-sm text-[var(--muted)]">Loading cart...</p>;
  }

  if (loadError) {
    return (
      <div className="section-shell flex flex-col items-center gap-3 py-24 text-center">
        <p className="text-sm font-bold text-[var(--red)]">We couldn&apos;t load your cart right now.</p>
        <p className="text-sm text-[var(--body-gray)]">Please check your connection and try again.</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="section-shell flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--red)]">Your cart</p>
        <h1 className="text-3xl font-black uppercase tracking-[-0.03em]">Your cart is empty</h1>
        <p className="max-w-md text-sm text-[var(--body-gray)]">Looks like you haven&apos;t added anything yet.</p>
        <Link href="/" className="mt-2 bg-[var(--red)] px-6 py-4 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[var(--red-dark)]">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="section-shell py-10 md:py-16">
      <div className="mb-8 flex items-end justify-between border-b border-[var(--border)] pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--red)]">Your cart</p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-[-0.03em]">{items.reduce((total, item) => total + item.quantity, 0)} item{items.reduce((total, item) => total + item.quantity, 0) === 1 ? "" : "s"}</h1>
        </div>
        <Link href="/" className="hidden text-xs font-bold uppercase tracking-wider text-[var(--red)] sm:block">Continue shopping →</Link>
      </div>

      {missingCount > 0 && (
        <p className="mb-4 rounded-xl border border-[var(--red)] bg-[var(--red)]/5 px-4 py-3 text-sm text-[var(--red)]">
          {missingCount} item{missingCount === 1 ? "" : "s"} in your cart {missingCount === 1 ? "is" : "are"} no longer available and {missingCount === 1 ? "has" : "have"} been hidden. You can add different products from the shop.
        </p>
      )}

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="divide-y divide-[var(--border)]">
          {lines.map(({ item, product }) => {
            const unavailable = !product.active || product.stock <= 0;
            const exceedsStock = !unavailable && item.quantity > product.stock;
            return (
              <div key={item.productId} className="flex gap-4 py-6">
                <Link href={`/products/${product.slug}`} className="product-visual h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-[var(--border)]">
                  {product.imageUrl ? <div role="img" aria-label={product.name} className="absolute inset-0 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${product.imageUrl})` }} /> : <div className={`${product.visual} product-fallback-visual`} />}
                </Link>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/products/${product.slug}`} className="text-sm font-bold uppercase tracking-wide hover:text-[var(--red)]">{product.name}</Link>
                      <p className="mt-1 text-sm text-[var(--body-gray)]">Rs. {product.price.toLocaleString()}</p>
                      {unavailable && <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[var(--red)]">Currently unavailable</p>}
                      {exceedsStock && <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[var(--red)]">Only {product.stock} left — please lower the quantity</p>}
                    </div>
                    <button type="button" onClick={() => removeItem(item.productId)} className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] hover:text-[var(--red)]">Remove</button>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="inline-flex items-center rounded-xl border border-[var(--foreground)]">
                      <button type="button" onClick={() => setQuantity(item.productId, item.quantity - 1, product.stock)} aria-label={`Decrease quantity of ${product.name}`} className="flex h-9 w-9 items-center justify-center text-base font-bold">−</button>
                      <span className="flex h-9 w-9 items-center justify-center text-sm font-bold">{item.quantity}</span>
                      <button type="button" onClick={() => setQuantity(item.productId, item.quantity + 1, product.stock)} disabled={unavailable || item.quantity >= product.stock} aria-label={`Increase quantity of ${product.name}`} className="flex h-9 w-9 items-center justify-center text-base font-bold disabled:text-[var(--muted)]">+</button>
                    </div>
                    <p className="text-sm font-bold">Subtotal: Rs. {(product.price * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="h-fit rounded-2xl border border-[var(--border)] p-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Order summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[var(--body-gray)]">Subtotal</span><span className="font-semibold">Rs. {subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-[var(--body-gray)]">Delivery</span><span className="font-semibold">{deliveryFee === 0 ? "Free" : `Rs. ${deliveryFee.toLocaleString()}`}</span></div>
          </div>
          <div className="mt-4 flex justify-between border-t border-[var(--border)] pt-4 text-base font-black"><span>Total</span><span>Rs. {total.toLocaleString()}</span></div>
          <Link
            href={canCheckout ? "/checkout" : "#"}
            aria-disabled={!canCheckout}
            className={`mt-6 block w-full px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-white transition-colors ${canCheckout ? "bg-[var(--red)] hover:bg-[var(--red-dark)]" : "cursor-not-allowed bg-[var(--border)] text-[var(--muted)]"}`}
            onClick={(event) => { if (!canCheckout) event.preventDefault(); }}
          >
            Proceed to checkout
          </Link>
          {!canCheckout && <p className="mt-3 text-xs text-[var(--muted)]">Resolve the unavailable or out-of-stock items above to continue.</p>}
          <p className="mt-4 text-xs text-[var(--muted)]">Payment: Cash on Delivery only.</p>
        </div>
      </div>
    </div>
  );
}
