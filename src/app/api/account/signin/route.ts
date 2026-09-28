import { NextResponse } from "next/server";
import { createAccountSession, findAccount, verifyPassword } from "@/lib/account-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { readJsonBody, RequestBodyTooLargeError } from "@/lib/request-body";

export async function POST(request: Request) {
  try {
    const limit = await enforceRateLimit(request, "account-signin", 10, 900);
    if (!limit.allowed) return NextResponse.json({ error: "Too many sign-in attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
    const body = await readJsonBody<{ identifier?: string; password?: string }>(request, 4096);
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    const identifier = body.identifier?.trim();
    if (!identifier || !body.password) return NextResponse.json({ error: "Email or phone and password are required." }, { status: 400 });
    if (identifier.length > 254 || body.password.length > 1024) return NextResponse.json({ error: "Sign-in details are invalid." }, { status: 400 });
    const account = await findAccount(identifier);
    if (!account?.passwordHash || !verifyPassword(body.password, account.passwordHash)) return NextResponse.json({ error: "The sign-in details are incorrect." }, { status: 401 });
    await createAccountSession(account.id);
    return NextResponse.json({ user: { id: account.id, name: account.name, email: account.email, phone: account.phone } });
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    return NextResponse.json({ error: "Unable to sign in right now." }, { status: 400 });
  }
}
