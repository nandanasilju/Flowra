/**
 * Simple fixed-window rate limiter (in memory, per server instance).
 * Good enough for a single instance; use a shared store (e.g. Redis) when scaling out.
 */
import { HttpError } from "./api";

const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    return;
  }
  b.count++;
  if (b.count > limit) throw new HttpError(429, "Too many attempts. Please wait a minute and try again.");
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "local";
}
