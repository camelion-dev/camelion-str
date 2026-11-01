import type { OrderRecord } from "@/lib/orders";

const SEND_MESSAGE_URL = "https://whatsapp.qasimhussain.com/api/send";

export type WhatsAppMessageStatus = "accepted" | "not_sent" | "unknown";

export function normalizeWhatsAppPhone(phone: string) {
  const trimmed = phone.trim();
  let digits = trimmed.replace(/\D/g, "");

  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `92${digits.replace(/^0+/, "")}`;
  else if (!trimmed.startsWith("+") && !digits.startsWith("92") && digits.length === 10) digits = `92${digits}`;

  return /^\d{10,15}$/.test(digits) ? digits : null;
}

function singleLine(value: string, maxLength: number) {
  return value.replace(/[\r\n\t]+/g, " ").trim().slice(0, maxLength);
}

function createOrderMessage(order: OrderRecord) {
  const customerName = singleLine(order.customerName, 80) || "there";
  const items = order.items.slice(0, 24).map((item) => {
    const name = singleLine(item.productName, 80);
    const amount = (item.unitPrice * item.quantity).toLocaleString("en-PK");
    return `- ${name} x ${item.quantity}: ${order.currency} ${amount}`;
  });
  if (order.items.length > items.length) items.push(`- Plus ${order.items.length - items.length} more item(s)`);

  return [
    `Assalamu alaikum ${customerName},`,
    "Thank you for your order from Camelion Store.",
    "",
    `Order: ${order.orderNumber}`,
    ...items,
    "",
    `Subtotal: ${order.currency} ${order.subtotal.toLocaleString("en-PK")}`,
    `Delivery: ${order.deliveryFee ? `${order.currency} ${order.deliveryFee.toLocaleString("en-PK")}` : "Free"}`,
    `Total: ${order.currency} ${order.total.toLocaleString("en-PK")}`,
    "Payment: Cash on Delivery",
    "",
    "Reply CONFIRM to confirm this order or CANCEL to cancel it.",
    `If you have more than one pending order, include this order number: ${order.orderNumber}`,
    "",
    "Your order remains pending until you reply.",
  ].join("\n");
}

export async function sendOrderConfirmationMessage(order: OrderRecord): Promise<WhatsAppMessageStatus> {
  const token = process.env.WHATSAPP_PROVIDER_TOKEN?.trim();
  const to = normalizeWhatsAppPhone(order.customerPhone);
  if (!token || !to) return "not_sent";

  try {
    const response = await fetch(SEND_MESSAGE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to, text: createOrderMessage(order) }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    let result: { ok?: unknown };
    try {
      result = await response.json() as { ok?: unknown };
    } catch {
      return "unknown";
    }

    if (result.ok === true) return "accepted";
    if (result.ok === false) return "not_sent";
    return "unknown";
  } catch {
    return "unknown";
  }
}