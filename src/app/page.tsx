import { getCatalogProducts } from "@/lib/catalog";
import { ProductCatalogue } from "@/components/ProductCatalogue";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { PromoCarousel } from "@/components/PromoCarousel";
import { CollectionCategoryCarousel } from "@/components/CollectionCategoryCarousel";
import { Suspense } from "react";

const collectionImagePaths: Record<string, string> = {
  Batteries: "/assets/tiles/batteries.png",
  Chargers: "/assets/tiles/chargers.png",
  "Extension Wires": "/assets/tiles/extensions.png",
  Flashlights: "/assets/tiles/flashlights.png",
  "Portable Devices": "/assets/tiles/portable.png",
  Bundles: "/assets/tiles/bundles.png",
};

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
  return (
    <main className="min-h-screen bg-white">
      <Header categories={availableCategories} searchProducts={products.map(({ name, slug, price, compareAtPrice, category, description, keywords, imageUrl, visual }) => ({ name, slug, price, compareAtPrice, category, description, keywords, imageUrl, visual }))} />

      <section id="collection" className="section-shell pt-5 pb-8 sm:pt-10 sm:pb-20"><CollectionCategoryCarousel><div className="collection-category-grid grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">{collections.map(({ name, visual, imageUrl }) => <a href={`/?category=${encodeURIComponent(name)}#all-products`} key={name} className="collection-category-card group block min-w-0 rounded-[24px] bg-white p-3 shadow-[0_8px_24px_rgb(0_0_0_/_6%)] transition-shadow duration-300 hover:shadow-[0_12px_30px_rgb(0_0_0_/_10%)]"><div className="collection-visual product-visual relative overflow-hidden rounded-[18px] border-0">{collectionImagePaths[name] ? <img src={collectionImagePaths[name]} alt={name} className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" /> : imageUrl ? <div role="img" aria-label={name} className="h-full w-full bg-contain bg-center bg-no-repeat transition-transform duration-300 group-hover:scale-105" style={{ backgroundImage: `url(${imageUrl})` }} /> : <div className={`${visual} product-fallback-visual transition-transform duration-300 group-hover:scale-105`} />}</div><h3 className="collection-category-title mt-3 block min-w-0 bg-transparent p-0 text-center uppercase text-[#111]">{name}</h3></a>)}</div></CollectionCategoryCarousel></section>

      <PromoCarousel />

      <Suspense fallback={<section id="all-products" className="bg-[var(--soft-gray)] py-20"><div className="section-shell h-96 animate-pulse bg-white" /></section>}><ProductCatalogue products={products} /></Suspense>

      <SiteFooter />
    </main>
  );
}
