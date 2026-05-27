import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { buildApplicantFields } from "@/lib/applicant-fields";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  const fields = buildApplicantFields(body);
  // Include email if provided (normalised)
  const updates: Record<string, unknown> = Object.fromEntries(
    Object.entries(fields).filter(([, v]) => v !== undefined)
  );
  if (typeof body.email === "string" && body.email.trim()) {
    updates.email = body.email.trim().toLowerCase();
  }
  // Disqualification flag (Big No screening)
  if (body.disqualified === true) {
    updates.disqualified_at = new Date().toISOString();
    if (typeof body.disqualification_reason === "string") {
      updates.disqualification_reason = body.disqualification_reason;
    }
  }

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
