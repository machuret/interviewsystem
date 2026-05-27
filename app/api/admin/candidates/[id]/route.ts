import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";
import { sendShortlistEmail, sendRejectionEmail } from "@/lib/email";

const VALID_STATUSES = ["new", "shortlisted", "interviewed", "rejected"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.status = body.status;
    if (body.status === "rejected" && body.rejection_reason) {
      updates.rejection_reason = body.rejection_reason;
    }
  }

  if (body.starred !== undefined) {
    updates.starred = Boolean(body.starred);
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const db = createServiceClient();
  const { error } = await db
    .from("apply_candidates")
    .update(updates)
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send status-transition emails (fire-and-forget)
  if (body.status === "shortlisted" || body.status === "rejected") {
    const { data: c } = await db
      .from("apply_candidates")
      .select("email, full_name, apply_quiz_sessions( apply_roles( name ) )")
      .eq("id", params.id)
      .single();
    if (c?.email) {
      const firstName = (c.full_name ?? "there").split(" ")[0];
      const roleName =
        (c as any).apply_quiz_sessions?.apply_roles?.name ?? "the role";
      if (body.status === "shortlisted") {
        sendShortlistEmail(c.email, firstName, roleName).catch(() => {});
      } else {
        sendRejectionEmail(c.email, firstName, roleName, body.rejection_reason ?? null).catch(() => {});
      }
    }
  }

  return NextResponse.json({ success: true });
}
