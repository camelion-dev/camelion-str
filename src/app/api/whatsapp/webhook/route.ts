import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { processWhatsAppOrderReply } from "@/lib/orders";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp-provider";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY_BYTES = 16 * 1024;
const replyPattern = /^\s*(CONFIRMED|CANCELLED)\s+(CM-\d{6}-[A-Z0-9]{6})\s*$/i;

type WhatsAppWebhookBody = {
  event?: unknown;
  id?: unknown;
  from?: unknown;
  group?: unknown;
  type?: unknown;
  text?: unknown;
};

class WebhookBodyTooLargeError extends Error {}

async function readRawBody(request: Request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    throw new WebhookBodyTooLargeError();
  }
  if (!request.body) return null;

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new WebhookBodyTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

function hasValidSignature(body: Uint8Array, supplied: string | null, secret: string) {
  const match = supplied?.trim().match(/^sha256=([a-f0-9]{64})$/i);
  if (!match) return false;
  const expected = createHmac("sha256", secret).update(body).digest();
  const actual = Buffer.from(match[1], "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function POST(request: Request) {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET?.trim();
  if (!secret || Buffer.byteLength(secret) < 32) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  let rawBody: Uint8Array | null;
  try {
    rawBody = await readRawBody(request);
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: error instanceof WebhookBodyTooLargeError ? 413 : 400 });
  }
  if (!rawBody) return NextResponse.json({ ok: false }, { status: 400 });
  if (!hasValidSignature(rawBody, request.headers.get("x-webhook-signature"), secret)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let body: WhatsAppWebhookBody;
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(rawBody));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    body = parsed as WhatsAppWebhookBody;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (body.event === "test") return NextResponse.json({ ok: true });
  if (body.event !== "message" || body.type !== "text" || typeof body.text !== "string" || body.group) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const match = body.text.match(replyPattern);
  const senderPhone = typeof body.from === "string" ? normalizeWhatsAppPhone(body.from) : null;
  if (!match || !senderPhone || typeof body.id !== "string" || !body.id.trim() || body.id.length > 200) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    await processWhatsAppOrderReply({
      eventId: body.id,
      orderNumber: match[2].toUpperCase(),
      senderPhone,
      action: match[1].toUpperCase() as "CONFIRMED" | "CANCELLED",
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}