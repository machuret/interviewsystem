import { NextResponse } from "next/server";

// Returns 512 KB of random-ish data for client-side download speed measurement
export async function GET() {
  const size = 512 * 1024;
  const buf = Buffer.alloc(size, "x");
  return new NextResponse(buf, {
    headers: {
      "Content-Type":  "application/octet-stream",
      "Content-Length": String(size),
      "Cache-Control":  "no-store",
    },
  });
}
