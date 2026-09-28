export default function DeliveryPage() {
  return (
    <main className="section-shell py-12 md:py-20">
      <div className="max-w-3xl border-b border-[var(--border)] pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--red)]">Help desk</p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] md:text-6xl">Delivery information</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--body-gray)]">We deliver Camelion products across Pakistan with cash on delivery available on every order.</p>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="border border-[var(--border)] p-6"><p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Processing</p><p className="mt-3 text-2xl font-black">1-2 days</p><p className="mt-2 text-sm leading-6 text-[var(--body-gray)]">Orders are prepared after confirmation.</p></div>
        <div className="border border-[var(--border)] p-6"><p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Transit</p><p className="mt-3 text-2xl font-black">2-5 days</p><p className="mt-2 text-sm leading-6 text-[var(--body-gray)]">Estimated time after dispatch, depending on location.</p></div>
        <div className="border border-[var(--border)] p-6"><p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Shipping</p><p className="mt-3 text-2xl font-black">Free over Rs. 5,000</p><p className="mt-2 text-sm leading-6 text-[var(--body-gray)]">Delivery charges are shown at checkout.</p></div>
      </div>
      <div className="mt-10 grid gap-8 md:grid-cols-2"><section><h2 className="text-2xl font-black uppercase">What to expect</h2><div className="mt-5 space-y-4 text-sm leading-6 text-[var(--body-gray)]"><p>Our delivery partner may call before arriving. Please provide a reachable phone number and complete address at checkout.</p><p>Orders may arrive in separate packages when products are fulfilled from different locations.</p><p>For delivery updates, contact support with your order number.</p></div></section><section className="bg-[var(--soft-gray)] p-6"><h2 className="text-2xl font-black uppercase">Delivery coverage</h2><p className="mt-4 text-sm leading-6 text-[var(--body-gray)]">We currently deliver to active serviceable regions selected during checkout. Remote-area delivery times may vary.</p></section></div>
    </main>
  );
}
