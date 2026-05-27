import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;

  const { searchParams } = new URL(req.url);
  const role_id = searchParams.get("role_id") || null;
  const view    = searchParams.get("view") || "questions"; // "questions" | "overview"

  const db = createServiceClient();

  if (view === "overview") {
    // --- Daily applications last 14 days ---
    const since14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const [applicantsRes, sessionsRes] = await Promise.all([
      db.from("apply_applicants")
        .select("created_at, role_slug")
        .gte("created_at", since14),
      db.from("apply_quiz_sessions")
        .select("score, passed, started_at, role_id")
        .not("completed_at", "is", null),
    ]);

    const applicants  = applicantsRes.data ?? [];
    const sessions    = sessionsRes.data ?? [];

    // Build day buckets (last 14 days)
    const dayMap: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dayMap[key] = 0;
    }
    for (const a of applicants) {
      const key = (a.created_at as string).slice(0, 10);
      if (key in dayMap) dayMap[key]++;
    }
    const daily_applications = Object.entries(dayMap).map(([date, count]) => ({ date, count }));

    // Score distribution (0–10)
    const scoreDist: Record<number, number> = {};
    for (let i = 0; i <= 10; i++) scoreDist[i] = 0;
    for (const s of sessions) {
      if (s.score != null && s.score >= 0 && s.score <= 10) scoreDist[s.score]++;
    }
    const score_distribution = Object.entries(scoreDist).map(([score, count]) => ({
      score: Number(score), count,
    }));

    // Overall metrics
    const total_applications = applicants.length; // last 14 days
    const passed   = sessions.filter((s) => s.passed).length;
    const total_completed = sessions.length;
    const pass_rate = total_completed > 0 ? Math.round((passed / total_completed) * 100) : 0;
    const scores    = sessions.map((s) => s.score).filter((s): s is number => s != null);
    const avg_score = scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : null;

    return NextResponse.json({
      view: "overview",
      daily_applications,
      score_distribution,
      metrics: {
        total_applications,
        passed,
        total_completed,
        pass_rate,
        avg_score,
      },
    });
  }

  // --- Default: question error rates (existing behaviour) ---
  const { data: rows, error } = await db.rpc("question_analytics", {
    p_role_id: role_id,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!rows || rows.length === 0) return NextResponse.json({ questions: [] });

  const qIds = rows.map((r: { question_id: string }) => r.question_id);
  const { data: questions } = await db
    .from("apply_questions")
    .select("id, question_text, apply_roles(name, slug)")
    .in("id", qIds);

  const qMap = new Map((questions ?? []).map((q) => [q.id, q]));

  const result = rows
    .map((r: { question_id: string; total: number; correct: number }) => {
      const q = qMap.get(r.question_id);
      const error_rate = r.total > 0
        ? Math.round(((r.total - r.correct) / r.total) * 100)
        : 0;
      return {
        id:            r.question_id,
        question_text: q?.question_text ?? "(deleted)",
        role:          (q as any)?.apply_roles ?? null,
        correct:       r.correct,
        total:         r.total,
        error_rate,
      };
    })
    .sort((a: { error_rate: number }, b: { error_rate: number }) => b.error_rate - a.error_rate);

  return NextResponse.json({ questions: result });
}
