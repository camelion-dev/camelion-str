"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

type User = { id: string; name: string | null; email: string | null; phone: string | null };
type AccountOrder = { id: string; number: string; status: string; currency: string; total: number; createdAt: string; OrderItem?: Array<{ productName: string; quantity: number }> };
type AccountData = { user: User | null; orders?: AccountOrder[]; favoriteIds?: string[] };

export default function AccountPage() {
  const [data, setData] = useState<AccountData | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", identifier: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadAccount = () => fetch("/api/account/me").then((response) => response.json()).then((result: AccountData) => setData(result));
  useEffect(() => { void loadAccount(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const endpoint = mode === "signin" ? "/api/account/signin" : "/api/account/signup";
    const body = mode === "signin" ? { identifier: form.identifier, password: form.password } : { name: form.name, email: form.email, phone: form.phone, password: form.password };
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Unable to continue."); setLoading(false); return; }
    window.location.reload();
  }

  async function signOut() {
    await fetch("/api/account/logout", { method: "POST" });
    setData({ user: null });
  }

  if (data?.user) {
    return (
      <main className="section-shell py-12 md:py-20">
        <div className="flex flex-col justify-between gap-5 border-b border-[var(--border)] pb-8 sm:flex-row sm:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--red)]">Your account</p><h1 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] md:text-6xl">Welcome, {data.user.name}</h1><p className="mt-3 text-sm text-[var(--body-gray)]">{data.user.email} · {data.user.phone}</p></div>
          <button onClick={signOut} className="w-fit border border-[var(--foreground)] px-5 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[var(--foreground)] hover:text-white">Sign out</button>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <section className="border border-[var(--border)] p-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Purchase history</h2>
            {data.orders?.length ? <div className="mt-5 divide-y divide-[var(--border)]">{data.orders.map((order) => <div key={order.id} className="py-4 first:pt-0"><div className="flex justify-between gap-3"><span className="flex items-center gap-2"><span className="font-mono text-xs">#{order.number}</span><a href={`/account/orders/${order.id}/invoice`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase tracking-wider text-[var(--red)] underline underline-offset-2">View invoice</a></span><span className="text-xs font-bold uppercase text-[var(--red)]">{order.status}</span></div><p className="mt-2 text-sm text-[var(--body-gray)]">{order.OrderItem?.map((item) => `${item.productName} × ${item.quantity}`).join(", ")}</p><p className="mt-2 text-sm font-bold">{order.currency} {order.total.toLocaleString()}</p></div>)}</div> : <p className="mt-5 text-sm text-[var(--body-gray)]">Your previous purchases will appear here.</p>}
          </section>
          <section className="border border-[var(--border)] p-6"><h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Saved favorites</h2><p className="mt-5 text-4xl font-black">{data.favoriteIds?.length || 0}</p><p className="mt-2 text-sm text-[var(--body-gray)]">Products saved to your account.</p><Link href="/favorites" className="mt-6 inline-block bg-[var(--red)] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-[var(--red-dark)]">View favorites</Link></section>
        </div>
      </main>
    );
  }

  return <main className="section-shell py-12 md:py-20"><div className="mx-auto max-w-xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--red)]">Optional account</p><h1 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em]">{mode === "signin" ? "Sign in" : "Create account"}</h1><p className="mt-4 text-sm leading-6 text-[var(--body-gray)]">Continue as a guest at checkout, or sign in to keep your purchase history and favorites together.</p><div className="mt-8 flex border-b border-[var(--border)]"><button onClick={() => setMode("signin")} className={`px-4 py-3 text-xs font-bold uppercase tracking-wider ${mode === "signin" ? "border-b-2 border-[var(--red)] text-[var(--red)]" : "text-[var(--muted)]"}`}>Sign in</button><button onClick={() => setMode("signup")} className={`px-4 py-3 text-xs font-bold uppercase tracking-wider ${mode === "signup" ? "border-b-2 border-[var(--red)] text-[var(--red)]" : "text-[var(--muted)]"}`}>Sign up</button></div><form onSubmit={submit} className="mt-8 grid gap-4">{mode === "signup" && <><label className="grid gap-2 text-sm font-medium">Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="border border-[var(--border)] px-3 py-3" /></label><label className="grid gap-2 text-sm font-medium">Phone number<input required type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="border border-[var(--border)] px-3 py-3" /></label><label className="grid gap-2 text-sm font-medium">Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="border border-[var(--border)] px-3 py-3" /></label></>}{mode === "signin" && <label className="grid gap-2 text-sm font-medium">Email or phone number<input required value={form.identifier} onChange={(event) => setForm({ ...form, identifier: event.target.value })} className="border border-[var(--border)] px-3 py-3" /></label>}<label className="grid gap-2 text-sm font-medium">Password<input required type="password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="border border-[var(--border)] px-3 py-3" /></label>{error && <p role="alert" className="bg-[#fff1f1] px-4 py-3 text-sm text-[var(--red)]">{error}</p>}<button disabled={loading} className="bg-[var(--red)] px-5 py-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-[var(--red-dark)]">{loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}</button></form></div></main>;
}
