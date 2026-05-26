"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

function PassForm() {
  const params       = useParams<{ role: string }>();
  const searchParams = useSearchParams();
  const sessionId    = searchParams.get("sid") ?? "";

  const [submitting, setSubmitting]       = useState(false);
  const [done, setDone]                   = useState(false);
  const [error, setError]                 = useState("");
  const [practicalPrompt, setPracticalPrompt] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name:              "",
    email:                  "",
    phone:                  "",
    location:               "",
    salary_expectation_php: "",
    payment_methods:        [] as string[],
    paypal_email:           "",
    wise_email:             "",
    differentiator:         "",
    cv_link:                "",
    video_intro_url:        "",
    practical_response:     "",
    writing_sample:         "",
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvMode, setCvMode] = useState<"file" | "link">("file");

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

    if (!sessionId) {
      setError("Invalid session. Please retake the quiz.");
      return;
    }
    if (form.payment_methods.length === 0) {
      setError("Please select at least one payment method.");
      return;
    }
    if (form.payment_methods.includes("paypal") && !form.paypal_email) {
      setError("Please enter your PayPal email.");
      return;
    }
    if (form.payment_methods.includes("wise") && !form.wise_email) {
      setError("Please enter your Wise email.");
      return;
    }
    if (cvMode === "file" && !cvFile) {
      setError("Please upload your CV as a PDF.");
      return;
    }
    if (cvMode === "link" && !form.cv_link) {
      setError("Please provide your Google Doc link.");
      return;
    }
    if (form.differentiator.length > 300) {
      setError("Your answer must be 300 characters or fewer.");
      return;
    }

    setSubmitting(true);

    const fd = new FormData();
    fd.append("session_id",             sessionId);
    fd.append("full_name",              form.full_name);
    fd.append("email",                  form.email);
    fd.append("phone",                  form.phone);
    fd.append("location",               form.location);
    fd.append("salary_expectation_php", form.salary_expectation_php);
    form.payment_methods.forEach((m)  => fd.append("payment_methods", m));
    if (form.paypal_email)  fd.append("paypal_email",       form.paypal_email);
    if (form.wise_email)    fd.append("wise_email",         form.wise_email);
    fd.append("differentiator",         form.differentiator);
    if (form.video_intro_url)    fd.append("video_intro_url",    form.video_intro_url);
    if (form.practical_response) fd.append("practical_response", form.practical_response);
    if (form.writing_sample)     fd.append("writing_sample",     form.writing_sample);

    if (cvMode === "file" && cvFile) {
      fd.append("cv_file", cvFile);
    } else {
      fd.append("cv_link", form.cv_link);
    }

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
          <a href="mailto:hello@rapidtal.com" className="text-[#f97316]">
            hello@rapidtal.com
          </a>
        </p>
      </div>
    );
  }

  const charCount = form.differentiator.length;

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-[#1c1c1c] border border-[#2a2a2a] rounded-full px-4 py-2 text-sm mb-4">
          <span className="text-[#f97316]">✓</span>
          <span className="text-white font-medium">You passed!</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Complete your application
        </h1>
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
        {/* Personal */}
        <div>
          <label>Full Name *</label>
          <input
            required
            type="text"
            placeholder="Maria Santos"
            value={form.full_name}
            onChange={(e) => update("full_name", e.target.value)}
          />
        </div>
        <div>
          <label>Email Address *</label>
          <input
            required
            type="email"
            placeholder="maria@example.com"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </div>
        <div>
          <label>Phone / WhatsApp Number *</label>
          <input
            required
            type="tel"
            placeholder="+63 912 345 6789"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </div>
        <div>
          <label>Current Location (City, Province) *</label>
          <input
            required
            type="text"
            placeholder="Makati, Metro Manila"
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
          />
        </div>

        {/* Salary */}
        <div>
          <label>Monthly Salary Expectation (PHP) *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] text-sm">₱</span>
            <input
              required
              type="number"
              min={1}
              placeholder="35000"
              value={form.salary_expectation_php}
              onChange={(e) => update("salary_expectation_php", e.target.value)}
              className="pl-7"
            />
          </div>
        </div>

        {/* Payment methods */}
        <div>
          <label>Payment Method *</label>
          <div className="flex gap-3 mt-1">
            {["paypal", "wise"].map((method) => (
              <label
                key={method}
                className="flex items-center gap-2 cursor-pointer select-none"
              >
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
        </div>

        {form.payment_methods.includes("paypal") && (
          <div>
            <label>PayPal Email *</label>
            <input
              required
              type="email"
              placeholder="your@paypal.com"
              value={form.paypal_email}
              onChange={(e) => update("paypal_email", e.target.value)}
            />
          </div>
        )}

        {form.payment_methods.includes("wise") && (
          <div>
            <label>Wise Email *</label>
            <input
              required
              type="email"
              placeholder="your@wise.com"
              value={form.wise_email}
              onChange={(e) => update("wise_email", e.target.value)}
            />
          </div>
        )}

        {/* CV */}
        <div>
          <label>CV *</label>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setCvMode("file")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                cvMode === "file"
                  ? "bg-[#f97316] border-[#f97316] text-white"
                  : "bg-[#141414] border-[#2a2a2a] text-[#777] hover:text-white"
              }`}
            >
              Upload PDF
            </button>
            <button
              type="button"
              onClick={() => setCvMode("link")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                cvMode === "link"
                  ? "bg-[#f97316] border-[#f97316] text-white"
                  : "bg-[#141414] border-[#2a2a2a] text-[#777] hover:text-white"
              }`}
            >
              Google Doc Link
            </button>
          </div>

          {cvMode === "file" ? (
            <div>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                className="file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#f97316] file:text-white hover:file:bg-[#ea580c] file:cursor-pointer text-[#a1a1aa] text-sm"
              />
              <p className="text-[#555] text-xs mt-1">PDF only · max 10 MB</p>
            </div>
          ) : (
            <div>
              <input
                type="url"
                placeholder="https://docs.google.com/document/d/..."
                value={form.cv_link}
                onChange={(e) => update("cv_link", e.target.value)}
              />
              <p className="text-[#555] text-xs mt-1">Must be a Google Docs URL</p>
            </div>
          )}
        </div>

        {/* Video intro */}
        <div>
          <label>Video Introduction (optional)</label>
          <input
            type="url"
            placeholder="https://loom.com/share/... or Google Drive link"
            value={form.video_intro_url}
            onChange={(e) => update("video_intro_url", e.target.value)}
          />
          <p className="text-[#555] text-xs mt-1">
            Record a 60–90 second video introducing yourself. Loom or Google Drive link accepted.
          </p>
        </div>

        {/* Practical task */}
        {practicalPrompt && (
          <div>
            <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-4 mb-3">
              <p className="text-[#f97316] text-xs font-semibold uppercase tracking-widest mb-2">
                Practical Task
              </p>
              <p className="text-[#e5e5e5] text-sm leading-relaxed">{practicalPrompt}</p>
            </div>
            <textarea
              rows={5}
              placeholder="Write your response here..."
              value={form.practical_response}
              onChange={(e) => update("practical_response", e.target.value)}
              className="resize-none"
            />
          </div>
        )}

        {/* English writing sample */}
        <div>
          <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-4 mb-3">
            <p className="text-[#f97316] text-xs font-semibold uppercase tracking-widest mb-2">
              English Writing Sample
            </p>
            <p className="text-[#e5e5e5] text-sm leading-relaxed">
              In 3–5 sentences, describe a time you had to manage a difficult situation at work —
              what happened, what you did, and what the outcome was.
            </p>
          </div>
          <textarea
            rows={4}
            placeholder="Write your response here..."
            value={form.writing_sample}
            onChange={(e) => update("writing_sample", e.target.value)}
            className="resize-none"
          />
        </div>

        {/* Differentiator */}
        <div>
          <div className="flex justify-between items-baseline mb-1">
            <label className="mb-0">What makes you different? *</label>
            <span className={`text-xs ${charCount > 300 ? "text-red-400" : "text-[#555]"}`}>
              {charCount}/300
            </span>
          </div>
          <textarea
            required
            rows={3}
            maxLength={300}
            placeholder="Tell us one specific thing that sets you apart from other candidates..."
            value={form.differentiator}
            onChange={(e) => update("differentiator", e.target.value)}
            className="resize-none"
          />
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
