import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

function checkAuth(req: NextRequest) {
  const cookie = req.cookies.get("admin_auth");
  return cookie?.value === process.env.ADMIN_PASSWORD;
}

const VALID_STATUSES = ["new", "shortlisted", "interviewed", "rejected"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = await req.json();
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const db = createServiceClient();
  const { error } = await db
    .from("apply_candidates")
    .update({ status })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
