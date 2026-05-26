import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;

  const db = createServiceClient();
  const { data, error } = await db
    .from("apply_candidate_notes")
    .select("id, note, created_at")
    .eq("candidate_id", params.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;

  const { note } = await req.json();
  if (!note?.trim()) return NextResponse.json({ error: "Note cannot be empty" }, { status: 400 });

  const db = createServiceClient();
  const { data, error } = await db
    .from("apply_candidate_notes")
    .insert({ candidate_id: params.id, note: note.trim() })
    .select("id, note, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
