import { NextResponse } from "next/server";
import { createCatalogProduct, deleteCatalogProduct, getAllCatalogProducts, updateCatalogProduct } from "@/lib/catalog";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { normalizeProductKeywords } from "@/lib/product-search";

export const dynamic = "force-dynamic";

const MAX_KEYWORDS_LENGTH = 1000;

function parseKeywords(value: unknown) {
  if (value === undefined) return { valid: true as const, value: undefined };
  if (value === null) return { valid: true as const, value: "" };
  if (typeof value !== "string" || value.length > MAX_KEYWORDS_LENGTH) {
    return { valid: false as const, value: undefined };
  }
  return { valid: true as const, value: normalizeProductKeywords(value) };
}

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
  const keywords = parseKeywords(input.keywords);
  if (!keywords.valid) return NextResponse.json({ error: "Search keywords must be text no longer than 1000 characters." }, { status: 400 });
  if (!input.name || !input.category || !Number.isFinite(Number(input.price))) {
    return NextResponse.json({ error: "Name, category, and price are required." }, { status: 400 });
  }
  const product = await createCatalogProduct({
    name: String(input.name),
    category: String(input.category),
    price: Number(input.price),
    compareAtPrice: input.compareAtPrice ? Number(input.compareAtPrice) : undefined,
    badge: input.badge ? String(input.badge) : undefined,
    keywords: keywords.value || undefined,
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
  const hasKeywords = Object.prototype.hasOwnProperty.call(input, "keywords");
  const keywords = parseKeywords(input.keywords);
  if (!keywords.valid) return NextResponse.json({ error: "Search keywords must be text no longer than 1000 characters." }, { status: 400 });
  const updates = hasKeywords ? { ...input, keywords: keywords.value } : input;
  const product = await updateCatalogProduct(String(input.id), updates);
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  return NextResponse.json({ product });
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });
  const { id } = await request.json();
  if (!id || !(await deleteCatalogProduct(String(id)))) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  return NextResponse.json({ success: true });
}
