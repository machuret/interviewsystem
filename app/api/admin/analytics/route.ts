import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

function checkAuth(req: NextRequest) {
  return req.cookies.get("admin_auth")?.value === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const role_id = searchParams.get("role_id");

  const db = createServiceClient();

  // Fetch completed sessions with correct_flags and question_ids
  let q = db
    .from("apply_quiz_sessions")
    .select("question_ids, correct_flags, role_id")
    .not("completed_at", "is", null)
    .not("correct_flags", "is", null);

  if (role_id) q = (q as any).eq("role_id", role_id);

  const { data: sessions, error: sessErr } = await q;
  if (sessErr) return NextResponse.json({ error: sessErr.message }, { status: 500 });

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ questions: [] });
  }

  // Aggregate per question_id
  const stats: Record<string, { correct: number; total: number }> = {};
  for (const s of sessions) {
    const ids: string[]   = s.question_ids ?? [];
    const flags: boolean[] = s.correct_flags ?? [];
    for (let i = 0; i < ids.length; i++) {
      const qid = ids[i];
      if (!stats[qid]) stats[qid] = { correct: 0, total: 0 };
      stats[qid].total++;
      if (flags[i]) stats[qid].correct++;
    }
  }

  const qIds = Object.keys(stats);
  if (qIds.length === 0) return NextResponse.json({ questions: [] });

  // Fetch question text
  const { data: questions } = await db
    .from("apply_questions")
    .select("id, question_text, apply_roles(name, slug)")
    .in("id", qIds);

  const result = (questions ?? []).map((q) => {
    const s = stats[q.id] ?? { correct: 0, total: 0 };
    const error_rate = s.total > 0 ? Math.round(((s.total - s.correct) / s.total) * 100) : 0;
    return {
      id: q.id,
      question_text: q.question_text,
      role: (q as any).apply_roles,
      correct: s.correct,
      total: s.total,
      error_rate,
    };
  }).sort((a, b) => b.error_rate - a.error_rate);

  return NextResponse.json({ questions: result });
}
