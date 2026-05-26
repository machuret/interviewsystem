import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

const PAGE_SIZE = 50;

export async function GET(req: NextRequest) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;

  const { searchParams } = new URL(req.url);
  const role   = searchParams.get("role");
  const status = searchParams.get("status");
  const page   = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));

  const db = createServiceClient();

  // Resolve role slug → role_id at the DB level (2 small queries beats JS filtering)
  let sessionIds: string[] | null = null;
  if (role) {
    const { data: roleData } = await db
      .from("apply_roles")
      .select("id")
      .eq("slug", role)
      .single();

    if (!roleData) {
      return NextResponse.json({ data: [], count: 0, page, page_size: PAGE_SIZE });
    }

    const { data: sessions } = await db
      .from("apply_quiz_sessions")
      .select("id")
      .eq("role_id", roleData.id);

    sessionIds = (sessions ?? []).map((s) => s.id);
    if (sessionIds.length === 0) {
      return NextResponse.json({ data: [], count: 0, page, page_size: PAGE_SIZE });
    }
  }

  let query = db
    .from("apply_candidates")
    .select(
      `id, full_name, last_name, email, phone, location,
       age, sex, married, kids,
       device_type, device_brand, internet_provider,
       facebook_link, instagram_link,
       current_job_title, years_experience,
       previous_employers, skills_tools, software_used, task_description,
       salary_expectation_php, payment_methods,
       paypal_email, wise_email,
       cv_url, cv_type, differentiator,
       video_intro_url, practical_response, writing_sample,
       submitted_at, status,
       apply_quiz_sessions (
         id, score, passed, started_at,
         tab_switches, suspicious_answer_count,
         apply_roles ( name, slug )
       )`,
      { count: "exact" }
    )
    .order("submitted_at", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (status)     query = query.eq("status", status);
  if (sessionIds) query = query.in("session_id", sessionIds);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data ?? [], count: count ?? 0, page, page_size: PAGE_SIZE });
}
