-- Migration 012: interview_date tracking on candidates
ALTER TABLE apply_candidates
  ADD COLUMN IF NOT EXISTS interview_date timestamptz;

CREATE INDEX IF NOT EXISTS idx_candidates_interview_date
  ON apply_candidates(interview_date)
  WHERE interview_date IS NOT NULL;
