import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { reorderCatalogProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });

  const input: unknown = await request.json();
  if (!input || typeof input !== "object" || !("productIds" in input) || !Array.isArray(input.productIds)) {
    return NextResponse.json({ error: "A complete product order is required." }, { status: 400 });
  }
  const productIds = input.productIds.filter((id): id is string => typeof id === "string" && id.length > 0);
  if (productIds.length === 0 || productIds.length !== input.productIds.length || new Set(productIds).size !== productIds.length) {
    return NextResponse.json({ error: "Product ids must be a non-empty list of unique ids." }, { status: 400 });
  }

  try {
    await reorderCatalogProducts(productIds);
  } catch (error) {
    console.error("Product reorder failed:", error);
    return NextResponse.json({ error: "The product order could not be saved." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
