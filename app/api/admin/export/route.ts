import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

type CandidateRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  salary_expectation_php: number;
  payment_methods: string[];
  paypal_email: string | null;
  wise_email: string | null;
  cv_url: string;
  cv_type: string;
  differentiator: string;
  submitted_at: string;
  status: string;
  apply_quiz_sessions: { score: number; apply_roles: { name: string } } | null;
};

export async function GET(req: NextRequest) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;

  const db = createServiceClient();
  const { data, error } = await db
    .from("apply_candidates")
    .select(`
      id, full_name, email, phone, location,
      salary_expectation_php, payment_methods,
      paypal_email, wise_email, cv_url, cv_type,
      differentiator, submitted_at, status,
      apply_quiz_sessions ( score, apply_roles ( name ) )
    `)
    .order("submitted_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const headers = [
    "ID", "Full Name", "Email", "Phone", "Location",
    "Salary (PHP)", "Payment Methods", "PayPal Email", "Wise Email",
    "Role", "Score", "CV Type", "CV URL", "Differentiator", "Status", "Submitted At",
  ];

  const rows = (data as unknown as CandidateRow[] ?? []).map((c) => [
    c.id, c.full_name, c.email, c.phone, c.location,
    c.salary_expectation_php,
    (c.payment_methods ?? []).join("|"),
    c.paypal_email, c.wise_email,
    c.apply_quiz_sessions?.apply_roles?.name ?? "",
    c.apply_quiz_sessions?.score ?? "",
    c.cv_type, c.cv_url, c.differentiator, c.status, c.submitted_at,
  ].map(escapeCSV).join(","));

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type":        "text/csv",
      "Content-Disposition": `attachment; filename="candidates-${Date.now()}.csv"`,
    },
  });
}
