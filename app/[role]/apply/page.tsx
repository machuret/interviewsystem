"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

const ROLE_NAMES: Record<string, string> = {
  "marketing":           "Marketing Specialist",
  "sales":               "Sales Representative",
  "virtual-assistant":   "Virtual Assistant",
  "executive-assistant": "Executive Assistant",
};

type Form = {
  first_name: string; last_name: string; email: string;
  facebook_link: string; instagram_link: string; phone: string;
  age: string; location: string; sex: string; married: string; kids: string;
  device_type: string; device_brand: string; internet_provider: string;
  current_job_title: string; years_experience: string; previous_employers: string;
  skills_tools: string; software_used: string; task_description: string;
};

const EMPTY_FORM: Form = {
  first_name: "", last_name: "", email: "",
  facebook_link: "", instagram_link: "", phone: "",
  age: "", location: "", sex: "", married: "", kids: "",
  device_type: "", device_brand: "", internet_provider: "",
  current_job_title: "", years_experience: "", previous_employers: "",
  skills_tools: "", software_used: "", task_description: "",
};

export default function ApplyPage() {
  const params = useParams<{ role: string }>();
  const router = useRouter();

  const [step, setStep]               = useState(1);
  const [form, setForm]               = useState<Form>(EMPTY_FORM);
  const [applicantId, setApplicantId] = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");
  const [internetMbps, setInternetMbps] = useState<number | null>(null);
  const [speedTesting, setSpeedTesting] = useState(false);
  const speedDoneRef = useRef(false);

  const roleName = ROLE_NAMES[params.role] ?? params.role;

  // Run internet speed test when entering step 2
  useEffect(() => {
    if (step !== 2 || speedDoneRef.current) return;
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
  }, [step, applicantId]);

  function update(field: keyof Form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function saveStep() {
    setError("");
    setSaving(true);
    try {
      let res: Response;
      if (!applicantId) {
        // Create new applicant record
        res = await fetch("/api/applicants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role_slug: params.role, ...form }),
        });
      } else {
        // Update existing record
        res = await fetch(`/api/applicants/${applicantId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save. Please try again.");
        setSaving(false);
        return false;
      }

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
    // Validate required fields per step
    if (step === 1) {
      if (!form.first_name.trim()) { setError("First name is required."); return; }
      if (!form.email.trim())      { setError("Email is required."); return; }
      if (!form.phone.trim())      { setError("Phone is required."); return; }
      if (!form.location.trim())   { setError("Location is required."); return; }
    }

    const ok = await saveStep();
    if (!ok) return;

    if (step < 3) {
      setStep(step + 1);
    } else {
      // All steps done — go to typing test, then quiz
      const aid = applicantId;
      router.push(`/${params.role}/typing-test${aid ? `?aid=${aid}` : ""}`);
    }
  }

  function handleBack() {
    setError("");
    setStep(step - 1);
  }

  // ── Progress indicator ───────────────────────────────────────────────────
  const STEPS = ["Basic Info", "Your Setup", "Work Experience"];

  return (
    <div className="max-w-xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-[#f97316] text-xs font-semibold uppercase tracking-widest mb-1">{roleName}</p>
        <h1 className="text-2xl font-bold text-white mb-1">Tell us about yourself</h1>
        <p className="text-[#555] text-sm">Step {step} of 3 — {STEPS[step - 1]}</p>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1.5 mb-8">
        {STEPS.map((_, i) => (
          <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i < step ? "bg-[#f97316]" : "bg-[#2a2a2a]"}`} />
        ))}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-400 rounded-xl px-4 py-3 mb-5 text-sm">
          {error}
        </div>
      )}

      {/* ── Step 1: Basic Info ──────────────────────────────────── */}
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

      {/* ── Step 2: Your Setup ──────────────────────────────────── */}
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

          <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-4 text-sm mt-2">
            <p className="text-[#777] mb-2">We work with Australian businesses, so a stable internet connection is important for remote roles.</p>
            {speedTesting && (
              <div className="flex items-center gap-2 text-[#a1a1aa]">
                <div className="w-3 h-3 border border-[#f97316] border-t-transparent rounded-full animate-spin" />
                Testing your connection speed...
              </div>
            )}
            {!speedTesting && internetMbps !== null && (
              <div className="flex items-center gap-2">
                <span className={`font-bold ${internetMbps >= 10 ? "text-green-400" : internetMbps >= 5 ? "text-yellow-400" : "text-red-400"}`}>
                  {internetMbps} Mbps
                </span>
                <span className="text-[#555]">download speed detected</span>
                {internetMbps < 5 && <span className="text-red-400 text-xs">(may affect remote work)</span>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 3: Work Experience ─────────────────────────────── */}
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

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <button
            onClick={handleBack}
            className="flex-1 bg-[#1c1c1c] border border-[#2a2a2a] text-[#a1a1aa] hover:text-white font-medium py-3 rounded-xl transition-colors"
          >
            ← Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={saving}
          className="flex-1 bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
        >
          {saving ? "Saving..." : step === 3 ? "Save & Continue →" : "Save & Continue →"}
        </button>
      </div>

      <p className="text-center text-[#555] text-xs mt-4">
        Your info is saved automatically as you progress.
      </p>
    </div>
  );
}

function F({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[#a1a1aa] text-sm mb-1">
        {label}{required && <span className="text-[#f97316] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
