import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

const VALID_STATUSES = ["new", "shortlisted", "interviewed", "rejected"];

export async function POST(req: NextRequest) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;

  const { ids, status, rejection_reason } = await req.json();

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No candidates selected" }, { status: 400 });
  }
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { status };
  if (status === "rejected" && rejection_reason) {
    updates.rejection_reason = rejection_reason;
  }

  const db = createServiceClient();
  const { error } = await db
    .from("apply_candidates")
    .update(updates)
    .in("id", ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, updated: ids.length });
}
