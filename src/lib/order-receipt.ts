import { createHmac, createHash, timingSafeEqual } from "node:crypto";

export const ORDER_RECEIPT_COOKIE = "camelion-order-receipt";
export const ORDER_RECEIPT_SECONDS = 60 * 60 * 24 * 30;

function signingSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32 || /replace[-_]with/i.test(secret)) return null;
  return secret;
}

export function isOrderReceiptSigningConfigured() {
  return Boolean(signingSecret());
}

function signature(orderId: string, expiresAt: string, secret: string) {
  return createHmac("sha256", secret).update(`order-receipt:${orderId}:${expiresAt}`).digest("hex");
}

export function createOrderReceiptToken(orderId: string) {
  const secret = signingSecret();
  if (!secret) throw new Error("Order receipt signing is not configured.");
  const expiresAt = String(Date.now() + ORDER_RECEIPT_SECONDS * 1000);
  return `${expiresAt}.${signature(orderId, expiresAt, secret)}`;
}

export function verifyOrderReceiptToken(orderId: string, token: string | undefined) {
  if (!token) return false;
  const [expiresAt, suppliedSignature, ...extra] = token.split(".");
  if (extra.length || !/^\d{13}$/.test(expiresAt) || !/^[a-f0-9]{64}$/.test(suppliedSignature)) return false;
  if (Number(expiresAt) <= Date.now()) return false;
  const secret = signingSecret();
  if (!secret) return false;
  const expected = signature(orderId, expiresAt, secret);
  const suppliedHash = createHash("sha256").update(suppliedSignature).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(suppliedHash, expectedHash);
}