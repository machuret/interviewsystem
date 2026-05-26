import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;

  const db = createServiceClient();

  // Single SQL call — all aggregation done in Postgres via RPC (migration 007)
  const { data, error } = await db.rpc("dashboard_stats");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const stats = data as {
    started_form: number;
    took_quiz:    number;
    passed_quiz:  number;
    applied:      number;
    by_status:    Record<string, number>;
    by_role:      Array<{
      slug: string; name: string;
      started_form: number; took_quiz: number; passed: number; applied: number;
      avg_score: number | null;
    }>;
  };

  return NextResponse.json({
    funnel: {
      started_form: stats.started_form,
      took_quiz:    stats.took_quiz,
      passed_quiz:  stats.passed_quiz,
      applied:      stats.applied,
    },
    roles:         stats.by_role,
    status_counts: stats.by_status,
  });
}
