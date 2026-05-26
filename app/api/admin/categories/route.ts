import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

function checkAuth(req: NextRequest) {
  return req.cookies.get("admin_auth")?.value === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role_id = req.nextUrl.searchParams.get("role_id");
  const db = createServiceClient();

  let query = db
    .from("apply_categories")
    .select("id, role_id, name, slug, active, created_at, apply_roles(name, slug)")
    .order("created_at", { ascending: true });

  if (role_id) query = query.eq("role_id", role_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role_id, name } = await req.json();
  if (!role_id || !name?.trim()) {
    return NextResponse.json({ error: "role_id and name required" }, { status: 400 });
  }

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const db = createServiceClient();

  const { data, error } = await db
    .from("apply_categories")
    .insert({ role_id, name: name.trim(), slug })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
