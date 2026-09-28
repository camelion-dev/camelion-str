import type { OrderStatus } from "./order-status";

export type OrderItemRecord = {
  id: string;
  productId: string | null;
  productName: string;
  unitPrice: number;
  quantity: number;
};

export type OrderRecord = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: "COD";
  currency: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  shippingAddressLine2?: string;
  shippingCity: string;
  shippingRegion?: string;
  shippingPostalCode?: string;
  createdAt: string;
  items: OrderItemRecord[];
};

const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function headers() {
  if (!apiUrl || !serviceKey) throw new Error("Supabase server environment variables are not configured.");
  return { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
}

async function supabase(path: string, init: RequestInit = {}) {
  return fetch(`${apiUrl}/rest/v1/${path}`, { ...init, headers: { ...headers(), ...(init.headers || {}) }, cache: "no-store" });
}

export type PlaceOrderInput = {
  items: Array<{ productId: string; quantity: number }>;
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  shippingCity: string;
  shippingRegion?: string;
  shippingPostalCode?: string;
};

export type PlaceOrderResult =
  | { success: true; orderId: string; orderNumber: string; subtotal: number; deliveryFee: number; total: number }
  | { success: false; error: string };

/**
 * Places a Cash on Delivery order using the atomic place_order() Postgres
 * function (see supabase/orders.sql). Stock, product status, and the
 * delivery fee are all re-checked and recalculated *inside that function*,
 * so nothing here trusts client-supplied prices, names, or totals -- the
 * client only ever sends { productId, quantity } pairs plus the delivery
 * details.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  let response: Response;
  try {
    response = await supabase("rpc/place_order", {
      method: "POST",
      body: JSON.stringify({
        payload: {
          items: input.items,
          userId: input.userId || "",
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail || "",
          shippingAddress: input.shippingAddress,
          shippingCity: input.shippingCity,
          shippingRegion: input.shippingRegion || "",
          shippingPostalCode: input.shippingPostalCode || "",
        },
      }),
    });
  } catch {
    return { success: false, error: "We couldn't reach the store's database. Please try again." };
  }

  if (!response.ok) {
    return { success: false, error: parseOrderError(await response.text()) };
  }

  const result = (await response.json()) as { id: string; number: string; subtotal: number; deliveryFee: number; total: number };
  return { success: true, orderId: result.id, orderNumber: result.number, subtotal: result.subtotal, deliveryFee: result.deliveryFee, total: result.total };
}

/** Translates the place_order() error codes (see supabase/orders.sql) into customer-friendly messages. */
function parseOrderError(rawBody: string): string {
  let message = rawBody;
  try {
    const parsed = JSON.parse(rawBody) as { message?: string };
    if (parsed.message) message = parsed.message;
  } catch {
    // Not JSON (e.g. the function/tables don't exist yet) -- fall through with the raw body.
  }

  if (message.startsWith("EMPTY_CART")) return "Your cart is empty.";
  if (message.startsWith("INVALID_ITEM")) return "Your cart has an invalid item. Please refresh your cart and try again.";
  if (message.startsWith("PRODUCT_NOT_FOUND")) return "One of the products in your cart no longer exists. Please remove it and try again.";
  if (message.startsWith("PRODUCT_INACTIVE")) {
    const name = message.split(":")[1];
    return `${name || "One of the products in your cart"} is currently unavailable.`;
  }
  if (message.startsWith("INSUFFICIENT_STOCK")) {
    const [, name, stock] = message.split(":");
    return `Only ${stock ?? 0} unit(s) of ${name || "that product"} ${Number(stock) === 1 ? "is" : "are"} currently available.`;
  }
  return "We couldn't place your order. Your cart has been kept intact -- please try again.";
}

function mapOrder(row: Record<string, unknown>): OrderRecord {
  const items = Array.isArray(row.OrderItem) ? (row.OrderItem as Array<Record<string, unknown>>) : [];
  return {
    id: String(row.id),
    orderNumber: String(row.number),
    status: String(row.status) as OrderStatus,
    paymentMethod: "COD",
    currency: String(row.currency || "PKR"),
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.deliveryFee),
    total: Number(row.total),
    customerName: String(row.customerName),
    customerPhone: String(row.customerPhone),
    customerEmail: row.customerEmail ? String(row.customerEmail) : undefined,
    shippingAddress: String((row.Address as Record<string, unknown> | null)?.line1 || ""),
    shippingCity: String((row.Address as Record<string, unknown> | null)?.city || ""),
    shippingRegion: row.Address ? String((row.Address as Record<string, unknown>).region || "") : undefined,
    shippingPostalCode: row.Address ? String((row.Address as Record<string, unknown>).postalCode || "") : undefined,
    createdAt: String(row.createdAt),
    items: items.map((item) => ({
      id: String(item.id),
      productId: item.productId ? String(item.productId) : null,
      productName: String(item.productName),
      unitPrice: Number(item.unitPrice),
      quantity: Number(item.quantity),
    })),
  };
}

/** Fetches one order with its line items, for the order confirmation page. */
export async function getOrderById(id: string): Promise<OrderRecord | null> {
  const response = await supabase(`Order?id=eq.${encodeURIComponent(id)}&select=*,Address(*),OrderItem(*)`);
  if (!response.ok) return null;
  const rows = (await response.json()) as Array<Record<string, unknown>>;
  return rows[0] ? mapOrder(rows[0]) : null;
}

export async function getAccountOrderById(id: string, userId: string): Promise<OrderRecord | null> {
  const response = await supabase(`Order?id=eq.${encodeURIComponent(id)}&userId=eq.${encodeURIComponent(userId)}&select=*,Address(*),OrderItem(*)`);
  if (!response.ok) return null;
  const rows = (await response.json()) as Array<Record<string, unknown>>;
  return rows[0] ? mapOrder(rows[0]) : null;
}

export type AdminOrderSummary = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  shippingAddressLine2?: string;
  shippingCity: string;
  shippingRegion?: string;
  shippingPostalCode?: string;
  paymentMethod: "COD";
  currency: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderItemRecord[];
};

/** For the admin "Orders & purchases" tab -- newest first, capped at 50. */
export async function getAdminOrders(): Promise<AdminOrderSummary[]> {
  const response = await supabase("Order?select=id,number,customerName,customerPhone,customerEmail,paymentMethod,currency,subtotal,deliveryFee,total,status,createdAt,Address(line1,line2,city,region,postalCode),OrderItem(id,productId,productName,unitPrice,quantity)&order=createdAt.desc&limit=50");
  if (!response.ok) return [];
  const rows = (await response.json()) as Array<Record<string, unknown>>;
  return rows.map((row) => {
    const address = row.Address as Record<string, unknown> | null;
    const items = Array.isArray(row.OrderItem) ? row.OrderItem as Array<Record<string, unknown>> : [];
    return {
      id: String(row.id),
      orderNumber: String(row.number),
      customerName: String(row.customerName),
      customerPhone: String(row.customerPhone),
      customerEmail: row.customerEmail ? String(row.customerEmail) : undefined,
      shippingAddress: String(address?.line1 || ""),
      shippingAddressLine2: address?.line2 ? String(address.line2) : undefined,
      shippingCity: String(address?.city || ""),
      shippingRegion: address?.region ? String(address.region) : undefined,
      shippingPostalCode: address?.postalCode ? String(address.postalCode) : undefined,
      paymentMethod: "COD",
      currency: String(row.currency || "PKR"),
      subtotal: Number(row.subtotal),
      deliveryFee: Number(row.deliveryFee),
      total: Number(row.total),
      status: String(row.status) as OrderStatus,
      createdAt: String(row.createdAt),
      items: items.map((item) => ({
        id: String(item.id),
        productId: item.productId ? String(item.productId) : null,
        productName: String(item.productName),
        unitPrice: Number(item.unitPrice),
        quantity: Number(item.quantity),
      })),
    } satisfies AdminOrderSummary;
  });
}

export type AdminCustomerSummary = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  orderCount: number;
  lifetimeValue: number;
};

export async function getAdminCustomers(): Promise<AdminCustomerSummary[]> {
  const response = await supabase("User?select=id,name,email,phone,createdAt,Order(total)&order=createdAt.desc&limit=100");
  if (!response.ok) return [];
  const rows = await response.json() as Array<Record<string, unknown>>;
  return rows.map((row) => {
    const orders = Array.isArray(row.Order) ? row.Order as Array<Record<string, unknown>> : [];
    return {
      id: String(row.id),
      name: String(row.name || "Unnamed customer"),
      email: row.email ? String(row.email) : undefined,
      phone: row.phone ? String(row.phone) : undefined,
      orderCount: orders.length,
      lifetimeValue: orders.reduce((total, order) => total + Number(order.total || 0), 0),
    };
  });
}

export async function updateAdminOrderStatus(id: string, status: OrderStatus) {
  const response = await supabase("rpc/update_order_status", {
    method: "POST",
    body: JSON.stringify({ payload: { orderId: id, status } }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(parseOrderError(body));
  }
  return (await response.json()) as { id: string; status: OrderStatus };
}
