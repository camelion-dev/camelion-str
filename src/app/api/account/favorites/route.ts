import { NextResponse } from "next/server";
import { addFavorite, getCurrentAccount, removeFavorite } from "@/lib/account-auth";

export async function POST(request: Request) {
  const user = await getCurrentAccount();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const body = await request.json() as { productId?: unknown };
  if (typeof body.productId !== "string" || !body.productId) return NextResponse.json({ error: "Product id is required." }, { status: 400 });
  const response = await addFavorite(user.id, body.productId);
  if (!response.ok) return NextResponse.json({ error: "Unable to save favorite." }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const user = await getCurrentAccount();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const productId = new URL(request.url).searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "Product id is required." }, { status: 400 });
  const response = await removeFavorite(user.id, productId);
  if (!response.ok) return NextResponse.json({ error: "Unable to remove favorite." }, { status: 500 });
  return NextResponse.json({ success: true });
}