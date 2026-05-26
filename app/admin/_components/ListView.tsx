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
};

export default function ListView({
  candidates, expandedId, onExpand, updatingId, updateStatus, notesCache, onAddNote,
}: Props) {
  if (candidates.length === 0) {
    return <p className="text-center py-16 text-[#555]">No candidates found.</p>;
  }

  return (
    <div className="space-y-2">
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
        />
      ))}
    </div>
  );
}
