import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;

  const { searchParams } = new URL(req.url);
  const role_id = searchParams.get("role_id") || null;

  const db = createServiceClient();

  // Aggregation done entirely in Postgres via RPC (migration 007)
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
