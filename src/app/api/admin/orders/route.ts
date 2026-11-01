import { after, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminOrders, getOrderById, updateAdminOrderStatus } from "@/lib/orders";
import { sendWhatsAppText } from "@/lib/whatsapp-provider";
import { orderStatuses, type OrderStatus } from "@/lib/order-status";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await getAdminOrders();
    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load orders." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json() as { id?: unknown; status?: unknown };
    if (typeof body.id !== "string" || !body.id || typeof body.status !== "string" || !orderStatuses.includes(body.status as OrderStatus)) {
      return NextResponse.json({ error: "A valid order id and status are required." }, { status: 400 });
    }
    const order = await updateAdminOrderStatus(body.id, body.status as OrderStatus);

    if (order.status === "CANCELLED") {
      after(async () => {
        try {
          const cancelledOrder = await getOrderById(order.id);
          if (!cancelledOrder) return;
          const messageStatus = await sendWhatsAppText(
            cancelledOrder.customerPhone,
            `Your order ${cancelledOrder.orderNumber} has been cancelled as requested. We hope to serve you again. Please visit our store to place a new order: https://www.camelion.store`,
          );
          if (messageStatus !== "accepted") {
            console.warn("WhatsApp cancellation message was not confirmed as accepted.", { orderId: order.id, messageStatus });
          }
        } catch {
          console.error("WhatsApp cancellation follow-up failed.", { orderId: order.id });
        }
      });
    }

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update order." }, { status: 400 });
  }
}
