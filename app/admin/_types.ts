export type Candidate = {
  id: string;
  full_name: string;
  last_name: string | null;
  email: string;
  phone: string;
  location: string;
  age: number | null;
  sex: string | null;
  married: boolean | null;
  kids: boolean | null;
  device_type: string | null;
  device_brand: string | null;
  internet_provider: string | null;
  facebook_link: string | null;
  instagram_link: string | null;
  current_job_title: string | null;
  years_experience: string | null;
  previous_employers: string | null;
  skills_tools: string | null;
  software_used: string | null;
  task_description: string | null;
  salary_expectation_php: number;
  payment_methods: string[];
  paypal_email: string | null;
  wise_email: string | null;
  cv_url: string;
  cv_type: "pdf" | "gdoc";
  differentiator: string;
  video_intro_url: string | null;
  practical_response: string | null;
  writing_sample: string | null;
  submitted_at: string;
  status: string;
  starred: boolean;
  rejection_reason: string | null;
  apply_quiz_sessions: {
    id: string;
    score: number;
    passed: boolean;
    tab_switches: number | null;
    suspicious_answer_count: number | null;
    apply_roles: { name: string; slug: string };
  } | null;
};

export type Note = {
  id: string;
  note: string;
  created_at: string;
};

export type NotesCache = Record<string, { notes: Note[]; loaded: boolean }>;

export type Category = {
  id: string;
  role_id: string;
  name: string;
  slug: string;
  active: boolean;
};

export type Question = {
  id: string;
  role_id: string;
  category_id: string | null;
  question_text: string;
  options: string[];
  correct_answer_index: number;
  active: boolean;
  apply_roles?: { name: string; slug: string };
  apply_categories?: { name: string; slug: string } | null;
};

export type DashboardStats = {
  funnel: {
    started_form: number;
    took_quiz: number;
    passed_quiz: number;
    applied: number;
  };
  roles: {
    slug: string;
    name: string;
    started_form: number;
    took_quiz: number;
    passed: number;
    applied: number;
    avg_score: number | null;
  }[];
  status_counts: Record<string, number>;
};

export type AnalyticsQuestion = {
  id: string;
  question_text: string;
  role: { name: string; slug: string } | null;
  correct: number;
  total: number;
  error_rate: number;
};

export const STATUSES = ["new", "shortlisted", "interviewed", "rejected"] as const;
export type Status = typeof STATUSES[number];

export const REJECTION_REASONS = [
  "Underqualified",
  "Salary too high",
  "Poor quiz score",
  "No-show / unresponsive",
  "Role filled",
  "Other",
] as const;
export type RejectionReason = typeof REJECTION_REASONS[number];

export const STATUS_COLORS: Record<string, string> = {
  new:         "bg-blue-900/40 text-blue-300 border border-blue-700/40",
  shortlisted: "bg-green-900/40 text-green-300 border border-green-700/40",
  interviewed: "bg-yellow-900/40 text-yellow-300 border border-yellow-700/40",
  rejected:    "bg-red-900/40 text-red-300 border border-red-700/40",
};

export const STATUS_HEADER_COLORS: Record<string, string> = {
  new:         "border-blue-700/50 text-blue-300",
  shortlisted: "border-green-700/50 text-green-300",
  interviewed: "border-yellow-700/50 text-yellow-300",
  rejected:    "border-red-700/50 text-red-300",
};

export const OPTION_LABEL = (i: number) => String.fromCharCode(65 + i);

export type JobPosting = {
  id: string;
  role_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  requirements: string | null;
  salary_from: number | null;
  salary_to: number | null;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
  apply_roles?: { id: string; name: string; slug: string };
  apply_categories?: { id: string; name: string; slug: string } | null;
};
