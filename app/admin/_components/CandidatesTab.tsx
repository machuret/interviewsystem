"use client";

import { useState, useEffect, useCallback } from "react";
import type { Candidate, Note, NotesCache } from "../_types";
import { STATUSES } from "../_types";
import { ROLES } from "@/lib/roles";
import Spinner from "./Spinner";
import ListView from "./ListView";
import KanbanView from "./KanbanView";

const PAGE_SIZE = 50;

export default function CandidatesTab() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [count, setCount]           = useState(0);
  const [page, setPage]             = useState(0);
  const [loading, setLoading]       = useState(false);
  const [filterRole, setFilterRole]     = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [viewMode, setViewMode]     = useState<"list" | "kanban">("list");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notesCache, setNotesCache] = useState<NotesCache>({});

  const fetchCandidates = useCallback(async (p = 0) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p) });
    if (filterRole)   params.set("role",   filterRole);
    if (filterStatus && viewMode === "list") params.set("status", filterStatus);
    const res = await fetch(`/api/admin/candidates?${params}`);
    if (res.ok) {
      const json = await res.json();
      setCandidates(json.data ?? []);
      setCount(json.count ?? 0);
      setPage(p);
    }
    setLoading(false);
  }, [filterRole, filterStatus, viewMode]);

  useEffect(() => { fetchCandidates(0); }, [fetchCandidates]);

  async function loadNotes(candidateId: string) {
    if (notesCache[candidateId]?.loaded) return;
    const res = await fetch(`/api/admin/candidates/${candidateId}/notes`);
    if (res.ok) {
      const data = await res.json();
      setNotesCache((prev) => ({
        ...prev,
        [candidateId]: { notes: Array.isArray(data) ? data : [], loaded: true },
      }));
    }
  }

  function addNoteToCache(candidateId: string, note: Note) {
    setNotesCache((prev) => ({
      ...prev,
      [candidateId]: {
        notes: [note, ...(prev[candidateId]?.notes ?? [])],
        loaded: true,
      },
    }));
  }

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

  function handleExpand(id: string | null) {
    setExpandedId(id);
    if (id) loadNotes(id);
  }

  function exportCSV() {
    const params = new URLSearchParams();
    if (filterRole)   params.set("role",   filterRole);
    if (filterStatus) params.set("status", filterStatus);
    window.open(`/api/admin/export?${params}`, "_blank");
  }

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <p className="text-brand-text-muted text-sm tabular-nums">{count} candidates</p>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode((v) => (v === "list" ? "kanban" : "list"))}
            className="btn-ghost text-sm px-3 py-2"
          >
            {viewMode === "list" ? "⊞ Kanban" : "≡ List"}
          </button>
          <button
            onClick={exportCSV}
            className="card-inner hover:border-brand-orange text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors duration-150"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="w-auto text-sm py-2 px-3"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r.slug} value={r.slug}>{r.name}</option>
          ))}
        </select>

        {viewMode === "list" && (
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
        )}

        <button
          onClick={() => fetchCandidates(0)}
          className="card-inner hover:border-brand-orange text-brand-text-secondary text-sm px-4 py-2 rounded-xl transition-colors duration-150"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : viewMode === "list" ? (
        <>
          <ListView
            candidates={candidates}
            expandedId={expandedId}
            onExpand={handleExpand}
            updatingId={updatingId}
            updateStatus={updateStatus}
            notesCache={notesCache}
            onAddNote={addNoteToCache}
          />
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => fetchCandidates(page - 1)}
                disabled={page === 0}
                className="card-inner hover:border-brand-orange text-brand-text-secondary text-sm px-3 py-1.5 rounded-lg disabled:opacity-40 transition-colors duration-150"
              >
                ← Prev
              </button>
              <span className="text-brand-text-muted text-sm tabular-nums">
                {page + 1} / {totalPages} ({count} total)
              </span>
              <button
                onClick={() => fetchCandidates(page + 1)}
                disabled={page >= totalPages - 1}
                className="card-inner hover:border-brand-orange text-brand-text-secondary text-sm px-3 py-1.5 rounded-lg disabled:opacity-40 transition-colors duration-150"
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        <KanbanView candidates={candidates} updateStatus={updateStatus} />
      )}
    </div>
  );
}
