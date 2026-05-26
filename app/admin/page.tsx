"use client";

import { useState, useEffect, useCallback } from "react";

type Candidate = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  salary_expectation_php: number;
  payment_methods: string[];
  paypal_email: string | null;
  wise_email: string | null;
  cv_url: string;
  cv_type: "pdf" | "gdoc";
  differentiator: string;
  submitted_at: string;
  status: string;
  apply_quiz_sessions: {
    id: string;
    score: number;
    apply_roles: { name: string; slug: string };
  };
};

const STATUSES = ["new", "shortlisted", "interviewed", "rejected"];

const STATUS_COLORS: Record<string, string> = {
  new:         "bg-blue-900/40 text-blue-300 border border-blue-700/40",
  shortlisted: "bg-green-900/40 text-green-300 border border-green-700/40",
  interviewed: "bg-yellow-900/40 text-yellow-300 border border-yellow-700/40",
  rejected:    "bg-red-900/40 text-red-300 border border-red-700/40",
};

export default function AdminPage() {
  const [authed, setAuthed]         = useState<boolean | null>(null);
  const [password, setPassword]     = useState("");
  const [loginError, setLoginError] = useState("");
  const [logging, setLogging]       = useState(false);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading]       = useState(false);
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Check auth on mount via a known-protected endpoint
  useEffect(() => {
    fetch("/api/admin/candidates?_check=1")
      .then((r) => setAuthed(r.status !== 401))
      .catch(() => setAuthed(false));
  }, []);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterRole)   params.set("role",   filterRole);
    if (filterStatus) params.set("status", filterStatus);
    const res = await fetch(`/api/admin/candidates?${params}`);
    if (res.ok) setCandidates(await res.json());
    setLoading(false);
  }, [filterRole, filterStatus]);

  useEffect(() => {
    if (authed) fetchCandidates();
  }, [authed, fetchCandidates]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLogging(true);
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
    } else {
      setLoginError("Incorrect password.");
    }
    setLogging(false);
  }

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setAuthed(false);
    setCandidates([]);
  }

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id);
    await fetch(`/api/admin/candidates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
    setUpdatingId(null);
  }

  function exportCSV() {
    const params = new URLSearchParams();
    if (filterRole)   params.set("role",   filterRole);
    if (filterStatus) params.set("status", filterStatus);
    window.open(`/api/admin/export?${params}`, "_blank");
  }

  // ── Login screen ─────────────────────────────────────────────────────────
  if (authed === null) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-4 h-4 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto px-4 py-24">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Admin Login</h1>
        {loginError && (
          <p className="text-red-400 text-sm mb-4 text-center">{loginError}</p>
        )}
        <form onSubmit={login} className="space-y-4">
          <div>
            <label>Password</label>
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
            />
          </div>
          <button
            type="submit"
            disabled={logging}
            className="w-full bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {logging ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  const roles = Array.from(
    new Set(candidates.map((c) => c.apply_quiz_sessions?.apply_roles?.slug).filter(Boolean))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Candidates</h1>
          <p className="text-[#555] text-sm mt-0.5">{candidates.length} total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={exportCSV}
            className="bg-[#1c1c1c] hover:bg-[#2a2a2a] border border-[#2a2a2a] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={logout}
            className="text-[#555] hover:text-red-400 text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="w-auto text-sm py-2 px-3"
        >
          <option value="">All roles</option>
          {roles.map((slug) => {
            const c = candidates.find((x) => x.apply_quiz_sessions?.apply_roles?.slug === slug);
            return (
              <option key={slug} value={slug}>
                {c?.apply_quiz_sessions?.apply_roles?.name ?? slug}
              </option>
            );
          })}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-auto text-sm py-2 px-3"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

        <button
          onClick={fetchCandidates}
          className="bg-[#1c1c1c] border border-[#2a2a2a] text-[#a1a1aa] text-sm px-4 py-2 rounded-lg hover:border-[#f97316] transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-6 h-6 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-16 text-[#555]">No candidates found.</div>
      ) : (
        <div className="space-y-2">
          {candidates.map((c) => (
            <div
              key={c.id}
              className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden"
            >
              {/* Row */}
              <button
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                className="w-full text-left px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-2 hover:bg-[#1c1c1c] transition-colors"
              >
                <div className="flex-1 min-w-[180px]">
                  <p className="text-white font-medium text-sm">{c.full_name}</p>
                  <p className="text-[#555] text-xs">{c.email}</p>
                </div>
                <div className="text-[#a1a1aa] text-sm min-w-[140px]">
                  {c.apply_quiz_sessions?.apply_roles?.name ?? "—"}
                </div>
                <div className="text-[#f97316] font-bold text-sm min-w-[60px]">
                  {c.apply_quiz_sessions?.score ?? "—"}/10
                </div>
                <div className="text-[#a1a1aa] text-sm min-w-[100px]">
                  ₱{Number(c.salary_expectation_php).toLocaleString()}
                </div>
                <div className="text-[#777] text-xs min-w-[100px]">
                  {new Date(c.submitted_at).toLocaleDateString("en-AU")}
                </div>
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[c.status] ?? ""}`}>
                    {c.status}
                  </span>
                </div>
                <div className="text-[#555] text-xs ml-auto">
                  {expanded === c.id ? "▲" : "▼"}
                </div>
              </button>

              {/* Expanded detail */}
              {expanded === c.id && (
                <div className="px-5 pb-5 border-t border-[#2a2a2a] pt-4 grid sm:grid-cols-2 gap-4">
                  <div className="space-y-3 text-sm">
                    <Detail label="Phone"    value={c.phone} />
                    <Detail label="Location" value={c.location} />
                    <Detail label="Payment"  value={c.payment_methods.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(", ")} />
                    {c.paypal_email && <Detail label="PayPal" value={c.paypal_email} />}
                    {c.wise_email   && <Detail label="Wise"   value={c.wise_email} />}
                    <div>
                      <p className="text-[#555] text-xs uppercase tracking-wide mb-1">What makes them different</p>
                      <p className="text-[#e5e5e5]">{c.differentiator}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[#555] text-xs uppercase tracking-wide mb-2">CV</p>
                      <a
                        href={c.cv_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#1c1c1c] border border-[#2a2a2a] hover:border-[#f97316] px-4 py-2 rounded-lg text-sm text-[#f97316] transition-colors"
                      >
                        {c.cv_type === "pdf" ? "📄 View PDF" : "📝 Open Google Doc"}
                      </a>
                    </div>

                    <div>
                      <p className="text-[#555] text-xs uppercase tracking-wide mb-2">Status</p>
                      <select
                        value={c.status}
                        disabled={updatingId === c.id}
                        onChange={(e) => updateStatus(c.id, e.target.value)}
                        className="w-full text-sm py-2 px-3 disabled:opacity-50"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s} className="capitalize">
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[#555] text-xs uppercase tracking-wide">{label}:</span>{" "}
      <span className="text-[#e5e5e5]">{value}</span>
    </div>
  );
}
