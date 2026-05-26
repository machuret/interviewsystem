-- Migration 007: Missing indexes + SQL RPC functions for dashboard & analytics

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_applicants_email    ON apply_applicants(email);
CREATE INDEX IF NOT EXISTS idx_applicants_role     ON apply_applicants(role_slug);
CREATE INDEX IF NOT EXISTS idx_candidates_email    ON apply_candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_status   ON apply_candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_session  ON apply_candidates(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_passed     ON apply_quiz_sessions(passed) WHERE passed = true;
CREATE INDEX IF NOT EXISTS idx_sessions_role       ON apply_quiz_sessions(role_id);
CREATE INDEX IF NOT EXISTS idx_sessions_completed  ON apply_quiz_sessions(completed_at) WHERE completed_at IS NOT NULL;

-- ── Dashboard stats RPC ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION dashboard_stats()
RETURNS json LANGUAGE sql SECURITY DEFINER AS $$
  SELECT json_build_object(
    'started_form', (SELECT COUNT(*)::int FROM apply_applicants),
    'took_quiz',    (SELECT COUNT(*)::int FROM apply_quiz_sessions),
    'passed_quiz',  (SELECT COUNT(*)::int FROM apply_quiz_sessions WHERE passed = true),
    'applied',      (SELECT COUNT(*)::int FROM apply_candidates),
    'by_status', (
      SELECT COALESCE(
        json_object_agg(status, cnt),
        '{"new":0,"shortlisted":0,"interviewed":0,"rejected":0}'::json
      )
      FROM (
        SELECT status, COUNT(*)::int AS cnt
        FROM apply_candidates
        GROUP BY status
      ) s
    ),
    'by_role', (
      SELECT COALESCE(json_agg(row_to_json(r)), '[]'::json)
      FROM (
        SELECT
          ar.slug,
          ar.name,
          COUNT(DISTINCT aa.id)::int                                    AS started_form,
          COUNT(DISTINCT qs.id)::int                                    AS took_quiz,
          COUNT(DISTINCT qs.id) FILTER (WHERE qs.passed = true)::int   AS passed,
          COUNT(DISTINCT ac.id)::int                                    AS applied,
          ROUND(AVG(qs.score)::numeric, 1)                             AS avg_score
        FROM apply_roles ar
        LEFT JOIN apply_applicants     aa ON aa.role_slug = ar.slug
        LEFT JOIN apply_quiz_sessions  qs ON qs.role_id  = ar.id
        LEFT JOIN apply_candidates     ac ON ac.session_id = qs.id
        WHERE ar.active = true
        GROUP BY ar.id, ar.slug, ar.name
        ORDER BY ar.name
      ) r
    )
  );
$$;

-- ── Question analytics RPC ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION question_analytics(p_role_id uuid DEFAULT NULL)
RETURNS TABLE(question_id uuid, total int, correct int)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    q_id::uuid   AS question_id,
    COUNT(*)::int AS total,
    SUM(CASE WHEN flag THEN 1 ELSE 0 END)::int AS correct
  FROM (
    SELECT
      unnest(question_ids) AS q_id,
      unnest(correct_flags) AS flag,
      role_id
    FROM apply_quiz_sessions
    WHERE correct_flags IS NOT NULL
      AND completed_at IS NOT NULL
  ) expanded
  WHERE p_role_id IS NULL OR role_id = p_role_id
  GROUP BY q_id;
$$;
