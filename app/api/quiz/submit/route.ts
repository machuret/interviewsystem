import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

const MAX_SECONDS_PER_QUIZ = 10 * 45 + 60; // 10 questions × 45s + 60s grace
const SUSPICIOUS_THRESHOLD_SECONDS = 3;

export async function POST(req: NextRequest) {
  const {
    session_id,
    answers,
    answer_times = [],
    tab_switches = 0,
    force_fail = false,
  } = await req.json();

  if (!session_id || !Array.isArray(answers)) {
    return NextResponse.json({ error: "session_id and answers required" }, { status: 400 });
  }

  const db = createServiceClient();

  // Fetch session including option_orders permutation
  const { data: session, error: sessErr } = await db
    .from("apply_quiz_sessions")
    .select("id, role_id, started_at, completed_at, question_ids, option_orders")
    .eq("id", session_id)
    .single();

  if (sessErr || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.completed_at) {
    return NextResponse.json({ error: "Session already completed" }, { status: 409 });
  }

  const now = new Date();
  const started = new Date(session.started_at);
  const elapsedSeconds = (now.getTime() - started.getTime()) / 1000;

  const timedOut = elapsedSeconds > MAX_SECONDS_PER_QUIZ;
  const autoFail = force_fail || tab_switches > 0 || timedOut;

  // Count suspicious answers (answered too fast)
  const suspiciousAnswerCount = (answer_times as number[]).filter(
    (t) => typeof t === "number" && t < SUSPICIOUS_THRESHOLD_SECONDS
  ).length;

  let score = 0;
  let passed = false;

  if (!autoFail) {
    const questionIds: string[] = session.question_ids;
    const optionOrders: number[][] = session.option_orders ?? [];

    const { data: questions, error: qErr } = await db
      .from("apply_questions")
      .select("id, correct_answer_index")
      .in("id", questionIds);

    if (qErr || !questions) {
      return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }

    for (let i = 0; i < questionIds.length; i++) {
      const q = questions.find((x) => x.id === questionIds[i]);
      if (!q) continue;

      const clientAnswer: number = answers[i];
      const permutation = optionOrders[i];

      // Map display-position answer back to original option index
      const originalAnswer =
        permutation && permutation[clientAnswer] !== undefined
          ? permutation[clientAnswer]
          : clientAnswer;

      if (originalAnswer === q.correct_answer_index) score++;
    }

    passed = score >= 7;
  }

  await db
    .from("apply_quiz_sessions")
    .update({
      score,
      passed,
      completed_at: now.toISOString(),
      tab_switches,
      answer_times: answer_times.length > 0 ? answer_times : null,
      suspicious_answer_count: suspiciousAnswerCount,
    })
    .eq("id", session_id);

  return NextResponse.json({ passed, score, auto_fail: autoFail });
}
