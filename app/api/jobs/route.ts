import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = createServiceClient();

  const { data, error } = await db
    .from("apply_job_postings")
    .select(`
      id, title, description, requirements,
      salary_from, salary_to, status, created_at,
      apply_roles ( id, name, slug ),
      apply_categories ( id, name, slug )
    `)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
