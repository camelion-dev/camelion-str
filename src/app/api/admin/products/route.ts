import { NextResponse } from "next/server";
import { createCatalogProduct, deleteCatalogProduct, getAllCatalogProducts, updateCatalogProduct } from "@/lib/catalog";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return getProducts();
}

async function getProducts() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });
  return NextResponse.json({ products: await getAllCatalogProducts() });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });
  const input = await request.json();
  if (!input.name || !input.category || !Number.isFinite(Number(input.price))) {
    return NextResponse.json({ error: "Name, category, and price are required." }, { status: 400 });
  }
  const product = await createCatalogProduct({
    name: String(input.name),
    category: String(input.category),
    price: Number(input.price),
    compareAtPrice: input.compareAtPrice ? Number(input.compareAtPrice) : undefined,
    badge: input.badge ? String(input.badge) : undefined,
    visual: String(input.visual || "product-battery"),
    stock: Number(input.stock || 0),
    active: input.active !== false,
    description: String(input.description || "Reliable Camelion power for everyday use."),
    imageUrl: input.imageUrl ? String(input.imageUrl) : undefined,
    imagePath: input.imagePath ? String(input.imagePath) : undefined,
  });
  return NextResponse.json({ product }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });
  const input = await request.json();
  if (!input.id) return NextResponse.json({ error: "Product id is required." }, { status: 400 });
  const product = await updateCatalogProduct(String(input.id), input);
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  return NextResponse.json({ product });
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });
  const { id } = await request.json();
  if (!id || !(await deleteCatalogProduct(String(id)))) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  return NextResponse.json({ success: true });
}
