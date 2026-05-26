-- Migration 006: Assessment quality fields, notes, analytics support

-- Add typing test + internet speed fields to apply_applicants
ALTER TABLE apply_applicants
  ADD COLUMN IF NOT EXISTS typing_wpm        integer,
  ADD COLUMN IF NOT EXISTS typing_accuracy   numeric(5,2),
  ADD COLUMN IF NOT EXISTS internet_mbps     numeric(8,2);

-- Add correct_flags to sessions (parallel array to question_ids — true = correct)
ALTER TABLE apply_quiz_sessions
  ADD COLUMN IF NOT EXISTS correct_flags boolean[];

-- Recruiter notes per candidate
CREATE TABLE IF NOT EXISTS apply_candidate_notes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES apply_candidates(id) ON DELETE CASCADE,
  note         text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candidate_notes_candidate ON apply_candidate_notes(candidate_id);

-- Status column on apply_candidates (if not already added)
ALTER TABLE apply_candidates
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'shortlisted', 'interviewed', 'rejected'));
