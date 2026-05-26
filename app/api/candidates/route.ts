import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

const GDOC_PATTERN = /^https:\/\/docs\.google\.com\/(document|file)\//;
const MAX_CV_BYTES = 10 * 1024 * 1024; // 10 MB
const DEDUP_DAYS = 30;

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const session_id        = formData.get("session_id") as string;
  const full_name         = (formData.get("full_name") as string)?.trim();
  const email             = (formData.get("email") as string)?.trim().toLowerCase();
  const phone             = (formData.get("phone") as string)?.trim();
  const location          = (formData.get("location") as string)?.trim();
  const salary_raw        = formData.get("salary_expectation_php") as string;
  const payment_methods   = formData.getAll("payment_methods") as string[];
  const paypal_email      = (formData.get("paypal_email") as string)?.trim() || null;
  const wise_email        = (formData.get("wise_email") as string)?.trim() || null;
  const differentiator    = (formData.get("differentiator") as string)?.trim();
  const cv_link           = (formData.get("cv_link") as string)?.trim() || "";
  const cv_file           = formData.get("cv_file") as File | null;
  const video_intro_url   = (formData.get("video_intro_url") as string)?.trim() || null;
  const practical_response = (formData.get("practical_response") as string)?.trim() || null;
  const writing_sample    = (formData.get("writing_sample") as string)?.trim() || null;

  // Basic validation
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

  const db = createServiceClient();

  // Verify the session is passed
  const { data: session, error: sessErr } = await db
    .from("apply_quiz_sessions")
    .select("id, passed")
    .eq("id", session_id)
    .single();

  if (sessErr || !session || !session.passed) {
    return NextResponse.json({ error: "Invalid or non-passing session" }, { status: 403 });
  }

  // Email-based 30-day deduplication block
  const since = new Date(Date.now() - DEDUP_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentByEmail } = await db
    .from("apply_candidates")
    .select("id")
    .eq("email", email)
    .gte("created_at", since)
    .limit(1)
    .maybeSingle();

  if (recentByEmail) {
    return NextResponse.json(
      { error: "An application with this email was already submitted recently. Please wait 30 days before applying again." },
      { status: 429 }
    );
  }

  // Check for duplicate submission on this session
  const { data: existing } = await db
    .from("apply_candidates")
    .select("id")
    .eq("session_id", session_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Application already submitted" }, { status: 409 });
  }

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

    const bytes = await cv_file.arrayBuffer();
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
    full_name,
    email,
    phone,
    location,
    salary_expectation_php: salary,
    payment_methods,
    paypal_email,
    wise_email,
    cv_url,
    cv_type,
    differentiator,
    video_intro_url,
    practical_response,
    writing_sample,
  });

  if (insertErr) {
    return NextResponse.json({ error: "Failed to save application" }, { status: 500 });
  }

  // Update session with email
  await db
    .from("apply_quiz_sessions")
    .update({ candidate_email: email })
    .eq("id", session_id);

  return NextResponse.json({ success: true });
}
