import { notFound, redirect } from "next/navigation";
import { getOrderById } from "@/lib/orders";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { InvoicePrintButton } from "@/components/InvoicePrintButton";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ orderId: string }> };

function formatMoney(currency: string, amount: number) {
  return `${currency} ${amount.toLocaleString("en-PK")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminInvoicePage({ params }: PageProps) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const { orderId } = await params;
  const order = await getOrderById(orderId);
  if (!order) notFound();

  return (
    <main className="min-h-screen bg-[#f5f5f5] px-4 py-8 text-[#111] print:bg-white print:px-0 print:py-0">
      <article className="mx-auto max-w-3xl bg-white p-6 shadow-sm sm:p-10 print:max-w-none print:shadow-none">
        <header className="flex flex-col justify-between gap-6 border-b-2 border-[#111] pb-6 sm:flex-row sm:items-start">
          <div>
            <img src="/brand-logo.avif" alt="Camelion" className="h-9 w-auto object-contain" />
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-[#777]">Order invoice</p>
          </div>
          <div className="text-left text-sm sm:text-right">
            <p className="font-bold">#{order.orderNumber}</p>
            <p className="mt-1 text-[#555]">{formatDate(order.createdAt)}</p>
            <p className="mt-2 font-bold uppercase tracking-wider text-[#e00000]">{order.status}</p>
          </div>
        </header>

        <section className="grid gap-6 border-b border-[#ddd] py-7 sm:grid-cols-2">
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#777]">Customer</h2>
            <p className="mt-2 font-bold">{order.customerName}</p>
            <p className="text-sm text-[#555]">{order.customerPhone}</p>
            {order.customerEmail && <p className="text-sm text-[#555]">{order.customerEmail}</p>}
          </div>
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#777]">Deliver to</h2>
            <p className="mt-2 text-sm text-[#555]">{order.shippingAddress}</p>
            {order.shippingAddressLine2 && <p className="text-sm text-[#555]">{order.shippingAddressLine2}</p>}
            <p className="text-sm text-[#555]">{order.shippingCity}{order.shippingRegion ? `, ${order.shippingRegion}` : ""}{order.shippingPostalCode ? ` ${order.shippingPostalCode}` : ""}</p>
          </div>
        </section>

        <section className="py-7">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#777]">Items ordered</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead><tr className="border-b border-[#111] text-left text-[10px] uppercase tracking-wider"><th className="pb-3">Item</th><th className="pb-3">Qty</th><th className="pb-3 text-right">Unit price</th><th className="pb-3 text-right">Amount</th></tr></thead>
              <tbody>{order.items.map((item) => <tr key={item.id} className="border-b border-[#ddd]"><td className="py-4 font-semibold">{item.productName}</td><td className="py-4">{item.quantity}</td><td className="py-4 text-right">{formatMoney(order.currency, item.unitPrice)}</td><td className="py-4 text-right font-semibold">{formatMoney(order.currency, item.unitPrice * item.quantity)}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="ml-auto mt-6 max-w-xs space-y-2 text-sm"><div className="flex justify-between"><span className="text-[#555]">Subtotal</span><span>{formatMoney(order.currency, order.subtotal)}</span></div><div className="flex justify-between"><span className="text-[#555]">Delivery</span><span>{order.deliveryFee ? formatMoney(order.currency, order.deliveryFee) : "Free"}</span></div><div className="flex justify-between border-t-2 border-[#111] pt-3 text-base font-black"><span>Total</span><span>{formatMoney(order.currency, order.total)}</span></div></div>
        </section>

        <footer className="flex flex-col justify-between gap-4 border-t border-[#ddd] pt-5 text-xs text-[#777] sm:flex-row"><span>Payment method: Cash on Delivery</span><InvoicePrintButton /></footer>
      </article>
    </main>
  );
}
