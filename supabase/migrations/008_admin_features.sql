-- Migration 008: Admin quick-win features
-- Starred candidates + rejection reasons

ALTER TABLE apply_candidates
  ADD COLUMN IF NOT EXISTS starred          boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

CREATE INDEX IF NOT EXISTS idx_candidates_starred
  ON apply_candidates(starred) WHERE starred = true;
