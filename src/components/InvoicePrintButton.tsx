"use client";

export function InvoicePrintButton() {
  return <button type="button" onClick={() => window.print()} className="w-fit bg-[#111] px-4 py-3 font-bold uppercase tracking-wider text-white print:hidden">Print / Save PDF</button>;
}
