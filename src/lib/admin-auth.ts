import { cookies } from "next/headers";
import { createHmac, createHash, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "camelion-admin-session";
const SESSION_SECONDS = 60 * 60 * 8;
const LOCAL_SESSION_SECRET = "camelion-local-development-signing-secret-only";

function adminConfig() {
  const isProduction = process.env.NODE_ENV === "production";
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET || (!isProduction ? LOCAL_SESSION_SECRET : undefined);
  if (!email || !password) return null;
  if (isProduction && (password.length < 16 || /replace[-_]with/i.test(password))) return null;
  if (!secret || Buffer.byteLength(secret) < 32 || (isProduction && /replace[-_]with/i.test(secret))) return null;
  return { email, password, secret };
}

function matches(value: string, expected: string) {
  const valueHash = createHash("sha256").update(value).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(valueHash, expectedHash);
}

export function verifyAdminCredentials(email: unknown, password: unknown) {
  const config = adminConfig();
  if (!config || typeof email !== "string" || typeof password !== "string") return false;
  return matches(email.trim().toLowerCase(), config.email) && matches(password, config.password);
}

function sign(expiresAt: string, secret: string) {
  return createHmac("sha256", secret).update(expiresAt).digest("hex");
}

export async function createAdminSession() {
  const config = adminConfig();
  if (!config) throw new Error("Admin authentication is not configured.");
  const expiresAt = String(Date.now() + SESSION_SECONDS * 1000);
  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_SESSION_COOKIE,
    value: `${expiresAt}.${sign(expiresAt, config.secret)}`,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function isAdminAuthenticated() {
  const config = adminConfig();
  if (!config) return false;
  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!value) return false;
  const [expiresAt, signature, ...extra] = value.split(".");
  if (extra.length || !/^\d{13}$/.test(expiresAt) || !/^[a-f0-9]{64}$/.test(signature)) return false;
  if (Number(expiresAt) <= Date.now()) return false;
  return matches(signature, sign(expiresAt, config.secret));
}
