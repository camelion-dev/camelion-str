import { NextResponse } from "next/server";
import { getCatalogProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await getCatalogProducts();
    return NextResponse.json({
      products: products.map(({ name, slug, price, compareAtPrice, category, description, keywords, imageUrl, visual }) => ({
        name,
        slug,
        price,
        compareAtPrice,
        category,
        description,
        keywords,
        imageUrl,
        visual,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to load search products." }, { status: 500 });
  }
}
