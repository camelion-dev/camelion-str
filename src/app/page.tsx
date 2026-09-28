import { getCatalogProducts } from "@/lib/catalog";
import { ProductCatalogue } from "@/components/ProductCatalogue";
import { ProductCard } from "@/components/ProductCard";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { BundlesSlideshow } from "@/components/BundlesSlideshow";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getCatalogProducts();
  const availableCategories = Array.from(new Set(products.map((product) => product.category))).sort();
  const collectionOrder = ["Batteries", "Chargers", "Extension Wires", "Flashlights", "Portable Devices", "Bundles"];
  const collections = [...availableCategories].sort((first, second) => collectionOrder.indexOf(first) - collectionOrder.indexOf(second)).map((category) => {
    const categoryProduct = products.find((product) => product.category === category);
    return {
      name: category,
      visual: categoryProduct?.visual || "product-battery",
      imageUrl: categoryProduct?.imageUrl,
    };
  });
  const newArrivals = products.slice(0, 4);
  const heroProducts = products.slice(0, 3);
  return (
    <main className="min-h-screen bg-white">
      <div className="bg-[var(--red)] px-5 py-2 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white">Power your everyday — free shipping on orders over Rs. 5,000 <span className="ml-2 underline underline-offset-4">Shop now →</span></div>
      <Header categories={availableCategories} />

      <section id="top" className="hero-split relative grid text-white md:min-h-[480px] md:grid-cols-[7fr_3fr]">
        <div className="hero-dark relative z-10 flex min-h-[480px] items-center bg-[#202020] px-6 py-16 md:px-[max(2.5rem,calc((100vw-1240px)/2))] md:py-20">
          <span className="hero-index absolute right-8 top-8 hidden text-[10px] font-bold uppercase tracking-[0.22em] text-white/30 md:block">01 / 04 &nbsp; // &nbsp; Field power</span>
          <div><p className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-[#ff5757]"><span className="inline-block h-2 w-2 rounded-full bg-[var(--red)] shadow-[0_0_14px_var(--red)]" />Camelion portable power</p><h1 className="max-w-xl text-5xl font-black uppercase leading-[0.94] tracking-[-0.05em] md:text-7xl">Power for<br />every adventure.</h1><p className="mt-6 max-w-md text-base leading-7 text-white/65">Reliable energy for life on the move. Built for the road, the room, and everything in between.</p><div className="mt-8 flex flex-wrap gap-3"><a href="#new-arrivals" className="bg-[var(--red)] px-6 py-4 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-[var(--red-dark)]">Shop portable power →</a><a href="#collection" className="border border-white/40 px-6 py-4 text-xs font-bold uppercase tracking-wider transition-colors hover:border-white">Explore products</a></div><div className="mt-14 flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35"><span className="h-px w-12 bg-[var(--red)]" />Ready when you are</div></div>
        </div>
        <div className="hero-red relative z-10 bg-[var(--red)] px-4 py-7 md:px-6 md:py-8"><div className="flex items-end justify-between border-b border-white/25 pb-3"><div><p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/65">Live catalogue</p><p className="mt-1 text-xl font-black uppercase leading-none tracking-[-0.04em]">Trending<br />now.</p></div><span className="text-[10px] font-bold text-white/60">{String(heroProducts.length).padStart(2, "0")} items</span></div><div className="mx-auto mt-4 flex max-w-[420px] flex-col gap-5">{heroProducts.map((product) => <a href={`/products/${product.slug}`} key={product.id} aria-label={`View ${product.name}`} className="group flex items-stretch gap-4 border-b border-white/15 pb-5 text-white transition-transform duration-500 last:border-0 last:pb-0 hover:-translate-y-0.5"><div className="relative aspect-square w-32 shrink-0 overflow-hidden rounded-xl bg-white shadow-[0_8px_18px_rgb(120_0_0_/_22%)] transition-shadow duration-500 group-hover:shadow-[0_12px_22px_rgb(80_0_0_/_28%)]">{product.imageUrl ? <div role="img" aria-label={product.name} className="absolute inset-0 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${product.imageUrl})` }} /> : <div className={`${product.visual} product-fallback-visual`} />}</div><div className="flex min-w-0 flex-1 flex-col justify-between py-1"><p className="line-clamp-3 text-base font-black uppercase leading-tight tracking-wide">{product.name}</p><p className="text-lg font-black text-white">Rs. {product.price.toLocaleString()}</p></div></a>)}</div><div className="mt-4 flex items-center justify-between text-[8px] font-bold uppercase tracking-[0.16em] text-white/55"><span>Curated for motion</span><span>Scroll to shop ↓</span></div></div>
      </section>

      <section id="collection" className="section-shell py-20"><div className="mb-8 flex items-end justify-between border-b border-[var(--border)] pb-5"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--red)]">Find your power</p><h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.04em] md:text-4xl">Shop by collection</h2></div><span className="hidden text-xs text-[var(--muted)] sm:block">{products.length} active products</span></div><div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">{collections.map(({ name, visual, imageUrl }) => <a href={`/?category=${encodeURIComponent(name)}#all-products`} key={name} className="group block rounded-[24px] bg-white p-3 shadow-[0_8px_24px_rgb(0_0_0_/_6%)] transition-shadow duration-300 hover:shadow-[0_12px_30px_rgb(0_0_0_/_10%)]"><div className="collection-visual product-visual relative overflow-hidden rounded-[18px] border-0 bg-[#f3f3f3]">{name === "Portable Devices" ? <img src="/favicon.ico" alt="Camelion logo" className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" /> : name === "Batteries" || name === "Bundles" || name === "Extension Wires" || name === "Flashlights" ? <img src={`/assets/${name === "Batteries" ? "batteries" : name === "Bundles" ? "bundles" : name === "Extension Wires" ? "extension_wires" : "flashlights"}.avif`} alt={name} className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" /> : imageUrl ? <div role="img" aria-label={name} className="h-full w-full bg-contain bg-center bg-no-repeat transition-transform duration-300 group-hover:scale-105" style={{ backgroundImage: `url(${imageUrl})` }} /> : <div className={`${visual} product-fallback-visual transition-transform duration-300 group-hover:scale-105`} />}</div><h3 className="mt-3 block bg-transparent p-0 text-center text-sm font-bold uppercase tracking-wide text-[#111]">{name}</h3></a>)}</div></section>

      <section id="new-arrivals" className="bg-[var(--soft-gray)] py-20"><div className="section-shell"><div className="mb-8 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--red)]">Just landed</p><h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.04em] md:text-4xl">New arrivals</h2><p className="mt-2 text-sm text-[var(--body-gray)]">Power up with what&apos;s new.</p></div><a href="#new-arrivals" className="hidden text-xs font-bold uppercase tracking-wider text-[var(--red)] sm:block">View all →</a></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{newArrivals.map((product) => <ProductCard key={product.id} product={product} />)}</div></div></section>

      <BundlesSlideshow />

      <Suspense fallback={<section id="all-products" className="bg-[var(--soft-gray)] py-20"><div className="section-shell h-96 animate-pulse bg-white" /></section>}><ProductCatalogue products={products} /></Suspense>

      <section className="border-y border-[var(--border)] bg-[var(--soft-gray)]"><div className="section-shell grid divide-y divide-[var(--border)] py-3 md:grid-cols-3 md:divide-x md:divide-y-0"><div className="flex gap-4 px-4 py-6 md:first:pl-0"><span className="text-2xl text-[var(--red)]">▣</span><div><h3 className="text-xs font-bold uppercase tracking-wider">Convenient shipping</h3><p className="mt-1 text-sm text-[var(--body-gray)]">COD available for all orders.</p></div></div><div className="flex gap-4 px-4 py-6"><span className="text-2xl text-[var(--red)]">↻</span><div><h3 className="text-xs font-bold uppercase tracking-wider">30 days returns</h3><p className="mt-1 text-sm text-[var(--body-gray)]">Simple exchanges, no friction.</p></div></div><div className="flex gap-4 px-4 py-6 md:pr-0"><span className="text-2xl text-[var(--red)]">✓</span><div><h3 className="text-xs font-bold uppercase tracking-wider">Secure payment</h3><p className="mt-1 text-sm text-[var(--body-gray)]">Safe checkout with Camelion.</p></div></div></div></section>

      <SiteFooter />
    </main>
  );
}