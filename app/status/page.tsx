"use client";

import { useState } from "react";
import Link from "next/link";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new:         { label: "Application received",   color: "text-blue-400" },
  shortlisted: { label: "You've been shortlisted!", color: "text-green-400" },
  interviewed: { label: "Interview stage",         color: "text-yellow-400" },
  rejected:    { label: "Not moving forward",      color: "text-red-400" },
};

type Application = {
  id: string;
  status: string;
  submitted_at: string;
  apply_quiz_sessions: {
    score: number;
    apply_roles: { name: string; slug: string };
  } | null;
};

export default function StatusPage() {
  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const [apps, setApps]         = useState<Application[]>([]);
  const [error, setError]       = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSearched(false);
    const trimmed = email.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/status?email=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Lookup failed."); return; }
      setApps(data.applications ?? []);
      setSearched(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <p className="section-label mb-3">Application Status</p>
        <h1 className="text-fluid-heading font-bold text-white mb-3">Check your application</h1>
        <p className="text-brand-text-secondary text-sm">
          Enter the email address you used when applying. No account needed.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary px-5 py-3 shrink-0"
        >
          {loading ? "..." : "Check"}
        </button>
      </form>

      {error && <div className="error-box mb-6">{error}</div>}

      {searched && apps.length === 0 && (
        <div className="text-center py-10">
          <p className="text-brand-text-secondary mb-2">No applications found for that email.</p>
          <p className="text-brand-text-muted text-sm">Make sure you used the same email address when applying.</p>
          <Link href="/" className="text-brand-orange text-sm mt-4 inline-block">← Apply now</Link>
        </div>
      )}

      {apps.length > 0 && (
        <div className="space-y-4">
          {apps.map((app) => {
            const st   = STATUS_LABELS[app.status] ?? { label: app.status, color: "text-brand-text-secondary" };
            const role = app.apply_quiz_sessions?.apply_roles;
            return (
              <div key={app.id} className="card p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-white font-semibold text-base mb-0.5">{role?.name ?? "Application"}</p>
                    <p className="text-brand-text-muted text-xs">
                      Submitted {new Date(app.submitted_at).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${st.color}`}>{st.label}</p>
                    {app.apply_quiz_sessions?.score != null && (
                      <p className="text-brand-text-muted text-xs mt-0.5 tabular-nums">Quiz score: {app.apply_quiz_sessions.score}/10</p>
                    )}
                  </div>
                </div>

                {app.status === "new" && (
                  <p className="text-brand-text-muted text-xs mt-3">
                    We review applications within 3–5 business days. We will be in touch if you are a strong fit.
                  </p>
                )}
                {app.status === "shortlisted" && (
                  <p className="text-brand-text-secondary text-xs mt-3">
                    Great news! Our team will be in touch shortly to arrange the next steps.
                  </p>
                )}
                {app.status === "rejected" && (
                  <p className="text-brand-text-muted text-xs mt-3">
                    Thank you for applying. We will keep your details on file and may reach out for future openings.
                  </p>
                )}
              </div>
            );
          })}
          <p className="text-center text-brand-text-muted text-xs mt-4">
            Questions? Email <a href="mailto:hello@rapidtal.com" className="text-brand-orange">hello@rapidtal.com</a>
          </p>
        </div>
      )}
    </div>
  );
}
