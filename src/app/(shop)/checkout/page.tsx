"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useCart } from "@/context/CartContext";
import type { CatalogProduct } from "@/lib/catalog";
import { calculateDeliveryFee, calculateSubtotal, calculateTotal } from "@/lib/pricing";

type FormState = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  region: string;
  postalCode: string;
};

const emptyForm: FormState = { name: "", phone: "", email: "", address: "", city: "", region: "", postalCode: "" };

export default function CheckoutPage() {
  const router = useRouter();
  const { items, hydrated, clearCart } = useCart();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    queueMicrotask(() => setLoading(true));
    fetch(`/api/products?ids=${productIds.map(encodeURIComponent).join(",")}`)
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
  }, [hydrated, productIds.join(",")]);

  useEffect(() => {
    fetch("/api/account/me")
      .then((response) => response.json())
      .then((data: { user?: { name?: string | null; email?: string | null; phone?: string | null } | null; latestAddress?: { address?: string; city?: string; region?: string; postalCode?: string } | null }) => {
        if (!data.user) return;
        setForm((current) => ({
          ...current,
          name: current.name || data.user?.name || "",
          email: current.email || data.user?.email || "",
          phone: current.phone || data.user?.phone || "",
          address: current.address || data.latestAddress?.address || "",
          city: current.city || data.latestAddress?.city || "",
          region: current.region || data.latestAddress?.region || "",
          postalCode: current.postalCode || data.latestAddress?.postalCode || "",
        }));
      })
      .catch(() => undefined);
  }, []);

  const lines = items
    .map((item) => ({ item, product: products.find((product) => product.id === item.productId) }))
    .filter((line): line is { item: (typeof items)[number]; product: CatalogProduct } => Boolean(line.product));

  const hasBlockingIssue = lines.length !== items.length || lines.some((line) => !line.product.active || line.product.stock < line.item.quantity);
  const subtotal = calculateSubtotal(lines.map((line) => ({ price: line.product.price, quantity: line.item.quantity })));
  const deliveryFee = calculateDeliveryFee(subtotal);
  const total = calculateTotal(subtotal, deliveryFee);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) nextErrors.name = "Full name is required.";
    if (!form.phone.trim()) nextErrors.phone = "Phone number is required.";
    else if (form.phone.replace(/\D/g, "").length < 10) nextErrors.phone = "Enter a valid phone number.";
    if (!form.address.trim()) nextErrors.address = "Delivery address is required.";
    if (!form.city.trim()) nextErrors.city = "City is required.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    if (submitting) return;
    if (items.length === 0 || hasBlockingIssue) {
      setSubmitError("Your cart has items that are no longer available. Please review your cart before checking out.");
      return;
    }
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          customer: { name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() || undefined },
          shipping: { address: form.address.trim(), city: form.city.trim(), region: form.region.trim() || undefined, postalCode: form.postalCode.trim() || undefined },
          paymentMethod: "COD",
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setSubmitError(data.error || "We couldn't place your order. Your cart has been kept intact — please try again.");
        setSubmitting(false);
        return;
      }
      clearCart();
      router.push(`/order/success/${data.order.id}`);
    } catch {
      setSubmitError("We couldn't reach the server. Your cart has been kept intact — please try again.");
      setSubmitting(false);
    }
  }

  if (!hydrated || loading) {
    return <p className="section-shell py-24 text-center text-sm text-[var(--muted)]">Loading checkout...</p>;
  }

  if (items.length === 0) {
    return (
      <div className="section-shell flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-3xl font-black uppercase tracking-[-0.03em]">Your cart is empty</h1>
        <p className="max-w-md text-sm text-[var(--body-gray)]">Add some products before checking out.</p>
        <Link href="/" className="mt-2 bg-[var(--red)] px-6 py-4 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[var(--red-dark)]">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="section-shell py-10 md:py-16">
      <div className="mb-8 border-b border-[var(--border)] pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--red)]">Checkout</p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-[-0.03em]">Delivery &amp; payment</h1>
      </div>

      {hasBlockingIssue && (
        <p className="mb-6 rounded-xl border border-[var(--red)] bg-[var(--red)]/5 px-4 py-3 text-sm text-[var(--red)]">
          Some items in your cart are no longer available or exceed available stock. <Link href="/cart" className="underline">Review your cart</Link> before placing your order.
        </p>
      )}

      <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-[1fr_360px]" noValidate>
        <div className="space-y-8">
          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Customer information</legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="mb-1 block">Full name</label>
                <input id="name" value={form.name} onChange={(event) => updateField("name", event.target.value)} className="w-full rounded-lg border border-[var(--border)] px-3" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} />
                {errors.name && <p id="name-error" className="mt-1 text-xs font-semibold text-[var(--red)]">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="phone" className="mb-1 block">Phone number</label>
                <input id="phone" type="tel" placeholder="03XXXXXXXXX" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} className="w-full rounded-lg border border-[var(--border)] px-3" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "phone-error" : undefined} />
                {errors.phone && <p id="phone-error" className="mt-1 text-xs font-semibold text-[var(--red)]">{errors.phone}</p>}
              </div>
              <div>
                <label htmlFor="email" className="mb-1 block">Email (optional)</label>
                <input id="email" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} className="w-full rounded-lg border border-[var(--border)] px-3" />
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Delivery information</legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="address" className="mb-1 block">Complete address</label>
                <input id="address" value={form.address} onChange={(event) => updateField("address", event.target.value)} className="w-full rounded-lg border border-[var(--border)] px-3" aria-invalid={Boolean(errors.address)} aria-describedby={errors.address ? "address-error" : undefined} />
                {errors.address && <p id="address-error" className="mt-1 text-xs font-semibold text-[var(--red)]">{errors.address}</p>}
              </div>
              <div>
                <label htmlFor="city" className="mb-1 block">City</label>
                <input id="city" value={form.city} onChange={(event) => updateField("city", event.target.value)} className="w-full rounded-lg border border-[var(--border)] px-3" aria-invalid={Boolean(errors.city)} aria-describedby={errors.city ? "city-error" : undefined} />
                {errors.city && <p id="city-error" className="mt-1 text-xs font-semibold text-[var(--red)]">{errors.city}</p>}
              </div>
              <div>
                <label htmlFor="region" className="mb-1 block">Province (optional)</label>
                <input id="region" value={form.region} onChange={(event) => updateField("region", event.target.value)} className="w-full rounded-lg border border-[var(--border)] px-3" />
              </div>
              <div>
                <label htmlFor="postalCode" className="mb-1 block">Postal code (optional)</label>
                <input id="postalCode" value={form.postalCode} onChange={(event) => updateField("postalCode", event.target.value)} className="w-full rounded-lg border border-[var(--border)] px-3" />
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Payment method</legend>
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-[var(--foreground)] bg-[var(--soft-gray)] px-4 py-4">
              <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--red)] text-[11px] text-white">✓</span>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide">Cash on Delivery</p>
                <p className="mt-1 text-sm text-[var(--body-gray)]">Pay in cash when your order is delivered. No other payment methods are available.</p>
              </div>
            </div>
          </fieldset>
        </div>

        <div className="h-fit rounded-2xl border border-[var(--border)] p-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Order summary</h2>
          <div className="mt-4 space-y-3 text-sm">
            {lines.map(({ item, product }) => (
              <div key={item.productId} className="flex justify-between gap-3"><span className="min-w-0 break-words text-[var(--body-gray)]">{product.name} × {item.quantity}</span><span className="shrink-0 font-semibold">Rs. {(product.price * item.quantity).toLocaleString()}</span></div>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-4 text-sm">
            <div className="flex justify-between"><span className="text-[var(--body-gray)]">Subtotal</span><span className="font-semibold">Rs. {subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-[var(--body-gray)]">Delivery</span><span className="font-semibold">{deliveryFee === 0 ? "Free" : `Rs. ${deliveryFee.toLocaleString()}`}</span></div>
          </div>
          <div className="mt-4 flex justify-between border-t border-[var(--border)] pt-4 text-base font-black"><span>Total</span><span>Rs. {total.toLocaleString()}</span></div>

          {submitError && <p className="mt-4 rounded-lg bg-[var(--red)]/5 px-3 py-2 text-xs font-semibold text-[var(--red)]">{submitError}</p>}

          <button
            type="submit"
            disabled={submitting || hasBlockingIssue}
            className="mt-6 w-full bg-[var(--red)] px-6 py-4 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[var(--red-dark)] disabled:cursor-not-allowed disabled:bg-[var(--border)] disabled:text-[var(--muted)]"
          >
            {submitting ? "Placing order..." : "Place order"}
          </button>
        </div>
      </form>
    </div>
  );
}
