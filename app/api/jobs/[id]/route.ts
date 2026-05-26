import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = createServiceClient();

  const { data, error } = await db
    .from("apply_job_postings")
    .select(`
      id, title, description, requirements,
      salary_from, salary_to, status, created_at,
      apply_roles ( id, name, slug ),
      apply_categories ( id, name, slug )
    `)
    .eq("id", params.id)
    .eq("status", "published")
    .single();

  if (error || !data) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  return NextResponse.json(data);
}
