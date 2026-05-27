-- ============================================================
-- Migration 011: Western Work Standards quiz category
-- Brief set of professional standards questions for working
-- with Western / Australian clients.
-- Sourced from Rapidtal "How to Get Hired by Western Companies" guide.
-- ============================================================

-- ============================================================
-- 1. Create "Western Work Standards" category for each role
-- ============================================================

INSERT INTO apply_categories (id, role_id, name, slug, active) VALUES
  -- Marketing Specialist
  ('22220001-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Western Work Standards', 'western-standards', true),
  -- Sales Representative
  ('22220001-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', 'Western Work Standards', 'western-standards', true),
  -- Virtual Assistant
  ('22220001-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000003', 'Western Work Standards', 'western-standards', true),
  -- Executive Assistant
  ('22220001-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000004', 'Western Work Standards', 'western-standards', true)
ON CONFLICT (role_id, slug) DO NOTHING;

-- ============================================================
-- 2. Western Work Standards questions — Marketing Specialist
-- 8 questions (quiz picks 5 randomly each time)
-- ============================================================

INSERT INTO apply_questions (role_id, category_id, question_text, options, correct_answer_index) VALUES

('11111111-0000-0000-0000-000000000001', '22220001-0000-0000-0000-000000000001',
 'Your Sydney client starts work at 9:00 am AEST. What time is that in Manila (Philippine Time)?',
 ARRAY['7:00 am','9:00 am','11:00 am','8:00 am'],
 0),

('11111111-0000-0000-0000-000000000001', '22220001-0000-0000-0000-000000000001',
 'A client messages you on Slack at 2:00 pm during your work hours. When should you reply?',
 ARRAY['Within 2–4 hours','End of the same day, whenever convenient','Next business day','Only if marked urgent'],
 0),

('11111111-0000-0000-0000-000000000001', '22220001-0000-0000-0000-000000000001',
 'You have a Zoom call scheduled at 3:00 pm. When should you join the call?',
 ARRAY['Exactly at 3:00 pm','5–10 minutes before','10–15 minutes after','Whenever you are ready'],
 1),

('11111111-0000-0000-0000-000000000001', '22220001-0000-0000-0000-000000000001',
 'Western freelance contracts typically pay how many times per year?',
 ARRAY['12 months — no 13th-month pay','13 months, the same as Philippine law','14 times — including a holiday bonus','It varies by project milestone'],
 0),

('11111111-0000-0000-0000-000000000001', '22220001-0000-0000-0000-000000000001',
 'Western clients prefer your CV to be:',
 ARRAY['Colourful with your photo and personal details','A clean, black-and-white Word or PDF — no photo required','A link to your social media or portfolio page','As long as possible to show all your experience'],
 1),

('11111111-0000-0000-0000-000000000001', '22220001-0000-0000-0000-000000000001',
 'Your client sends a brief task description but you are not sure what they want. You should:',
 ARRAY['Submit your best guess and see what they say','Ask one clear question before you start','Wait for them to follow up','Decline the task to avoid mistakes'],
 1),

('11111111-0000-0000-0000-000000000001', '22220001-0000-0000-0000-000000000001',
 'Best practice when working on a multi-day task for a Western client is:',
 ARRAY['Only contact them when it is 100% done','Send brief progress updates and flag blockers early','Update once a week regardless of the deadline','Wait for them to ask for a status update'],
 1),

('11111111-0000-0000-0000-000000000001', '22220001-0000-0000-0000-000000000001',
 'A client asks you to deliver by tomorrow but you realistically need two days. You should:',
 ARRAY['Say yes and try your best','Ignore the message until tomorrow','Say no without any explanation','Be upfront about the realistic timeline and propose an alternative date'],
 3);

-- ============================================================
-- 3. Western Work Standards questions — Sales Representative
-- ============================================================

INSERT INTO apply_questions (role_id, category_id, question_text, options, correct_answer_index) VALUES

('11111111-0000-0000-0000-000000000002', '22220001-0000-0000-0000-000000000002',
 'Your Sydney client starts work at 9:00 am AEST. What time is that in Manila (Philippine Time)?',
 ARRAY['7:00 am','9:00 am','11:00 am','8:00 am'],
 0),

('11111111-0000-0000-0000-000000000002', '22220001-0000-0000-0000-000000000002',
 'A client messages you on Slack at 2:00 pm during your work hours. When should you reply?',
 ARRAY['Within 2–4 hours','End of the same day, whenever convenient','Next business day','Only if marked urgent'],
 0),

('11111111-0000-0000-0000-000000000002', '22220001-0000-0000-0000-000000000002',
 'You have a Zoom call scheduled at 3:00 pm. When should you join the call?',
 ARRAY['Exactly at 3:00 pm','5–10 minutes before','10–15 minutes after','Whenever you are ready'],
 1),

('11111111-0000-0000-0000-000000000002', '22220001-0000-0000-0000-000000000002',
 'Western freelance contracts typically pay how many times per year?',
 ARRAY['12 months — no 13th-month pay','13 months, the same as Philippine law','14 times — including a holiday bonus','It varies by project milestone'],
 0),

('11111111-0000-0000-0000-000000000002', '22220001-0000-0000-0000-000000000002',
 'Western clients prefer your CV to be:',
 ARRAY['Colourful with your photo and personal details','A clean, black-and-white Word or PDF — no photo required','A link to your social media or portfolio page','As long as possible to show all your experience'],
 1),

('11111111-0000-0000-0000-000000000002', '22220001-0000-0000-0000-000000000002',
 'Your client sends a brief task description but you are not sure what they want. You should:',
 ARRAY['Submit your best guess and see what they say','Ask one clear question before you start','Wait for them to follow up','Decline the task to avoid mistakes'],
 1),

('11111111-0000-0000-0000-000000000002', '22220001-0000-0000-0000-000000000002',
 'Best practice when working on a multi-day task for a Western client is:',
 ARRAY['Only contact them when it is 100% done','Send brief progress updates and flag blockers early','Update once a week regardless of the deadline','Wait for them to ask for a status update'],
 1),

('11111111-0000-0000-0000-000000000002', '22220001-0000-0000-0000-000000000002',
 'A client asks you to deliver by tomorrow but you realistically need two days. You should:',
 ARRAY['Say yes and try your best','Ignore the message until tomorrow','Say no without any explanation','Be upfront about the realistic timeline and propose an alternative date'],
 3);

-- ============================================================
-- 4. Western Work Standards questions — Virtual Assistant
-- ============================================================

INSERT INTO apply_questions (role_id, category_id, question_text, options, correct_answer_index) VALUES

('11111111-0000-0000-0000-000000000003', '22220001-0000-0000-0000-000000000003',
 'Your Sydney client starts work at 9:00 am AEST. What time is that in Manila (Philippine Time)?',
 ARRAY['7:00 am','9:00 am','11:00 am','8:00 am'],
 0),

('11111111-0000-0000-0000-000000000003', '22220001-0000-0000-0000-000000000003',
 'A client messages you on Slack at 2:00 pm during your work hours. When should you reply?',
 ARRAY['Within 2–4 hours','End of the same day, whenever convenient','Next business day','Only if marked urgent'],
 0),

('11111111-0000-0000-0000-000000000003', '22220001-0000-0000-0000-000000000003',
 'You have a Zoom call scheduled at 3:00 pm. When should you join the call?',
 ARRAY['Exactly at 3:00 pm','5–10 minutes before','10–15 minutes after','Whenever you are ready'],
 1),

('11111111-0000-0000-0000-000000000003', '22220001-0000-0000-0000-000000000003',
 'Western freelance contracts typically pay how many times per year?',
 ARRAY['12 months — no 13th-month pay','13 months, the same as Philippine law','14 times — including a holiday bonus','It varies by project milestone'],
 0),

('11111111-0000-0000-0000-000000000003', '22220001-0000-0000-0000-000000000003',
 'Western clients prefer your CV to be:',
 ARRAY['Colourful with your photo and personal details','A clean, black-and-white Word or PDF — no photo required','A link to your social media or portfolio page','As long as possible to show all your experience'],
 1),

('11111111-0000-0000-0000-000000000003', '22220001-0000-0000-0000-000000000003',
 'Your client sends a brief task description but you are not sure what they want. You should:',
 ARRAY['Submit your best guess and see what they say','Ask one clear question before you start','Wait for them to follow up','Decline the task to avoid mistakes'],
 1),

('11111111-0000-0000-0000-000000000003', '22220001-0000-0000-0000-000000000003',
 'Best practice when working on a multi-day task for a Western client is:',
 ARRAY['Only contact them when it is 100% done','Send brief progress updates and flag blockers early','Update once a week regardless of the deadline','Wait for them to ask for a status update'],
 1),

('11111111-0000-0000-0000-000000000003', '22220001-0000-0000-0000-000000000003',
 'A client asks you to deliver by tomorrow but you realistically need two days. You should:',
 ARRAY['Say yes and try your best','Ignore the message until tomorrow','Say no without any explanation','Be upfront about the realistic timeline and propose an alternative date'],
 3);

-- ============================================================
-- 5. Western Work Standards questions — Executive Assistant
-- ============================================================

INSERT INTO apply_questions (role_id, category_id, question_text, options, correct_answer_index) VALUES

('11111111-0000-0000-0000-000000000004', '22220001-0000-0000-0000-000000000004',
 'Your Sydney client starts work at 9:00 am AEST. What time is that in Manila (Philippine Time)?',
 ARRAY['7:00 am','9:00 am','11:00 am','8:00 am'],
 0),

('11111111-0000-0000-0000-000000000004', '22220001-0000-0000-0000-000000000004',
 'A client messages you on Slack at 2:00 pm during your work hours. When should you reply?',
 ARRAY['Within 2–4 hours','End of the same day, whenever convenient','Next business day','Only if marked urgent'],
 0),

('11111111-0000-0000-0000-000000000004', '22220001-0000-0000-0000-000000000004',
 'You have a Zoom call scheduled at 3:00 pm. When should you join the call?',
 ARRAY['Exactly at 3:00 pm','5–10 minutes before','10–15 minutes after','Whenever you are ready'],
 1),

('11111111-0000-0000-0000-000000000004', '22220001-0000-0000-0000-000000000004',
 'Western freelance contracts typically pay how many times per year?',
 ARRAY['12 months — no 13th-month pay','13 months, the same as Philippine law','14 times — including a holiday bonus','It varies by project milestone'],
 0),

('11111111-0000-0000-0000-000000000004', '22220001-0000-0000-0000-000000000004',
 'Western clients prefer your CV to be:',
 ARRAY['Colourful with your photo and personal details','A clean, black-and-white Word or PDF — no photo required','A link to your social media or portfolio page','As long as possible to show all your experience'],
 1),

('11111111-0000-0000-0000-000000000004', '22220001-0000-0000-0000-000000000004',
 'Your client sends a brief task description but you are not sure what they want. You should:',
 ARRAY['Submit your best guess and see what they say','Ask one clear question before you start','Wait for them to follow up','Decline the task to avoid mistakes'],
 1),

('11111111-0000-0000-0000-000000000004', '22220001-0000-0000-0000-000000000004',
 'Best practice when working on a multi-day task for a Western client is:',
 ARRAY['Only contact them when it is 100% done','Send brief progress updates and flag blockers early','Update once a week regardless of the deadline','Wait for them to ask for a status update'],
 1),

('11111111-0000-0000-0000-000000000004', '22220001-0000-0000-0000-000000000004',
 'A client asks you to deliver by tomorrow but you realistically need two days. You should:',
 ARRAY['Say yes and try your best','Ignore the message until tomorrow','Say no without any explanation','Be upfront about the realistic timeline and propose an alternative date'],
 3);
