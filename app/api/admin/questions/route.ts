import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

function checkAuth(req: NextRequest) {
  return req.cookies.get("admin_auth")?.value === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const role_id     = searchParams.get("role_id");
  const category_id = searchParams.get("category_id");

  const db = createServiceClient();

  let query = db
    .from("apply_questions")
    .select("id, role_id, category_id, question_text, options, correct_answer_index, active, created_at, apply_roles(name, slug), apply_categories(name, slug)")
    .order("created_at", { ascending: false });

  if (role_id)     query = query.eq("role_id", role_id);
  if (category_id === "base") {
    query = query.is("category_id", null);
  } else if (category_id) {
    query = query.eq("category_id", category_id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role_id, category_id, question_text, options, correct_answer_index } = await req.json();

  if (!role_id || !question_text?.trim() || !Array.isArray(options) || options.length !== 4) {
    return NextResponse.json({ error: "role_id, question_text, and 4 options required" }, { status: 400 });
  }
  if (typeof correct_answer_index !== "number" || correct_answer_index < 0 || correct_answer_index > 3) {
    return NextResponse.json({ error: "correct_answer_index must be 0–3" }, { status: 400 });
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("apply_questions")
    .insert({
      role_id,
      category_id: category_id || null,
      question_text: question_text.trim(),
      options,
      correct_answer_index,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
