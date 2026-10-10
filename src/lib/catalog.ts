export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  badge?: string;
  keywords?: string;
  visual: string;
  stock: number;
  active: boolean;
  description: string;
  imageUrl?: string;
  imagePath?: string;
  createdAt?: string;
  images: Array<{ url: string; publicId?: string }>;
};

export const catalogCategories = ["Batteries", "Chargers", "Flashlights", "Extension Wires", "Portable Devices", "Bundles"];

const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function headers() {
  if (!apiUrl || !serviceKey) throw new Error("Supabase server environment variables are not configured.");
  return { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
}

async function supabase(path: string, init: RequestInit = {}) {
  const response = await fetch(`${apiUrl}/rest/v1/${path}`, { ...init, headers: { ...headers(), ...(init.headers || {}) }, cache: "no-store" });
  if (!response.ok) throw new Error(`Supabase catalogue request failed (${response.status}): ${await response.text()}`);
  return response;
}

function mapProduct(row: Record<string, unknown>): CatalogProduct {
  const category = row.Category as { name?: string } | null;
  const productImages = Array.isArray(row.ProductImage) ? (row.ProductImage as Array<{ url?: string; publicId?: string }>) : [];
  const image = productImages[0];
  const galleryImages = productImages.filter((entry) => entry.url).map((entry) => ({ url: entry.url as string, publicId: entry.publicId }));
  const imageUrl = row.imageUrl ? String(row.imageUrl) : image?.url;
  const imagePath = row.imagePath ? String(row.imagePath) : image?.publicId;
  return {
    id: String(row.id),
    slug: String(row.slug || row.id),
    name: String(row.name),
    category: category?.name || "Batteries",
    price: Number(row.price),
    compareAtPrice: row.compareAtPrice == null ? undefined : Number(row.compareAtPrice),
    badge: row.badge ? String(row.badge) : undefined,
    keywords: row.keywords ? String(row.keywords) : undefined,
    visual: String(row.visual || "product-battery"),
    stock: Number(row.stock || 0),
    active: Boolean(row.isActive),
    description: String(row.description || ""),
    imageUrl,
    imagePath,
    createdAt: row.createdAt ? String(row.createdAt) : undefined,
    images: galleryImages.length ? galleryImages : imageUrl ? [{ url: imageUrl, publicId: imagePath }] : [],
  };
}

async function categoryId(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const response = await supabase(`Category?slug=eq.${encodeURIComponent(slug)}&select=id`);
  const rows = await response.json() as Array<{ id: string }>;
  if (!rows[0]) throw new Error(`Unknown catalogue category: ${name}`);
  return rows[0].id;
}

export async function getCatalogProducts() {
  const response = await supabase("Product?isActive=eq.true&select=*,Category(name),ProductImage(url,publicId,position)&order=sortOrder.asc,createdAt.desc&ProductImage.order=position.asc");
  return (await response.json() as Array<Record<string, unknown>>).map(mapProduct);
}

export async function getAllCatalogProducts() {
  const response = await supabase("Product?select=*,Category(name),ProductImage(url,publicId,position)&order=sortOrder.asc,createdAt.desc&ProductImage.order=position.asc");
  return (await response.json() as Array<Record<string, unknown>>).map(mapProduct);
}

/**
 * Looks up a single active, public product by its slug for the storefront
 * product details page. Returns null when there's no matching active
 * product (unknown slug, or the product has been hidden/deleted) so the
 * page can render a "not found" state instead of throwing.
 */
export async function getCatalogProductBySlug(slug: string) {
  const response = await supabase(`Product?slug=eq.${encodeURIComponent(slug)}&isActive=eq.true&select=*,Category(name),ProductImage(url,publicId,position)&ProductImage.order=position.asc&limit=1`);
  const rows = await response.json() as Array<Record<string, unknown>>;
  return rows[0] ? mapProduct(rows[0]) : null;
}

/**
 * Looks up any product (active or not) by id. Used server-side when placing
 * or displaying an order, where we need the record even if it has since
 * been hidden from the storefront.
 */
export async function getCatalogProductById(id: string) {
  const response = await supabase(`Product?id=eq.${encodeURIComponent(id)}&select=*,Category(name),ProductImage(url,publicId,position)&ProductImage.order=position.asc&limit=1`);
  const rows = await response.json() as Array<Record<string, unknown>>;
  return rows[0] ? mapProduct(rows[0]) : null;
}

/**
 * Looks up several products by id in one request. Used to turn the
 * productId/quantity pairs stored in the browser's cart/favorites
 * localStorage into real, current product data (name, price, stock,
 * image) -- localStorage is never trusted for anything but the id and
 * the quantity the customer chose. Includes inactive products so the
 * cart can tell the customer a product became unavailable, instead of
 * just silently dropping it.
 */
export async function getCatalogProductsByIds(ids: string[]) {
  if (!ids.length) return [];
  const uniqueIds = Array.from(new Set(ids));
  const response = await supabase(`Product?id=in.(${uniqueIds.map(encodeURIComponent).join(",")})&select=*,Category(name),ProductImage(url,publicId,position)&ProductImage.order=position.asc`);
  return (await response.json() as Array<Record<string, unknown>>).map(mapProduct);
}

export async function createCatalogProduct(input: Omit<CatalogProduct, "id" | "slug" | "images">) {
  const id = crypto.randomUUID();
  const slug = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
  const positionResponse = await supabase("Product?select=sortOrder&order=sortOrder.desc&limit=1");
  const positions = await positionResponse.json() as Array<{ sortOrder: number }>;
  const sortOrder = (positions[0]?.sortOrder ?? -1) + 1;
  const response = await supabase("Product", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ id, name: input.name, slug, description: input.description, price: input.price, compareAtPrice: input.compareAtPrice ?? null, badge: input.badge ?? null, keywords: input.keywords?.trim() || null, visual: input.visual, stock: input.stock, isActive: input.active, imageUrl: input.imageUrl ?? null, imagePath: input.imagePath ?? null, sortOrder, categoryId: await categoryId(input.category) }) });
  const rows = await response.json() as Array<Record<string, unknown>>;
  const createdId = rows[0]?.id ? String(rows[0].id) : id;
  const createdSlug = rows[0]?.slug ? String(rows[0].slug) : slug;
  return { ...input, id: createdId, slug: createdSlug, images: input.imageUrl ? [{ url: input.imageUrl, publicId: input.imagePath }] : [] };
}

export async function updateCatalogProduct(id: string, input: Partial<Omit<CatalogProduct, "id">>) {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.description !== undefined) payload.description = input.description;
  if (input.price !== undefined) payload.price = input.price;
  if (input.compareAtPrice !== undefined) payload.compareAtPrice = input.compareAtPrice ?? null;
  if (input.badge !== undefined) payload.badge = input.badge ?? null;
  if (input.keywords !== undefined) payload.keywords = input.keywords?.trim() || null;
  if (input.visual !== undefined) payload.visual = input.visual;
  if (input.stock !== undefined) payload.stock = input.stock;
  if (input.active !== undefined) payload.isActive = input.active;
  if (input.imageUrl !== undefined) payload.imageUrl = input.imageUrl ?? null;
  if (input.imagePath !== undefined) payload.imagePath = input.imagePath ?? null;
  if (input.category !== undefined) payload.categoryId = await categoryId(input.category);
  const response = await supabase(`Product?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(payload) });
  const rows = await response.json() as Array<Record<string, unknown>>;
  return rows[0] ? mapProduct(rows[0]) : null;
}

export async function deleteCatalogProduct(id: string) {
  const response = await supabase(`Product?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: { Prefer: "return=representation" } });
  return (await response.json() as unknown[]).length > 0;
}

export async function reorderCatalogProducts(productIds: string[]) {
  await supabase("rpc/reorder_catalog_products", {
    method: "POST",
    body: JSON.stringify({ p_product_ids: productIds }),
  });
}
