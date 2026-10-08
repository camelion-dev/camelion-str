"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Unable to sign in.");
      setLoading(false);
      return;
    }
    router.push("/admin");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080808] text-white lg:h-screen lg:overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/foradminbg.png')" }} />
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 flex min-h-screen flex-col px-6 py-4 md:px-10 md:py-5 lg:h-full lg:min-h-0">
        <header className="flex items-start justify-between">
          <div><Link href="/" className="inline-flex items-center" aria-label="Camelion home"><img src="/brand-logo.avif" alt="Camelion" className="h-8 w-auto object-contain" /></Link><p className="mt-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white/55">Operations portal</p></div>
          <span className="hidden text-[10px] font-bold uppercase tracking-[0.25em] text-white/40 md:block">Secure access / 01</span>
        </header>
        <div className="flex flex-1 items-center justify-between gap-8 py-1 lg:pl-0">
          <section className="hidden max-w-lg lg:block">
            <p className="mb-3 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.25em] text-white/60"><span className="h-px w-10 bg-[#ed0010]" />Camelion Store</p>
            <h2 className="text-[1.75rem] font-black uppercase leading-[0.9] tracking-[-0.05em] xl:text-4xl">Keep the<br /><span className="text-[#ed0010]">power</span><br />moving.</h2>
            <p className="mt-3 max-w-xs text-[11px] leading-4 text-white/60">Manage products, watch demand, and keep every Camelion order moving forward.</p>
          </section>
          <section className="mx-auto w-full max-w-[310px] min-w-0 overflow-hidden rounded-xl border border-white/15 bg-[#121010]/80 p-3 shadow-2xl backdrop-blur-xl sm:p-3.5 lg:mx-0 lg:mr-[4vw]">
            <p className="flex items-center gap-2.5 text-[9px] font-bold uppercase tracking-[0.25em] text-white/65"><span className="h-px w-6 bg-[#ed0010]" />Welcome back</p>
            <h1 className="mt-1.5 text-[1.75rem] font-black uppercase leading-none tracking-[-0.04em] sm:text-[1.9rem]">Admin<br />sign in</h1>
            <p className="mt-1.5 max-w-sm text-[11px] leading-4 text-white/55">Sign in to manage the Camelion catalogue and store operations.</p>
            <form onSubmit={submit} className="mt-3 grid gap-2">
              <label className="grid min-w-0 gap-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white/60">Email<div className="flex w-full min-w-0 items-center overflow-hidden rounded-md border border-white/20 bg-white/[0.04] px-2 transition-colors focus-within:border-white/55"><span className="mr-2 shrink-0 text-white/45">@</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" className="min-w-0 flex-1 bg-transparent py-1.5 text-[11px] font-normal normal-case tracking-normal text-white outline-none placeholder:text-white/35" /></div></label>
              <label className="grid min-w-0 gap-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white/60">Password<div className="flex w-full min-w-0 items-center overflow-hidden rounded-md border border-white/20 bg-white/[0.04] px-2 transition-colors focus-within:border-white/55"><span className="mr-2 shrink-0 text-white/45">●</span><input required type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="min-w-0 flex-1 bg-transparent py-1.5 text-[11px] font-normal normal-case tracking-normal text-white outline-none placeholder:text-white/35" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} className="flex min-h-11 min-w-11 shrink-0 items-center justify-center px-2 text-[10px] text-white/55 hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button></div></label>
              {error && <p role="alert" className="border border-[#ed0010]/40 bg-[#ed0010]/10 px-4 py-3 text-sm text-[#ff9da4]">{error}</p>}
              <button disabled={loading} className="mt-0.5 rounded-md bg-[#ed0010] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#ff1c2a] disabled:cursor-wait disabled:opacity-60">{loading ? "Signing in..." : "Sign in to portal  →"}</button>
            </form>
            <Link href="/" className="mt-3 inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-white/45 hover:text-white">← Back to store</Link>
          </section>
        </div>
        <footer className="flex items-center text-xs text-white/45"><span>Camelion Store · Admin access</span></footer>
      </div>
    </main>
  );
}
