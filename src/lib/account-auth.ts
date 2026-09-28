import { cookies } from "next/headers";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const ACCOUNT_SESSION_COOKIE = "camelion-account-session";
const SESSION_DAYS = 30;

type Account = { id: string; name: string | null; email: string | null; phone: string | null };

function headers() {
  if (!apiUrl || !serviceKey) throw new Error("Supabase server environment variables are not configured.");
  return { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
}

async function supabase(path: string, init: RequestInit = {}) {
  return fetch(`${apiUrl}/rest/v1/${path}`, { ...init, headers: { ...headers(), ...(init.headers || {}) }, cache: "no-store" });
}

export async function getAccountOverview(userId: string) {
  const [ordersResponse, favoritesResponse] = await Promise.all([
    supabase(`Order?userId=eq.${encodeURIComponent(userId)}&select=id,number,status,currency,total,createdAt,Address(line1,city,region,postalCode),OrderItem(productName,quantity,unitPrice)&order=createdAt.desc&limit=50`),
    supabase(`UserFavorite?userId=eq.${encodeURIComponent(userId)}&select=productId&order=createdAt.desc`),
  ]);
  if (!ordersResponse.ok || !favoritesResponse.ok) throw new Error("Unable to load account history.");
  const orders = await ordersResponse.json() as Array<Record<string, unknown>>;
  const latestAddress = orders[0]?.Address as Record<string, unknown> | null | undefined;
  return {
    orders,
    latestAddress: latestAddress ? {
      address: String(latestAddress.line1 || ""),
      city: String(latestAddress.city || ""),
      region: String(latestAddress.region || ""),
      postalCode: String(latestAddress.postalCode || ""),
    } : null,
    favoriteIds: (await favoritesResponse.json() as Array<{ productId: string }>).map((favorite) => favorite.productId),
  };
}

export async function addFavorite(userId: string, productId: string) {
  return supabase("UserFavorite", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates" }, body: JSON.stringify({ userId, productId }) });
}

export async function removeFavorite(userId: string, productId: string) {
  return supabase(`UserFavorite?userId=eq.${encodeURIComponent(userId)}&productId=eq.${encodeURIComponent(productId)}`, { method: "DELETE" });
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [, salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, "hex");
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}

function sessionHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAccountSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  const response = await supabase("Session", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ sessionToken: sessionHash(token), userId, expires }),
  });
  if (!response.ok) throw new Error("Unable to create account session.");
  const cookieStore = await cookies();
  cookieStore.set({ name: ACCOUNT_SESSION_COOKIE, value: token, httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_DAYS * 86400 });
}

export async function getCurrentAccount(): Promise<Account | null> {
  const token = (await cookies()).get(ACCOUNT_SESSION_COOKIE)?.value;
  if (!token) return null;
  const response = await supabase(`Session?sessionToken=eq.${encodeURIComponent(sessionHash(token))}&expires=gt.${encodeURIComponent(new Date().toISOString())}&select=userId,User(id,name,email,phone)`);
  if (!response.ok) return null;
  const rows = await response.json() as Array<{ User?: Account | null }>;
  return rows[0]?.User || null;
}

export async function clearAccountSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCOUNT_SESSION_COOKIE)?.value;
  if (token) await supabase(`Session?sessionToken=eq.${encodeURIComponent(sessionHash(token))}`, { method: "DELETE" });
  cookieStore.set({ name: ACCOUNT_SESSION_COOKIE, value: "", httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
}

export async function findAccount(identifier: string) {
  const encoded = encodeURIComponent(identifier);
  const filter = identifier.includes("@") ? `email=eq.${encoded}` : `phone=eq.${encoded}`;
  const response = await supabase(`User?${filter}&select=id,name,email,phone,passwordHash&limit=1`);
  if (!response.ok) return null;
  const rows = await response.json() as Array<Account & { passwordHash: string | null }>;
  return rows[0] || null;
}

export async function createCustomer(input: { name: string; email: string; phone: string; password: string }) {
  const response = await supabase("User", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ name: input.name, email: input.email, phone: input.phone, passwordHash: hashPassword(input.password), role: "CUSTOMER" }),
  });
  if (!response.ok) {
    const body = await response.text();
    if (body.includes("duplicate") || body.includes("unique")) throw new Error("An account with that email or phone already exists.");
    throw new Error("Unable to create account.");
  }
  const rows = await response.json() as Account[];
  return rows[0];
}
