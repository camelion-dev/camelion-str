import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { uploadProductImage } from "@/lib/supabase-storage";

export const dynamic = "force-dynamic";
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES + 64 * 1024) {
    return NextResponse.json({ error: "Images must be 4MB or smaller." }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }
  const file = formData.get("file");
  const productId = String(formData.get("productId") || "new-product");

  if (!(file instanceof File)) return NextResponse.json({ error: "An image file is required." }, { status: 400 });
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(productId)) return NextResponse.json({ error: "Invalid product identifier." }, { status: 400 });
  if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "Images must be 4MB or smaller." }, { status: 400 });

  try {
    const image = await uploadProductImage(file, productId);
    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Image upload failed." }, { status: 500 });
  }
}
