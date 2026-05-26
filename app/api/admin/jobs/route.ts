import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;

  const db = createServiceClient();
  const { data, error } = await db
    .from("apply_job_postings")
    .select(`
      id, title, description, requirements,
      salary_from, salary_to, status, created_at, updated_at,
      role_id, category_id,
      apply_roles ( id, name, slug ),
      apply_categories ( id, name, slug )
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;

  const body = await req.json();
  const { role_id, category_id, title, description, requirements, salary_from, salary_to, status } = body;

  if (!role_id || !title?.trim()) {
    return NextResponse.json({ error: "role_id and title are required" }, { status: 400 });
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("apply_job_postings")
    .insert({
      role_id,
      category_id: category_id || null,
      title: title.trim(),
      description: description?.trim() || null,
      requirements: requirements?.trim() || null,
      salary_from: salary_from ? parseInt(salary_from, 10) : null,
      salary_to:   salary_to   ? parseInt(salary_to,   10) : null,
      status: status ?? "draft",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
