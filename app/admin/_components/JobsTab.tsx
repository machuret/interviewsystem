"use client";

import { useState, useEffect, useCallback } from "react";
import { ROLES } from "@/lib/roles";
import type { JobPosting } from "../_types";

const EMPTY_FORM = {
  title: "", role_id: ROLES[0].id as string, category_id: "",
  description: "", requirements: "", salary_from: "", salary_to: "", status: "draft" as "draft" | "published",
};

type FormState = typeof EMPTY_FORM;

export default function JobsTab() {
  const [jobs, setJobs]               = useState<JobPosting[]>([]);
  const [loading, setLoading]         = useState(false);
  const [form, setForm]               = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [showForm, setShowForm]       = useState(false);
  const [saving, setSaving]           = useState(false);
  const [formError, setFormError]     = useState("");
  const [categories, setCategories]   = useState<{ id: string; name: string; slug: string }[]>([]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/jobs");
    if (res.ok) setJobs(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // Fetch categories whenever role changes in form
  useEffect(() => {
    if (!showForm) return;
    const role = ROLES.find((r) => r.id === form.role_id);
    if (!role) return;
    fetch(`/api/admin/categories?role_id=${form.role_id}`)
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data.filter((c: { active: boolean }) => c.active) : []))
      .catch(() => setCategories([]));
  }, [form.role_id, showForm]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
    setShowForm(true);
  }

  function openEdit(job: JobPosting) {
    setForm({
      title:        job.title,
      role_id:      job.role_id,
      category_id:  job.category_id ?? "",
      description:  job.description ?? "",
      requirements: job.requirements ?? "",
      salary_from:  job.salary_from != null ? String(job.salary_from) : "",
      salary_to:    job.salary_to   != null ? String(job.salary_to)   : "",
      status:       job.status as "draft" | "published",
    });
    setEditingId(job.id);
    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setFormError("");
  }

  function update(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setFormError("Title is required."); return; }
    setFormError("");
    setSaving(true);
    const body = {
      role_id:      form.role_id,
      category_id:  form.category_id || null,
      title:        form.title,
      description:  form.description,
      requirements: form.requirements,
      salary_from:  form.salary_from,
      salary_to:    form.salary_to,
      status:       form.status,
    };
    const res = editingId
      ? await fetch(`/api/admin/jobs/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/admin/jobs",               { method: "POST",  headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

    if (res.ok) {
      closeForm();
      fetchJobs();
    } else {
      const d = await res.json();
      setFormError(d.error || "Failed to save.");
    }
    setSaving(false);
  }

  async function toggleStatus(job: JobPosting) {
    const next = job.status === "published" ? "draft" : "published";
    await fetch(`/api/admin/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, status: next } : j));
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this job posting? Applicant links will remain.")) return;
    await fetch(`/api/admin/jobs/${id}`, { method: "DELETE" });
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }

  const published = jobs.filter((j) => j.status === "published").length;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <p className="text-brand-text-muted text-sm tabular-nums">
          {jobs.length} postings · <span className="text-green-400">{published} live</span>
        </p>
        <button onClick={openCreate} className="btn-primary px-5 py-2 text-sm">
          + New posting
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6 mb-6">
          <p className="text-white font-semibold mb-4">
            {editingId ? "Edit posting" : "New posting"}
          </p>
          {formError && <p className="text-red-400 text-sm mb-4">{formError}</p>}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label>Job Title<span className="text-brand-orange ml-0.5">*</span></label>
                <input
                  required
                  type="text"
                  placeholder="e.g. SEO Marketing Specialist"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  className="text-sm py-2 px-3"
                />
              </div>
              <div>
                <label>Role</label>
                <select
                  value={form.role_id}
                  onChange={(e) => { update("role_id", e.target.value); update("category_id", ""); }}
                  className="w-full text-sm py-2 px-3"
                >
                  {ROLES.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label>Specialisation (optional)</label>
                <select
                  value={form.category_id}
                  onChange={(e) => update("category_id", e.target.value)}
                  className="w-full text-sm py-2 px-3"
                >
                  <option value="">None — general {ROLES.find(r => r.id === form.role_id)?.name ?? "role"} questions</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <p className="text-brand-text-muted text-xs mt-1">Determines which quiz questions applicants see.</p>
              </div>
              <div>
                <label>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => update("status", e.target.value)}
                  className="w-full text-sm py-2 px-3"
                >
                  <option value="draft">Draft — hidden from homepage</option>
                  <option value="published">Published — live on homepage</option>
                </select>
              </div>
            </div>

            <div>
              <label>Description</label>
              <textarea
                rows={3}
                className="resize-none w-full text-sm"
                placeholder="What does this role involve? What will the person be doing day-to-day?"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </div>

            <div>
              <label>Requirements (optional)</label>
              <textarea
                rows={3}
                className="resize-none w-full text-sm"
                placeholder="Experience, skills, tools, or qualifications required..."
                value={form.requirements}
                onChange={(e) => update("requirements", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Salary from (PHP/mo)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted text-sm">₱</span>
                  <input
                    type="number"
                    min={0}
                    placeholder="35000"
                    value={form.salary_from}
                    onChange={(e) => update("salary_from", e.target.value)}
                    className="pl-7 text-sm py-2 px-3"
                  />
                </div>
              </div>
              <div>
                <label>Salary to (PHP/mo)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted text-sm">₱</span>
                  <input
                    type="number"
                    min={0}
                    placeholder="50000"
                    value={form.salary_to}
                    onChange={(e) => update("salary_to", e.target.value)}
                    className="pl-7 text-sm py-2 px-3"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary px-6 py-2 text-sm disabled:opacity-50">
                {saving ? "Saving..." : editingId ? "Save changes" : "Create posting"}
              </button>
              <button type="button" onClick={closeForm} className="btn-ghost px-6 py-2 text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Job list */}
      {loading ? (
        <div className="flex items-center gap-2 text-brand-text-muted text-sm py-8">
          <div className="w-4 h-4 border border-brand-orange border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-brand-text-muted">
          <p className="text-lg mb-2">No job postings yet.</p>
          <p className="text-sm">Create your first posting above — published ones appear on the homepage.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const role = ROLES.find((r) => r.id === job.role_id);
            return (
              <div key={job.id} className="card p-5">
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-white font-semibold text-sm">{job.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        job.status === "published"
                          ? "bg-green-900/40 text-green-300 border border-green-700/40"
                          : "bg-brand-black-card text-brand-text-muted border border-brand-black-border"
                      }`}>
                        {job.status === "published" ? "● Live" : "○ Draft"}
                      </span>
                    </div>
                    <p className="text-brand-text-secondary text-xs">
                      {role?.icon} {role?.name}
                      {job.apply_categories && (
                        <span className="text-brand-text-muted"> · {job.apply_categories.name}</span>
                      )}
                    </p>
                    {(job.salary_from || job.salary_to) && (
                      <p className="text-brand-orange text-xs mt-1 tabular-nums">
                        ₱{job.salary_from?.toLocaleString() ?? "—"}
                        {job.salary_to ? ` – ₱${job.salary_to.toLocaleString()}` : "+"}/mo
                      </p>
                    )}
                    {job.description && (
                      <p className="text-brand-text-muted text-xs mt-2 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0 flex-wrap">
                    <button
                      onClick={() => toggleStatus(job)}
                      className={`text-xs font-medium transition-colors duration-150 ${
                        job.status === "published"
                          ? "text-green-400 hover:text-brand-text-muted"
                          : "text-brand-text-muted hover:text-green-400"
                      }`}
                    >
                      {job.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      onClick={() => openEdit(job)}
                      className="text-brand-text-muted hover:text-brand-orange text-xs transition-colors duration-150"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="text-brand-text-muted hover:text-red-400 text-xs transition-colors duration-150"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
