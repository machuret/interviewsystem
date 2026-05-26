-- ============================================================
-- Extended candidate profile fields
-- ============================================================

ALTER TABLE apply_candidates
  -- Basic info
  ADD COLUMN IF NOT EXISTS last_name          text,
  ADD COLUMN IF NOT EXISTS facebook_link      text,
  ADD COLUMN IF NOT EXISTS instagram_link     text,
  ADD COLUMN IF NOT EXISTS age                int,
  ADD COLUMN IF NOT EXISTS sex                text CHECK (sex IN ('male','female')),
  ADD COLUMN IF NOT EXISTS married            bool,
  ADD COLUMN IF NOT EXISTS kids               bool,

  -- Setup
  ADD COLUMN IF NOT EXISTS device_type        text CHECK (device_type IN ('pc','laptop')),
  ADD COLUMN IF NOT EXISTS device_brand       text,
  ADD COLUMN IF NOT EXISTS internet_provider  text,

  -- Work experience
  ADD COLUMN IF NOT EXISTS current_job_title  text,
  ADD COLUMN IF NOT EXISTS years_experience   text,
  ADD COLUMN IF NOT EXISTS previous_employers text,
  ADD COLUMN IF NOT EXISTS skills_tools       text,
  ADD COLUMN IF NOT EXISTS software_used      text,
  ADD COLUMN IF NOT EXISTS task_description   text;
