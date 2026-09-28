import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="section-shell py-12 md:py-20">
      <div className="max-w-3xl border-b border-[var(--border)] pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--red)]">Help desk</p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] md:text-6xl">Contact Camelion</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--body-gray)]">Need help choosing a product or checking an order? Our team is here to help keep your everyday powered.</p>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="border border-[var(--border)] p-6"><p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Email</p><a href="mailto:hello@camelion.store" className="mt-3 block font-bold hover:text-[var(--red)]">hello@camelion.store</a><p className="mt-2 text-sm text-[var(--body-gray)]">We reply within one business day.</p></div>
        <div className="border border-[var(--border)] p-6"><p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Phone</p><a href="tel:+923001234567" className="mt-3 block font-bold hover:text-[var(--red)]">+92 300 123 4567</a><p className="mt-2 text-sm text-[var(--body-gray)]">Monday to Saturday, 9am to 6pm.</p></div>
        <div className="border border-[var(--border)] p-6"><p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Store support</p><p className="mt-3 font-bold">Order assistance</p><p className="mt-2 text-sm text-[var(--body-gray)]">Keep your order number ready for faster support.</p></div>
      </div>
      <div className="mt-10 bg-[var(--soft-gray)] p-6 md:p-8"><h2 className="text-2xl font-black uppercase">Before you reach out</h2><ul className="mt-5 grid gap-3 text-sm leading-6 text-[var(--body-gray)]"><li>For delivery questions, include your city and order number.</li><li>For product support, tell us the product name and what you need help with.</li><li>For returns, review our <Link href="/returns" className="font-bold text-[var(--red)] underline">returns policy</Link> first.</li></ul></div>
    </main>
  );
}
