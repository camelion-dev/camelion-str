import { NextResponse } from "next/server";
import { createAccountSession, createCustomer } from "@/lib/account-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { readJsonBody, RequestBodyTooLargeError } from "@/lib/request-body";

export async function POST(request: Request) {
  try {
    const limit = await enforceRateLimit(request, "account-signup", 5, 3600);
    if (!limit.allowed) return NextResponse.json({ error: "Too many account attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
    const body = await readJsonBody<{ name?: string; email?: string; phone?: string; password?: string }>(request, 8192);
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const phone = body.phone?.trim();
    const password = body.password || "";
    if (!name || !email || !phone || password.length < 12) return NextResponse.json({ error: "Name, email, phone, and a password of at least 12 characters are required." }, { status: 400 });
    if (name.length > 120 || email.length > 254 || phone.length > 40 || password.length > 1024) return NextResponse.json({ error: "Account details are too long." }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (phone.replace(/\D/g, "").length < 10) return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
    const account = await createCustomer({ name, email, phone, password });
    await createAccountSession(account.id);
    return NextResponse.json({ user: { id: account.id, name: account.name, email: account.email, phone: account.phone } }, { status: 201 });
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    return NextResponse.json({ error: "Unable to create account right now." }, { status: 400 });
  }
}
