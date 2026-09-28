"use client";

import { jsPDF } from "jspdf";
import type { OrderRecord } from "@/lib/orders";

function money(currency: string, amount: number) {
  return `${currency} ${amount.toLocaleString("en-PK")}`;
}

async function loadLogoDataUrl() {
  const response = await fetch("/brand-logo.avif");
  if (!response.ok) throw new Error("Logo unavailable");
  const blob = await response.blob();
  const imageUrl = URL.createObjectURL(blob);

  try {
    const image = new Image();
    image.src = imageUrl;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Logo could not be decoded"));
    });
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.getContext("2d")?.drawImage(image, 0, 0);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export function ReceiptDownloadButton({ order }: { order: OrderRecord }) {
  async function downloadReceipt() {
    const document = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = document.internal.pageSize.getWidth();
    const left = 18;
    const right = pageWidth - 18;
    let y = 22;

    try {
      const logoDataUrl = await loadLogoDataUrl();
      document.addImage(logoDataUrl, "PNG", left, y - 15, 42, 15, undefined, "FAST");
    } catch {
      document.setTextColor(224, 0, 0);
      document.setFontSize(24);
      document.setFont("helvetica", "bold");
      document.text("CAMELION.", left, y);
    }
    document.setTextColor(17, 17, 17);
    document.setFontSize(11);
    document.text("ORDER RECEIPT", left, y + 9);
    document.setFont("helvetica", "normal");
    document.setTextColor(85, 85, 85);
    document.text(`Order # ${order.orderNumber}`, left, y + 16);
    document.text(new Date(order.createdAt).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" }), left, y + 22);
    y += 38;

    const address = [order.shippingAddress, order.shippingAddressLine2, order.shippingCity, order.shippingRegion, order.shippingPostalCode].filter(Boolean).join(", ");
    document.setDrawColor(225, 225, 225);
    document.line(left, y, right, y);
    y += 9;
    document.setFontSize(10);
    document.setFont("helvetica", "bold");
    document.setTextColor(120, 120, 120);
    document.text("CUSTOMER", left, y);
    document.text("DELIVER TO", pageWidth / 2, y);
    document.setFont("helvetica", "normal");
    document.setTextColor(17, 17, 17);
    document.text(document.splitTextToSize(`${order.customerName}\n${order.customerPhone}${order.customerEmail ? `\n${order.customerEmail}` : ""}`, 75), left, y + 7);
    document.text(document.splitTextToSize(`${address}\nPayment: Cash on Delivery`, 75), pageWidth / 2, y + 7);
    y += 35;

    document.setFont("helvetica", "bold");
    document.setTextColor(120, 120, 120);
    document.text("ORDER SUMMARY", left, y);
    y += 8;
    document.setTextColor(17, 17, 17);
    document.setFontSize(9);
    document.text("ITEM", left, y);
    document.text("QTY", right - 48, y);
    document.text("AMOUNT", right, y, { align: "right" });
    y += 4;
    document.line(left, y, right, y);
    y += 7;

    document.setFont("helvetica", "normal");
    for (const item of order.items) {
      const nameLines = document.splitTextToSize(item.productName, 105);
      if (y + nameLines.length * 5 > 270) {
        document.addPage();
        y = 22;
      }
      document.text(nameLines, left, y);
      document.text(String(item.quantity), right - 48, y);
      document.text(money(order.currency, item.unitPrice * item.quantity), right, y, { align: "right" });
      y += Math.max(nameLines.length * 5, 5) + 3;
      document.setDrawColor(235, 235, 235);
      document.line(left, y - 1, right, y - 1);
    }

    y += 8;
    const totals = [["Subtotal", money(order.currency, order.subtotal)], ["Delivery", order.deliveryFee ? money(order.currency, order.deliveryFee) : "Free"]];
    document.setFontSize(10);
    for (const [label, value] of totals) {
      document.text(label, right - 70, y);
      document.text(value, right, y, { align: "right" });
      y += 7;
    }
    document.setDrawColor(17, 17, 17);
    document.line(right - 70, y - 3, right, y - 3);
    document.setFont("helvetica", "bold");
    document.setFontSize(13);
    document.text("Total", right - 70, y + 6);
    document.text(money(order.currency, order.total), right, y + 6, { align: "right" });
    document.save(`camelion-receipt-${order.orderNumber}.pdf`);
  }

  return <button type="button" onClick={downloadReceipt} className="border border-[var(--foreground)] px-6 py-4 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-[var(--foreground)] hover:text-white">Download receipt</button>;
}