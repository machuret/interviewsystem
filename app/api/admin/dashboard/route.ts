import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

function checkAuth(req: NextRequest) {
  return req.cookies.get("admin_auth")?.value === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServiceClient();

  const [applicantsRes, sessionsRes, candidatesRes] = await Promise.all([
    db.from("apply_applicants").select("id, role_slug, created_at"),
    db.from("apply_quiz_sessions").select("id, role_id, score, passed, started_at, apply_roles(slug, name)"),
    db.from("apply_candidates").select("id, status, submitted_at, apply_quiz_sessions(apply_roles(slug, name))"),
  ]);

  const applicants  = applicantsRes.data  ?? [];
  const sessions    = sessionsRes.data    ?? [];
  const candidates  = candidatesRes.data  ?? [];

  // Funnel
  const funnel = {
    started_form: applicants.length,
    took_quiz:    sessions.length,
    passed_quiz:  sessions.filter((s) => s.passed).length,
    applied:      candidates.length,
  };

  // Per-role breakdown
  const roleMap: Record<string, { name: string; started_form: number; took_quiz: number; passed: number; applied: number; total_score: number; scored_count: number }> = {};

  const ensureRole = (slug: string, name: string) => {
    if (!roleMap[slug]) roleMap[slug] = { name, started_form: 0, took_quiz: 0, passed: 0, applied: 0, total_score: 0, scored_count: 0 };
  };

  for (const a of applicants) {
    if (a.role_slug) {
      ensureRole(a.role_slug, a.role_slug);
      roleMap[a.role_slug].started_form++;
    }
  }

  for (const s of sessions) {
    const role = (s as any).apply_roles;
    if (role?.slug) {
      ensureRole(role.slug, role.name);
      roleMap[role.slug].took_quiz++;
      if (s.passed) roleMap[role.slug].passed++;
      if (s.score != null) {
        roleMap[role.slug].total_score += s.score;
        roleMap[role.slug].scored_count++;
      }
    }
  }

  for (const c of candidates) {
    const role = (c as any).apply_quiz_sessions?.apply_roles;
    if (role?.slug) {
      ensureRole(role.slug, role.name);
      roleMap[role.slug].applied++;
    }
  }

  const roles = Object.entries(roleMap).map(([slug, d]) => ({
    slug,
    name: d.name,
    started_form: d.started_form,
    took_quiz: d.took_quiz,
    passed: d.passed,
    applied: d.applied,
    avg_score: d.scored_count > 0 ? Math.round((d.total_score / d.scored_count) * 10) / 10 : null,
  }));

  // Candidates by status
  const statusCounts: Record<string, number> = { new: 0, shortlisted: 0, interviewed: 0, rejected: 0 };
  for (const c of candidates) {
    const s = (c as any).status ?? "new";
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
  }

  // Applications per day (last 14 days)
  const daily: Record<string, number> = {};
  for (const c of candidates) {
    const day = c.submitted_at?.slice(0, 10);
    if (day) daily[day] = (daily[day] ?? 0) + 1;
  }

  return NextResponse.json({ funnel, roles, status_counts: statusCounts, daily_applications: daily });
}
