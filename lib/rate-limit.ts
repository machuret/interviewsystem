import { NextRequest } from "next/server";

// In-process store — works for single-instance dev/preview.
// For production Vercel (multiple instances), replace with @upstash/ratelimit + Vercel KV:
//   import { Ratelimit } from "@upstash/ratelimit";
//   import { kv } from "@vercel/kv";
//   const limiter = new Ratelimit({ redis: kv, limiter: Ratelimit.slidingWindow(10, "1 m") });

type Entry = { count: number; reset: number };
const store = new Map<string, Entry>();

export function checkRateLimit(key: string, max: number, windowMs = 60_000): boolean {
  const now   = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    // Purge stale entries to prevent memory growth
    if (store.size > 5_000) {
      store.forEach((v, k) => { if (now > v.reset) store.delete(k); });
    }
    return true;
  }

  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
