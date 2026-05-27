"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import ProgressSteps from "@/components/ProgressSteps";
import { PartyIcon, CheckCircleIcon } from "@/components/icons";

function PassForm() {
  const params       = useParams<{ role: string }>();
  const searchParams = useSearchParams();
  const sessionId    = searchParams.get("sid") ?? "";
  const applicantId  = searchParams.get("aid") ?? "";

  const [submitting, setSubmitting]           = useState(false);
  const [done, setDone]                       = useState(false);
  const [error, setError]                     = useState("");
  const [practicalPrompt, setPracticalPrompt] = useState<string | null>(null);
  const [cvMode, setCvMode]                   = useState<"file" | "link">("file");
  const [cvFile, setCvFile]                   = useState<File | null>(null);

  const [form, setForm] = useState({
    salary_expectation_php: "",
    payment_methods:        [] as string[],
    paypal_email:           "",
    wise_email:             "",
    cv_link:                "",
    video_intro_url:        "",
    practical_response:     "",
    writing_sample:         "",
    differentiator:         "",
  });

  useEffect(() => {
    if (!params.role) return;
    fetch(`/api/quiz/task?role=${params.role}`)
      .then((r) => r.json())
      .then((d) => setPracticalPrompt(d.prompt ?? null))
      .catch(() => {});
  }, [params.role]);

  function update(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

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
    if (!sessionId)                                                  { setError("Invalid session. Please retake the quiz."); return; }
    if (form.payment_methods.length === 0)                           { setError("Please select at least one payment method."); return; }
    if (form.payment_methods.includes("paypal") && !form.paypal_email) { setError("Please enter your PayPal email."); return; }
    if (form.payment_methods.includes("wise")   && !form.wise_email)   { setError("Please enter your Wise email."); return; }
    if (cvMode === "file" && !cvFile)                                { setError("Please upload your CV as a PDF."); return; }
    if (cvMode === "link" && !form.cv_link)                          { setError("Please provide your Google Doc link."); return; }
    if (form.differentiator.length > 300)                            { setError("Differentiator must be 300 characters or fewer."); return; }
    setSubmitting(true);
    const fd = new FormData();
    fd.append("session_id", sessionId);
    if (applicantId) fd.append("applicant_id", applicantId);
    fd.append("salary_expectation_php", form.salary_expectation_php);
    form.payment_methods.forEach((m) => fd.append("payment_methods", m));
    if (form.paypal_email) fd.append("paypal_email", form.paypal_email);
    if (form.wise_email)   fd.append("wise_email",   form.wise_email);
    if (cvMode === "file" && cvFile) fd.append("cv_file", cvFile);
    else if (form.cv_link) fd.append("cv_link", form.cv_link);
    if (form.video_intro_url)    fd.append("video_intro_url",    form.video_intro_url);
    if (form.practical_response) fd.append("practical_response", form.practical_response);
    if (form.writing_sample)     fd.append("writing_sample",     form.writing_sample);
    fd.append("differentiator", form.differentiator);
    try {
      const res  = await fetch("/api/candidates", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Submission failed. Please try again."); setSubmitting(false); return; }
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
        <a href="/" className="text-brand-orange underline">← Start over</a>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="mb-6 flex justify-center">
          <PartyIcon size={48} className="text-brand-orange" />
        </div>
        <h1 className="text-fluid-heading font-bold text-white mb-4">Application received!</h1>
        <p className="text-brand-text-secondary text-fluid-lead mb-6 leading-relaxed">
          We've got your details and we'll be in touch within 3–5 business days if you're a strong fit.
        </p>
        <p className="text-brand-text-muted text-sm">
          Questions? Email us at{" "}
          <a href="mailto:hello@rapidtal.com" className="text-brand-orange">hello@rapidtal.com</a>
        </p>
      </div>
    );
  }

  const charCount = form.differentiator.length;

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <ProgressSteps steps={["Apply", "Quick Check", "Typing Test", "Quiz", "Profile"]} current={4} />

      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 card-inner rounded-full px-4 py-2 text-sm mb-4">
          <CheckCircleIcon size={14} className="text-brand-orange" />
          <span className="text-white font-medium">You passed!</span>
        </div>
        <h1 className="text-fluid-heading font-bold text-white mb-2">Almost there</h1>
        <p className="text-brand-text-secondary text-sm">Just a few more details and your application is complete.</p>
      </div>

      {error && <div className="error-box mb-6">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">

        <div>
          <p className="section-label mb-4">Compensation</p>
          <div className="space-y-4">
            <div>
              <label>Monthly Salary Expectation (PHP)<span className="text-brand-orange ml-0.5">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted text-sm">₱</span>
                <input required type="number" min={1} placeholder="35000" value={form.salary_expectation_php} onChange={(e) => update("salary_expectation_php", e.target.value)} className="pl-7" />
              </div>
            </div>
            <div>
              <label>Payment Method<span className="text-brand-orange ml-0.5">*</span></label>
              <div className="flex gap-4 mt-1">
                {["paypal", "wise"].map((method) => (
                  <label key={method} className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" className="w-4 h-4 accent-brand-orange" checked={form.payment_methods.includes(method)} onChange={() => togglePayment(method)} />
                    <span className="text-brand-text-body text-sm capitalize">{method}</span>
                  </label>
                ))}
              </div>
            </div>
            {form.payment_methods.includes("paypal") && (
              <div>
                <label>PayPal Email<span className="text-brand-orange ml-0.5">*</span></label>
                <input required type="email" placeholder="your@paypal.com" value={form.paypal_email} onChange={(e) => update("paypal_email", e.target.value)} />
              </div>
            )}
            {form.payment_methods.includes("wise") && (
              <div>
                <label>Wise Email<span className="text-brand-orange ml-0.5">*</span></label>
                <input required type="email" placeholder="your@wise.com" value={form.wise_email} onChange={(e) => update("wise_email", e.target.value)} />
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-brand-black-border pt-5">
          <p className="section-label mb-4">Your CV</p>
          <div className="flex gap-2 mb-3">
            <button type="button" onClick={() => setCvMode("file")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors duration-150 ${cvMode === "file" ? "bg-brand-orange border-brand-orange text-white" : "bg-brand-black-soft border-brand-black-border text-brand-text-tertiary hover:text-white"}`}>
              Upload PDF
            </button>
            <button type="button" onClick={() => setCvMode("link")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors duration-150 ${cvMode === "link" ? "bg-brand-orange border-brand-orange text-white" : "bg-brand-black-soft border-brand-black-border text-brand-text-tertiary hover:text-white"}`}>
              Google Doc Link
            </button>
          </div>
          {cvMode === "file" ? (
            <div>
              <input type="file" accept="application/pdf" onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                className="file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-orange file:text-white hover:file:bg-brand-orange-dark file:cursor-pointer text-brand-text-secondary text-sm" />
              <p className="text-brand-text-muted text-xs mt-1">PDF only · max 10 MB</p>
            </div>
          ) : (
            <div>
              <input type="url" placeholder="https://docs.google.com/document/d/..." value={form.cv_link} onChange={(e) => update("cv_link", e.target.value)} />
              <p className="text-brand-text-muted text-xs mt-1">Must be a Google Docs URL</p>
            </div>
          )}
        </div>

        <div className="border-t border-brand-black-border pt-5 space-y-5">
          <p className="section-label">Your Application</p>

          <div>
            <label>Video Introduction (optional)</label>
            <input type="url" placeholder="https://loom.com/share/... or Google Drive link" value={form.video_intro_url} onChange={(e) => update("video_intro_url", e.target.value)} />
            <p className="text-brand-text-muted text-xs mt-1">60–90 second intro video. Loom or Google Drive accepted.</p>
          </div>

          {practicalPrompt && (
            <div>
              <div className="card-inner p-4 mb-2">
                <p className="section-label mb-2">Practical Task</p>
                <p className="text-brand-text-body text-sm leading-relaxed">{practicalPrompt}</p>
              </div>
              <textarea rows={5} placeholder="Write your response here..." value={form.practical_response} onChange={(e) => update("practical_response", e.target.value)} className="resize-none" />
            </div>
          )}

          <div>
            <div className="card-inner p-4 mb-2">
              <p className="section-label mb-2">English Writing Sample</p>
              <p className="text-brand-text-body text-sm leading-relaxed">
                In 3–5 sentences, describe a time you had to manage a difficult situation at work — what happened, what you did, and what the outcome was.
              </p>
            </div>
            <textarea rows={4} placeholder="Write your response here..." value={form.writing_sample} onChange={(e) => update("writing_sample", e.target.value)} className="resize-none" />
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1">
              <label className="mb-0">What makes you different?<span className="text-brand-orange ml-0.5">*</span></label>
              <span className={`text-xs tabular-nums ${charCount > 300 ? "text-red-400" : "text-brand-text-muted"}`}>{charCount}/300</span>
            </div>
            <textarea required rows={3} maxLength={300} placeholder="Tell us one specific thing that sets you apart from other candidates..." value={form.differentiator} onChange={(e) => update("differentiator", e.target.value)} className="resize-none" />
          </div>
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full py-4 text-lg">
          {submitting ? "Submitting..." : "Submit Application →"}
        </button>

        <p className="text-brand-text-muted text-xs text-center">Your information is kept confidential and will only be shared with relevant clients.</p>
      </form>
    </div>
  );
}

export default function PassPage() {
  return <Suspense><PassForm /></Suspense>;
}
