import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get("role");
  if (!role) return NextResponse.json({ error: "role required" }, { status: 400 });

  const db = createServiceClient();

  const { data, error } = await db
    .from("apply_practical_tasks")
    .select("prompt, apply_roles!inner(slug)")
    .eq("apply_roles.slug", role)
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ prompt: null });
  }

  return NextResponse.json({ prompt: data.prompt });
}
