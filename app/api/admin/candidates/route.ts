import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

const PAGE_SIZE = 50;

const EMPTY = (page: number) =>
  NextResponse.json({ data: [], count: 0, page, page_size: PAGE_SIZE });

export async function GET(req: NextRequest) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;

  const { searchParams } = new URL(req.url);
  const role        = searchParams.get("role");
  const status      = searchParams.get("status");
  const search      = searchParams.get("search")?.trim() ?? "";
  const minScore    = parseInt(searchParams.get("min_score") ?? "0", 10);
  const days        = parseInt(searchParams.get("days") ?? "0", 10);
  const starredOnly = searchParams.get("starred") === "1";
  const page        = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));

  const db = createServiceClient();

  // Build allowed session_id set incrementally from role + score filters
  let allowedSessionIds: string[] | null = null;

  if (role) {
    const { data: roleData } = await db
      .from("apply_roles")
      .select("id")
      .eq("slug", role)
      .single();
    if (!roleData) return EMPTY(page);

    const { data: sessions } = await db
      .from("apply_quiz_sessions")
      .select("id")
      .eq("role_id", roleData.id);
    const ids = (sessions ?? []).map((s) => s.id);
    if (!ids.length) return EMPTY(page);
    allowedSessionIds = ids;
  }

  if (minScore > 0) {
    let q = db.from("apply_quiz_sessions").select("id").gte("score", minScore);
    if (allowedSessionIds) q = q.in("id", allowedSessionIds);
    const { data: scored } = await q;
    const ids = (scored ?? []).map((s) => s.id);
    if (!ids.length) return EMPTY(page);
    allowedSessionIds = ids;
  }

  const since = days > 0
    ? new Date(Date.now() - days * 86_400_000).toISOString()
    : null;

  // Try with migration 008 columns first
  {
    let q = db
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
         submitted_at, status, starred, rejection_reason,
         apply_quiz_sessions (
           id, score, passed, started_at,
           tab_switches, suspicious_answer_count,
           apply_roles ( name, slug )
         )`,
        { count: "exact" }
      )
      .order("submitted_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (status)            q = q.eq("status", status);
    if (starredOnly)       q = q.eq("starred", true);
    if (allowedSessionIds) q = q.in("session_id", allowedSessionIds);
    if (since)             q = q.gte("submitted_at", since);
    if (search)            q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);

    const { data, error, count } = await q;

    if (!error) {
      return NextResponse.json({ data: data ?? [], count: count ?? 0, page, page_size: PAGE_SIZE });
    }

    // Column not found — migration 008 not applied, fall through to legacy query
    if (error.code !== "42703") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Fallback without starred / rejection_reason
  {
    let q = db
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

    if (status)            q = q.eq("status", status);
    if (allowedSessionIds) q = q.in("session_id", allowedSessionIds);
    if (since)             q = q.gte("submitted_at", since);
    if (search)            q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);

    const { data, error, count } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({
      data: data ?? [],
      count: count ?? 0,
      page,
      page_size: PAGE_SIZE,
      migration_needed: true,
    });
  }
}
