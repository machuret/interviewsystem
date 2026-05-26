import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const DEDUP_DAYS    = 30;
const BASE_COUNT    = 5;
const CATEGORY_COUNT = 5;

// Unbiased Fisher-Yates shuffle that does NOT mutate the input array
function pickRandom<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

function shuffleOptions(options: string[]): { shuffled: string[]; permutation: number[] } {
  const permutation = options.map((_, i) => i);
  for (let i = permutation.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
  }
  return { shuffled: permutation.map((orig) => options[orig]), permutation };
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // 10 quiz-start attempts per IP per minute
  if (!checkRateLimit(`quiz-start:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  const { role_slug, category_slug, applicant_id, job_id } = await req.json();
  if (!role_slug) return NextResponse.json({ error: "role_slug required" }, { status: 400 });

  const db = createServiceClient();

  // IP-based 30-day dedup (passed sessions only)
  if (ip && ip !== "unknown") {
    const since = new Date(Date.now() - DEDUP_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: prior } = await db
      .from("apply_quiz_sessions")
      .select("id")
      .eq("ip_address", ip)
      .eq("passed", true)
      .gte("started_at", since)
      .limit(1)
      .maybeSingle();

    if (prior) {
      return NextResponse.json(
        { error: "You have already completed this assessment recently. Please try again in 30 days." },
        { status: 429 }
      );
    }
  }

  const { data: role, error: roleErr } = await db
    .from("apply_roles")
    .select("id, name, slug")
    .eq("slug", role_slug)
    .eq("active", true)
    .single();

  if (roleErr || !role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  // Resolve effective category: job_id takes priority, then category_slug
  let effectiveCategorySlug = category_slug ?? null;
  if (job_id) {
    const { data: job } = await db
      .from("apply_job_postings")
      .select("category_id, apply_categories ( slug )")
      .eq("id", job_id)
      .eq("status", "published")
      .single();
    if (job && job.apply_categories) {
      const cats = job.apply_categories as unknown as { slug: string } | null;
      if (cats) effectiveCategorySlug = cats.slug;
    }
  }

  let selectedQuestions: { id: string; question_text: string; options: string[] }[];

  if (effectiveCategorySlug) {
    const { data: category } = await db
      .from("apply_categories")
      .select("id, name")
      .eq("role_id", role.id)
      .eq("slug", effectiveCategorySlug)
      .eq("active", true)
      .single();

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const [baseRes, catRes] = await Promise.all([
      db.from("apply_questions")
        .select("id, question_text, options")
        .eq("role_id", role.id)
        .is("category_id", null)
        .eq("active", true),
      db.from("apply_questions")
        .select("id, question_text, options")
        .eq("category_id", category.id)
        .eq("active", true),
    ]);

    const baseQuestions = baseRes.data ?? [];
    const catQuestions  = catRes.data ?? [];

    if (baseQuestions.length < BASE_COUNT) {
      return NextResponse.json(
        { error: `Not enough base questions (need ${BASE_COUNT}, have ${baseQuestions.length})` },
        { status: 500 }
      );
    }
    if (catQuestions.length < CATEGORY_COUNT) {
      return NextResponse.json(
        { error: `Not enough questions for this specialisation (need ${CATEGORY_COUNT}, have ${catQuestions.length})` },
        { status: 500 }
      );
    }

    selectedQuestions = [
      ...pickRandom(baseQuestions, BASE_COUNT),
      ...pickRandom(catQuestions, CATEGORY_COUNT),
    ];
    // Interleave with unbiased shuffle
    for (let i = selectedQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
    }
  } else {
    const { data: allQuestions, error: qErr } = await db
      .from("apply_questions")
      .select("id, question_text, options")
      .eq("role_id", role.id)
      .eq("active", true);

    if (qErr || !allQuestions || allQuestions.length < 10) {
      return NextResponse.json({ error: "Not enough questions for this role" }, { status: 500 });
    }

    selectedQuestions = pickRandom(allQuestions, 10);
  }

  const questionIds = selectedQuestions.map((q) => q.id);
  const optionOrders: number[][] = [];
  const questionsForClient = selectedQuestions.map((q) => {
    const { shuffled, permutation } = shuffleOptions(q.options as string[]);
    optionOrders.push(permutation);
    return { id: q.id, question_text: q.question_text, options: shuffled };
  });

  const { data: session, error: sessErr } = await db
    .from("apply_quiz_sessions")
    .insert({
      role_id: role.id,
      started_at: new Date().toISOString(),
      question_ids: questionIds,
      option_orders: optionOrders,
      ip_address: ip,
      applicant_id: applicant_id ?? null,
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
    questions: questionsForClient,
  });
}
