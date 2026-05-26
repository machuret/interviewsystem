"use client";

import { memo } from "react";
import type { Candidate, Note, NotesCache } from "../_types";
import { STATUS_COLORS } from "../_types";
import CandidateDetail from "./CandidateDetail";

type Props = {
  c: Candidate;
  expanded: boolean;
  onToggle: () => void;
  updatingId: string | null;
  updateStatus: (id: string, status: string) => void;
  notesCache: NotesCache;
  onAddNote: (candidateId: string, note: Note) => void;
  selected: boolean;
  onToggleSelect: () => void;
  onToggleStar: () => void;
  migrationNeeded: boolean;
};

function CandidateRow({
  c, expanded, onToggle, updatingId, updateStatus,
  notesCache, onAddNote, selected, onToggleSelect, onToggleStar, migrationNeeded,
}: Props) {
  const isSuspicious =
    (c.apply_quiz_sessions?.suspicious_answer_count ?? 0) > 0 ||
    (c.apply_quiz_sessions?.tab_switches ?? 0) > 0;

  const cachedNotes = notesCache[c.id];

  return (
    <div className={`card overflow-hidden transition-colors duration-150 ${selected ? "border-brand-orange/50" : ""}`}>
      <div className="flex items-center">
        {!migrationNeeded && (
          <div
            className="flex items-center gap-2 pl-4 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              className="accent-brand-orange w-4 h-4 cursor-pointer"
            />
            <button
              onClick={onToggleStar}
              className={`text-base leading-none transition-colors duration-150 ${
                c.starred ? "text-yellow-400" : "text-brand-text-muted hover:text-yellow-400"
              }`}
              title={c.starred ? "Unstar" : "Star candidate"}
            >
              {c.starred ? "★" : "☆"}
            </button>
          </div>
        )}

        <button
          onClick={onToggle}
          className="flex-1 text-left px-4 py-4 flex flex-wrap items-center gap-x-6 gap-y-2 hover:bg-brand-black-card transition-colors duration-150"
        >
          <div className="flex-1 min-w-[180px]">
            <div className="flex items-center gap-2">
              <p className="text-white font-medium text-sm">{c.full_name}</p>
              {isSuspicious && (
                <span
                  title={`${c.apply_quiz_sessions?.suspicious_answer_count ?? 0} fast answers, ${c.apply_quiz_sessions?.tab_switches ?? 0} tab switches`}
                  className="text-xs bg-yellow-900/40 text-yellow-400 border border-yellow-700/40 rounded-full px-1.5 py-0.5 leading-none"
                >
                  ⚠ suspicious
                </span>
              )}
            </div>
            <p className="text-brand-text-muted text-xs">{c.email}</p>
          </div>
          <div className="text-brand-text-secondary text-sm min-w-[140px]">
            {c.apply_quiz_sessions?.apply_roles?.name ?? "—"}
          </div>
          <div className="text-brand-orange font-bold text-sm min-w-[60px] tabular-nums">
            {c.apply_quiz_sessions?.score ?? "—"}/10
          </div>
          <div className="text-brand-text-secondary text-sm min-w-[100px] tabular-nums">
            ₱{Number(c.salary_expectation_php).toLocaleString()}
          </div>
          <div className="text-brand-text-tertiary text-xs min-w-[100px]">
            {new Date(c.submitted_at).toLocaleDateString("en-AU")}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[c.status] ?? ""}`}>
              {c.status}
            </span>
            {c.rejection_reason && (
              <span className="text-brand-text-muted text-xs truncate max-w-[120px]" title={c.rejection_reason}>
                {c.rejection_reason}
              </span>
            )}
          </div>
          <div className="text-brand-text-muted text-xs ml-auto">{expanded ? "▲" : "▼"}</div>
        </button>
      </div>

      {expanded && (
        <CandidateDetail
          c={c}
          notes={cachedNotes?.notes ?? []}
          notesLoaded={cachedNotes?.loaded ?? false}
          updatingId={updatingId}
          updateStatus={updateStatus}
          onAddNote={onAddNote}
        />
      )}
    </div>
  );
}

export default memo(CandidateRow);
