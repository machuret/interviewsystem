import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

const VALID_STATUSES = ["new", "shortlisted", "interviewed", "rejected"];

// POST — bulk status update (existing)
export async function POST(req: NextRequest) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;

  const { ids, status, rejection_reason } = await req.json();

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No candidates selected" }, { status: 400 });
  }
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { status };
  if (status === "rejected" && rejection_reason) {
    updates.rejection_reason = rejection_reason;
  }

  const db = createServiceClient();
  const { error } = await db.from("apply_candidates").update(updates).in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, updated: ids.length });
}

// GET — export CV links for selected IDs  (?ids=id1,id2,id3)
export async function GET(req: NextRequest) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;

  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids") ?? "";
  const ids = idsParam.split(",").filter(Boolean);

  if (ids.length === 0) {
    return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("apply_candidates")
    .select("id, full_name, email, cv_url, cv_type, apply_quiz_sessions( apply_roles( name ) )")
    .in("id", ids);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Generate signed URLs for PDF CVs
  const results = await Promise.all(
    (data ?? []).map(async (c) => {
      let cv_url = c.cv_url;
      if (c.cv_type === "pdf") {
        try {
          const urlObj  = new URL(c.cv_url);
          const match   = urlObj.pathname.match(/\/apply-cvs\/(.+)$/);
          if (match) {
            const { data: sd } = await db.storage.from("apply-cvs").createSignedUrl(match[1], 3600);
            if (sd?.signedUrl) cv_url = sd.signedUrl;
          }
        } catch { /* use original URL */ }
      }
      return {
        name:  c.full_name,
        email: c.email,
        role:  (c as any).apply_quiz_sessions?.apply_roles?.name ?? "",
        cv_url,
        cv_type: c.cv_type,
      };
    })
  );

  return NextResponse.json({ candidates: results });
}
