import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-white py-16 text-[var(--foreground)]">
      <div className="section-shell grid gap-10 md:grid-cols-[1.4fr_1fr_1.4fr]">
        <div>
          <h2 className="text-xs font-bold">About us</h2>
          <p className="mt-5 max-w-xs text-[10px] leading-5 text-[var(--body-gray)]">Camelion has been specializing in the R&amp;D, energy solutions including primary batteries, rechargeable batteries, lighting as well as other power related products.</p>
          <div className="mt-4 flex gap-3 text-xs"><span aria-label="Facebook">f</span><span aria-label="Instagram">◎</span></div>
        </div>
        <div>
          <h2 className="text-xs font-bold">Quick Links</h2>
          <div className="mt-5 grid gap-3 text-[10px] text-[var(--body-gray)]"><Link href="/">About us</Link><Link href="/delivery">Delivery Policy</Link><Link href="/returns">Privacy Policy</Link><Link href="/returns">Return Policy</Link><Link href="/">Compare</Link><Link href="/contact">Contact</Link></div>
        </div>
        <div>
          <h2 className="text-xs font-bold">Newsletter</h2>
          <div className="mt-5 flex items-center rounded-lg border border-[var(--border)] px-3 py-2"><span className="mr-2 text-sm text-[var(--body-gray)]">✉</span><input className="min-w-0 flex-1 bg-transparent text-[10px] outline-none placeholder:text-[var(--muted)]" placeholder="Enter your email" aria-label="Email for newsletter" /><button className="text-sm text-[var(--body-gray)]" aria-label="Subscribe to newsletter">→</button></div>
        </div>
      </div>
      <div className="section-shell mt-14 border-t border-[var(--border)] pt-6 text-[10px] text-[var(--muted)]">
        <span>© 2026 All rights reserved</span>
      </div>
    </footer>
  );
}
