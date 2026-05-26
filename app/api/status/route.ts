import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  // 10 lookups per IP per minute — prevents email enumeration at scale
  if (!checkRateLimit(`status:${getClientIp(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const email = (searchParams.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("apply_candidates")
    .select(`
      id, status, submitted_at,
      apply_quiz_sessions (
        score,
        apply_roles ( name, slug )
      )
    `)
    .eq("email", email)
    .order("submitted_at", { ascending: false })
    .limit(5);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ applications: data ?? [] });
}
