"use client";

import { useState, useEffect, useCallback } from "react";
import type { Candidate, Note, NotesCache } from "../_types";
import { STATUSES } from "../_types";
import { ROLES } from "@/lib/roles";
import Spinner from "./Spinner";
import ListView from "./ListView";
import KanbanView from "./KanbanView";
import BulkActionBar from "./BulkActionBar";
import RejectionModal from "./RejectionModal";

const PAGE_SIZE = 50;

export default function CandidatesTab() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [count, setCount]           = useState(0);
  const [page, setPage]             = useState(0);
  const [loading, setLoading]       = useState(false);
  const [migrationNeeded, setMigrationNeeded] = useState(false);

  // Filters
  const [filterRole, setFilterRole]     = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch]             = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [minScore, setMinScore]         = useState("");
  const [days, setDays]                 = useState("");
  const [starredOnly, setStarredOnly]   = useState(false);

  // View
  const [viewMode, setViewMode]     = useState<"list" | "kanban">("list");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notesCache, setNotesCache] = useState<NotesCache>({});

  // Bulk + rejection
  const [selectedIds, setSelectedIds]               = useState<Set<string>>(new Set());
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [pendingRejectIds, setPendingRejectIds]     = useState<string[]>([]);

  // Debounce search 500ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCandidates = useCallback(async (p = 0) => {
    setLoading(true);
    setSelectedIds(new Set());
    const params = new URLSearchParams({ page: String(p) });
    if (filterRole)                       params.set("role",      filterRole);
    if (filterStatus && viewMode === "list") params.set("status", filterStatus);
    if (debouncedSearch)                  params.set("search",    debouncedSearch);
    if (minScore)                         params.set("min_score", minScore);
    if (days)                             params.set("days",      days);
    if (starredOnly)                      params.set("starred",   "1");

    const res = await fetch(`/api/admin/candidates?${params}`);
    if (res.ok) {
      const json = await res.json();
      setCandidates(json.data ?? []);
      setCount(json.count ?? 0);
      setPage(p);
      if (json.migration_needed) setMigrationNeeded(true);
    }
    setLoading(false);
  }, [filterRole, filterStatus, viewMode, debouncedSearch, minScore, days, starredOnly]);

  useEffect(() => { fetchCandidates(0); }, [fetchCandidates]);

  // Notes
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

  // Status — intercept "rejected" to show reason modal
  async function performUpdateStatus(id: string, status: string, rejectionReason?: string) {
    setUpdatingId(id);
    const body: Record<string, string> = { status };
    if (rejectionReason) body.rejection_reason = rejectionReason;
    await fetch(`/api/admin/candidates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status, rejection_reason: rejectionReason ?? c.rejection_reason }
          : c
      )
    );
    setUpdatingId(null);
  }

  function updateStatus(id: string, status: string) {
    if (status === "rejected") {
      setPendingRejectIds([id]);
      setShowRejectionModal(true);
      return;
    }
    performUpdateStatus(id, status);
  }

  // Kanban drag-drop skips the rejection modal
  function kanbanUpdateStatus(id: string, status: string) {
    performUpdateStatus(id, status);
  }

  // Star
  async function toggleStar(id: string, starred: boolean) {
    await fetch(`/api/admin/candidates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ starred }),
    });
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, starred } : c)));
  }

  // Bulk select
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds(
      selectedIds.size === candidates.length
        ? new Set()
        : new Set(candidates.map((c) => c.id))
    );
  }

  async function performBulkUpdate(status: string, rejectionReason?: string) {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    const body: Record<string, unknown> = { ids, status };
    if (rejectionReason) body.rejection_reason = rejectionReason;
    await fetch("/api/admin/candidates/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setCandidates((prev) =>
      prev.map((c) =>
        selectedIds.has(c.id)
          ? { ...c, status, rejection_reason: rejectionReason ?? c.rejection_reason }
          : c
      )
    );
    setSelectedIds(new Set());
  }

  function handleBulkReject() {
    setPendingRejectIds(Array.from(selectedIds));
    setShowRejectionModal(true);
  }

  function handleRejectConfirm(reason: string) {
    setShowRejectionModal(false);
    const isSingleFromRow = pendingRejectIds.length === 1 && !selectedIds.has(pendingRejectIds[0]);
    if (isSingleFromRow) {
      performUpdateStatus(pendingRejectIds[0], "rejected", reason);
    } else {
      performBulkUpdate("rejected", reason);
    }
    setPendingRejectIds([]);
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

  function clearFilters() {
    setFilterRole("");
    setFilterStatus("");
    setSearch("");
    setMinScore("");
    setDays("");
    setStarredOnly(false);
  }

  const totalPages  = Math.ceil(count / PAGE_SIZE);
  const hasFilters  = !!(filterRole || filterStatus || search || minScore || days || starredOnly);

  return (
    <div>
      {migrationNeeded && (
        <div className="mb-4 card-inner border-brand-orange/40 px-4 py-3 flex items-start gap-3">
          <span className="text-brand-orange mt-0.5">⚠</span>
          <p className="text-brand-text-secondary text-sm">
            <span className="text-white font-medium">Migration 008 needed</span> — apply{" "}
            <code className="text-brand-orange text-xs bg-brand-black-soft px-1 py-0.5 rounded">supabase/migrations/008_admin_features.sql</code>{" "}
            in your Supabase SQL editor to enable starred candidates &amp; rejection reasons.
          </p>
        </div>
      )}

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

      {/* Search */}
      <div className="mb-3">
        <input
          type="search"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-xs text-sm py-2 px-3"
        />
      </div>

      {/* Filters row */}
      <div className="flex gap-3 mb-6 flex-wrap items-center">
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

        <select
          value={minScore}
          onChange={(e) => setMinScore(e.target.value)}
          className="w-auto text-sm py-2 px-3"
        >
          <option value="">Any score</option>
          {[6, 7, 8, 9, 10].map((s) => (
            <option key={s} value={String(s)}>{s}+ / 10</option>
          ))}
        </select>

        <select
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="w-auto text-sm py-2 px-3"
        >
          <option value="">All time</option>
          <option value="7">Last 7 days</option>
          <option value="14">Last 14 days</option>
          <option value="30">Last 30 days</option>
          <option value="60">Last 60 days</option>
        </select>

        {!migrationNeeded && (
          <button
            onClick={() => setStarredOnly((v) => !v)}
            className={`text-sm px-3 py-2 rounded-xl border transition-colors duration-150 ${
              starredOnly
                ? "bg-yellow-900/30 border-yellow-600/50 text-yellow-400"
                : "card-inner text-brand-text-muted hover:text-yellow-400 hover:border-yellow-600/40"
            }`}
          >
            ★ Starred
          </button>
        )}

        <button
          onClick={() => fetchCandidates(0)}
          className="card-inner hover:border-brand-orange text-brand-text-secondary text-sm px-4 py-2 rounded-xl transition-colors duration-150"
        >
          Refresh
        </button>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-brand-text-muted hover:text-white text-sm transition-colors duration-150"
          >
            ✕ Clear filters
          </button>
        )}
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
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onToggleStar={toggleStar}
            migrationNeeded={migrationNeeded}
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
        <KanbanView candidates={candidates} updateStatus={kanbanUpdateStatus} />
      )}

      <BulkActionBar
        count={selectedIds.size}
        onShortlist={() => performBulkUpdate("shortlisted")}
        onInterview={() => performBulkUpdate("interviewed")}
        onReject={handleBulkReject}
        onClear={() => setSelectedIds(new Set())}
      />

      {showRejectionModal && (
        <RejectionModal
          count={pendingRejectIds.length}
          onConfirm={handleRejectConfirm}
          onCancel={() => {
            setShowRejectionModal(false);
            setPendingRejectIds([]);
          }}
        />
      )}
    </div>
  );
}
