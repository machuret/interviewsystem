import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

function buildFields(body: Record<string, unknown>) {
  const str = (k: string) => (typeof body[k] === "string" && body[k] ? (body[k] as string).trim() : null);
  const bool = (k: string) => (body[k] === "yes" ? true : body[k] === "no" ? false : null);
  const num = (k: string) => (body[k] ? parseInt(body[k] as string, 10) || null : null);

  return {
    first_name:        str("first_name"),
    last_name:         str("last_name"),
    email:             typeof body["email"] === "string" ? body["email"].trim().toLowerCase() : undefined,
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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const updates = Object.fromEntries(
    Object.entries(buildFields(body)).filter(([, v]) => v !== undefined)
  );

  const db = createServiceClient();
  const { data, error } = await db
    .from("apply_applicants")
    .update(updates)
    .eq("id", params.id)
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
