import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get("role");
  if (!role) return NextResponse.json({ error: "role required" }, { status: 400 });

  const db = createServiceClient();

  const { data, error } = await db
    .from("apply_categories")
    .select("id, name, slug, apply_roles!inner(slug)")
    .eq("apply_roles.slug", role)
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ categories: [] });
  return NextResponse.json({ categories: data ?? [] });
}
