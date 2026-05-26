"use client";

import { useState } from "react";
import type { Candidate, Note } from "../_types";
import { STATUSES } from "../_types";
import Detail from "./Detail";

type Props = {
  c: Candidate;
  notes: Note[];
  notesLoaded: boolean;
  updatingId: string | null;
  updateStatus: (id: string, status: string) => void;
  onAddNote: (candidateId: string, note: Note) => void;
};

const firstName = (name: string) => name.split(" ")[0];

function makeTemplates(c: Candidate) {
  const name = firstName(c.full_name);
  const role = c.apply_quiz_sessions?.apply_roles?.name ?? "the role";
  return [
    {
      label: "Shortlist invite",
      color: "text-green-400",
      body: `Hi ${name},\n\nGreat news — your application for the ${role} position at RapidTal has been shortlisted!\n\nWe'd love to schedule a short interview with you to learn more. Please reply with your availability over the next few days and we'll lock in a time.\n\nLooking forward to speaking with you.\n\nBest,\nThe RapidTal Team`,
    },
    {
      label: "Interview scheduled",
      color: "text-yellow-400",
      body: `Hi ${name},\n\nThis is a confirmation of your upcoming interview for the ${role} position at RapidTal.\n\nWe'll send the meeting link shortly. Please make sure you're in a quiet place with a stable internet connection.\n\nSee you soon!\n\nBest,\nThe RapidTal Team`,
    },
    {
      label: "Kind rejection",
      color: "text-red-400",
      body: `Hi ${name},\n\nThank you for taking the time to apply for the ${role} position at RapidTal. We genuinely appreciate the effort you put in.\n\nAfter careful review, we've decided to move forward with other candidates who more closely match our current requirements. This doesn't reflect on your abilities — it's simply a matter of fit at this time.\n\nWe'll keep your profile on file and encourage you to apply again in the future.\n\nAll the best,\nThe RapidTal Team`,
    },
  ];
}

export default function CandidateDetail({
  c, notes, notesLoaded, updatingId, updateStatus, onAddNote,
}: Props) {
  const [newNote, setNewNote]         = useState("");
  const [addingNote, setAddingNote]   = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [copied, setCopied]           = useState<string | null>(null);

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

  async function copyTemplate(label: string, body: string) {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // fallback — select the textarea
    }
  }

  const templates = makeTemplates(c);

  return (
    <div className="px-5 pb-5 border-t border-brand-black-border pt-4">
      <div className="grid sm:grid-cols-3 gap-6">

        {/* Column 1 — Personal */}
        <div className="space-y-2 text-sm">
          <p className="section-label mb-2">Personal</p>
          <Detail label="Phone"    value={c.phone} />
          <Detail label="Location" value={c.location} />
          {c.age        != null && <Detail label="Age"     value={String(c.age)} />}
          {c.sex                 && <Detail label="Sex"     value={c.sex} />}
          {c.married    != null  && <Detail label="Married" value={c.married ? "Yes" : "No"} />}
          {c.kids       != null  && <Detail label="Kids"    value={c.kids ? "Yes" : "No"} />}
          {c.facebook_link       && <Detail label="Facebook"  value={c.facebook_link}  link />}
          {c.instagram_link      && <Detail label="Instagram" value={c.instagram_link} link />}

          <p className="section-label mb-1 mt-4">Setup</p>
          {(c.device_type || c.device_brand) &&
            <Detail label="Device" value={[c.device_type, c.device_brand].filter(Boolean).join(" — ")} />}
          {c.internet_provider && <Detail label="Internet" value={c.internet_provider} />}

          <p className="section-label mb-1 mt-4">Experience</p>
          {c.current_job_title  && <Detail label="Title"     value={c.current_job_title} />}
          {c.years_experience   && <Detail label="Exp"       value={c.years_experience} />}
          {c.previous_employers && <Detail label="Employers" value={c.previous_employers} />}
          {c.skills_tools       && <Detail label="Skills"    value={c.skills_tools} />}
          {c.software_used      && <Detail label="Software"  value={c.software_used} />}
          {c.task_description   && (
            <div>
              <p className="text-brand-text-muted text-xs uppercase tracking-wide mb-0.5">Day-to-day</p>
              <p className="text-brand-text-secondary text-sm">{c.task_description}</p>
            </div>
          )}
        </div>

        {/* Column 2 — Application */}
        <div className="space-y-4 text-sm">
          <p className="section-label mb-2">Application</p>
          <Detail label="Salary"  value={`₱${Number(c.salary_expectation_php).toLocaleString()}/mo`} />
          <Detail label="Payment" value={c.payment_methods.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(", ")} />
          {c.paypal_email && <Detail label="PayPal" value={c.paypal_email} />}
          {c.wise_email   && <Detail label="Wise"   value={c.wise_email} />}

          <div>
            <p className="text-brand-text-muted text-xs uppercase tracking-wide mb-1">What makes them different</p>
            <p className="text-brand-text-body text-sm">{c.differentiator}</p>
          </div>
          {c.video_intro_url && (
            <div>
              <p className="text-brand-text-muted text-xs uppercase tracking-wide mb-1">Video Intro</p>
              <a href={c.video_intro_url} target="_blank" rel="noopener noreferrer"
                className="text-brand-orange text-sm underline">Watch video</a>
            </div>
          )}
          {c.writing_sample && (
            <div>
              <p className="text-brand-text-muted text-xs uppercase tracking-wide mb-1">Writing Sample</p>
              <p className="text-brand-text-secondary text-sm leading-relaxed">{c.writing_sample}</p>
            </div>
          )}
          {c.practical_response && (
            <div>
              <p className="text-brand-text-muted text-xs uppercase tracking-wide mb-1">Practical Task</p>
              <p className="text-brand-text-secondary text-sm leading-relaxed">{c.practical_response}</p>
            </div>
          )}

          <div>
            <p className="text-brand-text-muted text-xs uppercase tracking-wide mb-2">CV</p>
            <a href={c.cv_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 card-inner hover:border-brand-orange px-4 py-2 rounded-lg text-sm text-brand-orange transition-colors duration-150">
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

          {c.rejection_reason && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-3 text-xs text-red-400">
              <p className="font-semibold mb-0.5">Rejection reason</p>
              <p>{c.rejection_reason}</p>
            </div>
          )}

          <div>
            <p className="text-brand-text-muted text-xs uppercase tracking-wide mb-2">Status</p>
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

        {/* Column 3 — Notes + Email templates */}
        <div>
          <p className="section-label mb-3">Recruiter Notes</p>
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
              className="bg-brand-orange hover:bg-brand-orange-dark disabled:opacity-50 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors duration-150"
            >
              Add
            </button>
          </form>

          {!notesLoaded ? (
            <div className="flex items-center gap-2 text-brand-text-muted text-xs">
              <div className="w-3 h-3 border border-brand-orange border-t-transparent rounded-full animate-spin" />
              Loading...
            </div>
          ) : notes.length === 0 ? (
            <p className="text-brand-text-muted text-xs">No notes yet.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 mb-4">
              {notes.map((n) => (
                <div key={n.id} className="card-inner rounded-lg px-3 py-2">
                  <p className="text-brand-text-body text-sm">{n.note}</p>
                  <p className="text-brand-text-muted text-xs mt-1">
                    {new Date(n.created_at).toLocaleString("en-AU")}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Email templates */}
          <button
            onClick={() => setShowTemplates((v) => !v)}
            className="text-brand-text-muted hover:text-white text-xs flex items-center gap-1.5 transition-colors duration-150 mt-2"
          >
            <span>{showTemplates ? "▲" : "▼"}</span>
            Email templates
          </button>

          {showTemplates && (
            <div className="mt-3 space-y-2">
              {templates.map((t) => (
                <div key={t.label} className="card-inner rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold ${t.color}`}>{t.label}</span>
                    <button
                      onClick={() => copyTemplate(t.label, t.body)}
                      className="text-xs text-brand-text-muted hover:text-white transition-colors duration-150"
                    >
                      {copied === t.label ? "✓ Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="text-brand-text-muted text-xs leading-relaxed line-clamp-3 whitespace-pre-line">
                    {t.body}
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
