import Link from "next/link";

const shopCategories = ["Batteries", "Chargers", "Extension Wires", "Flashlights", "Portable Devices", "Bundles"];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <section className="site-footer-signup-band" aria-label="Newsletter">
        <h2 className="site-footer-signup-title">Stay powered with Camelion</h2>
        <div className="site-footer-signup-pill">
          <input type="email" aria-label="Email address" placeholder="Enter your email address" />
          <button type="button">Subscribe</button>
        </div>
      </section>

      <div className="site-footer-main">
        <div className="section-shell">
          <div className="site-footer-columns">
            <div className="site-footer-brand-column">
              <Link href="/" className="site-footer-brand">CAMELION<span aria-hidden="true">.</span></Link>
              <p className="site-footer-about">
                Camelion brings practical energy solutions for everyday life, from batteries and lighting to chargers and power accessories.
              </p>
              <Link href="/#collection" className="site-footer-read-more">Explore Camelion <span aria-hidden="true">→</span></Link>
            </div>

            <nav aria-label="Discover Camelion">
              <h2 className="site-footer-column-title">Discover</h2>
              <div className="site-footer-links">
                <Link href="/#all-products">Shop all products</Link>
                {shopCategories.map((category) => (
                  <Link key={category} href={`/?category=${encodeURIComponent(category)}#all-products`}>{category}</Link>
                ))}
              </div>
            </nav>

            <nav aria-label="About Camelion">
              <h2 className="site-footer-column-title">About</h2>
              <div className="site-footer-links">
                <Link href="/#collection">Our collections</Link>
                <Link href="/contact">Contact Camelion</Link>
                <Link href="/account">My account</Link>
              </div>
            </nav>

            <nav aria-label="Customer resources">
              <h2 className="site-footer-column-title">Resources</h2>
              <div className="site-footer-links">
                <Link href="/delivery">Delivery policy</Link>
                <Link href="/returns">Returns &amp; exchanges</Link>
                <Link href="/contact">Customer support</Link>
              </div>
            </nav>

            <nav aria-label="Your Camelion account">
              <h2 className="site-footer-column-title">Your account</h2>
              <div className="site-footer-links">
                <Link href="/account">Sign in</Link>
                <Link href="/favorites">Wishlist</Link>
                <Link href="/cart">Shopping cart</Link>
              </div>
            </nav>
          </div>

          <div className="site-footer-promises">
            <span className="site-footer-promises-label">Shop with confidence</span>
            <span><i aria-hidden="true" />Free delivery over Rs. 5,000</span>
            <span><i aria-hidden="true" />Cash on delivery</span>
            <span><i aria-hidden="true" />30-day return support</span>
            <Link href="/#all-products">Shop now <span aria-hidden="true">→</span></Link>
          </div>

          <div className="site-footer-legal">
            <span className="site-footer-camelion-copyright">© {year} Camelion. All rights reserved.</span>
            <span className="site-footer-khushu-copyright">
              © {year} <a href="https://khushu.tech">Khushu Agency</a>. All rights reserved.
            </span>
            <nav className="site-footer-legal-links" aria-label="Footer links">
              <Link href="/delivery">Delivery</Link>
              <Link href="/returns">Returns</Link>
              <Link href="/contact">Contact</Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
