import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { role_slug } = await req.json();
  if (!role_slug) return NextResponse.json({ error: "role_slug required" }, { status: 400 });

  const db = createServiceClient();

  // Fetch role
  const { data: role, error: roleErr } = await db
    .from("apply_roles")
    .select("id, name, slug")
    .eq("slug", role_slug)
    .eq("active", true)
    .single();

  if (roleErr || !role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  // Fetch all active questions for the role
  const { data: allQuestions, error: qErr } = await db
    .from("apply_questions")
    .select("id, question_text, options")
    .eq("role_id", role.id)
    .eq("active", true);

  if (qErr || !allQuestions || allQuestions.length < 10) {
    return NextResponse.json({ error: "Not enough questions for this role" }, { status: 500 });
  }

  // Shuffle and pick 10
  const shuffled = allQuestions.sort(() => Math.random() - 0.5).slice(0, 10);
  const questionIds = shuffled.map((q) => q.id);

  // Create session
  const { data: session, error: sessErr } = await db
    .from("apply_quiz_sessions")
    .insert({
      role_id: role.id,
      started_at: new Date().toISOString(),
      question_ids: questionIds,
    })
    .select("id, started_at")
    .single();

  if (sessErr || !session) {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }

  return NextResponse.json({
    session_id: session.id,
    started_at: session.started_at,
    role: { name: role.name, slug: role.slug },
    questions: shuffled.map((q) => ({
      id: q.id,
      question_text: q.question_text,
      options: q.options,
    })),
  });
}
