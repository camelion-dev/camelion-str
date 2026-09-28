import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-[var(--foreground)] py-16 text-white">
      <div className="section-shell grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.4fr]">
        <div>
          <Link href="/" className="text-2xl font-black tracking-[-0.1em]">CAMELION<span className="text-[var(--red)]">.</span></Link>
          <p className="mt-5 max-w-xs text-sm leading-6 text-white/55">Powering everyday life with reliable energy solutions for every move.</p>
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-white/50">Shop</h2>
          <div className="mt-5 grid gap-3 text-sm text-white/80"><Link href="/#collection">Batteries</Link><Link href="/#collection">Chargers</Link><Link href="/#collection">Flashlights</Link><Link href="/#bundles">Bundles</Link></div>
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-white/50">Help</h2>
          <div className="mt-5 grid gap-3 text-sm text-white/80"><Link href="/contact">Contact</Link><Link href="/delivery">Delivery</Link><Link href="/returns">Returns</Link></div>
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-white/50">Stay powered</h2>
          <p className="mt-5 text-sm text-white/60">Get product updates and offers.</p>
          <div className="mt-4 flex border-b border-white/30 pb-3"><input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/40" placeholder="Enter your email" aria-label="Email for newsletter" /><button className="text-sm font-bold text-[var(--red)]" aria-label="Subscribe to newsletter">→</button></div>
        </div>
      </div>
      <div className="section-shell mt-14 flex flex-col justify-between gap-3 border-t border-white/15 pt-6 text-xs text-white/45 md:flex-row">
        <span>© 2026 Camelion | All Rights Reserved</span>
        <span>Made for life on the move.</span>
      </div>
    </footer>
  );
}
