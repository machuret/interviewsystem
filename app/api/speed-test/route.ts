import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

// Allocate once at module level — never re-allocate per request
const PAYLOAD = Buffer.alloc(512 * 1024, 0x78);

export async function GET(req: NextRequest) {
  // 20 speed-test requests per IP per minute (5 retries × 4 steps with margin)
  if (!checkRateLimit(`speed-test:${getClientIp(req)}`, 20, 60_000)) {
    return new NextResponse(null, { status: 429 });
  }

  return new NextResponse(PAYLOAD, {
    headers: {
      "Content-Type":   "application/octet-stream",
      "Content-Length": String(PAYLOAD.byteLength),
      "Cache-Control":  "no-store",
    },
  });
}
