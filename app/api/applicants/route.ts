import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

const DEDUP_DAYS = 30;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { role_slug, first_name, email } = body;

  if (!role_slug || !first_name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "role_slug, first_name, and email required" }, { status: 400 });
  }

  const db = createServiceClient();
  const normalizedEmail = email.trim().toLowerCase();

  // Email 30-day dedup check
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
      first_name: first_name.trim(),
      email: normalizedEmail,
      ...buildFields(body),
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}

function buildFields(body: Record<string, unknown>) {
  const str = (k: string) => (typeof body[k] === "string" && body[k] ? (body[k] as string).trim() : null);
  const bool = (k: string) => (body[k] === "yes" ? true : body[k] === "no" ? false : null);
  const num = (k: string) => (body[k] ? parseInt(body[k] as string, 10) || null : null);

  return {
    last_name:         str("last_name"),
    facebook_link:     str("facebook_link"),
    instagram_link:    str("instagram_link"),
    phone:             str("phone"),
    age:               num("age"),
    location:          str("location"),
    sex:               str("sex"),
    married:           bool("married"),
    kids:              bool("kids"),
    device_type:       str("device_type"),
    device_brand:      str("device_brand"),
    internet_provider: str("internet_provider"),
    current_job_title:  str("current_job_title"),
    years_experience:   str("years_experience"),
    previous_employers: str("previous_employers"),
    skills_tools:       str("skills_tools"),
    software_used:      str("software_used"),
    task_description:   str("task_description"),
  };
}
