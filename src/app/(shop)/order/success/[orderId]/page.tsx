import Link from "next/link";
import { cookies } from "next/headers";
import { getOrderById } from "@/lib/orders";
import { getAccountOrderById } from "@/lib/orders";
import { getCurrentAccount } from "@/lib/account-auth";
import { ORDER_RECEIPT_COOKIE, verifyOrderReceiptToken } from "@/lib/order-receipt";
import { ReceiptDownloadButton } from "@/components/ReceiptDownloadButton";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ orderId: string }> };

export default async function OrderSuccessPage({ params }: PageProps) {
  const { orderId } = await params;
  const account = await getCurrentAccount();
  const accountOrder = account ? await getAccountOrderById(orderId, account.id) : null;
  const receiptToken = (await cookies()).get(ORDER_RECEIPT_COOKIE)?.value;
  const order = accountOrder || (verifyOrderReceiptToken(orderId, receiptToken) ? await getOrderById(orderId) : null);

  if (!order) {
    return (
      <div className="section-shell flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-3xl font-black uppercase tracking-[-0.03em]">Order not found</h1>
        <p className="max-w-md text-sm text-[var(--body-gray)]">We couldn&apos;t find an order at this link.</p>
        <Link href="/" className="mt-2 bg-[var(--red)] px-6 py-4 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[var(--red-dark)]">Back to shop</Link>
      </div>
    );
  }

  return (
    <div className="section-shell py-10 md:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--red)] text-2xl text-white">✓</span>
        <h1 className="mt-5 text-3xl font-black uppercase tracking-[-0.03em] md:text-4xl">Order confirmed!</h1>
        <p className="mt-2 text-sm text-[var(--body-gray)]">Thank you for your order.</p>
        <p className="mt-4 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Order # {order.orderNumber}</p>
      </div>

      <div className="mx-auto mt-10 grid max-w-2xl gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] p-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Payment</h2>
          <p className="mt-2 text-sm font-bold uppercase tracking-wide">Cash on Delivery</p>
          <p className="mt-1 text-sm text-[var(--body-gray)]">Pay in cash when your order arrives.</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] p-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">We&apos;ll deliver your order to</h2>
          <p className="mt-2 text-sm font-semibold">{order.customerName}</p>
          <p className="text-sm text-[var(--body-gray)]">{order.shippingAddress}</p>
          <p className="text-sm text-[var(--body-gray)]">{order.shippingCity}{order.shippingRegion ? `, ${order.shippingRegion}` : ""}</p>
          <p className="mt-1 text-sm text-[var(--body-gray)]">{order.customerPhone}</p>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-[var(--border)] p-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Order summary</h2>
        <div className="mt-4 space-y-3 text-sm">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-3"><span className="text-[var(--body-gray)]">{item.productName} × {item.quantity}</span><span className="shrink-0 font-semibold">Rs. {(item.unitPrice * item.quantity).toLocaleString()}</span></div>
          ))}
        </div>
        <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-4 text-sm">
          <div className="flex justify-between"><span className="text-[var(--body-gray)]">Subtotal</span><span className="font-semibold">Rs. {order.subtotal.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-[var(--body-gray)]">Delivery</span><span className="font-semibold">{order.deliveryFee === 0 ? "Free" : `Rs. ${order.deliveryFee.toLocaleString()}`}</span></div>
        </div>
        <div className="mt-4 flex justify-between border-t border-[var(--border)] pt-4 text-base font-black"><span>Total</span><span>Rs. {order.total.toLocaleString()}</span></div>
      </div>

      <div className="mt-10 text-center">
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <ReceiptDownloadButton order={order} />
          <Link href="/" className="bg-[var(--red)] px-6 py-4 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[var(--red-dark)]">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
