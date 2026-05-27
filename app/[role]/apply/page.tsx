"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";

const ROLE_NAMES: Record<string, string> = {
  "marketing":           "Marketing Specialist",
  "sales":               "Sales Representative",
  "virtual-assistant":   "Virtual Assistant",
  "executive-assistant": "Executive Assistant",
};

// ─── Big No screening ────────────────────────────────────────────────────────

type BigNoStage =
  | "q1"   // Philippines?
  | "q2"   // Own laptop?
  | "q3"   // Employed last 6 months?
  | "q3b"  // Why not employed? (shown only when q3 = no)
  | "q4"   // Single parent?
  | "q4b"  // Kids under 4? (shown only when q4 = yes)
  | "q5"   // Full-time 40 hrs/wk?
  | "q6";  // Work references?

interface BigNoQuestion {
  stage: BigNoStage;
  question: string;
  options: { label: string; value: string; disqualifies?: boolean }[];
  subtext?: string;
}

const BIG_NO_QUESTIONS: BigNoQuestion[] = [
  {
    stage: "q1",
    question: "Are you currently based in the Philippines?",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No",  value: "no", disqualifies: true },
    ],
  },
  {
    stage: "q2",
    question: "Do you have your own laptop or computer for work?",
    options: [
      { label: "Yes, I own it",         value: "own" },
      { label: "I share a laptop",      value: "shared", disqualifies: true },
      { label: "No, I don't have one",  value: "no",     disqualifies: true },
    ],
  },
  {
    stage: "q3",
    question: "Were you employed or actively working in the last 6 months?",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No",  value: "no" },  // triggers q3b, not direct disqualify
    ],
  },
  {
    stage: "q3b",
    question: "Could you tell us a bit more about why?",
    subtext: "We ask this to better understand your situation.",
    options: [
      { label: "I was dealing with a health issue",  value: "sick",       disqualifies: true },
      { label: "Family responsibilities",            value: "family",     disqualifies: true },
      { label: "I was looking but couldn't find one",value: "job_search", disqualifies: true },
    ],
  },
  {
    stage: "q4",
    question: "Are you a single parent?",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No",  value: "no" },  // no reaction either way
    ],
  },
  {
    stage: "q4b",
    question: "Are any of your children under 4 years old?",
    subtext: "This role requires consistent availability during Australian business hours.",
    options: [
      { label: "Yes", value: "yes", disqualifies: true },
      { label: "No",  value: "no" },
    ],
  },
  {
    stage: "q5",
    question: "Are you looking for full-time work (40 hours per week)?",
    options: [
      { label: "Yes, full-time",         value: "fulltime" },
      { label: "No, part-time only",     value: "parttime", disqualifies: true },
    ],
  },
  {
    stage: "q6",
    question: "Do you have work references we can contact to verify your experience?",
    subtext: "We may reach out to past employers or clients.",
    options: [
      { label: "Yes, I have references",       value: "yes" },
      { label: "No, I don't have references",  value: "no", disqualifies: true },
    ],
  },
];

// Determine the next stage after a given answer
function nextStage(stage: BigNoStage, value: string): BigNoStage | "pass" {
  if (stage === "q3" && value === "no") return "q3b";
  if (stage === "q4" && value === "yes") return "q4b";
  const order: BigNoStage[] = ["q1", "q2", "q3", "q3b", "q4", "q4b", "q5", "q6"];
  const idx = order.indexOf(stage);
  const nextIdx = order.indexOf(
    stage === "q3" ? "q4"  // skip q3b when q3 = yes
    : stage === "q4" ? "q5" // skip q4b when q4 = no
    : order[idx + 1] as BigNoStage
  );
  if (nextIdx === -1 || nextIdx >= order.length) return "pass";
  return order[nextIdx] ?? "pass";
}

// ─── Main form types ─────────────────────────────────────────────────────────

type Form = {
  first_name: string; last_name: string; email: string;
  facebook_link: string; instagram_link: string; phone: string;
  age: string; location: string; sex: string; married: string; kids: string;
  device_type: string; device_brand: string; internet_provider: string;
  current_job_title: string; years_experience: string; previous_employers: string;
  skills_tools: string; software_used: string; task_description: string;
};

type JobDetails = {
  id: string;
  title: string;
  description: string | null;
  salary_from: number | null;
  salary_to: number | null;
  apply_roles: { name: string; slug: string };
  apply_categories: { name: string; slug: string } | null;
};

const EMPTY_FORM: Form = {
  first_name: "", last_name: "", email: "",
  facebook_link: "", instagram_link: "", phone: "",
  age: "", location: "", sex: "", married: "", kids: "",
  device_type: "", device_brand: "", internet_provider: "",
  current_job_title: "", years_experience: "", previous_employers: "",
  skills_tools: "", software_used: "", task_description: "",
};

// ─── Component ───────────────────────────────────────────────────────────────

function ApplyInner() {
  const params       = useParams<{ role: string }>();
  const searchParams = useSearchParams();
  const router       = useRouter();

  const jobId = searchParams.get("job") ?? null;

  // Main form state
  const [step, setStep]               = useState(1);
  const [form, setForm]               = useState<Form>(EMPTY_FORM);
  const [applicantId, setApplicantId] = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");
  const [internetMbps, setInternetMbps] = useState<number | null>(null);
  const [speedTesting, setSpeedTesting] = useState(false);
  const [jobDetails, setJobDetails]   = useState<JobDetails | null>(null);

  // Big No screening state (null = not started yet)
  const [bigNoStage, setBigNoStage]   = useState<BigNoStage | "pass" | null>(null);
  const [bigNoFlagging, setBigNoFlagging] = useState(false);

  const speedDoneRef = useRef(false);

  // Fetch job details if job param provided
  useEffect(() => {
    if (!jobId) return;
    fetch(`/api/jobs/${jobId}`)
      .then((r) => r.json())
      .then((data) => { if (!data.error) setJobDetails(data); })
      .catch(() => {});
  }, [jobId]);

  // Internet speed test (step 2 = old step 2, now step 3 counting from bigNo)
  useEffect(() => {
    // We're on step 2 of the main form (the "Your Setup" step)
    if (step !== 2 || bigNoStage !== "pass" || speedDoneRef.current) return;
    speedDoneRef.current = true;
    setSpeedTesting(true);
    const start = Date.now();
    fetch("/api/speed-test")
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        const elapsed = (Date.now() - start) / 1000;
        const mbps = Math.round(((buf.byteLength * 8) / elapsed / 1_000_000) * 10) / 10;
        setInternetMbps(mbps);
        if (applicantId) {
          fetch(`/api/applicants/${applicantId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ internet_mbps: mbps }),
          }).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setSpeedTesting(false));
  }, [step, applicantId, bigNoStage]);

  function update(field: keyof Form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function saveStep() {
    setError("");
    setSaving(true);
    try {
      let res: Response;
      if (!applicantId) {
        res = await fetch("/api/applicants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role_slug: params.role,
            job_id: jobId ?? undefined,
            ...form,
          }),
        });
      } else {
        res = await fetch(`/api/applicants/${applicantId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save. Please try again."); setSaving(false); return false; }
      if (!applicantId && data.id) setApplicantId(data.id);
      setSaving(false);
      return true;
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
      return false;
    }
  }

  async function handleNext() {
    if (step === 1) {
      if (!form.first_name.trim()) { setError("First name is required."); return; }
      if (!form.email.trim())      { setError("Email is required."); return; }
      if (!form.phone.trim())      { setError("Phone is required."); return; }
      if (!form.location.trim())   { setError("Location is required."); return; }
    }
    const ok = await saveStep();
    if (!ok) return;

    if (step === 1) {
      // After step 1 → start Big No screening
      setBigNoStage("q1");
      return;
    }

    if (step < 3) {
      setStep(step + 1);
    } else {
      let url = `/${params.role}/typing-test`;
      const qs: string[] = [];
      if (applicantId) qs.push(`aid=${applicantId}`);
      if (jobId)       qs.push(`job=${jobId}`);
      if (qs.length)   url += `?${qs.join("&")}`;
      router.push(url);
    }
  }

  // Handle a Big No answer
  async function handleBigNoAnswer(stage: BigNoStage, value: string, disqualifies: boolean) {
    if (disqualifies) {
      // Flag the applicant silently in the background then redirect
      setBigNoFlagging(true);
      if (applicantId) {
        await fetch(`/api/applicants/${applicantId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            disqualified: true,
            disqualification_reason: `${stage}:${value}`,
          }),
        }).catch(() => {});
      }
      router.push(`/${params.role}/screened`);
      return;
    }

    const next = nextStage(stage, value);
    if (next === "pass") {
      setBigNoStage("pass");
      setStep(2); // advance to step 2 of main form
    } else {
      setBigNoStage(next);
    }
  }

  function handleBack() { setError(""); setStep(step - 1); }

  const STEPS = ["Basic Info", "Your Setup", "Work Experience"];
  const displayRole = jobDetails?.apply_roles.name ?? ROLE_NAMES[params.role] ?? params.role;

  // ── Render Big No screening ──────────────────────────────────────────────
  if (bigNoStage !== null && bigNoStage !== "pass") {
    if (bigNoFlagging) {
      return (
        <div className="max-w-xl mx-auto px-4 py-24 text-center">
          <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      );
    }

    const q = BIG_NO_QUESTIONS.find((x) => x.stage === bigNoStage);
    if (!q) return null;

    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <p className="section-label mb-2">Quick check</p>
          <p className="text-brand-text-muted text-sm">
            Just a few questions before we continue
          </p>
        </div>

        <div className="card p-8">
          <h2 className="text-white font-semibold text-lg mb-2 leading-snug">
            {q.question}
          </h2>
          {q.subtext && (
            <p className="text-brand-text-muted text-sm mb-6">{q.subtext}</p>
          )}
          {!q.subtext && <div className="mb-6" />}

          <div className="grid gap-3">
            {q.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleBigNoAnswer(q.stage, opt.value, !!opt.disqualifies)}
                className="w-full text-left card px-5 py-4 text-brand-text-body text-sm font-medium
                           hover:border-brand-orange hover:bg-brand-black-card hover:text-white
                           transition-all duration-150"
              >
                <span className="text-brand-orange font-bold mr-3">→</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Render main form ──────────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto px-4 py-10">

      {/* Job banner */}
      {jobDetails && (
        <div className="card-inner p-4 mb-6 border-brand-orange/30">
          <p className="text-xs text-brand-orange font-semibold uppercase tracking-wider mb-1">You're applying for</p>
          <h2 className="text-white font-semibold text-base">{jobDetails.title}</h2>
          <p className="text-brand-text-secondary text-sm">
            {jobDetails.apply_roles.name}
            {jobDetails.apply_categories && (
              <span className="text-brand-text-muted"> · {jobDetails.apply_categories.name}</span>
            )}
          </p>
          {(jobDetails.salary_from || jobDetails.salary_to) && (
            <p className="text-brand-orange text-sm mt-1 tabular-nums font-medium">
              ₱{jobDetails.salary_from?.toLocaleString() ?? "—"}
              {jobDetails.salary_to ? ` – ₱${jobDetails.salary_to.toLocaleString()}` : "+"}/mo
            </p>
          )}
          {jobDetails.description && (
            <p className="text-brand-text-muted text-xs mt-2 leading-relaxed line-clamp-3">
              {jobDetails.description}
            </p>
          )}
        </div>
      )}

      <div className="text-center mb-8">
        <p className="section-label mb-1">{displayRole}</p>
        <h1 className="text-fluid-heading font-bold text-white mb-1">Tell us about yourself</h1>
        <p className="text-brand-text-muted text-sm">Step {step} of 3 — {STEPS[step - 1]}</p>
      </div>

      <div className="flex gap-1.5 mb-8">
        {STEPS.map((_, i) => (
          <div key={i} className={`flex-1 h-1 rounded-full transition-colors duration-150 ${i < step ? "bg-brand-orange" : "bg-brand-black-border"}`} />
        ))}
      </div>

      {error && <div className="error-box mb-5">{error}</div>}

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <F label="First Name" required>
              <input required type="text" placeholder="Maria" value={form.first_name} onChange={(e) => update("first_name", e.target.value)} />
            </F>
            <F label="Last Name">
              <input type="text" placeholder="Santos" value={form.last_name} onChange={(e) => update("last_name", e.target.value)} />
            </F>
          </div>
          <F label="Email Address" required>
            <input required type="email" placeholder="maria@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </F>
          <div className="grid grid-cols-2 gap-4">
            <F label="Facebook">
              <input type="url" placeholder="facebook.com/..." value={form.facebook_link} onChange={(e) => update("facebook_link", e.target.value)} />
            </F>
            <F label="Instagram">
              <input type="url" placeholder="instagram.com/..." value={form.instagram_link} onChange={(e) => update("instagram_link", e.target.value)} />
            </F>
          </div>
          <F label="Phone / WhatsApp" required>
            <input required type="tel" placeholder="+63 912 345 6789" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </F>
          <div className="grid grid-cols-2 gap-4">
            <F label="Age">
              <input type="number" min={18} max={70} placeholder="27" value={form.age} onChange={(e) => update("age", e.target.value)} />
            </F>
            <F label="Location" required>
              <input required type="text" placeholder="Makati, Metro Manila" value={form.location} onChange={(e) => update("location", e.target.value)} />
            </F>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <F label="Sex">
              <select value={form.sex} onChange={(e) => update("sex", e.target.value)}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </F>
            <F label="Married?">
              <select value={form.married} onChange={(e) => update("married", e.target.value)}>
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </F>
            <F label="Kids?">
              <select value={form.kids} onChange={(e) => update("kids", e.target.value)}>
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </F>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <F label="PC or Laptop?">
              <select value={form.device_type} onChange={(e) => update("device_type", e.target.value)}>
                <option value="">Select</option>
                <option value="pc">PC (Desktop)</option>
                <option value="laptop">Laptop</option>
              </select>
            </F>
            <F label="Brand">
              <input type="text" placeholder="Dell, ASUS, Apple..." value={form.device_brand} onChange={(e) => update("device_brand", e.target.value)} />
            </F>
          </div>
          <F label="Internet Provider">
            <input type="text" placeholder="PLDT, Globe, Converge..." value={form.internet_provider} onChange={(e) => update("internet_provider", e.target.value)} />
          </F>
          <div className="card-inner p-4 text-sm mt-2">
            <p className="text-brand-text-tertiary mb-2">We work with Australian businesses, so a stable internet connection is important for remote roles.</p>
            {speedTesting && (
              <div className="flex items-center gap-2 text-brand-text-secondary">
                <div className="w-3 h-3 border border-brand-orange border-t-transparent rounded-full animate-spin" />
                Testing your connection speed...
              </div>
            )}
            {!speedTesting && internetMbps !== null && (
              <div className="flex items-center gap-2">
                <span className={`font-bold tabular-nums ${internetMbps >= 10 ? "text-green-400" : internetMbps >= 5 ? "text-yellow-400" : "text-red-400"}`}>
                  {internetMbps} Mbps
                </span>
                <span className="text-brand-text-muted">download speed detected</span>
                {internetMbps < 5 && <span className="text-red-400 text-xs">(may affect remote work)</span>}
              </div>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <F label="Current / Last Job Title">
              <input type="text" placeholder="Virtual Assistant" value={form.current_job_title} onChange={(e) => update("current_job_title", e.target.value)} />
            </F>
            <F label="Years of Experience">
              <select value={form.years_experience} onChange={(e) => update("years_experience", e.target.value)}>
                <option value="">Select</option>
                <option value="less-than-1">Less than 1 year</option>
                <option value="1">1 year</option>
                <option value="2-3">2–3 years</option>
                <option value="4-5">4–5 years</option>
                <option value="5+">5+ years</option>
              </select>
            </F>
          </div>
          <F label="Previous Employers / Clients">
            <textarea rows={2} className="resize-none" placeholder="List companies or clients you've worked for..." value={form.previous_employers} onChange={(e) => update("previous_employers", e.target.value)} />
          </F>
          <F label="Skills & Tools">
            <textarea rows={2} className="resize-none" placeholder="Google Workspace, Canva, HubSpot, Trello..." value={form.skills_tools} onChange={(e) => update("skills_tools", e.target.value)} />
          </F>
          <F label="Software You Use">
            <textarea rows={2} className="resize-none" placeholder="Slack, Zoom, Notion, Asana, QuickBooks..." value={form.software_used} onChange={(e) => update("software_used", e.target.value)} />
          </F>
          <F label="Describe Your Day-to-Day Tasks">
            <textarea rows={3} className="resize-none" placeholder="What do you typically do in your current or most recent role?" value={form.task_description} onChange={(e) => update("task_description", e.target.value)} />
          </F>
        </div>
      )}

      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <button onClick={handleBack} className="flex-1 btn-ghost py-3">
            ← Back
          </button>
        )}
        <button onClick={handleNext} disabled={saving} className="flex-1 btn-primary py-3">
          {saving ? "Saving..." : "Save & Continue →"}
        </button>
      </div>

      <p className="text-center text-brand-text-muted text-xs mt-4">
        Your info is saved automatically as you progress.
      </p>
    </div>
  );
}

function F({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label>
        {label}{required && <span className="text-brand-orange ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function ApplyPage() {
  return <Suspense><ApplyInner /></Suspense>;
}
