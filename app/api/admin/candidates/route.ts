import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

function checkAuth(req: NextRequest) {
  const cookie = req.cookies.get("admin_auth");
  return cookie?.value === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const role   = searchParams.get("role");
  const status = searchParams.get("status");

  const db = createServiceClient();

  let query = db
    .from("apply_candidates")
    .select(`
      id, full_name, email, phone, location,
      salary_expectation_php, payment_methods,
      paypal_email, wise_email,
      cv_url, cv_type, differentiator,
      submitted_at, status,
      apply_quiz_sessions (
        id, score, passed, started_at,
        apply_roles ( name, slug )
      )
    `)
    .order("submitted_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Filter by role slug if requested (nested filter not supported in supabase-js without RPC)
  const filtered = role
    ? data?.filter(
        (c: any) => c.apply_quiz_sessions?.apply_roles?.slug === role
      )
    : data;

  return NextResponse.json(filtered);
}
