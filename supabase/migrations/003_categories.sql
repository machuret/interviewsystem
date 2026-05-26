-- ============================================================
-- Categories: specialisations within each role
-- ============================================================

CREATE TABLE IF NOT EXISTS apply_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id    uuid NOT NULL REFERENCES apply_roles(id) ON DELETE CASCADE,
  name       text NOT NULL,
  slug       text NOT NULL,
  active     bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role_id, slug)
);

-- category_id NULL = base question (shown for all specialisations within the role)
ALTER TABLE apply_questions
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES apply_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS apply_questions_category_idx
  ON apply_questions(category_id) WHERE category_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS apply_categories_role_idx
  ON apply_categories(role_id, active);
