import type { Candidate, Note, NotesCache } from "../_types";
import CandidateRow from "./CandidateRow";

type Props = {
  candidates: Candidate[];
  expandedId: string | null;
  onExpand: (id: string | null) => void;
  updatingId: string | null;
  updateStatus: (id: string, status: string) => void;
  notesCache: NotesCache;
  onAddNote: (candidateId: string, note: Note) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onToggleStar: (id: string, starred: boolean) => void;
  migrationNeeded: boolean;
};

export default function ListView({
  candidates, expandedId, onExpand, updatingId, updateStatus,
  notesCache, onAddNote, selectedIds, onToggleSelect, onToggleSelectAll,
  onToggleStar, migrationNeeded,
}: Props) {
  if (candidates.length === 0) {
    return <p className="text-center py-16 text-brand-text-muted">No candidates found.</p>;
  }

  const allSelected = selectedIds.size === candidates.length && candidates.length > 0;

  return (
    <div className="space-y-2">
      {!migrationNeeded && (
        <div className="flex items-center gap-3 px-2 pb-1">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onToggleSelectAll}
            className="accent-brand-orange w-4 h-4 cursor-pointer"
          />
          <span className="text-brand-text-muted text-xs">
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
          </span>
        </div>
      )}

      {candidates.map((c) => (
        <CandidateRow
          key={c.id}
          c={c}
          expanded={expandedId === c.id}
          onToggle={() => onExpand(expandedId === c.id ? null : c.id)}
          updatingId={updatingId}
          updateStatus={updateStatus}
          notesCache={notesCache}
          onAddNote={onAddNote}
          selected={selectedIds.has(c.id)}
          onToggleSelect={() => onToggleSelect(c.id)}
          onToggleStar={() => onToggleStar(c.id, !c.starred)}
          migrationNeeded={migrationNeeded}
        />
      ))}
    </div>
  );
}
