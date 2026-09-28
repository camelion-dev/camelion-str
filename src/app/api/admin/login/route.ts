import { NextResponse } from "next/server";
import { clearAdminSession, createAdminSession, verifyAdminCredentials } from "@/lib/admin-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { readJsonBody, RequestBodyTooLargeError } from "@/lib/request-body";

export async function POST(request: Request) {
  let limit: { allowed: boolean; retryAfter: number };
  try {
    limit = await enforceRateLimit(request, "admin-login", 5, 900);
  } catch {
    return NextResponse.json({ error: "Sign-in is temporarily unavailable." }, { status: 503 });
  }
  if (!limit.allowed) return NextResponse.json({ error: "Too many sign-in attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });

  let body: { email?: unknown; password?: unknown };
  try {
    body = await readJsonBody(request, 4096);
  } catch (error) {
    return NextResponse.json({ error: error instanceof RequestBodyTooLargeError ? "Request is too large." : "Invalid request." }, { status: error instanceof RequestBodyTooLargeError ? 413 : 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  if (!verifyAdminCredentials(body.email, body.password)) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  await createAdminSession();
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  await clearAdminSession();
  return NextResponse.json({ success: true });
}
