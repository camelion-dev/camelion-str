"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CatalogProduct } from "@/lib/catalog";
import type { AdminOrderSummary } from "@/lib/orders";
import type { AdminCustomerSummary } from "@/lib/orders";

const emptyForm = { name: "", category: "Batteries", price: "", compareAtPrice: "", stock: "0", badge: "", description: "", imageUrl: "", imagePath: "" };

function formatOrderDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
  if (isSameDay) return `Today, ${time}`;
  if (isYesterday) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

type Tab = "overview" | "catalogue" | "orders" | "customers";

export default function AdminPortal({ initialProducts }: { initialProducts: CatalogProduct[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [customers, setCustomers] = useState<AdminCustomerSummary[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const portalRef = useRef<HTMLElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/products").then((response) => response.json()).then((data) => setProducts(data.products));
    fetch("/api/admin/orders").then((response) => response.json()).then((data) => setOrders(data.orders || []));
    fetch("/api/admin/customers").then((response) => response.json()).then((data) => setCustomers(data.customers || []));
  }, []);

  useEffect(() => {
    const inactivityLimit = 5 * 60 * 1000;
    let timeout: ReturnType<typeof setTimeout>;

    const signOutAfterInactivity = () => {
      void fetch("/api/admin/login", { method: "DELETE" }).finally(() => router.replace("/admin/login"));
    };

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(signOutAfterInactivity, inactivityLimit);
    };

    const activityEvents = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeout);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
    };
  }, [router]);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentDate(new Date()), 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!portalRef.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      gsap.fromTo(".admin-workspace > *", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.06, ease: "power3.out", scrollTrigger: { trigger: portalRef.current, start: "top 88%", once: true } });
    }, portalRef);
    return () => context.revert();
  }, [tab]);

  const refresh = async () => {
    const response = await fetch("/api/admin/products");
    const data = await response.json();
    setProducts(data.products);
  };

  const updateOrderStatus = async (id: string, status: "CONFIRMED" | "CANCELLED") => {
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const data = await response.json();
    if (!response.ok) {
      setNotice(data.error || "The order could not be updated.");
      return;
    }
    setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order));
    setNotice(status === "CONFIRMED" ? "Order approved." : "Order cancelled and stock restored.");
  };

  const updateForm = (key: keyof typeof emptyForm, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submitProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    let imageData = { imageUrl: form.imageUrl, imagePath: form.imagePath };
    if (imageFile) {
      const uploadData = new FormData();
      uploadData.append("file", imageFile);
      uploadData.append("productId", editingId || "new-product");
      const uploadResponse = await fetch("/api/admin/product-images", { method: "POST", body: uploadData });
      if (!uploadResponse.ok) {
        const result = await uploadResponse.json();
        setNotice(result.error || "Image upload failed.");
        return;
      }
      const uploadedImage = await uploadResponse.json() as { url: string; path: string };
      imageData = { imageUrl: uploadedImage.url, imagePath: uploadedImage.path };
    }
    const payload = { ...form, ...imageData, price: Number(form.price), compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined, stock: Number(form.stock), active: true };
    const response = await fetch("/api/admin/products", { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload) });
    if (!response.ok) { setNotice("The product could not be saved."); return; }
    setForm(emptyForm);
    setEditingId(null);
    setImageFile(null);
    setImagePreview("");
    setIsAddProductModalOpen(false);
    setNotice(editingId ? "Product updated and reflected in the store." : "Product added to the catalogue and store.");
    await refresh();
  };

  const editProduct = (product: CatalogProduct) => {
    setEditingId(product.id);
    setForm({ name: product.name, category: product.category, price: String(product.price), compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "", stock: String(product.stock), badge: product.badge || "", description: product.description, imageUrl: product.imageUrl || "", imagePath: product.imagePath || "" });
    setImagePreview(product.imageUrl || "");
    setIsAddProductModalOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleProduct = async (product: CatalogProduct) => {
    await fetch("/api/admin/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: product.id, active: !product.active }) });
    setNotice(`${product.name} is now ${product.active ? "hidden from" : "visible in"} the store.`);
    await refresh();
  };

  const removeProduct = async (product: CatalogProduct) => {
    try {
      const response = await fetch("/api/admin/products", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: product.id }) });
      if (!response.ok) {
        setNotice("The product could not be deleted.");
        return false;
      }
      setNotice(`${product.name} was deleted from the catalogue.`);
      try {
        await refresh();
      } catch {
        setNotice(`${product.name} was deleted, but the catalogue could not refresh.`);
      }
      return true;
    } catch {
      setNotice("The product could not be deleted. Check your connection and try again.");
      return false;
    }
  };

  const nav = [["overview", "Overview"], ["catalogue", "Product catalogue"], ["orders", "Orders & purchases"], ["customers", "Customers"]] as const;
  return (
    <main ref={portalRef} className="admin-portal admin-command-center min-h-screen bg-[#f7f8fa] text-[#111]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="admin-sidebar w-full shrink-0 bg-[#111214] p-6 text-white lg:w-[260px] lg:p-7"><Link href="/" className="inline-flex items-center" aria-label="Camelion home"><img src="/brand-logo.avif" alt="Camelion" className="h-8 w-auto object-contain" /></Link><p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Control centre</p><nav className="mt-12 grid gap-1.5">{nav.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`flex items-center justify-between rounded-md px-4 py-3 text-left text-xs font-semibold tracking-wide transition-colors ${tab === id ? "border-l-2 border-[#e00000] bg-white/[0.09] text-white" : "border-l-2 border-transparent text-white/50 hover:bg-white/[0.06] hover:text-white"}`}>{label}<span className="text-white/35">→</span></button>)}</nav><div className="mt-14 border-t border-white/10 pt-6 text-xs text-white/45"><p>Signed in as</p><p className="mt-1 font-semibold text-white">Sam · Administrator</p><Link href="/" className="mt-6 inline-block font-semibold text-[#ff5757]">View live store ↗</Link><button onClick={async () => { await fetch("/api/admin/login", { method: "DELETE" }); router.push("/admin/login"); }} className="mt-5 block font-semibold text-white/50 hover:text-white">Sign out</button></div></aside>
        <section className="admin-workspace min-w-0 flex-1 p-5 md:p-8 lg:p-10 xl:p-12">
          <header className="admin-workspace-header flex flex-col justify-between gap-5 border-b border-[#e1e5ea] pb-7 sm:flex-row sm:items-start">
            <div>
              <p className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#555f6d]"><span className="h-px w-7 bg-[#e00000]" />Camelion / Operations</p>
              {tab !== "orders" && (
                <>
                  <h1 className="mt-4 max-w-5xl text-3xl font-black tracking-[-0.04em] md:text-5xl">{tab === "overview" ? `${getGreeting(currentDate)}, Sam.` : nav.find(([id]) => id === tab)?.[1]}</h1>
                  <p className="mt-2 text-sm text-[#7b8490]">{tab === "overview" ? "Here’s what’s happening with your store today." : "Keep your store operations moving."}</p>
                </>
              )}
            </div>
            <div className="text-left text-xs text-[#7b8490] sm:text-right">
              <p>{currentDate.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
              <p className="mt-2 font-semibold text-[#111]">Store status: <span className="text-[#e00000]">Live</span><span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-[#1aa875]" /></p>
            </div>
          </header>
          {notice && <div className="mt-6 flex items-center justify-between border border-[#e000000]/20 bg-white px-4 py-3 text-sm"><span>{notice}</span><button onClick={() => setNotice("")} className="font-bold text-[#e00000]" aria-label="Dismiss notification">×</button></div>}
          {tab === "overview" && <Overview products={products} orders={orders} setTab={setTab} />}
          {tab === "catalogue" && <Catalogue products={products} form={form} editingId={editingId} imagePreview={imagePreview} updateForm={updateForm} submitProduct={submitProduct} editProduct={editProduct} toggleProduct={toggleProduct} removeProduct={removeProduct} cancelEdit={() => { setEditingId(null); setForm(emptyForm); setImageFile(null); setImagePreview(""); setIsAddProductModalOpen(false); }} onImageChange={(file) => { if (file.size > 4 * 1024 * 1024) { setNotice("Images must be 4MB or smaller."); return; } setImageFile(file); setImagePreview(URL.createObjectURL(file)); }} isAddProductModalOpen={isAddProductModalOpen} setIsAddProductModalOpen={setIsAddProductModalOpen} />}
          {tab === "orders" && (orders.length > 0 ? <OrdersTable orders={orders} expandedOrderId={expandedOrderId} onExpand={setExpandedOrderId} onStatusChange={updateOrderStatus} /> : <p className="mt-8 border border-[#111]/15 bg-white p-8 text-center text-sm text-[#888]">No orders yet. Orders placed by customers at checkout will show up here.</p>)}
          {tab === "customers" && <DataTable title="Customers" columns={["Customer", "Email / phone", "Orders", "Lifetime value"]} rows={customers.map((customer) => [customer.name, customer.email || customer.phone || "No contact details", `${customer.orderCount} order${customer.orderCount === 1 ? "" : "s"}`, `PKR ${customer.lifetimeValue.toLocaleString()}`])} />}
        </section>
      </div>
    </main>
  );
}

function Overview({ products, orders, setTab }: { products: CatalogProduct[]; orders: AdminOrderSummary[]; setTab: (tab: Tab) => void }) {
  const lowStock = products.filter((product) => product.stock < 10).length;
  const activeProducts = products.filter((product) => product.active).length;
  const grossRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const ordersThisWeek = orders.filter((order) => new Date(order.createdAt) >= weekAgo).length;
  return <div className="mt-8"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[["Gross revenue", `PKR ${grossRevenue.toLocaleString()}`, `From last ${orders.length} order${orders.length === 1 ? "" : "s"}`], ["Orders this week", String(ordersThisWeek), `${orders.length} total loaded`], ["Active products", String(activeProducts), `${products.length} total records`], ["Low stock", String(lowStock).padStart(2, "0"), "Needs attention"]].map(([label, value, change]) => <div key={label} className="border border-[#111]/15 bg-white p-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#888]">{label}</p><p className="mt-7 text-4xl font-black">{value}</p><p className="mt-3 text-xs font-bold text-[#e00000]">{change}</p></div>)}</div><div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]"><section className="border border-[#111]/15 bg-white"><div className="flex items-center justify-between border-b border-[#111]/10 p-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e00000]">Live feed</p><h2 className="mt-2 text-2xl font-black uppercase">Recent orders</h2></div><button onClick={() => setTab("orders")} className="text-xs font-bold uppercase tracking-wider text-[#e00000]">View all →</button></div>{orders.length > 0 ? <div className="divide-y divide-[#111]/10">{orders.slice(0, 3).map((order) => <div key={order.id} className="grid gap-2 px-5 py-5 text-sm sm:grid-cols-[1fr_1.4fr_1fr_1fr] sm:items-center"><span className="font-mono text-xs">#{order.orderNumber}</span><span>{order.customerName}</span><span>PKR {order.total.toLocaleString()}</span><span className="text-[10px] font-bold uppercase tracking-wider text-[#e00000]">{order.status.charAt(0) + order.status.slice(1).toLowerCase()}</span></div>)}</div> : <p className="p-5 text-sm text-[#888]">No orders yet.</p>}</section><section className="border border-[#111]/15 bg-[#111] p-6 text-white"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ff5757]">Catalogue health</p><h2 className="mt-3 text-2xl font-black uppercase">Keep the store moving.</h2><div className="mt-8 grid gap-4 text-sm"><button onClick={() => setTab("catalogue")} className="flex justify-between border-b border-white/15 pb-4 text-left"><span>Review low stock items</span><span className="text-[#ff5757]">{lowStock} →</span></button><button onClick={() => setTab("catalogue")} className="flex justify-between border-b border-white/15 pb-4 text-left"><span>Manage product catalogue</span><span className="text-[#ff5757]">{activeProducts} →</span></button><button onClick={() => setTab("customers")} className="flex justify-between text-left"><span>Review customer activity</span><span className="text-[#ff5757]">View →</span></button></div></section></div></div>;
}

function Catalogue({ products, form, editingId, imagePreview, updateForm, submitProduct, editProduct, toggleProduct, removeProduct, cancelEdit, onImageChange, isAddProductModalOpen, setIsAddProductModalOpen }: { products: CatalogProduct[]; form: typeof emptyForm; editingId: string | null; imagePreview: string; updateForm: (key: keyof typeof emptyForm, value: string) => void; submitProduct: (event: React.FormEvent) => void; editProduct: (product: CatalogProduct) => void; toggleProduct: (product: CatalogProduct) => void; removeProduct: (product: CatalogProduct) => Promise<boolean>; cancelEdit: () => void; onImageChange: (file: File) => void; isAddProductModalOpen: boolean; setIsAddProductModalOpen: (value: boolean) => void }) {
  const [productPendingDelete, setProductPendingDelete] = useState<CatalogProduct | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const cancelDeleteButtonRef = useRef<HTMLButtonElement>(null);
  const closeProductModal = () => {
    setIsAddProductModalOpen(false);
    cancelEdit();
  };

  useEffect(() => {
    if (!productPendingDelete) return;
    cancelDeleteButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeletingProduct) setProductPendingDelete(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [productPendingDelete, isDeletingProduct]);

  const confirmProductDeletion = async () => {
    if (!productPendingDelete || isDeletingProduct) return;
    setIsDeletingProduct(true);
    const deleted = await removeProduct(productPendingDelete);
    setIsDeletingProduct(false);
    if (deleted) setProductPendingDelete(null);
  };

  const productForm = (
    <form onSubmit={submitProduct} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="grid gap-2 text-[10px] font-bold uppercase tracking-wider text-[#666] sm:col-span-2">
        Product picture
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) onImageChange(file); }} className="rounded-lg border border-dashed border-[#111]/20 bg-[#f8f8f8] px-3 py-2.5 text-xs normal-case tracking-normal text-[#444]" />
        {imagePreview && <img src={imagePreview} alt="Product preview" className="mt-1 aspect-video w-full rounded-lg border border-[#111]/10 bg-[#f6f6f6] object-contain" />}
      </label>

      {[["name", "Product name", "text"], ["price", "Price (PKR)", "number"], ["compareAtPrice", "Compare-at price", "number"], ["stock", "Stock units", "number"], ["badge", "Badge", "text"], ["description", "Description", "text"]].map(([key, label, type]) => (
        <label key={key} className="grid gap-2 text-[10px] font-bold uppercase tracking-wider text-[#666]">
          {label}
          <input required={key === "name" || key === "price"} type={type} value={form[key as keyof typeof form]} onChange={(event) => updateForm(key as keyof typeof emptyForm, event.target.value)} className="rounded-lg border border-[#111]/15 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-[#111] outline-none transition focus:border-[#e00000] focus:ring-2 focus:ring-[#e00000]/10" />
        </label>
      ))}

      <label className="grid gap-2 text-[10px] font-bold uppercase tracking-wider text-[#666] sm:col-span-2">
        Category
        <select value={form.category} onChange={(event) => updateForm("category", event.target.value)} className="rounded-lg border border-[#111]/15 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-[#111] outline-none transition focus:border-[#e00000] focus:ring-2 focus:ring-[#e00000]/10">
          {["Batteries", "Chargers", "Flashlights", "Extension Wires", "Portable Devices", "Bundles"].map((category) => <option key={category}>{category}</option>)}
        </select>
      </label>

      <button className="mt-2 w-full rounded-lg bg-[#e00000] px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#b80000] sm:col-span-2">{editingId ? "Save product changes" : "Add to catalogue"} →</button>
    </form>
  );

  return (
    <>
      <div className="mt-8">
        <section className="catalogue-products border border-[#111]/15 bg-white">
          <div className="flex flex-col justify-between gap-3 border-b border-[#111]/10 p-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e00000]">{products.length} records</p>
              <h2 className="mt-2 text-2xl font-black uppercase">All products</h2>
            </div>
            <button type="button" onClick={() => { if (editingId) cancelEdit(); setIsAddProductModalOpen(true); }} className="rounded-none border-2 border-[#111] bg-[#e00000] px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-[3px_3px_0_#111] transition-[background-color,transform,box-shadow] hover:bg-[#b80000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e00000]/30 focus-visible:ring-offset-2">Add Product</button>
          </div>
          <div className="divide-y divide-[#111]/10">
            {products.map((product) => (
              <div key={product.id} className="grid gap-4 p-5 transition-colors hover:bg-[#fafbfc] md:grid-cols-[64px_1fr_auto] md:items-center">
                <div className="product-visual h-16 w-16 rounded-lg border border-[#e5e5e5]">
                  {product.imageUrl ? <div role="img" aria-label={`${product.name} product image`} className="h-full w-full bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${product.imageUrl})` }} /> : <div className={`${product.visual} product-fallback-visual scale-50`} />}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">{product.name}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${product.active ? "bg-[#e00000] text-white" : "bg-[#111] text-white"}`}>{product.active ? "Live" : "Hidden"}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#888]">{product.category} · Rs. {product.price.toLocaleString()} · <span className={product.stock < 10 ? "font-bold text-[#e00000]" : ""}>{product.stock} in stock</span></p>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <button onClick={() => editProduct(product)} className="rounded-full border border-red-300 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-red-500 transition-colors hover:bg-red-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/25 focus-visible:ring-offset-2">Edit</button>
                  <button onClick={() => toggleProduct(product)} className="rounded-full border border-red-300 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-red-500 transition-colors hover:bg-red-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/25 focus-visible:ring-offset-2">{product.active ? "Hide" : "Publish"}</button>
                  <button onClick={() => setProductPendingDelete(product)} className="rounded-full border border-red-300 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-red-500 transition-colors hover:bg-red-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/25 focus-visible:ring-offset-2">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {productPendingDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]" onClick={() => { if (!isDeletingProduct) setProductPendingDelete(null); }}>
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-product-title"
            aria-describedby="delete-product-description"
            className="w-full max-w-[440px] overflow-hidden border-2 border-[#111] bg-white shadow-[6px_6px_0_#111]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="h-1.5 bg-[#e00000]" />
            <div className="p-5 sm:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#e00000]">Catalogue removal</p>
              <h2 id="delete-product-title" className="mt-2 text-2xl font-black uppercase">Delete product?</h2>
              <p id="delete-product-description" className="mt-2 text-sm leading-6 text-[#666]">This permanently removes the product from your catalogue and storefront.</p>

              <div className="mt-5 flex items-center gap-3 border border-[#111]/10 bg-[#f7f8fa] p-3">
                <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden border border-[#111]/10 bg-white text-xl font-black uppercase text-[#111]">
                  {productPendingDelete.imageUrl ? <img src={productPendingDelete.imageUrl} alt="" className="h-full w-full object-contain" /> : productPendingDelete.name.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#111]">{productPendingDelete.name}</p>
                  <p className="mt-1 text-xs text-[#666]">{productPendingDelete.category} · Rs. {productPendingDelete.price.toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button ref={cancelDeleteButtonRef} type="button" disabled={isDeletingProduct} onClick={() => setProductPendingDelete(null)} className="min-h-11 border border-[#111]/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#111] transition-colors hover:bg-[#f2f2f2] disabled:cursor-wait disabled:opacity-60">Keep product</button>
                <button type="button" disabled={isDeletingProduct} onClick={confirmProductDeletion} className="min-h-11 border-2 border-[#111] bg-[#e00000] px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-[3px_3px_0_#111] transition-[background-color,transform,box-shadow] hover:bg-[#b80000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-wait disabled:opacity-70">{isDeletingProduct ? "Deleting..." : "Delete product"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]" onClick={closeProductModal}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={editingId ? "Edit product" : "Add product"}
            className="relative w-full max-w-[680px] overflow-hidden rounded-2xl border border-[#111]/10 bg-white shadow-[0_30px_90px_rgba(17,17,17,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#111]/10 px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e00000]">{editingId ? "Edit record" : "New record"}</p>
                <h2 className="mt-1 text-xl font-black uppercase tracking-[-0.04em]">{editingId ? "Update product" : "Add product"}</h2>
              </div>
              <button type="button" aria-label="Close add product form" onClick={closeProductModal} className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-[#666] transition hover:bg-[#111]/5 hover:text-[#111]">×</button>
            </div>
            <div className="max-h-[90vh] overflow-y-auto p-5">{productForm}</div>
          </div>
        </div>
      )}
    </>
  );
}

function DataTable({ title, columns, rows }: { title: string; columns: string[]; rows: string[][] }) {
  const gridStyle = { gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` };
  return <section className="mt-8 border border-[#111]/15 bg-white"><div className="border-b border-[#111]/10 p-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e00000]">Operations</p><h2 className="mt-2 text-2xl font-black uppercase">{title}</h2></div><div className="overflow-x-auto"><div className="min-w-[620px]"><div className="grid gap-4 border-b border-[#111]/10 bg-[#f6f6f6] px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-[#888]" style={gridStyle}>{columns.map((column) => <span key={column}>{column}</span>)}</div>{rows.map((row) => <div key={row[0]} className="grid gap-4 border-b border-[#111]/10 px-5 py-5 text-sm last:border-0" style={gridStyle}>{row.map((cell, index) => <span key={`${row[0]}-${cell}`} className={index === row.length - 1 ? "font-bold text-[#e00000]" : ""}>{cell}</span>)}</div>)}</div></div></section>;
}

function OrdersTable({ orders, expandedOrderId, onExpand, onStatusChange }: { orders: AdminOrderSummary[]; expandedOrderId: string | null; onExpand: (id: string | null) => void; onStatusChange: (id: string, status: "CONFIRMED" | "CANCELLED") => void }) {
  return <section className="mt-8 border border-[#111]/15 bg-white"><div className="border-b border-[#111]/10 p-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e00000]">Operations</p><h2 className="mt-2 text-2xl font-black uppercase">Orders &amp; purchases</h2><p className="mt-2 text-sm text-[#888]">Select an order to view the customer, delivery, and item details.</p></div><div className="overflow-x-auto"><div className="min-w-[760px]"><div className="grid grid-cols-[1fr_1.4fr_1fr_1fr_1.5fr] gap-4 border-b border-[#111]/10 bg-[#f6f6f6] px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-[#888]"><span>Order</span><span>Customer</span><span>Total</span><span>Status</span><span>Decision</span></div>{orders.map((order) => <div key={order.id} className="border-b border-[#111]/10 last:border-0"><div className="grid grid-cols-[1fr_1.4fr_1fr_1fr_1.5fr] items-center gap-4 px-5 py-4 text-sm"><span className="flex flex-wrap items-center gap-2"><button onClick={() => onExpand(expandedOrderId === order.id ? null : order.id)} aria-expanded={expandedOrderId === order.id} className="text-left font-mono text-xs font-bold text-[#e00000] underline-offset-4 hover:underline">#{order.orderNumber}<span className="ml-2 font-sans text-[10px] text-[#888]">{expandedOrderId === order.id ? "Hide details" : "View details"}</span></button><a href={`/admin/orders/${order.id}/invoice`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase tracking-wider text-[#111] underline underline-offset-2 hover:text-[#e00000]">View invoice</a></span><span>{order.customerName}</span><span>PKR {order.total.toLocaleString()}</span><span className="text-[10px] font-bold uppercase tracking-wider text-[#e00000]">{order.status.charAt(0) + order.status.slice(1).toLowerCase()}</span><span className="flex gap-2">{order.status === "PENDING" ? <><button onClick={() => onStatusChange(order.id, "CONFIRMED")} className="bg-[#e00000] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white">Approve</button><button onClick={() => onStatusChange(order.id, "CANCELLED")} className="border border-[#111]/20 px-3 py-2 text-[10px] font-bold uppercase tracking-wider">Disapprove</button></> : <span className="text-xs text-[#888]">{formatOrderDate(order.createdAt)}</span>}</span></div>{expandedOrderId === order.id && <OrderDetails order={order} />}</div>)}</div></div></section>;
}

function OrderDetails({ order }: { order: AdminOrderSummary }) {
  return <div className="grid gap-6 border-t border-[#111]/10 bg-[#fafafa] px-5 py-6 lg:grid-cols-[1fr_1fr_1.2fr]"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#888]">Customer</p><p className="mt-2 font-bold">{order.customerName}</p><p className="text-sm text-[#555]">{order.customerPhone}</p><p className="text-sm text-[#555]">{order.customerEmail || "No email provided"}</p></div><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#888]">Deliver to</p><p className="mt-2 text-sm text-[#555]">{order.shippingAddress}</p>{order.shippingAddressLine2 && <p className="text-sm text-[#555]">{order.shippingAddressLine2}</p>}<p className="text-sm text-[#555]">{order.shippingCity}{order.shippingRegion ? `, ${order.shippingRegion}` : ""}{order.shippingPostalCode ? ` ${order.shippingPostalCode}` : ""}</p><p className="mt-2 text-xs font-bold uppercase tracking-wider text-[#888]">{order.paymentMethod} · {formatOrderDate(order.createdAt)}</p></div><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#888]">Items ordered</p><div className="mt-2 space-y-2">{order.items.map((item) => <div key={item.id} className="flex justify-between gap-4 text-sm"><span>{item.productName} <span className="text-[#888]">× {item.quantity}</span></span><span className="shrink-0 font-semibold">{order.currency} { (item.unitPrice * item.quantity).toLocaleString()}</span></div>)}</div><div className="mt-3 border-t border-[#111]/10 pt-3 text-xs text-[#555]"><div className="flex justify-between"><span>Subtotal</span><span>{order.currency} {order.subtotal.toLocaleString()}</span></div><div className="mt-1 flex justify-between"><span>Delivery</span><span>{order.deliveryFee ? `${order.currency} ${order.deliveryFee.toLocaleString()}` : "Free"}</span></div><div className="mt-2 flex justify-between font-bold text-[#111]"><span>Total</span><span>{order.currency} {order.total.toLocaleString()}</span></div></div></div></div>;
}
