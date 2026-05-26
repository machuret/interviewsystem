import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (typeof body.active            === "boolean") updates.active = body.active;
  if (typeof body.category_id       !== "undefined") updates.category_id = body.category_id || null;
  if (typeof body.question_text     === "string") updates.question_text = body.question_text.trim();
  if (Array.isArray(body.options) && body.options.length === 4) updates.options = body.options;
  if (typeof body.correct_answer_index === "number") updates.correct_answer_index = body.correct_answer_index;

  const db = createServiceClient();
  const { data, error } = await db
    .from("apply_questions")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;

  const db = createServiceClient();
  const { error } = await db.from("apply_questions").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
