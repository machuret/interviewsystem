import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { buildApplicantFields } from "@/lib/applicant-fields";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const DEDUP_DAYS = 30;

export async function POST(req: NextRequest) {
  if (!checkRateLimit(`applicants:${getClientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  const body = await req.json();
  const { role_slug, first_name, email } = body;

  if (!role_slug || !first_name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "role_slug, first_name, and email required" }, { status: 400 });
  }

  const db = createServiceClient();
  const normalizedEmail = (email as string).trim().toLowerCase();

  const since = new Date(Date.now() - DEDUP_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: recent } = await db
    .from("apply_applicants")
    .select("id")
    .eq("email", normalizedEmail)
    .gte("created_at", since)
    .limit(1)
    .maybeSingle();

  if (recent) {
    return NextResponse.json(
      { error: "An application with this email was submitted recently. Please wait 30 days before applying again." },
      { status: 429 }
    );
  }

  const { data, error } = await db
    .from("apply_applicants")
    .insert({
      role_slug,
      first_name: (first_name as string).trim(),
      email: normalizedEmail,
      ...buildApplicantFields(body),
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
