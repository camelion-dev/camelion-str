import { createHash } from "node:crypto";

const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function enforceRateLimit(request: Request, scope: string, maxAttempts: number, windowSeconds: number) {
  if (!apiUrl || !serviceKey) throw new Error("Supabase server environment variables are not configured.");
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientAddress = forwardedFor?.split(",").at(-1)?.trim() || request.headers.get("x-real-ip") || "unknown";
  const key = createHash("sha256").update(`${scope}:${clientAddress}`).digest("hex");
  const response = await fetch(`${apiUrl}/rest/v1/rpc/consume_rate_limit`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ payload: { key, maxAttempts, windowSeconds } }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Rate-limit service is unavailable.");
  return await response.json() as { allowed: boolean; retryAfter: number };
}