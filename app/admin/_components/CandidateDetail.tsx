"use client";

import { useState } from "react";
import type { Candidate, Note } from "../_types";
import { STATUSES, STATUS_COLORS } from "../_types";
import Detail from "./Detail";

type Props = {
  c: Candidate;
  notes: Note[];
  notesLoaded: boolean;
  updatingId: string | null;
  updateStatus: (id: string, status: string) => void;
  onAddNote: (candidateId: string, note: Note) => void;
};

export default function CandidateDetail({
  c, notes, notesLoaded, updatingId, updateStatus, onAddNote,
}: Props) {
  const [newNote, setNewNote]   = useState("");
  const [addingNote, setAddingNote] = useState(false);

  const isSuspicious =
    (c.apply_quiz_sessions?.suspicious_answer_count ?? 0) > 0 ||
    (c.apply_quiz_sessions?.tab_switches ?? 0) > 0;

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
      const n: Note = await res.json();
      onAddNote(c.id, n);
      setNewNote("");
    }
    setAddingNote(false);
  }

  return (
    <div className="px-5 pb-5 border-t border-[#2a2a2a] pt-4">
      <div className="grid sm:grid-cols-3 gap-6">

        {/* Col 1: Personal + Setup + Experience */}
        <div className="space-y-2 text-sm">
          <p className="text-[#f97316] text-xs font-semibold uppercase tracking-widest mb-2">Personal</p>
          <Detail label="Phone" value={c.phone} />
          <Detail label="Location" value={c.location} />
          {c.age         != null && <Detail label="Age"     value={String(c.age)} />}
          {c.sex                  && <Detail label="Sex"     value={c.sex} />}
          {c.married     != null  && <Detail label="Married" value={c.married ? "Yes" : "No"} />}
          {c.kids        != null  && <Detail label="Kids"    value={c.kids ? "Yes" : "No"} />}
          {c.facebook_link        && <Detail label="Facebook"  value={c.facebook_link}  link />}
          {c.instagram_link       && <Detail label="Instagram" value={c.instagram_link} link />}

          <p className="text-[#f97316] text-xs font-semibold uppercase tracking-widest mb-1 mt-4">Setup</p>
          {(c.device_type || c.device_brand) &&
            <Detail label="Device" value={[c.device_type, c.device_brand].filter(Boolean).join(" — ")} />}
          {c.internet_provider && <Detail label="Internet" value={c.internet_provider} />}

          <p className="text-[#f97316] text-xs font-semibold uppercase tracking-widest mb-1 mt-4">Experience</p>
          {c.current_job_title  && <Detail label="Title"     value={c.current_job_title} />}
          {c.years_experience   && <Detail label="Exp"       value={c.years_experience} />}
          {c.previous_employers && <Detail label="Employers" value={c.previous_employers} />}
          {c.skills_tools       && <Detail label="Skills"    value={c.skills_tools} />}
          {c.software_used      && <Detail label="Software"  value={c.software_used} />}
          {c.task_description   && (
            <div>
              <p className="text-[#555] text-xs uppercase tracking-wide mb-0.5">Day-to-day</p>
              <p className="text-[#a1a1aa] text-sm">{c.task_description}</p>
            </div>
          )}
        </div>

        {/* Col 2: Application details */}
        <div className="space-y-4 text-sm">
          <p className="text-[#f97316] text-xs font-semibold uppercase tracking-widest mb-2">Application</p>
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
              <a href={c.video_intro_url} target="_blank" rel="noopener noreferrer"
                className="text-[#f97316] text-sm underline">Watch video</a>
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
              <p className="font-semibold mb-1">⚠ Suspicious Activity</p>
              {(c.apply_quiz_sessions?.suspicious_answer_count ?? 0) > 0 && (
                <p>{c.apply_quiz_sessions!.suspicious_answer_count} answer(s) under 3 seconds</p>
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
              {STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Col 3: Recruiter Notes */}
        <div>
          <p className="text-[#f97316] text-xs font-semibold uppercase tracking-widest mb-3">
            Recruiter Notes
          </p>
          <form onSubmit={addNote} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note..."
              className="flex-1 text-sm py-2 px-3"
            />
            <button
              type="submit"
              disabled={addingNote || !newNote.trim()}
              className="bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-50 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
            >
              Add
            </button>
          </form>

          {!notesLoaded ? (
            <div className="flex items-center gap-2 text-[#555] text-xs">
              <div className="w-3 h-3 border border-[#f97316] border-t-transparent rounded-full animate-spin" />
              Loading...
            </div>
          ) : notes.length === 0 ? (
            <p className="text-[#555] text-xs">No notes yet.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {notes.map((n) => (
                <div key={n.id} className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg px-3 py-2">
                  <p className="text-[#e5e5e5] text-sm">{n.note}</p>
                  <p className="text-[#555] text-xs mt-1">
                    {new Date(n.created_at).toLocaleString("en-AU")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
