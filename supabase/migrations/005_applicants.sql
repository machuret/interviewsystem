-- ============================================================
-- Pre-quiz applicant staging table
-- Personal info is collected before the quiz and auto-saved here.
-- On pass, candidates API reads this to build the full candidate record.
-- ============================================================

CREATE TABLE IF NOT EXISTS apply_applicants (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_slug        text NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  -- Basic info
  first_name       text,
  last_name        text,
  email            text,
  facebook_link    text,
  instagram_link   text,
  phone            text,
  age              int,
  location         text,
  sex              text CHECK (sex IN ('male','female')),
  married          bool,
  kids             bool,
  -- Setup
  device_type      text CHECK (device_type IN ('pc','laptop')),
  device_brand     text,
  internet_provider text,
  -- Work experience
  current_job_title   text,
  years_experience    text,
  previous_employers  text,
  skills_tools        text,
  software_used       text,
  task_description    text
);

ALTER TABLE apply_quiz_sessions
  ADD COLUMN IF NOT EXISTS applicant_id uuid REFERENCES apply_applicants(id);

CREATE INDEX IF NOT EXISTS apply_applicants_email_idx  ON apply_applicants(email);
CREATE INDEX IF NOT EXISTS apply_applicants_role_idx   ON apply_applicants(role_slug);
