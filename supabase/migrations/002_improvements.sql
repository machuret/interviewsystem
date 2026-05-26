-- ============================================================
-- Improvements: anti-cheat, time tracking, dedup, practical tasks
-- ============================================================

-- Quiz session enhancements
ALTER TABLE apply_quiz_sessions
  ADD COLUMN IF NOT EXISTS option_orders          jsonb,      -- per-question option permutations
  ADD COLUMN IF NOT EXISTS answer_times           numeric[],  -- seconds per answer
  ADD COLUMN IF NOT EXISTS suspicious_answer_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ip_address             text;

-- Candidate enhancements
ALTER TABLE apply_candidates
  ADD COLUMN IF NOT EXISTS video_intro_url    text,
  ADD COLUMN IF NOT EXISTS practical_response text,
  ADD COLUMN IF NOT EXISTS writing_sample     text;

-- Practical tasks per role
CREATE TABLE IF NOT EXISTS apply_practical_tasks (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES apply_roles(id) ON DELETE CASCADE,
  prompt  text NOT NULL,
  active  bool NOT NULL DEFAULT true
);

-- Indexes
CREATE INDEX IF NOT EXISTS apply_sessions_ip_idx
  ON apply_quiz_sessions(ip_address, started_at)
  WHERE ip_address IS NOT NULL;

CREATE INDEX IF NOT EXISTS apply_sessions_email_started_idx
  ON apply_quiz_sessions(candidate_email, started_at)
  WHERE candidate_email IS NOT NULL;

-- ============================================================
-- Seed: Practical Tasks (one per role)
-- ============================================================
INSERT INTO apply_practical_tasks (role_id, prompt) VALUES

('11111111-0000-0000-0000-000000000001',
 'Write a 3-sentence social media caption promoting a Sydney-based digital marketing agency''s new Google Ads service. The target audience is small business owners who feel their current marketing isn''t working.'),

('11111111-0000-0000-0000-000000000002',
 'A prospect replies to your outreach: "Thanks, but we''re happy with our current provider." Write a 2–3 sentence response that acknowledges their reply and keeps the door open — without being pushy or desperate.'),

('11111111-0000-0000-0000-000000000003',
 'Your client forwarded you this email thread and said "can you handle this?" — The client has a confirmed 3pm Tuesday meeting with a vendor. The vendor''s assistant has just emailed asking to reschedule to 4pm Wednesday due to a conflict. Write the reply you would send on your client''s behalf.'),

('11111111-0000-0000-0000-000000000004',
 'Your executive is flying to Melbourne tomorrow morning for a full-day client visit. They just told you they need a dinner reservation for 7pm for 4 people (one guest is vegetarian, the executive prefers a private or semi-private setting). Write the booking request email you would send to the restaurant.');
