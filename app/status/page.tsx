"use client";

import { useState } from "react";
import Link from "next/link";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new:         { label: "Application received",  color: "text-blue-400" },
  shortlisted: { label: "You've been shortlisted!", color: "text-green-400" },
  interviewed: { label: "Interview stage",        color: "text-yellow-400" },
  rejected:    { label: "Not moving forward",     color: "text-red-400" },
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
  const [email, setEmail]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState(false);
  const [apps, setApps]           = useState<Application[]>([]);
  const [error, setError]         = useState("");

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
        <p className="text-[#f97316] text-xs font-semibold uppercase tracking-widest mb-3">Application Status</p>
        <h1 className="text-3xl font-bold text-white mb-3">Check your application</h1>
        <p className="text-[#a1a1aa] text-sm">
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
          className="bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-60 text-white font-bold px-5 py-3 rounded-xl transition-colors shrink-0"
        >
          {loading ? "..." : "Check"}
        </button>
      </form>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-400 rounded-xl px-4 py-3 mb-6 text-sm">{error}</div>
      )}

      {searched && apps.length === 0 && (
        <div className="text-center py-10">
          <p className="text-[#a1a1aa] mb-2">No applications found for that email.</p>
          <p className="text-[#555] text-sm">Make sure you used the same email address when applying.</p>
          <Link href="/" className="text-[#f97316] text-sm mt-4 inline-block">← Apply now</Link>
        </div>
      )}

      {apps.length > 0 && (
        <div className="space-y-4">
          {apps.map((app) => {
            const st = STATUS_LABELS[app.status] ?? { label: app.status, color: "text-[#a1a1aa]" };
            const role = app.apply_quiz_sessions?.apply_roles;
            return (
              <div key={app.id} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-white font-semibold text-base mb-0.5">{role?.name ?? "Application"}</p>
                    <p className="text-[#555] text-xs">
                      Submitted {new Date(app.submitted_at).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${st.color}`}>{st.label}</p>
                    {app.apply_quiz_sessions?.score != null && (
                      <p className="text-[#555] text-xs mt-0.5">Quiz score: {app.apply_quiz_sessions.score}/10</p>
                    )}
                  </div>
                </div>

                {app.status === "new" && (
                  <p className="text-[#555] text-xs mt-3">
                    We review applications within 3–5 business days. We will be in touch if you are a strong fit.
                  </p>
                )}
                {app.status === "shortlisted" && (
                  <p className="text-[#a1a1aa] text-xs mt-3">
                    Great news! Our team will be in touch shortly to arrange the next steps.
                  </p>
                )}
                {app.status === "rejected" && (
                  <p className="text-[#555] text-xs mt-3">
                    Thank you for applying. We will keep your details on file and may reach out for future openings.
                  </p>
                )}
              </div>
            );
          })}
          <p className="text-center text-[#555] text-xs mt-4">
            Questions? Email <a href="mailto:hello@rapidtal.com" className="text-[#f97316]">hello@rapidtal.com</a>
          </p>
        </div>
      )}
    </div>
  );
}
