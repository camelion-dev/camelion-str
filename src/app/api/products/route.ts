import { NextResponse } from "next/server";
import { getCatalogProductsByIds } from "@/lib/catalog";

export const dynamic = "force-dynamic";

/**
 * GET /api/products?ids=id1,id2,id3
 *
 * Public, read-only. Lets the browser turn the productIds it saved in
 * localStorage (cart, favorites) back into real product data -- current
 * price, stock, active status, image -- without ever trusting anything
 * about the product except its id from the browser itself.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const idsParam = url.searchParams.get("ids") || "";
  const ids = idsParam.split(",").map((id) => id.trim()).filter(Boolean);
  if (!ids.length) return NextResponse.json({ products: [] });
  if (ids.length > 100) return NextResponse.json({ error: "Too many product ids." }, { status: 400 });

  try {
    const products = await getCatalogProductsByIds(ids);
    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ error: "Failed to load products." }, { status: 500 });
  }
}
