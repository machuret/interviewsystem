import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

const GDOC_PATTERN = /^https:\/\/docs\.google\.com\/(document|file)\//;
const MAX_CV_BYTES = 10 * 1024 * 1024;
const DEDUP_DAYS  = 30;

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const g = (key: string) => (formData.get(key) as string)?.trim() || null;
  const gb = (key: string): boolean | null => {
    const v = formData.get(key) as string;
    if (v === "yes") return true;
    if (v === "no")  return false;
    return null;
  };

  const session_id       = g("session_id") ?? "";
  const full_name        = g("full_name") ?? "";    // first name
  const last_name        = g("last_name");
  const email            = (formData.get("email") as string)?.trim().toLowerCase() ?? "";
  const facebook_link    = g("facebook_link");
  const instagram_link   = g("instagram_link");
  const phone            = g("phone") ?? "";
  const age_raw          = formData.get("age") as string;
  const location         = g("location") ?? "";
  const sex              = g("sex");
  const married          = gb("married");
  const kids             = gb("kids");

  const device_type      = g("device_type");
  const device_brand     = g("device_brand");
  const internet_provider = g("internet_provider");

  const current_job_title  = g("current_job_title");
  const years_experience   = g("years_experience");
  const previous_employers = g("previous_employers");
  const skills_tools       = g("skills_tools");
  const software_used      = g("software_used");
  const task_description   = g("task_description");

  const salary_raw       = formData.get("salary_expectation_php") as string;
  const payment_methods  = formData.getAll("payment_methods") as string[];
  const paypal_email     = g("paypal_email");
  const wise_email       = g("wise_email");
  const differentiator   = g("differentiator") ?? "";
  const cv_link          = g("cv_link") ?? "";
  const cv_file          = formData.get("cv_file") as File | null;
  const video_intro_url  = g("video_intro_url");
  const practical_response = g("practical_response");
  const writing_sample   = g("writing_sample");

  // Required field validation
  if (!session_id || !full_name || !email || !phone || !location || !salary_raw || !differentiator) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (payment_methods.length === 0) {
    return NextResponse.json({ error: "Select at least one payment method" }, { status: 400 });
  }
  if (differentiator.length > 300) {
    return NextResponse.json({ error: "Differentiator must be 300 characters or fewer" }, { status: 400 });
  }

  const salary = parseFloat(salary_raw);
  if (isNaN(salary) || salary <= 0) {
    return NextResponse.json({ error: "Invalid salary value" }, { status: 400 });
  }

  const age = age_raw ? parseInt(age_raw, 10) : null;

  const db = createServiceClient();

  // Verify passing session
  const { data: session, error: sessErr } = await db
    .from("apply_quiz_sessions")
    .select("id, passed")
    .eq("id", session_id)
    .single();

  if (sessErr || !session || !session.passed) {
    return NextResponse.json({ error: "Invalid or non-passing session" }, { status: 403 });
  }

  // Email 30-day dedup
  const since = new Date(Date.now() - DEDUP_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentByEmail } = await db
    .from("apply_candidates")
    .select("id")
    .eq("email", email)
    .gte("submitted_at", since)
    .limit(1)
    .maybeSingle();

  if (recentByEmail) {
    return NextResponse.json(
      { error: "An application with this email was already submitted recently. Please wait 30 days before applying again." },
      { status: 429 }
    );
  }

  // Session-level dedup
  const { data: existing } = await db
    .from("apply_candidates")
    .select("id")
    .eq("session_id", session_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Application already submitted" }, { status: 409 });
  }

  // CV handling
  let cv_url: string;
  let cv_type: "pdf" | "gdoc";

  if (cv_link) {
    if (!GDOC_PATTERN.test(cv_link)) {
      return NextResponse.json({ error: "CV link must be a valid Google Docs URL" }, { status: 400 });
    }
    cv_url = cv_link;
    cv_type = "gdoc";
  } else if (cv_file) {
    if (cv_file.type !== "application/pdf") {
      return NextResponse.json({ error: "CV must be a PDF file" }, { status: 400 });
    }
    if (cv_file.size > MAX_CV_BYTES) {
      return NextResponse.json({ error: "CV file must be under 10 MB" }, { status: 400 });
    }
    const bytes    = await cv_file.arrayBuffer();
    const filename = `${session_id}/${Date.now()}.pdf`;
    const { error: uploadErr } = await db.storage
      .from("apply-cvs")
      .upload(filename, bytes, { contentType: "application/pdf", upsert: false });
    if (uploadErr) {
      return NextResponse.json({ error: "CV upload failed: " + uploadErr.message }, { status: 500 });
    }
    const { data: urlData } = db.storage.from("apply-cvs").getPublicUrl(filename);
    cv_url = urlData.publicUrl;
    cv_type = "pdf";
  } else {
    return NextResponse.json({ error: "Provide a CV file or Google Doc link" }, { status: 400 });
  }

  const { error: insertErr } = await db.from("apply_candidates").insert({
    session_id,
    // Basic info
    full_name,
    last_name,
    email,
    facebook_link,
    instagram_link,
    phone,
    age,
    location,
    sex,
    married,
    kids,
    // Setup
    device_type,
    device_brand,
    internet_provider,
    // Work experience
    current_job_title,
    years_experience,
    previous_employers,
    skills_tools,
    software_used,
    task_description,
    // Compensation & CV
    salary_expectation_php: salary,
    payment_methods,
    paypal_email,
    wise_email,
    cv_url,
    cv_type,
    differentiator,
    // Additional
    video_intro_url,
    practical_response,
    writing_sample,
  });

  if (insertErr) {
    return NextResponse.json({ error: "Failed to save application" }, { status: 500 });
  }

  await db
    .from("apply_quiz_sessions")
    .update({ candidate_email: email })
    .eq("id", session_id);

  return NextResponse.json({ success: true });
}
