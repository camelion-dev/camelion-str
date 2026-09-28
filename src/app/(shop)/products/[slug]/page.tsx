import type { Metadata } from "next";
import Link from "next/link";
import { getCatalogProductBySlug } from "@/lib/catalog";
import { ProductDetails } from "@/components/ProductDetails";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);
  if (!product) return { title: "Product not found | Camelion" };
  return {
    title: `${product.name} | Camelion Store`,
    description: product.description ? product.description.slice(0, 155) : `Shop ${product.name} at Camelion Store. Cash on Delivery available.`,
  };
}

export default async function ProductDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);

  if (!product) {
    return (
      <div className="section-shell flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--red)]">404</p>
        <h1 className="text-3xl font-black uppercase tracking-[-0.03em]">Product not found</h1>
        <p className="max-w-md text-sm text-[var(--body-gray)]">We couldn&apos;t find a product at this link. It may have been removed or the link may be incorrect.</p>
        <Link href="/" className="mt-2 bg-[var(--red)] px-6 py-4 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[var(--red-dark)]">Back to products</Link>
      </div>
    );
  }

  return <ProductDetails product={product} />;
}
