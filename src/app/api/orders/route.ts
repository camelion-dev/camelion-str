import { NextResponse } from "next/server";
import { placeOrder } from "@/lib/orders";
import { getCurrentAccount } from "@/lib/account-auth";
import { ORDER_RECEIPT_COOKIE, ORDER_RECEIPT_SECONDS, createOrderReceiptToken, isOrderReceiptSigningConfigured } from "@/lib/order-receipt";
import { enforceRateLimit } from "@/lib/rate-limit";
import { readJsonBody, RequestBodyTooLargeError } from "@/lib/request-body";

export const dynamic = "force-dynamic";

type OrderRequestBody = {
  items?: Array<{ productId?: string; quantity?: number }>;
  customer?: { name?: string; phone?: string; email?: string };
  shipping?: { address?: string; city?: string; region?: string; postalCode?: string };
  paymentMethod?: string;
};

/**
 * POST /api/orders
 *
 * Never trusts the client for prices, product names, or totals -- only
 * { productId, quantity } pairs plus the delivery details are read here.
 * The actual price lookup, stock check, and total calculation all happen
 * inside the place_order() database function (see supabase/orders.sql) so
 * a tampered request can never change what gets charged.
 */
export async function POST(request: Request) {
  if (!isOrderReceiptSigningConfigured()) return NextResponse.json({ success: false, error: "Checkout is temporarily unavailable." }, { status: 503 });

  let limit: { allowed: boolean; retryAfter: number };
  try {
    limit = await enforceRateLimit(request, "checkout", 10, 3600);
  } catch {
    return NextResponse.json({ success: false, error: "Checkout is temporarily unavailable." }, { status: 503 });
  }
  if (!limit.allowed) return NextResponse.json({ success: false, error: "Too many checkout attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });

  let body: OrderRequestBody;
  try {
    body = await readJsonBody(request, 32768);
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof RequestBodyTooLargeError ? "Request is too large." : "Invalid request." }, { status: error instanceof RequestBodyTooLargeError ? 413 : 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });

  // COD enforcement: the payment method is never taken on faith from the
  // client. Hiding a payment option in the UI is not security -- this is.
  if (body.paymentMethod !== undefined && body.paymentMethod !== "COD") {
    return NextResponse.json({ success: false, error: "Only Cash on Delivery is supported." }, { status: 400 });
  }

  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (rawItems.length > 50) return NextResponse.json({ success: false, error: "Your cart contains too many items." }, { status: 400 });
  const items: Array<{ productId: string; quantity: number }> = [];
  for (const item of rawItems) {
    if (typeof item?.productId !== "string" || !item.productId.trim()) {
      return NextResponse.json({ success: false, error: "Your cart has an invalid item. Please refresh your cart and try again." }, { status: 400 });
    }
    const quantity = Number(item.quantity);
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000) {
      return NextResponse.json({ success: false, error: "Quantity must be a positive whole number." }, { status: 400 });
    }
    items.push({ productId: item.productId, quantity });
  }
  if (items.length === 0) {
    return NextResponse.json({ success: false, error: "Your cart is empty." }, { status: 400 });
  }

  const customerName = typeof body.customer?.name === "string" ? body.customer.name.trim() : "";
  const customerPhone = typeof body.customer?.phone === "string" ? body.customer.phone.trim() : "";
  const customerEmail = typeof body.customer?.email === "string" ? body.customer.email.trim() : "";
  const shippingAddress = typeof body.shipping?.address === "string" ? body.shipping.address.trim() : "";
  const shippingCity = typeof body.shipping?.city === "string" ? body.shipping.city.trim() : "";
  const shippingRegion = typeof body.shipping?.region === "string" ? body.shipping.region.trim() : "";
  const shippingPostalCode = typeof body.shipping?.postalCode === "string" ? body.shipping.postalCode.trim() : "";

  if (!customerName || customerName.length > 120) return NextResponse.json({ success: false, error: "Enter a valid full name." }, { status: 400 });
  if (!customerPhone || customerPhone.length > 40) return NextResponse.json({ success: false, error: "Enter a valid phone number." }, { status: 400 });
  if (!shippingAddress || shippingAddress.length > 300) return NextResponse.json({ success: false, error: "Enter a valid delivery address." }, { status: 400 });
  if (!shippingCity || shippingCity.length > 120) return NextResponse.json({ success: false, error: "Enter a valid city." }, { status: 400 });
  if (customerEmail.length > 254 || shippingRegion.length > 100 || shippingPostalCode.length > 20) {
    return NextResponse.json({ success: false, error: "Some delivery details are too long." }, { status: 400 });
  }

  const account = await getCurrentAccount();
  const result = await placeOrder({
    items,
    userId: account?.id,
    customerName,
    customerPhone,
    customerEmail: customerEmail || undefined,
    shippingAddress,
    shippingCity,
    shippingRegion: shippingRegion || undefined,
    shippingPostalCode: shippingPostalCode || undefined,
  });

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  const response = NextResponse.json({
    success: true,
    order: { id: result.orderId, orderNumber: result.orderNumber, subtotal: result.subtotal, deliveryFee: result.deliveryFee, total: result.total },
  }, { headers: { "Cache-Control": "private, no-store" } });
  response.cookies.set({
    name: ORDER_RECEIPT_COOKIE,
    value: createOrderReceiptToken(result.orderId),
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: `/order/success/${result.orderId}`,
    maxAge: ORDER_RECEIPT_SECONDS,
  });
  return response;
}
