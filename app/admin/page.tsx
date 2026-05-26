"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = { id: string; name: string; slug: string };

type Category = {
  id: string;
  role_id: string;
  name: string;
  slug: string;
  active: boolean;
};

type Question = {
  id: string;
  role_id: string;
  category_id: string | null;
  question_text: string;
  options: string[];
  correct_answer_index: number;
  active: boolean;
  apply_roles?: { name: string; slug: string };
  apply_categories?: { name: string; slug: string } | null;
};

type Candidate = {
  id: string;
  full_name: string;
  last_name: string | null;
  email: string;
  phone: string;
  location: string;
  age: number | null;
  sex: string | null;
  married: boolean | null;
  kids: boolean | null;
  device_type: string | null;
  device_brand: string | null;
  internet_provider: string | null;
  current_job_title: string | null;
  years_experience: string | null;
  previous_employers: string | null;
  skills_tools: string | null;
  software_used: string | null;
  task_description: string | null;
  facebook_link: string | null;
  instagram_link: string | null;
  salary_expectation_php: number;
  payment_methods: string[];
  paypal_email: string | null;
  wise_email: string | null;
  cv_url: string;
  cv_type: "pdf" | "gdoc";
  differentiator: string;
  video_intro_url: string | null;
  practical_response: string | null;
  writing_sample: string | null;
  submitted_at: string;
  status: string;
  apply_quiz_sessions: {
    id: string;
    score: number;
    passed: boolean;
    tab_switches: number | null;
    suspicious_answer_count: number | null;
    apply_roles: { name: string; slug: string };
  } | null;
};

type Note = { id: string; note: string; created_at: string };

type DashboardData = {
  funnel: { started_form: number; took_quiz: number; passed_quiz: number; applied: number };
  roles: { slug: string; name: string; started_form: number; took_quiz: number; passed: number; applied: number; avg_score: number | null }[];
  status_counts: Record<string, number>;
};

type AnalyticsQuestion = {
  id: string;
  question_text: string;
  role: { name: string; slug: string } | null;
  correct: number;
  total: number;
  error_rate: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES = ["new", "shortlisted", "interviewed", "rejected"] as const;
type Status = typeof STATUSES[number];

const STATUS_COLORS: Record<string, string> = {
  new:         "bg-blue-900/40 text-blue-300 border border-blue-700/40",
  shortlisted: "bg-green-900/40 text-green-300 border border-green-700/40",
  interviewed: "bg-yellow-900/40 text-yellow-300 border border-yellow-700/40",
  rejected:    "bg-red-900/40 text-red-300 border border-red-700/40",
};

const STATUS_HEADER_COLORS: Record<string, string> = {
  new:         "border-blue-700/50 text-blue-300",
  shortlisted: "border-green-700/50 text-green-300",
  interviewed: "border-yellow-700/50 text-yellow-300",
  rejected:    "border-red-700/50 text-red-300",
};

const ROLE_LIST: Role[] = [
  { id: "11111111-0000-0000-0000-000000000001", name: "Marketing Specialist",  slug: "marketing" },
  { id: "11111111-0000-0000-0000-000000000002", name: "Sales Representative",  slug: "sales" },
  { id: "11111111-0000-0000-0000-000000000003", name: "Virtual Assistant",     slug: "virtual-assistant" },
  { id: "11111111-0000-0000-0000-000000000004", name: "Executive Assistant",   slug: "executive-assistant" },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authed, setAuthed]         = useState<boolean | null>(null);
  const [password, setPassword]     = useState("");
  const [loginError, setLoginError] = useState("");
  const [logging, setLogging]       = useState(false);
  const [tab, setTab]               = useState<"dashboard" | "candidates" | "analytics" | "categories" | "questions">("dashboard");

  useEffect(() => {
    fetch("/api/admin/candidates?_check=1")
      .then((r) => setAuthed(r.status !== 401))
      .catch(() => setAuthed(false));
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLogging(true);
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) setAuthed(true);
    else setLoginError("Incorrect password.");
    setLogging(false);
  }

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setAuthed(false);
  }

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
        {loginError && <p className="text-red-400 text-sm mb-4 text-center">{loginError}</p>}
        <form onSubmit={login} className="space-y-4">
          <div>
            <label>Password</label>
            <input type="password" required autoFocus value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter admin password" />
          </div>
          <button type="submit" disabled={logging} className="w-full bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors">
            {logging ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">RapidTal Admin</h1>
        <button onClick={logout} className="text-[#555] hover:text-red-400 text-sm px-4 py-2 rounded-lg transition-colors">Logout</button>
      </div>

      <div className="flex gap-1 mb-8 bg-[#141414] border border-[#2a2a2a] rounded-xl p-1 w-fit flex-wrap">
        {(["dashboard", "candidates", "analytics", "categories", "questions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? "bg-[#f97316] text-white" : "text-[#777] hover:text-white"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "dashboard"   && <DashboardTab />}
      {tab === "candidates"  && <CandidatesTab />}
      {tab === "analytics"   && <AnalyticsTab />}
      {tab === "categories"  && <CategoriesTab />}
      {tab === "questions"   && <QuestionsTab />}
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab() {
  const [data, setData]     = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data) return <p className="text-red-400">Failed to load dashboard.</p>;

  const { funnel, roles, status_counts } = data;
  const funnelSteps = [
    { label: "Started Application", value: funnel.started_form },
    { label: "Took Quiz",           value: funnel.took_quiz },
    { label: "Passed Quiz",         value: funnel.passed_quiz },
    { label: "Submitted Application", value: funnel.applied },
  ];
  const maxFunnel = Math.max(...funnelSteps.map((s) => s.value), 1);

  return (
    <div className="space-y-8">
      {/* Funnel */}
      <section>
        <h2 className="text-white font-semibold text-lg mb-4">Funnel</h2>
        <div className="grid sm:grid-cols-4 gap-4">
          {funnelSteps.map((s, i) => (
            <div key={i} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
              <p className="text-3xl font-black text-[#f97316] mb-1">{s.value}</p>
              <p className="text-[#a1a1aa] text-sm mb-3">{s.label}</p>
              <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                <div className="h-1.5 bg-[#f97316] rounded-full" style={{ width: `${(s.value / maxFunnel) * 100}%` }} />
              </div>
              {i > 0 && funnelSteps[i - 1].value > 0 && (
                <p className="text-[#555] text-xs mt-1">{Math.round((s.value / funnelSteps[i - 1].value) * 100)}% of prev</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Status breakdown */}
      <section>
        <h2 className="text-white font-semibold text-lg mb-4">Candidates by Status</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATUSES.map((s) => (
            <div key={s} className={`bg-[#141414] border rounded-xl p-4 ${STATUS_HEADER_COLORS[s]}`}>
              <p className="text-2xl font-black mb-1">{status_counts[s] ?? 0}</p>
              <p className="text-sm capitalize">{s}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Per-role table */}
      {roles.length > 0 && (
        <section>
          <h2 className="text-white font-semibold text-lg mb-4">By Role</h2>
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a] text-[#555] text-xs uppercase">
                  <th className="text-left px-4 py-3 font-medium">Role</th>
                  <th className="text-right px-4 py-3 font-medium">Form</th>
                  <th className="text-right px-4 py-3 font-medium">Quiz</th>
                  <th className="text-right px-4 py-3 font-medium">Passed</th>
                  <th className="text-right px-4 py-3 font-medium">Applied</th>
                  <th className="text-right px-4 py-3 font-medium">Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.slug} className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#1c1c1c]">
                    <td className="px-4 py-3 text-white font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-right text-[#a1a1aa]">{r.started_form}</td>
                    <td className="px-4 py-3 text-right text-[#a1a1aa]">{r.took_quiz}</td>
                    <td className="px-4 py-3 text-right text-[#a1a1aa]">{r.passed}</td>
                    <td className="px-4 py-3 text-right text-[#a1a1aa]">{r.applied}</td>
                    <td className="px-4 py-3 text-right text-[#f97316] font-bold">{r.avg_score ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Candidates Tab ───────────────────────────────────────────────────────────

function CandidatesTab() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading]       = useState(false);
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [viewMode, setViewMode]     = useState<"list" | "kanban">("list");
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const dragItem                    = useRef<{ id: string; status: string } | null>(null);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterRole)   params.set("role",   filterRole);
    if (filterStatus && viewMode === "list") params.set("status", filterStatus);
    const res = await fetch(`/api/admin/candidates?${params}`);
    if (res.ok) setCandidates(await res.json());
    setLoading(false);
  }, [filterRole, filterStatus, viewMode]);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id);
    await fetch(`/api/admin/candidates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    setUpdatingId(null);
  }

  function exportCSV() {
    const params = new URLSearchParams();
    if (filterRole)   params.set("role",   filterRole);
    if (filterStatus) params.set("status", filterStatus);
    window.open(`/api/admin/export?${params}`, "_blank");
  }

  // Drag-and-drop for Kanban
  function onDragStart(id: string, status: string) {
    dragItem.current = { id, status };
  }

  function onDrop(targetStatus: string) {
    if (!dragItem.current || dragItem.current.status === targetStatus) return;
    updateStatus(dragItem.current.id, targetStatus);
    dragItem.current = null;
  }

  const roles = Array.from(new Set(candidates.map((c) => c.apply_quiz_sessions?.apply_roles?.slug).filter(Boolean)));

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <p className="text-[#555] text-sm">{candidates.length} candidates</p>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === "list" ? "kanban" : "list")}
            className="bg-[#1c1c1c] hover:bg-[#2a2a2a] border border-[#2a2a2a] text-[#a1a1aa] text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          >
            {viewMode === "list" ? "⊞ Kanban" : "≡ List"}
          </button>
          <button onClick={exportCSV} className="bg-[#1c1c1c] hover:bg-[#2a2a2a] border border-[#2a2a2a] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-auto text-sm py-2 px-3">
          <option value="">All roles</option>
          {roles.map((slug) => {
            const c = candidates.find((x) => x.apply_quiz_sessions?.apply_roles?.slug === slug);
            return <option key={slug} value={slug!}>{c?.apply_quiz_sessions?.apply_roles?.name ?? slug}</option>;
          })}
        </select>
        {viewMode === "list" && (
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-auto text-sm py-2 px-3">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        )}
        <button onClick={fetchCandidates} className="bg-[#1c1c1c] border border-[#2a2a2a] text-[#a1a1aa] text-sm px-4 py-2 rounded-lg hover:border-[#f97316] transition-colors">
          Refresh
        </button>
      </div>

      {loading ? <Spinner /> : viewMode === "list"
        ? <ListView candidates={candidates} expanded={expanded} setExpanded={setExpanded} updatingId={updatingId} updateStatus={updateStatus} />
        : <KanbanView candidates={candidates} updateStatus={updateStatus} onDragStart={onDragStart} onDrop={onDrop} />
      }
    </div>
  );
}

// ─── List View ─────────────────────────────────────────────────────────────────

function ListView({ candidates, expanded, setExpanded, updatingId, updateStatus }: {
  candidates: Candidate[];
  expanded: string | null;
  setExpanded: (id: string | null) => void;
  updatingId: string | null;
  updateStatus: (id: string, status: string) => void;
}) {
  if (candidates.length === 0) return <p className="text-center py-16 text-[#555]">No candidates found.</p>;

  return (
    <div className="space-y-2">
      {candidates.map((c) => (
        <CandidateRow key={c.id} c={c} expanded={expanded === c.id} onToggle={() => setExpanded(expanded === c.id ? null : c.id)} updatingId={updatingId} updateStatus={updateStatus} />
      ))}
    </div>
  );
}

function CandidateRow({ c, expanded, onToggle, updatingId, updateStatus }: {
  c: Candidate;
  expanded: boolean;
  onToggle: () => void;
  updatingId: string | null;
  updateStatus: (id: string, status: string) => void;
}) {
  const isSuspicious = (c.apply_quiz_sessions?.suspicious_answer_count ?? 0) > 0 || (c.apply_quiz_sessions?.tab_switches ?? 0) > 0;

  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full text-left px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-2 hover:bg-[#1c1c1c] transition-colors">
        <div className="flex-1 min-w-[180px]">
          <div className="flex items-center gap-2">
            <p className="text-white font-medium text-sm">{c.full_name}</p>
            {isSuspicious && (
              <span title={`Suspicious: ${c.apply_quiz_sessions?.suspicious_answer_count ?? 0} fast answers, ${c.apply_quiz_sessions?.tab_switches ?? 0} tab switches`}
                className="text-xs bg-yellow-900/40 text-yellow-400 border border-yellow-700/40 rounded-full px-1.5 py-0.5 leading-none">
                ⚠ suspicious
              </span>
            )}
          </div>
          <p className="text-[#555] text-xs">{c.email}</p>
        </div>
        <div className="text-[#a1a1aa] text-sm min-w-[140px]">{c.apply_quiz_sessions?.apply_roles?.name ?? "—"}</div>
        <div className="text-[#f97316] font-bold text-sm min-w-[60px]">{c.apply_quiz_sessions?.score ?? "—"}/10</div>
        <div className="text-[#a1a1aa] text-sm min-w-[100px]">₱{Number(c.salary_expectation_php).toLocaleString()}</div>
        <div className="text-[#777] text-xs min-w-[100px]">{new Date(c.submitted_at).toLocaleDateString("en-AU")}</div>
        <div><span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[c.status] ?? ""}`}>{c.status}</span></div>
        <div className="text-[#555] text-xs ml-auto">{expanded ? "▲" : "▼"}</div>
      </button>

      {expanded && <CandidateDetail c={c} updatingId={updatingId} updateStatus={updateStatus} />}
    </div>
  );
}

function CandidateDetail({ c, updatingId, updateStatus }: { c: Candidate; updatingId: string | null; updateStatus: (id: string, status: string) => void }) {
  const [notes, setNotes]       = useState<Note[]>([]);
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [newNote, setNewNote]   = useState("");
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/candidates/${c.id}/notes`)
      .then((r) => r.json())
      .then((d) => { setNotes(Array.isArray(d) ? d : []); setNotesLoaded(true); })
      .catch(() => setNotesLoaded(true));
  }, [c.id]);

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;
    setAddingNote(true);
    const res = await fetch(`/api/admin/candidates/${c.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: newNote.trim() }),
    });
    if (res.ok) {
      const n = await res.json();
      setNotes((prev) => [n, ...prev]);
      setNewNote("");
    }
    setAddingNote(false);
  }

  const isSuspicious = (c.apply_quiz_sessions?.suspicious_answer_count ?? 0) > 0 || (c.apply_quiz_sessions?.tab_switches ?? 0) > 0;

  return (
    <div className="px-5 pb-5 border-t border-[#2a2a2a] pt-4">
      <div className="grid sm:grid-cols-3 gap-6">

        {/* Col 1: Personal */}
        <div className="space-y-2 text-sm">
          <p className="text-[#f97316] text-xs font-semibold uppercase tracking-widest mb-3">Personal</p>
          <Detail label="Phone"    value={c.phone} />
          <Detail label="Location" value={c.location} />
          {c.age        && <Detail label="Age"      value={String(c.age)} />}
          {c.sex        && <Detail label="Sex"      value={c.sex} />}
          {c.married != null && <Detail label="Married" value={c.married ? "Yes" : "No"} />}
          {c.kids != null    && <Detail label="Kids"    value={c.kids ? "Yes" : "No"} />}
          {c.facebook_link   && <Detail label="Facebook" value={c.facebook_link} link />}
          {c.instagram_link  && <Detail label="Instagram" value={c.instagram_link} link />}
          <p className="text-[#f97316] text-xs font-semibold uppercase tracking-widest mb-1 mt-4">Setup</p>
          {c.device_type     && <Detail label="Device"   value={`${c.device_type} — ${c.device_brand ?? ""}`} />}
          {c.internet_provider && <Detail label="Internet" value={c.internet_provider} />}
          <p className="text-[#f97316] text-xs font-semibold uppercase tracking-widest mb-1 mt-4">Experience</p>
          {c.current_job_title  && <Detail label="Title"    value={c.current_job_title} />}
          {c.years_experience   && <Detail label="Exp"      value={c.years_experience} />}
          {c.previous_employers && <Detail label="Employers" value={c.previous_employers} />}
          {c.skills_tools       && <Detail label="Skills"   value={c.skills_tools} />}
          {c.software_used      && <Detail label="Software" value={c.software_used} />}
        </div>

        {/* Col 2: Application + CV + Suspicious */}
        <div className="space-y-4 text-sm">
          <p className="text-[#f97316] text-xs font-semibold uppercase tracking-widest mb-3">Application</p>
          <Detail label="Salary"  value={`₱${Number(c.salary_expectation_php).toLocaleString()}/mo`} />
          <Detail label="Payment" value={c.payment_methods.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(", ")} />
          {c.paypal_email && <Detail label="PayPal" value={c.paypal_email} />}
          {c.wise_email   && <Detail label="Wise"   value={c.wise_email} />}
          <div>
            <p className="text-[#555] text-xs uppercase tracking-wide mb-1">What makes them different</p>
            <p className="text-[#e5e5e5] text-sm">{c.differentiator}</p>
          </div>
          {c.video_intro_url && (
            <div>
              <p className="text-[#555] text-xs uppercase tracking-wide mb-1">Video Intro</p>
              <a href={c.video_intro_url} target="_blank" rel="noopener noreferrer" className="text-[#f97316] text-sm underline break-all">Watch video</a>
            </div>
          )}
          {c.writing_sample && (
            <div>
              <p className="text-[#555] text-xs uppercase tracking-wide mb-1">Writing Sample</p>
              <p className="text-[#a1a1aa] text-sm leading-relaxed">{c.writing_sample}</p>
            </div>
          )}
          {c.practical_response && (
            <div>
              <p className="text-[#555] text-xs uppercase tracking-wide mb-1">Practical Task</p>
              <p className="text-[#a1a1aa] text-sm leading-relaxed">{c.practical_response}</p>
            </div>
          )}
          <div>
            <p className="text-[#555] text-xs uppercase tracking-wide mb-2">CV</p>
            <a href={c.cv_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#1c1c1c] border border-[#2a2a2a] hover:border-[#f97316] px-4 py-2 rounded-lg text-sm text-[#f97316] transition-colors">
              {c.cv_type === "pdf" ? "📄 View PDF" : "📝 Open Google Doc"}
            </a>
          </div>

          {isSuspicious && (
            <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-3 text-xs text-yellow-400">
              <p className="font-semibold mb-1">⚠ Suspicious Activity Detected</p>
              {(c.apply_quiz_sessions?.suspicious_answer_count ?? 0) > 0 && (
                <p>{c.apply_quiz_sessions!.suspicious_answer_count} answer(s) completed in under 3 seconds</p>
              )}
              {(c.apply_quiz_sessions?.tab_switches ?? 0) > 0 && (
                <p>{c.apply_quiz_sessions!.tab_switches} tab switch(es) during quiz</p>
              )}
            </div>
          )}

          <div>
            <p className="text-[#555] text-xs uppercase tracking-wide mb-2">Status</p>
            <select
              value={c.status}
              disabled={updatingId === c.id}
              onChange={(e) => updateStatus(c.id, e.target.value)}
              className="w-full text-sm py-2 px-3 disabled:opacity-50"
            >
              {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>

        {/* Col 3: Notes */}
        <div>
          <p className="text-[#f97316] text-xs font-semibold uppercase tracking-widest mb-3">Recruiter Notes</p>
          <form onSubmit={addNote} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note..."
              className="flex-1 text-sm py-2 px-3"
            />
            <button type="submit" disabled={addingNote || !newNote.trim()} className="bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-50 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors">
              Add
            </button>
          </form>
          {!notesLoaded ? (
            <div className="flex items-center gap-2 text-[#555] text-xs">
              <div className="w-3 h-3 border border-[#f97316] border-t-transparent rounded-full animate-spin" />
              Loading notes...
            </div>
          ) : notes.length === 0 ? (
            <p className="text-[#555] text-xs">No notes yet.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {notes.map((n) => (
                <div key={n.id} className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg px-3 py-2">
                  <p className="text-[#e5e5e5] text-sm">{n.note}</p>
                  <p className="text-[#555] text-xs mt-1">{new Date(n.created_at).toLocaleString("en-AU")}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Kanban View ──────────────────────────────────────────────────────────────

function KanbanView({ candidates, updateStatus, onDragStart, onDrop }: {
  candidates: Candidate[];
  updateStatus: (id: string, status: string) => void;
  onDragStart: (id: string, status: string) => void;
  onDrop: (status: string) => void;
}) {
  const [dragOver, setDragOver] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 min-h-[60vh]">
      {STATUSES.map((status) => {
        const cols = candidates.filter((c) => c.status === status);
        return (
          <div
            key={status}
            className={`bg-[#0f0f0f] border rounded-xl p-3 transition-colors ${dragOver === status ? "border-[#f97316] bg-[#1c1c1c]" : "border-[#2a2a2a]"}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(status); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={() => { onDrop(status); setDragOver(null); }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className={`text-xs font-semibold uppercase tracking-widest capitalize ${STATUS_HEADER_COLORS[status].split(" ").find((c) => c.startsWith("text-"))}`}>
                {status}
              </p>
              <span className="text-[#555] text-xs bg-[#1c1c1c] px-2 py-0.5 rounded-full">{cols.length}</span>
            </div>
            <div className="space-y-2">
              {cols.map((c) => {
                const isSuspicious = (c.apply_quiz_sessions?.suspicious_answer_count ?? 0) > 0 || (c.apply_quiz_sessions?.tab_switches ?? 0) > 0;
                return (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={() => onDragStart(c.id, c.status)}
                    className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2.5 cursor-grab active:cursor-grabbing hover:border-[#3a3a3a] transition-colors"
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-white text-xs font-medium truncate flex-1">{c.full_name}</p>
                      {isSuspicious && <span className="text-yellow-400 text-xs shrink-0" title="Suspicious activity">⚠</span>}
                    </div>
                    <p className="text-[#555] text-xs truncate">{c.apply_quiz_sessions?.apply_roles?.name ?? "—"}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[#f97316] text-xs font-bold">{c.apply_quiz_sessions?.score ?? "—"}/10</span>
                      <span className="text-[#555] text-xs">{new Date(c.submitted_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</span>
                    </div>
                  </div>
                );
              })}
              {cols.length === 0 && <p className="text-[#555] text-xs text-center py-6">Drop here</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────

function AnalyticsTab() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [questions, setQuestions]       = useState<AnalyticsQuestion[]>([]);
  const [loading, setLoading]           = useState(false);
  const [empty, setEmpty]               = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setEmpty(false);
    const params = new URLSearchParams();
    if (selectedRole) params.set("role_id", selectedRole.id);
    const res = await fetch(`/api/admin/analytics?${params}`);
    if (res.ok) {
      const d = await res.json();
      const qs = d.questions ?? [];
      setQuestions(qs);
      setEmpty(qs.length === 0);
    }
    setLoading(false);
  }, [selectedRole]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap items-center">
        <button
          onClick={() => setSelectedRole(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${!selectedRole ? "bg-[#f97316] border-[#f97316] text-white" : "bg-[#141414] border-[#2a2a2a] text-[#777] hover:text-white"}`}
        >
          All Roles
        </button>
        {ROLE_LIST.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelectedRole(r)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${selectedRole?.id === r.id ? "bg-[#f97316] border-[#f97316] text-white" : "bg-[#141414] border-[#2a2a2a] text-[#777] hover:text-white"}`}
          >
            {r.name}
          </button>
        ))}
      </div>

      <p className="text-[#555] text-xs mb-4">Questions sorted by highest error rate (wrong answer %). Only shows questions with at least 1 attempt.</p>

      {loading ? <Spinner /> : empty ? (
        <div className="text-center py-16 text-[#555]">
          <p>No analytics data yet.</p>
          <p className="text-xs mt-1">Data appears after candidates complete the quiz with correct_flags stored (migration 006 required).</p>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#f97316] font-black text-sm w-6 shrink-0">#{i + 1}</span>
                    <p className="text-white text-sm font-medium">{q.question_text}</p>
                  </div>
                  {q.role && <p className="text-[#555] text-xs ml-8">{q.role.name}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-2xl font-black ${q.error_rate >= 70 ? "text-red-400" : q.error_rate >= 40 ? "text-yellow-400" : "text-green-400"}`}>
                    {q.error_rate}%
                  </p>
                  <p className="text-[#555] text-xs">error rate</p>
                  <p className="text-[#555] text-xs">{q.correct}/{q.total} correct</p>
                </div>
              </div>
              <div className="mt-2 ml-8 h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
                <div
                  className={`h-1 rounded-full ${q.error_rate >= 70 ? "bg-red-500" : q.error_rate >= 40 ? "bg-yellow-500" : "bg-green-500"}`}
                  style={{ width: `${q.error_rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Categories Tab ───────────────────────────────────────────────────────────

function CategoriesTab() {
  const [selectedRole, setSelectedRole] = useState<Role>(ROLE_LIST[0]);
  const [categories, setCategories]     = useState<Category[]>([]);
  const [loading, setLoading]           = useState(false);
  const [newName, setNewName]           = useState("");
  const [adding, setAdding]             = useState(false);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [editName, setEditName]         = useState("");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/categories?role_id=${selectedRole.id}`);
    if (res.ok) setCategories(await res.json());
    setLoading(false);
  }, [selectedRole.id]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role_id: selectedRole.id, name: newName.trim() }),
    });
    if (res.ok) { setNewName(""); fetchCategories(); }
    setAdding(false);
  }

  async function toggleActive(cat: Category) {
    await fetch(`/api/admin/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !cat.active }),
    });
    fetchCategories();
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return;
    await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    setEditingId(null);
    fetchCategories();
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category? Questions assigned to it will become base questions.")) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    fetchCategories();
  }

  return (
    <div className="max-w-2xl">
      <div className="flex gap-2 mb-6 flex-wrap">
        {ROLE_LIST.map((r) => (
          <button key={r.id} onClick={() => setSelectedRole(r)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${selectedRole.id === r.id ? "bg-[#f97316] border-[#f97316] text-white" : "bg-[#141414] border-[#2a2a2a] text-[#777] hover:text-white"}`}>
            {r.name}
          </button>
        ))}
      </div>

      <form onSubmit={addCategory} className="flex gap-2 mb-6">
        <input type="text" placeholder={`New specialisation for ${selectedRole.name}...`} value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1 text-sm py-2 px-3" />
        <button type="submit" disabled={adding || !newName.trim()} className="bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">Add</button>
      </form>

      {loading ? <Spinner /> : categories.length === 0 ? (
        <p className="text-[#555] text-sm text-center py-8">No specialisations yet for {selectedRole.name}. Add one above.</p>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-[#141414] border border-[#2a2a2a] rounded-xl px-4 py-3 flex items-center gap-3">
              {editingId === cat.id ? (
                <>
                  <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(cat.id); if (e.key === "Escape") setEditingId(null); }} className="flex-1 text-sm py-1 px-2" />
                  <button onClick={() => saveEdit(cat.id)} className="text-[#f97316] text-sm font-medium hover:text-white">Save</button>
                  <button onClick={() => setEditingId(null)} className="text-[#555] text-sm hover:text-white">Cancel</button>
                </>
              ) : (
                <>
                  <span className={`flex-1 text-sm font-medium ${cat.active ? "text-white" : "text-[#555] line-through"}`}>{cat.name}</span>
                  <span className="text-[#555] text-xs">{cat.slug}</span>
                  <button onClick={() => { setEditingId(cat.id); setEditName(cat.name); }} className="text-[#555] hover:text-[#f97316] text-xs transition-colors">Edit</button>
                  <button onClick={() => toggleActive(cat)} className={`text-xs font-medium transition-colors ${cat.active ? "text-green-400 hover:text-[#555]" : "text-[#555] hover:text-green-400"}`}>{cat.active ? "Active" : "Inactive"}</button>
                  <button onClick={() => deleteCategory(cat.id)} className="text-[#555] hover:text-red-400 text-xs transition-colors">Delete</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Questions Tab ────────────────────────────────────────────────────────────

function QuestionsTab() {
  const [selectedRole, setSelectedRole]     = useState<Role>(ROLE_LIST[0]);
  const [categories, setCategories]         = useState<Category[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [questions, setQuestions]           = useState<Question[]>([]);
  const [loading, setLoading]               = useState(false);
  const [showAddForm, setShowAddForm]       = useState(false);
  const [newQ, setNewQ]                     = useState({ question_text: "", options: ["", "", "", ""], correct_answer_index: 0, category_id: "" });
  const [adding, setAdding]                 = useState(false);
  const [addError, setAddError]             = useState("");

  useEffect(() => {
    fetch(`/api/admin/categories?role_id=${selectedRole.id}`)
      .then((r) => r.json()).then(setCategories).catch(() => {});
    setFilterCategory("");
  }, [selectedRole.id]);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ role_id: selectedRole.id });
    if (filterCategory) params.set("category_id", filterCategory);
    const res = await fetch(`/api/admin/questions?${params}`);
    if (res.ok) setQuestions(await res.json());
    setLoading(false);
  }, [selectedRole.id, filterCategory]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  async function addQuestion(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    if (newQ.options.some((o) => !o.trim())) { setAddError("All 4 options must be filled in."); return; }
    setAdding(true);
    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role_id: selectedRole.id, category_id: newQ.category_id || null, question_text: newQ.question_text, options: newQ.options, correct_answer_index: newQ.correct_answer_index }),
    });
    if (res.ok) { setNewQ({ question_text: "", options: ["", "", "", ""], correct_answer_index: 0, category_id: "" }); setShowAddForm(false); fetchQuestions(); }
    else { const d = await res.json(); setAddError(d.error || "Failed to add question."); }
    setAdding(false);
  }

  async function toggleActive(q: Question) {
    await fetch(`/api/admin/questions/${q.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !q.active }) });
    fetchQuestions();
  }

  async function changeCategory(q: Question, category_id: string) {
    await fetch(`/api/admin/questions/${q.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category_id: category_id || null }) });
    fetchQuestions();
  }

  async function deleteQuestion(id: string) {
    if (!confirm("Delete this question?")) return;
    await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
    fetchQuestions();
  }

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {ROLE_LIST.map((r) => (
          <button key={r.id} onClick={() => setSelectedRole(r)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${selectedRole.id === r.id ? "bg-[#f97316] border-[#f97316] text-white" : "bg-[#141414] border-[#2a2a2a] text-[#777] hover:text-white"}`}>
            {r.name}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-6 flex-wrap items-center">
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-auto text-sm py-2 px-3">
          <option value="">All questions</option>
          <option value="base">Base only</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={() => setShowAddForm((v) => !v)} className="bg-[#f97316] hover:bg-[#ea580c] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          {showAddForm ? "Cancel" : "+ Add Question"}
        </button>
        <span className="text-[#555] text-sm ml-auto">{questions.length} questions</span>
      </div>

      {showAddForm && (
        <form onSubmit={addQuestion} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5 mb-6 space-y-4">
          <p className="text-white font-medium text-sm">New Question — {selectedRole.name}</p>
          {addError && <p className="text-red-400 text-xs">{addError}</p>}
          <div>
            <label className="text-[#555] text-xs uppercase tracking-wide block mb-1">Specialisation</label>
            <select value={newQ.category_id} onChange={(e) => setNewQ((q) => ({ ...q, category_id: e.target.value }))} className="w-full text-sm py-2 px-3">
              <option value="">Base (shown for all specialisations)</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[#555] text-xs uppercase tracking-wide block mb-1">Question</label>
            <textarea required rows={2} className="resize-none w-full text-sm" placeholder="Enter the question..." value={newQ.question_text} onChange={(e) => setNewQ((q) => ({ ...q, question_text: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <label className="text-[#555] text-xs uppercase tracking-wide block">Options — select the correct answer</label>
            {newQ.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" name="correct" checked={newQ.correct_answer_index === i} onChange={() => setNewQ((q) => ({ ...q, correct_answer_index: i }))} className="accent-[#f97316] w-4 h-4 shrink-0" title="Mark as correct answer" />
                <span className="text-[#f97316] font-bold text-sm w-5">{String.fromCharCode(65 + i)}.</span>
                <input required type="text" className="flex-1 text-sm py-1.5 px-3" placeholder={`Option ${String.fromCharCode(65 + i)}`} value={opt} onChange={(e) => { const opts = [...newQ.options]; opts[i] = e.target.value; setNewQ((q) => ({ ...q, options: opts })); }} />
              </div>
            ))}
          </div>
          <button type="submit" disabled={adding} className="bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-50 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors">
            {adding ? "Saving..." : "Save Question"}
          </button>
        </form>
      )}

      {loading ? <Spinner /> : questions.length === 0 ? (
        <p className="text-[#555] text-sm text-center py-8">No questions found.</p>
      ) : (
        <div className="space-y-2">
          {questions.map((q) => (
            <div key={q.id} className={`bg-[#141414] border rounded-xl p-4 ${q.active ? "border-[#2a2a2a]" : "border-[#1a1a1a] opacity-50"}`}>
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium mb-2 ${q.active ? "text-white" : "text-[#555]"}`}>{q.question_text}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mb-2">
                    {q.options.map((opt, i) => (
                      <p key={i} className={`text-xs ${i === q.correct_answer_index ? "text-[#f97316] font-semibold" : "text-[#555]"}`}>{String.fromCharCode(65 + i)}. {opt}{i === q.correct_answer_index && " ✓"}</p>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end shrink-0">
                  <select value={q.category_id ?? ""} onChange={(e) => changeCategory(q, e.target.value)} className="text-xs py-1 px-2 w-44">
                    <option value="">Base</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <div className="flex gap-3">
                    <button onClick={() => toggleActive(q)} className={`text-xs font-medium transition-colors ${q.active ? "text-green-400 hover:text-[#555]" : "text-[#555] hover:text-green-400"}`}>{q.active ? "Active" : "Inactive"}</button>
                    <button onClick={() => deleteQuestion(q.id)} className="text-[#555] hover:text-red-400 text-xs transition-colors">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function Detail({ label, value, link }: { label: string; value: string; link?: boolean }) {
  return (
    <div>
      <span className="text-[#555] text-xs uppercase tracking-wide">{label}:</span>{" "}
      {link ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-[#f97316] text-sm underline break-all">{value}</a>
      ) : (
        <span className="text-[#e5e5e5]">{value}</span>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className="text-center py-16">
      <div className="w-6 h-6 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  );
}
