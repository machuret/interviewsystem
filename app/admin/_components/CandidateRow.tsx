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
};

function CandidateRow({ c, expanded, onToggle, updatingId, updateStatus, notesCache, onAddNote }: Props) {
  const isSuspicious =
    (c.apply_quiz_sessions?.suspicious_answer_count ?? 0) > 0 ||
    (c.apply_quiz_sessions?.tab_switches ?? 0) > 0;

  const cachedNotes = notesCache[c.id];

  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-2 hover:bg-[#1c1c1c] transition-colors"
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
        <div className="text-[#555] text-xs ml-auto">{expanded ? "▲" : "▼"}</div>
      </button>

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
