import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;

  const body = await req.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.title       !== undefined) updates.title        = body.title.trim();
  if (body.role_id     !== undefined) updates.role_id      = body.role_id;
  if (body.category_id !== undefined) updates.category_id  = body.category_id || null;
  if (body.description !== undefined) updates.description  = body.description?.trim() || null;
  if (body.requirements !== undefined) updates.requirements = body.requirements?.trim() || null;
  if (body.salary_from !== undefined) updates.salary_from  = body.salary_from ? parseInt(body.salary_from, 10) : null;
  if (body.salary_to   !== undefined) updates.salary_to    = body.salary_to   ? parseInt(body.salary_to,   10) : null;
  if (body.status      !== undefined) {
    if (!["draft", "published"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.status = body.status;
  }

  const db = createServiceClient();
  const { error } = await db
    .from("apply_job_postings")
    .update(updates)
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;

  const db = createServiceClient();
  const { error } = await db
    .from("apply_job_postings")
    .delete()
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
