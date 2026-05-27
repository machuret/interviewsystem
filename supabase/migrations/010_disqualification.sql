-- Migration 010: Applicant disqualification tracking

ALTER TABLE apply_applicants
  ADD COLUMN IF NOT EXISTS disqualified_at      timestamptz,
  ADD COLUMN IF NOT EXISTS disqualification_reason text;

CREATE INDEX IF NOT EXISTS idx_applicants_disqualified
  ON apply_applicants(disqualified_at)
  WHERE disqualified_at IS NOT NULL;
