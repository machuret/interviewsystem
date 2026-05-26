"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

// ─── helpers ─────────────────────────────────────────────────────────────────

function Section({ title }: { title: string }) {
  return (
    <div className="border-t border-[#2a2a2a] pt-6 mt-6">
      <p className="text-[#f97316] text-xs font-semibold uppercase tracking-widest mb-4">{title}</p>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[#a1a1aa] text-sm mb-1">
        {label}{required && <span className="text-[#f97316] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── form ─────────────────────────────────────────────────────────────────────

function PassForm() {
  const params       = useParams<{ role: string }>();
  const searchParams = useSearchParams();
  const sessionId    = searchParams.get("sid") ?? "";

  const [submitting, setSubmitting]           = useState(false);
  const [done, setDone]                       = useState(false);
  const [error, setError]                     = useState("");
  const [practicalPrompt, setPracticalPrompt] = useState<string | null>(null);
  const [cvMode, setCvMode]                   = useState<"file" | "link">("file");
  const [cvFile, setCvFile]                   = useState<File | null>(null);

  const [form, setForm] = useState({
    // Basic info
    full_name:        "",
    last_name:        "",
    email:            "",
    facebook_link:    "",
    instagram_link:   "",
    phone:            "",
    age:              "",
    location:         "",
    sex:              "",
    married:          "",
    kids:             "",
    // Setup
    device_type:      "",
    device_brand:     "",
    internet_provider: "",
    // Work experience
    current_job_title:  "",
    years_experience:   "",
    previous_employers: "",
    skills_tools:       "",
    software_used:      "",
    task_description:   "",
    // Compensation
    salary_expectation_php: "",
    payment_methods:        [] as string[],
    paypal_email:           "",
    wise_email:             "",
    // Application
    cv_link:             "",
    video_intro_url:     "",
    practical_response:  "",
    writing_sample:      "",
    differentiator:      "",
  });

  useEffect(() => {
    if (!params.role) return;
    fetch(`/api/quiz/task?role=${params.role}`)
      .then((r) => r.json())
      .then((d) => setPracticalPrompt(d.prompt ?? null))
      .catch(() => {});
  }, [params.role]);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function togglePayment(method: string) {
    setForm((f) => ({
      ...f,
      payment_methods: f.payment_methods.includes(method)
        ? f.payment_methods.filter((m) => m !== method)
        : [...f.payment_methods, method],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!sessionId) { setError("Invalid session. Please retake the quiz."); return; }
    if (form.payment_methods.length === 0) { setError("Please select at least one payment method."); return; }
    if (form.payment_methods.includes("paypal") && !form.paypal_email) { setError("Please enter your PayPal email."); return; }
    if (form.payment_methods.includes("wise")   && !form.wise_email)   { setError("Please enter your Wise email."); return; }
    if (cvMode === "file" && !cvFile)      { setError("Please upload your CV as a PDF."); return; }
    if (cvMode === "link" && !form.cv_link){ setError("Please provide your Google Doc link."); return; }
    if (form.differentiator.length > 300)  { setError("Differentiator must be 300 characters or fewer."); return; }

    setSubmitting(true);

    const fd = new FormData();
    const append = (k: string, v: string | null | undefined) => { if (v) fd.append(k, v); };

    fd.append("session_id", sessionId);
    // Basic
    fd.append("full_name",  form.full_name);
    append("last_name",     form.last_name);
    fd.append("email",      form.email);
    append("facebook_link", form.facebook_link);
    append("instagram_link",form.instagram_link);
    fd.append("phone",      form.phone);
    append("age",           form.age);
    fd.append("location",   form.location);
    append("sex",           form.sex);
    append("married",       form.married);
    append("kids",          form.kids);
    // Setup
    append("device_type",      form.device_type);
    append("device_brand",     form.device_brand);
    append("internet_provider",form.internet_provider);
    // Work experience
    append("current_job_title",  form.current_job_title);
    append("years_experience",   form.years_experience);
    append("previous_employers", form.previous_employers);
    append("skills_tools",       form.skills_tools);
    append("software_used",      form.software_used);
    append("task_description",   form.task_description);
    // Compensation
    fd.append("salary_expectation_php", form.salary_expectation_php);
    form.payment_methods.forEach((m) => fd.append("payment_methods", m));
    append("paypal_email", form.paypal_email);
    append("wise_email",   form.wise_email);
    // CV
    if (cvMode === "file" && cvFile) fd.append("cv_file", cvFile);
    else append("cv_link", form.cv_link);
    // Application
    append("video_intro_url",    form.video_intro_url);
    append("practical_response", form.practical_response);
    append("writing_sample",     form.writing_sample);
    fd.append("differentiator",  form.differentiator);

    try {
      const res = await fetch("/api/candidates", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Submission failed. Please try again.");
        setSubmitting(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  if (!sessionId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-red-400 mb-4">Invalid session. Please retake the quiz.</p>
        <a href="/" className="text-[#f97316] underline">← Start over</a>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-white mb-4">Application received!</h1>
        <p className="text-[#a1a1aa] text-lg mb-6">
          We've got your details and we'll be in touch within 3–5 business days if you're a strong fit.
        </p>
        <p className="text-[#555] text-sm">
          Questions? Email us at{" "}
          <a href="mailto:hello@rapidtal.com" className="text-[#f97316]">hello@rapidtal.com</a>
        </p>
      </div>
    );
  }

  const charCount = form.differentiator.length;

  return (
    <div className="max-w-xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-[#1c1c1c] border border-[#2a2a2a] rounded-full px-4 py-2 text-sm mb-4">
          <span className="text-[#f97316]">✓</span>
          <span className="text-white font-medium">You passed!</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Complete your application</h1>
        <p className="text-[#a1a1aa] text-sm">
          You're one step away from being considered for a role with one of our Australian clients.
        </p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-400 rounded-xl px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Basic Info ─────────────────────────────────────────── */}
        <Section title="Basic Info" />

        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name" required>
            <input required type="text" placeholder="Maria" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} />
          </Field>
          <Field label="Last Name">
            <input type="text" placeholder="Santos" value={form.last_name} onChange={(e) => update("last_name", e.target.value)} />
          </Field>
        </div>

        <Field label="Email Address" required>
          <input required type="email" placeholder="maria@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Facebook Profile">
            <input type="url" placeholder="https://facebook.com/..." value={form.facebook_link} onChange={(e) => update("facebook_link", e.target.value)} />
          </Field>
          <Field label="Instagram Profile">
            <input type="url" placeholder="https://instagram.com/..." value={form.instagram_link} onChange={(e) => update("instagram_link", e.target.value)} />
          </Field>
        </div>

        <Field label="Phone / WhatsApp" required>
          <input required type="tel" placeholder="+63 912 345 6789" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Age">
            <input type="number" min={18} max={70} placeholder="27" value={form.age} onChange={(e) => update("age", e.target.value)} />
          </Field>
          <Field label="Location (City, Province)" required>
            <input required type="text" placeholder="Makati, Metro Manila" value={form.location} onChange={(e) => update("location", e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Sex">
            <select value={form.sex} onChange={(e) => update("sex", e.target.value)}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </Field>
          <Field label="Married?">
            <select value={form.married} onChange={(e) => update("married", e.target.value)}>
              <option value="">Select</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
          <Field label="Kids?">
            <select value={form.kids} onChange={(e) => update("kids", e.target.value)}>
              <option value="">Select</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
        </div>

        {/* ── Your Setup ─────────────────────────────────────────── */}
        <Section title="Your Setup" />

        <div className="grid grid-cols-2 gap-4">
          <Field label="PC or Laptop?">
            <select value={form.device_type} onChange={(e) => update("device_type", e.target.value)}>
              <option value="">Select</option>
              <option value="pc">PC (Desktop)</option>
              <option value="laptop">Laptop</option>
            </select>
          </Field>
          <Field label="Brand">
            <input type="text" placeholder="Dell, ASUS, Apple..." value={form.device_brand} onChange={(e) => update("device_brand", e.target.value)} />
          </Field>
        </div>

        <Field label="Internet Provider">
          <input type="text" placeholder="PLDT, Globe, Converge..." value={form.internet_provider} onChange={(e) => update("internet_provider", e.target.value)} />
        </Field>

        {/* ── Work Experience ────────────────────────────────────── */}
        <Section title="Work Experience" />

        <div className="grid grid-cols-2 gap-4">
          <Field label="Current / Last Job Title">
            <input type="text" placeholder="Virtual Assistant" value={form.current_job_title} onChange={(e) => update("current_job_title", e.target.value)} />
          </Field>
          <Field label="Years of Experience">
            <select value={form.years_experience} onChange={(e) => update("years_experience", e.target.value)}>
              <option value="">Select</option>
              <option value="less-than-1">Less than 1 year</option>
              <option value="1">1 year</option>
              <option value="2-3">2–3 years</option>
              <option value="4-5">4–5 years</option>
              <option value="5+">5+ years</option>
            </select>
          </Field>
        </div>

        <Field label="Previous Employers">
          <textarea rows={2} className="resize-none" placeholder="List companies or clients you've worked for..." value={form.previous_employers} onChange={(e) => update("previous_employers", e.target.value)} />
        </Field>

        <Field label="Skills & Tools">
          <textarea rows={2} className="resize-none" placeholder="e.g. Google Workspace, Canva, HubSpot, Trello..." value={form.skills_tools} onChange={(e) => update("skills_tools", e.target.value)} />
        </Field>

        <Field label="Software You Use">
          <textarea rows={2} className="resize-none" placeholder="e.g. Slack, Zoom, Notion, Asana, QuickBooks..." value={form.software_used} onChange={(e) => update("software_used", e.target.value)} />
        </Field>

        <Field label="Describe Your Day-to-Day Tasks">
          <textarea rows={3} className="resize-none" placeholder="What do you typically do in your current or most recent role?" value={form.task_description} onChange={(e) => update("task_description", e.target.value)} />
        </Field>

        {/* ── Compensation ───────────────────────────────────────── */}
        <Section title="Compensation" />

        <Field label="Monthly Salary Expectation (PHP)" required>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] text-sm">₱</span>
            <input required type="number" min={1} placeholder="35000" value={form.salary_expectation_php} onChange={(e) => update("salary_expectation_php", e.target.value)} className="pl-7" />
          </div>
        </Field>

        <Field label="Payment Method" required>
          <div className="flex gap-4 mt-1">
            {["paypal", "wise"].map((method) => (
              <label key={method} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-[#f97316]"
                  checked={form.payment_methods.includes(method)}
                  onChange={() => togglePayment(method)}
                />
                <span className="text-[#e5e5e5] text-sm capitalize">{method}</span>
              </label>
            ))}
          </div>
        </Field>

        {form.payment_methods.includes("paypal") && (
          <Field label="PayPal Email" required>
            <input required type="email" placeholder="your@paypal.com" value={form.paypal_email} onChange={(e) => update("paypal_email", e.target.value)} />
          </Field>
        )}
        {form.payment_methods.includes("wise") && (
          <Field label="Wise Email" required>
            <input required type="email" placeholder="your@wise.com" value={form.wise_email} onChange={(e) => update("wise_email", e.target.value)} />
          </Field>
        )}

        {/* ── CV ─────────────────────────────────────────────────── */}
        <Section title="Your CV" />

        <div className="flex gap-2 mb-3">
          <button type="button" onClick={() => setCvMode("file")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${cvMode === "file" ? "bg-[#f97316] border-[#f97316] text-white" : "bg-[#141414] border-[#2a2a2a] text-[#777] hover:text-white"}`}>
            Upload PDF
          </button>
          <button type="button" onClick={() => setCvMode("link")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${cvMode === "link" ? "bg-[#f97316] border-[#f97316] text-white" : "bg-[#141414] border-[#2a2a2a] text-[#777] hover:text-white"}`}>
            Google Doc Link
          </button>
        </div>

        {cvMode === "file" ? (
          <div>
            <input type="file" accept="application/pdf" onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
              className="file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#f97316] file:text-white hover:file:bg-[#ea580c] file:cursor-pointer text-[#a1a1aa] text-sm" />
            <p className="text-[#555] text-xs mt-1">PDF only · max 10 MB</p>
          </div>
        ) : (
          <div>
            <input type="url" placeholder="https://docs.google.com/document/d/..." value={form.cv_link} onChange={(e) => update("cv_link", e.target.value)} />
            <p className="text-[#555] text-xs mt-1">Must be a Google Docs URL</p>
          </div>
        )}

        {/* ── Application ────────────────────────────────────────── */}
        <Section title="Your Application" />

        <Field label="Video Introduction (optional)">
          <input type="url" placeholder="https://loom.com/share/... or Google Drive link" value={form.video_intro_url} onChange={(e) => update("video_intro_url", e.target.value)} />
          <p className="text-[#555] text-xs mt-1">Record a 60–90 second intro video. Loom or Google Drive accepted.</p>
        </Field>

        {practicalPrompt && (
          <div>
            <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-4 mb-2">
              <p className="text-[#f97316] text-xs font-semibold uppercase tracking-widest mb-2">Practical Task</p>
              <p className="text-[#e5e5e5] text-sm leading-relaxed">{practicalPrompt}</p>
            </div>
            <textarea rows={5} placeholder="Write your response here..." value={form.practical_response} onChange={(e) => update("practical_response", e.target.value)} className="resize-none" />
          </div>
        )}

        <div>
          <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-4 mb-2">
            <p className="text-[#f97316] text-xs font-semibold uppercase tracking-widest mb-2">English Writing Sample</p>
            <p className="text-[#e5e5e5] text-sm leading-relaxed">
              In 3–5 sentences, describe a time you had to manage a difficult situation at work — what happened, what you did, and what the outcome was.
            </p>
          </div>
          <textarea rows={4} placeholder="Write your response here..." value={form.writing_sample} onChange={(e) => update("writing_sample", e.target.value)} className="resize-none" />
        </div>

        <div>
          <div className="flex justify-between items-baseline mb-1">
            <label className="text-[#a1a1aa] text-sm mb-0">
              What makes you different?<span className="text-[#f97316] ml-0.5">*</span>
            </label>
            <span className={`text-xs ${charCount > 300 ? "text-red-400" : "text-[#555]"}`}>{charCount}/300</span>
          </div>
          <textarea required rows={3} maxLength={300} placeholder="Tell us one specific thing that sets you apart from other candidates..."
            value={form.differentiator} onChange={(e) => update("differentiator", e.target.value)} className="resize-none" />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-lg transition-colors mt-2"
        >
          {submitting ? "Submitting..." : "Submit Application →"}
        </button>

        <p className="text-[#555] text-xs text-center">
          Your information is kept confidential and will only be shared with relevant clients.
        </p>
      </form>
    </div>
  );
}

export default function PassPage() {
  return (
    <Suspense>
      <PassForm />
    </Suspense>
  );
}
