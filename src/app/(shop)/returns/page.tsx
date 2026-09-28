import Link from "next/link";

export default function ReturnsPage() {
  return (
    <main className="section-shell py-12 md:py-20">
      <div className="max-w-3xl border-b border-[var(--border)] pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--red)]">Help desk</p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] md:text-6xl">Returns &amp; exchanges</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--body-gray)]">We want every product to arrive ready for your next move. Contact us within 30 days if something is not right.</p>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="border border-[var(--border)] p-6"><p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Window</p><p className="mt-3 text-2xl font-black">30 days</p><p className="mt-2 text-sm text-[var(--body-gray)]">Start a return within 30 days of delivery.</p></div>
        <div className="border border-[var(--border)] p-6"><p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Condition</p><p className="mt-3 text-2xl font-black">Unused</p><p className="mt-2 text-sm text-[var(--body-gray)]">Products should be unused and in original packaging.</p></div>
        <div className="border border-[var(--border)] p-6"><p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Resolution</p><p className="mt-3 text-2xl font-black">Exchange or refund</p><p className="mt-2 text-sm text-[var(--body-gray)]">We will review the request and confirm the next step.</p></div>
      </div>
      <div className="mt-10 grid gap-8 md:grid-cols-2"><section><h2 className="text-2xl font-black uppercase">How it works</h2><ol className="mt-5 grid gap-4 text-sm leading-6 text-[var(--body-gray)]"><li><span className="font-bold text-[var(--red)]">01 /</span> Contact support with your order number and reason.</li><li><span className="font-bold text-[var(--red)]">02 /</span> Wait for return instructions before sending anything back.</li><li><span className="font-bold text-[var(--red)]">03 /</span> Pack the product securely with its original accessories.</li></ol></section><section className="bg-[var(--soft-gray)] p-6"><h2 className="text-2xl font-black uppercase">Not sure?</h2><p className="mt-4 text-sm leading-6 text-[var(--body-gray)]">Reach out before shipping a product. Our team can help determine whether an exchange or return is the best option.</p><Link href="/contact" className="mt-5 inline-block bg-[var(--red)] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-[var(--red-dark)]">Contact support</Link></section></div>
    </main>
  );
}
