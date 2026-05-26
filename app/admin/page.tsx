"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = { id: string; name: string; slug: string };

type Category = {
  id: string;
  role_id: string;
  name: string;
  slug: string;
  active: boolean;
  apply_roles?: { name: string; slug: string };
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

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES = ["new", "shortlisted", "interviewed", "rejected"];

const STATUS_COLORS: Record<string, string> = {
  new:         "bg-blue-900/40 text-blue-300 border border-blue-700/40",
  shortlisted: "bg-green-900/40 text-green-300 border border-green-700/40",
  interviewed: "bg-yellow-900/40 text-yellow-300 border border-yellow-700/40",
  rejected:    "bg-red-900/40 text-red-300 border border-red-700/40",
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
  const [tab, setTab]               = useState<"candidates" | "categories" | "questions">("candidates");

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Admin</h1>
        <button
          onClick={logout}
          className="text-[#555] hover:text-red-400 text-sm px-4 py-2 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-[#141414] border border-[#2a2a2a] rounded-xl p-1 w-fit">
        {(["candidates", "categories", "questions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t ? "bg-[#f97316] text-white" : "text-[#777] hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "candidates" && <CandidatesTab />}
      {tab === "categories" && <CategoriesTab />}
      {tab === "questions"  && <QuestionsTab />}
    </div>
  );
}

// ─── Candidates Tab ───────────────────────────────────────────────────────────

function CandidatesTab() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading]       = useState(false);
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterRole)   params.set("role",   filterRole);
    if (filterStatus) params.set("status", filterStatus);
    const res = await fetch(`/api/admin/candidates?${params}`);
    if (res.ok) setCandidates(await res.json());
    setLoading(false);
  }, [filterRole, filterStatus]);

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

  const roles = Array.from(
    new Set(candidates.map((c) => c.apply_quiz_sessions?.apply_roles?.slug).filter(Boolean))
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <p className="text-[#555] text-sm">{candidates.length} candidates</p>
        <button
          onClick={exportCSV}
          className="bg-[#1c1c1c] hover:bg-[#2a2a2a] border border-[#2a2a2a] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Export CSV
        </button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-auto text-sm py-2 px-3">
          <option value="">All roles</option>
          {roles.map((slug) => {
            const c = candidates.find((x) => x.apply_quiz_sessions?.apply_roles?.slug === slug);
            return <option key={slug} value={slug}>{c?.apply_quiz_sessions?.apply_roles?.name ?? slug}</option>;
          })}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-auto text-sm py-2 px-3">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <button onClick={fetchCandidates} className="bg-[#1c1c1c] border border-[#2a2a2a] text-[#a1a1aa] text-sm px-4 py-2 rounded-lg hover:border-[#f97316] transition-colors">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-6 h-6 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-16 text-[#555]">No candidates found.</div>
      ) : (
        <div className="space-y-2">
          {candidates.map((c) => (
            <div key={c.id} className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                className="w-full text-left px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-2 hover:bg-[#1c1c1c] transition-colors"
              >
                <div className="flex-1 min-w-[180px]">
                  <p className="text-white font-medium text-sm">{c.full_name}</p>
                  <p className="text-[#555] text-xs">{c.email}</p>
                </div>
                <div className="text-[#a1a1aa] text-sm min-w-[140px]">{c.apply_quiz_sessions?.apply_roles?.name ?? "—"}</div>
                <div className="text-[#f97316] font-bold text-sm min-w-[60px]">{c.apply_quiz_sessions?.score ?? "—"}/10</div>
                <div className="text-[#a1a1aa] text-sm min-w-[100px]">₱{Number(c.salary_expectation_php).toLocaleString()}</div>
                <div className="text-[#777] text-xs min-w-[100px]">{new Date(c.submitted_at).toLocaleDateString("en-AU")}</div>
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[c.status] ?? ""}`}>{c.status}</span>
                </div>
                <div className="text-[#555] text-xs ml-auto">{expanded === c.id ? "▲" : "▼"}</div>
              </button>

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
                      <a href={c.cv_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#1c1c1c] border border-[#2a2a2a] hover:border-[#f97316] px-4 py-2 rounded-lg text-sm text-[#f97316] transition-colors">
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
                          <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
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
    if (res.ok) {
      setNewName("");
      fetchCategories();
    }
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
          <button
            key={r.id}
            onClick={() => setSelectedRole(r)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              selectedRole.id === r.id
                ? "bg-[#f97316] border-[#f97316] text-white"
                : "bg-[#141414] border-[#2a2a2a] text-[#777] hover:text-white"
            }`}
          >
            {r.name}
          </button>
        ))}
      </div>

      <form onSubmit={addCategory} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder={`New specialisation for ${selectedRole.name}...`}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 text-sm py-2 px-3"
        />
        <button
          type="submit"
          disabled={adding || !newName.trim()}
          className="bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Add
        </button>
      </form>

      {loading ? (
        <div className="text-center py-8">
          <div className="w-5 h-5 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : categories.length === 0 ? (
        <p className="text-[#555] text-sm text-center py-8">
          No specialisations yet for {selectedRole.name}. Add one above.
        </p>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-[#141414] border border-[#2a2a2a] rounded-xl px-4 py-3 flex items-center gap-3">
              {editingId === cat.id ? (
                <>
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveEdit(cat.id); if (e.key === "Escape") setEditingId(null); }}
                    className="flex-1 text-sm py-1 px-2"
                  />
                  <button onClick={() => saveEdit(cat.id)} className="text-[#f97316] text-sm font-medium hover:text-white">Save</button>
                  <button onClick={() => setEditingId(null)} className="text-[#555] text-sm hover:text-white">Cancel</button>
                </>
              ) : (
                <>
                  <span className={`flex-1 text-sm font-medium ${cat.active ? "text-white" : "text-[#555] line-through"}`}>
                    {cat.name}
                  </span>
                  <span className="text-[#555] text-xs">{cat.slug}</span>
                  <button
                    onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                    className="text-[#555] hover:text-[#f97316] text-xs transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleActive(cat)}
                    className={`text-xs font-medium transition-colors ${cat.active ? "text-green-400 hover:text-[#555]" : "text-[#555] hover:text-green-400"}`}
                  >
                    {cat.active ? "Active" : "Inactive"}
                  </button>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="text-[#555] hover:text-red-400 text-xs transition-colors"
                  >
                    Delete
                  </button>
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

  const [newQ, setNewQ] = useState({
    question_text: "",
    options: ["", "", "", ""],
    correct_answer_index: 0,
    category_id: "",
  });
  const [adding, setAdding]     = useState(false);
  const [addError, setAddError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/categories?role_id=${selectedRole.id}`)
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
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
    if (newQ.options.some((o) => !o.trim())) {
      setAddError("All 4 options must be filled in.");
      return;
    }
    setAdding(true);
    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role_id: selectedRole.id,
        category_id: newQ.category_id || null,
        question_text: newQ.question_text,
        options: newQ.options,
        correct_answer_index: newQ.correct_answer_index,
      }),
    });
    if (res.ok) {
      setNewQ({ question_text: "", options: ["", "", "", ""], correct_answer_index: 0, category_id: "" });
      setShowAddForm(false);
      fetchQuestions();
    } else {
      const d = await res.json();
      setAddError(d.error || "Failed to add question.");
    }
    setAdding(false);
  }

  async function toggleActive(q: Question) {
    await fetch(`/api/admin/questions/${q.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !q.active }),
    });
    fetchQuestions();
  }

  async function changeCategory(q: Question, category_id: string) {
    await fetch(`/api/admin/questions/${q.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category_id: category_id || null }),
    });
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
          <button
            key={r.id}
            onClick={() => setSelectedRole(r)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              selectedRole.id === r.id
                ? "bg-[#f97316] border-[#f97316] text-white"
                : "bg-[#141414] border-[#2a2a2a] text-[#777] hover:text-white"
            }`}
          >
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
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="bg-[#f97316] hover:bg-[#ea580c] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
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
            <select
              value={newQ.category_id}
              onChange={(e) => setNewQ((q) => ({ ...q, category_id: e.target.value }))}
              className="w-full text-sm py-2 px-3"
            >
              <option value="">Base (shown for all specialisations)</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[#555] text-xs uppercase tracking-wide block mb-1">Question</label>
            <textarea
              required
              rows={2}
              className="resize-none w-full text-sm"
              placeholder="Enter the question..."
              value={newQ.question_text}
              onChange={(e) => setNewQ((q) => ({ ...q, question_text: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[#555] text-xs uppercase tracking-wide block">Options — select the correct answer</label>
            {newQ.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  checked={newQ.correct_answer_index === i}
                  onChange={() => setNewQ((q) => ({ ...q, correct_answer_index: i }))}
                  className="accent-[#f97316] w-4 h-4 shrink-0"
                  title="Mark as correct answer"
                />
                <span className="text-[#f97316] font-bold text-sm w-5">{String.fromCharCode(65 + i)}.</span>
                <input
                  required
                  type="text"
                  className="flex-1 text-sm py-1.5 px-3"
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  value={opt}
                  onChange={(e) => {
                    const opts = [...newQ.options];
                    opts[i] = e.target.value;
                    setNewQ((q) => ({ ...q, options: opts }));
                  }}
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={adding}
            className="bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-50 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors"
          >
            {adding ? "Saving..." : "Save Question"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="w-5 h-5 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : questions.length === 0 ? (
        <p className="text-[#555] text-sm text-center py-8">No questions found.</p>
      ) : (
        <div className="space-y-2">
          {questions.map((q) => (
            <div
              key={q.id}
              className={`bg-[#141414] border rounded-xl p-4 ${q.active ? "border-[#2a2a2a]" : "border-[#1a1a1a] opacity-50"}`}
            >
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium mb-2 ${q.active ? "text-white" : "text-[#555]"}`}>
                    {q.question_text}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mb-2">
                    {q.options.map((opt, i) => (
                      <p key={i} className={`text-xs ${i === q.correct_answer_index ? "text-[#f97316] font-semibold" : "text-[#555]"}`}>
                        {String.fromCharCode(65 + i)}. {opt}{i === q.correct_answer_index && " ✓"}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end shrink-0">
                  <select
                    value={q.category_id ?? ""}
                    onChange={(e) => changeCategory(q, e.target.value)}
                    className="text-xs py-1 px-2 w-44"
                  >
                    <option value="">Base</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <div className="flex gap-3">
                    <button
                      onClick={() => toggleActive(q)}
                      className={`text-xs font-medium transition-colors ${q.active ? "text-green-400 hover:text-[#555]" : "text-[#555] hover:text-green-400"}`}
                    >
                      {q.active ? "Active" : "Inactive"}
                    </button>
                    <button onClick={() => deleteQuestion(q.id)} className="text-[#555] hover:text-red-400 text-xs transition-colors">
                      Delete
                    </button>
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[#555] text-xs uppercase tracking-wide">{label}:</span>{" "}
      <span className="text-[#e5e5e5]">{value}</span>
    </div>
  );
}
