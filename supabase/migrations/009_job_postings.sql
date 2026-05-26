-- Migration 009: Job postings system

CREATE TABLE IF NOT EXISTS apply_job_postings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id       uuid NOT NULL REFERENCES apply_roles(id),
  category_id   uuid REFERENCES apply_categories(id),
  title         text NOT NULL,
  description   text,
  requirements  text,
  salary_from   integer,
  salary_to     integer,
  status        text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'published')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_postings_status ON apply_job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_role   ON apply_job_postings(role_id);

-- Track which job posting each applicant / candidate came from
ALTER TABLE apply_applicants
  ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES apply_job_postings(id);

ALTER TABLE apply_candidates
  ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES apply_job_postings(id);
