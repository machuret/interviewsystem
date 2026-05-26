-- ============================================================
-- apply.rapidtal.com — candidate pre-screening schema
-- Run this in the Supabase SQL editor for the rapidtal project
-- ============================================================

-- Roles
CREATE TABLE IF NOT EXISTS apply_roles (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  active bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Questions per role
CREATE TABLE IF NOT EXISTS apply_questions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id              uuid NOT NULL REFERENCES apply_roles(id) ON DELETE CASCADE,
  question_text        text NOT NULL,
  options              text[] NOT NULL,       -- exactly 4 items
  correct_answer_index int NOT NULL CHECK (correct_answer_index BETWEEN 0 AND 3),
  active               bool NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- Quiz sessions
CREATE TABLE IF NOT EXISTS apply_quiz_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id         uuid NOT NULL REFERENCES apply_roles(id),
  candidate_email text,
  score           int,
  started_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz,
  passed          bool,
  tab_switches    int NOT NULL DEFAULT 0,
  question_ids    uuid[] NOT NULL DEFAULT '{}'  -- ordered list used in session
);

-- Candidates (only created on pass)
CREATE TABLE IF NOT EXISTS apply_candidates (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            uuid NOT NULL REFERENCES apply_quiz_sessions(id),
  full_name             text NOT NULL,
  email                 text NOT NULL,
  phone                 text NOT NULL,
  location              text NOT NULL,
  salary_expectation_php numeric(12,2) NOT NULL,
  payment_methods       text[] NOT NULL,       -- ['paypal','wise']
  paypal_email          text,
  wise_email            text,
  cv_url                text NOT NULL,
  cv_type               text NOT NULL CHECK (cv_type IN ('pdf','gdoc')),
  differentiator        text NOT NULL,
  submitted_at          timestamptz NOT NULL DEFAULT now(),
  status                text NOT NULL DEFAULT 'new'
                          CHECK (status IN ('new','shortlisted','interviewed','rejected'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS apply_questions_role_idx   ON apply_questions(role_id, active);
CREATE INDEX IF NOT EXISTS apply_sessions_role_idx    ON apply_quiz_sessions(role_id);
CREATE INDEX IF NOT EXISTS apply_candidates_email_idx ON apply_candidates(email);
CREATE INDEX IF NOT EXISTS apply_candidates_status_idx ON apply_candidates(status);

-- ============================================================
-- Seed: Roles
-- ============================================================
INSERT INTO apply_roles (id, name, slug, description) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Marketing Specialist',    'marketing',            'Content, SEO, social media, email & digital marketing'),
  ('11111111-0000-0000-0000-000000000002', 'Sales Representative',    'sales',                'Lead generation, outreach, closing & CRM management'),
  ('11111111-0000-0000-0000-000000000003', 'Virtual Assistant',       'virtual-assistant',    'Admin support, scheduling, email & data entry'),
  ('11111111-0000-0000-0000-000000000004', 'Executive Assistant',     'executive-assistant',  'C-suite support, complex scheduling, travel & discretion')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Seed: Marketing Questions (15)
-- ============================================================
INSERT INTO apply_questions (role_id, question_text, options, correct_answer_index) VALUES

('11111111-0000-0000-0000-000000000001',
 'What does CTR stand for in digital marketing?',
 ARRAY['Customer Traffic Report','Click-Through Rate','Content Tracking Revenue','Campaign Target Reach'],
 1),

('11111111-0000-0000-0000-000000000001',
 'Which platform is most effective for B2B marketing?',
 ARRAY['Instagram','TikTok','LinkedIn','Snapchat'],
 2),

('11111111-0000-0000-0000-000000000001',
 'What is the top stage of a marketing funnel called?',
 ARRAY['Conversion','Retention','Awareness','Decision'],
 2),

('11111111-0000-0000-0000-000000000001',
 'What does SEO stand for?',
 ARRAY['Social Engagement Optimization','Search Engine Optimization','Sales and Email Outreach','Site Engagement Overview'],
 1),

('11111111-0000-0000-0000-000000000001',
 'Which metric measures the percentage of visitors who leave after viewing only one page?',
 ARRAY['Exit rate','Bounce rate','Churn rate','Drop-off rate'],
 1),

('11111111-0000-0000-0000-000000000001',
 'What is A/B testing in marketing?',
 ARRAY['Comparing two ad budgets','Comparing two versions of a page to see which performs better','Testing two social platforms','Comparing two products'],
 1),

('11111111-0000-0000-0000-000000000001',
 'What does CPA stand for in paid advertising?',
 ARRAY['Click Per Action','Cost Per Acquisition','Campaign Performance Analytics','Conversion Performance Average'],
 1),

('11111111-0000-0000-0000-000000000001',
 'A good email subject line should:',
 ARRAY['Be as long as possible','Always include the recipient''s full name','Be concise and create curiosity or urgency','Use all capital letters'],
 2),

('11111111-0000-0000-0000-000000000001',
 'What is a buyer persona?',
 ARRAY['A fake social media profile','A semi-fictional representation of your ideal customer','A real customer interview transcript','A competitor analysis document'],
 1),

('11111111-0000-0000-0000-000000000001',
 'What does ROAS stand for?',
 ARRAY['Return on Advertising Spend','Rate of Active Subscribers','Revenue on Audience Segments','Return on Asset Strategy'],
 0),

('11111111-0000-0000-0000-000000000001',
 'Which content format typically drives the highest engagement on social media?',
 ARRAY['Long-form articles','Text-only posts','Video content','PDF downloads'],
 2),

('11111111-0000-0000-0000-000000000001',
 'What is remarketing?',
 ARRAY['Rebranding a product','Targeting ads to users who previously visited your site','Sending a second marketing email','Refreshing ad creatives'],
 1),

('11111111-0000-0000-0000-000000000001',
 'What is the purpose of a UTM parameter?',
 ARRAY['To improve page loading speed','To block competitor ads','To track traffic sources and campaign performance','To manage email unsubscribes'],
 2),

('11111111-0000-0000-0000-000000000001',
 'What does CRM stand for?',
 ARRAY['Customer Revenue Management','Content Resource Map','Customer Relationship Management','Campaign Response Metrics'],
 2),

('11111111-0000-0000-0000-000000000001',
 'Content marketing is primarily focused on:',
 ARRAY['Direct selling through paid ads','Creating valuable content to attract and retain customers','Cold calling prospects','Increasing ad spend'],
 1);

-- ============================================================
-- Seed: Sales Questions (15)
-- ============================================================
INSERT INTO apply_questions (role_id, question_text, options, correct_answer_index) VALUES

('11111111-0000-0000-0000-000000000002',
 'What does BANT stand for in sales qualification?',
 ARRAY['Budget, Authority, Need, Timeline','Brand, Audience, Network, Timing','Buy, Assess, Negotiate, Transfer','Business, Action, Nurture, Target'],
 0),

('11111111-0000-0000-0000-000000000002',
 'What is a discovery call?',
 ARRAY['A cold call to pitch a product','An initial call to understand a prospect''s needs and challenges','A demo presentation','A closing call for signatures'],
 1),

('11111111-0000-0000-0000-000000000002',
 'Which objection-handling technique involves agreeing with the prospect before presenting your case?',
 ARRAY['Direct denial','Feel-Felt-Found method','Hard reframe','Silence method'],
 1),

('11111111-0000-0000-0000-000000000002',
 'What distinguishes a "prospect" from a "lead"?',
 ARRAY['No difference — they are the same','A prospect has not been contacted yet','A lead is further along in the sales cycle','A prospect has been qualified as a potential buyer'],
 3),

('11111111-0000-0000-0000-000000000002',
 'What is a sales pipeline?',
 ARRAY['A physical office layout for sales','A visual representation of where prospects are in the buying process','A cold-calling script','A sales training program'],
 1),

('11111111-0000-0000-0000-000000000002',
 'When a prospect says "your price is too high," the best response is to:',
 ARRAY['Immediately lower the price','Apologize and offer a discount','Ask questions to understand the value gap and justify ROI','End the call and follow up later'],
 2),

('11111111-0000-0000-0000-000000000002',
 'What does "follow-up cadence" mean?',
 ARRAY['The rhythm and sequence of outreach attempts after initial contact','The speed of a presentation','A method to track commission','The process of closing a deal'],
 0),

('11111111-0000-0000-0000-000000000002',
 'What is social proof in a sales context?',
 ARRAY['Using social media to advertise','Testimonials, case studies, and reviews that build trust','Proving your product is popular on Instagram','Getting likes on your LinkedIn posts'],
 1),

('11111111-0000-0000-0000-000000000002',
 'What is an elevator pitch?',
 ARRAY['A 30-60 second compelling summary of your value proposition','A pitch delivered inside an elevator','A 10-minute product demo','A written sales proposal'],
 0),

('11111111-0000-0000-0000-000000000002',
 'In sales, "closing" means:',
 ARRAY['Ending a failed conversation','Finishing a presentation','Getting a commitment or agreement from the prospect','Sending a final invoice'],
 2),

('11111111-0000-0000-0000-000000000002',
 'What is cross-selling?',
 ARRAY['Selling to a competitor''s customers','Offering a more expensive product','Recommending complementary products to existing customers','Selling in a different country'],
 2),

('11111111-0000-0000-0000-000000000002',
 'The key benefit of CRM software in sales is:',
 ARRAY['Automatically closing deals','Tracking interactions, managing pipelines, and organizing customer data','Replacing salespeople with automation','Creating ad campaigns'],
 1),

('11111111-0000-0000-0000-000000000002',
 'What is a "pain point" in sales?',
 ARRAY['A difficult negotiation','A specific problem or challenge your product can solve','An objection you cannot overcome','A competitor''s weakness'],
 1),

('11111111-0000-0000-0000-000000000002',
 'The ideal first step in any sales conversation is to:',
 ARRAY['Pitch your product immediately','Ask for a purchasing decision','Listen and ask questions to understand the prospect''s needs','Send a product brochure upfront'],
 2),

('11111111-0000-0000-0000-000000000002',
 'What does "warm calling" mean?',
 ARRAY['Calling during business hours','Calling leads who have already shown interest or been referred','Using a friendly tone on cold calls','Making calls in a comfortable temperature'],
 1);

-- ============================================================
-- Seed: Virtual Assistant Questions (15)
-- ============================================================
INSERT INTO apply_questions (role_id, question_text, options, correct_answer_index) VALUES

('11111111-0000-0000-0000-000000000003',
 'A client asks you to reschedule a meeting that conflicts with another booking. What do you do first?',
 ARRAY['Cancel the less important meeting immediately','Check both parties'' availability before proposing a new time','Email both parties to sort it out themselves','Ignore it until the client follows up'],
 1),

('11111111-0000-0000-0000-000000000003',
 'What is the best practice for managing a busy client''s inbox?',
 ARRAY['Delete all non-urgent emails','Reply to everything on their behalf without asking','Categorise, flag priority emails, and create a daily digest','Forward all emails to yourself'],
 2),

('11111111-0000-0000-0000-000000000003',
 'Which tool is best for real-time collaborative document editing?',
 ARRAY['Microsoft Paint','Google Docs','Notepad','Adobe Acrobat Reader'],
 1),

('11111111-0000-0000-0000-000000000003',
 'A client gives you access to their Google Calendar. You should:',
 ARRAY['Share it with your other clients as a reference','Only add events they explicitly ask you to add','Reorganise all existing events to improve structure','Treat the access as confidential and use it only for assigned tasks'],
 3),

('11111111-0000-0000-0000-000000000003',
 'What does "async communication" mean?',
 ARRAY['Communication that happens in real time','Communication where both parties don''t need to be online simultaneously','Video calls only','Using multiple devices at once'],
 1),

('11111111-0000-0000-0000-000000000003',
 'You spot an error in work you already delivered to a client. You should:',
 ARRAY['Hope the client doesn''t notice','Wait for the client to point it out','Proactively inform the client and provide a corrected version','Deny responsibility'],
 2),

('11111111-0000-0000-0000-000000000003',
 'Which is the correct way to open a professional email to a new contact?',
 ARRAY['"Hey there,"','"To Whom It May Concern,"','"Dear [First Name]," or "Hi [First Name],"','Start directly with the message, no greeting needed'],
 2),

('11111111-0000-0000-0000-000000000003',
 'What is the best approach to managing multiple tasks with different deadlines?',
 ARRAY['Work on the most interesting tasks first','Prioritise by deadline and client impact, and maintain a task list','Ask your client to prioritise for you','Work on tasks randomly as they arrive'],
 1),

('11111111-0000-0000-0000-000000000003',
 'A client asks you to book a flight. What information do you collect first?',
 ARRAY['Just the destination city','Travel dates, origin, destination, passenger details, and budget/preferences','Only the budget','Just the travel dates'],
 1),

('11111111-0000-0000-0000-000000000003',
 'A Virtual Assistant should NOT:',
 ARRAY['Manage emails on behalf of a client','Organise a client''s calendar','Make legal or financial decisions on behalf of the client','Handle travel arrangements'],
 2),

('11111111-0000-0000-0000-000000000003',
 'The best way to track your work hours for a client is to:',
 ARRAY['Estimate at the end of the month','Ask the client to estimate your hours','Use a time-tracking tool like Toggl or Clockify and report regularly','Only track when the client asks'],
 2),

('11111111-0000-0000-0000-000000000003',
 'Which file format is best for sharing documents that should not be edited by the recipient?',
 ARRAY['.docx','.txt','.pdf','.pages'],
 2),

('11111111-0000-0000-0000-000000000003',
 'When a client is unhappy with your work, the best response is to:',
 ARRAY['Defend your work and explain why it''s correct','Apologise, ask for specific feedback, and propose solutions','Offer a refund immediately without discussion','Argue that the instructions were unclear'],
 1),

('11111111-0000-0000-0000-000000000003',
 'What is Slack primarily used for?',
 ARRAY['Video editing','Email marketing campaigns','Team communication and messaging','Project invoicing'],
 2),

('11111111-0000-0000-0000-000000000003',
 'You receive a confidential document from your client. You should:',
 ARRAY['Share it with colleagues for their input','Post it online for reference','Store it securely and never share it without explicit permission','Print it out for easier reading'],
 2);

-- ============================================================
-- Seed: Executive Assistant Questions (15)
-- ============================================================
INSERT INTO apply_questions (role_id, question_text, options, correct_answer_index) VALUES

('11111111-0000-0000-0000-000000000004',
 'An executive''s calendar has two critical meetings overlapping. You should:',
 ARRAY['Decline both and reschedule','Let the executive handle it','Assess priority, check availability, and propose alternatives to both parties','Cancel whichever was booked last'],
 2),

('11111111-0000-0000-0000-000000000004',
 'What is a "briefing document"?',
 ARRAY['A short employment contract','A document summarising key points before a meeting or event','An employee onboarding guide','A quarterly financial report'],
 1),

('11111111-0000-0000-0000-000000000004',
 'Which best describes "discretion" as an Executive Assistant?',
 ARRAY['Being quiet in meetings','Handling sensitive information with absolute confidentiality','Not speaking unless spoken to','Wearing formal attire at all times'],
 1),

('11111111-0000-0000-0000-000000000004',
 'An executive needs to travel internationally next week. You should arrange:',
 ARRAY['Flights only','Flights, accommodation, visa requirements, transfers, and a full itinerary','Just a hotel','Only the visa application'],
 1),

('11111111-0000-0000-0000-000000000004',
 'What is the best way to take minutes during a meeting?',
 ARRAY['Write down every single word spoken','Record only action items','Capture key decisions, action items, owners, and deadlines','Ask someone else to do it'],
 2),

('11111111-0000-0000-0000-000000000004',
 'An executive asks you to "handle" their emails. This means:',
 ARRAY['Reading them without their knowledge','Deleting ones that seem unimportant','Triaging, flagging urgent items, drafting responses, and keeping them updated','Forwarding all emails to yourself'],
 2),

('11111111-0000-0000-0000-000000000004',
 'What does "gatekeeping" mean in an EA role?',
 ARRAY['Locking the office entrance','Managing who has access to the executive''s time and information','Screening job applicants','Monitoring building security'],
 1),

('11111111-0000-0000-0000-000000000004',
 'An executive is on an important call and someone walks into the office. You should:',
 ARRAY['Interrupt to announce the visitor','Ignore the visitor','Silently signal the visitor and manage the situation without interrupting','Ask the executive to pause the call'],
 2),

('11111111-0000-0000-0000-000000000004',
 'To manage a complex project across multiple stakeholders, you would use:',
 ARRAY['A notepad','WhatsApp groups','Project management software like Asana, Monday, or Trello','Printed to-do lists'],
 2),

('11111111-0000-0000-0000-000000000004',
 'An executive asks you to prepare a presentation. Before starting, you ask for:',
 ARRAY['Permission to use any template you like','Key talking points, audience, purpose, and deadline','Last year''s presentation to copy','Design preferences only'],
 1),

('11111111-0000-0000-0000-000000000004',
 'What is the purpose of a pre-meeting agenda?',
 ARRAY['To fill time before the meeting','To give attendees structure, context, and preparation expectations','To make meetings run longer','To replace the meeting itself'],
 1),

('11111111-0000-0000-0000-000000000004',
 'When booking a restaurant for an executive business dinner, you should consider:',
 ARRAY['Only the price','Only the location','Guest dietary preferences, ambiance, location, privacy, and availability','Your own personal preferences'],
 2),

('11111111-0000-0000-0000-000000000004',
 'What does "managing up" mean as an EA?',
 ARRAY['Seeking a promotion','Proactively communicating, anticipating needs, and supporting your executive''s success','Reporting your executive to HR','Working longer hours'],
 1),

('11111111-0000-0000-0000-000000000004',
 'An executive needs to sign a contract urgently while travelling. You should:',
 ARRAY['Wait until they return to the office','Sign it yourself on their behalf','Send it via an e-signature platform so they can sign digitally','Ask a colleague to sign it'],
 2),

('11111111-0000-0000-0000-000000000004',
 'What distinguishes an Executive Assistant from a general Virtual Assistant?',
 ARRAY['EAs are always paid more','EAs handle only scheduling tasks','EAs are involved in strategic priorities, complex scheduling, and executive decision support','EAs must work from an office'],
 2);

-- ============================================================
-- Storage bucket for CVs (run separately in Storage dashboard
-- or via Supabase CLI — SQL cannot create buckets)
-- ============================================================
-- Bucket name: apply-cvs
-- Public: false
-- File size limit: 10MB
-- Allowed MIME types: application/pdf
