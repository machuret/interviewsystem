import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const unauth = requireAdmin(req);
  if (unauth) return unauth;

  const db = createServiceClient();
  const { data: c, error } = await db
    .from("apply_candidates")
    .select("cv_url, cv_type")
    .eq("id", params.id)
    .single();

  if (error || !c) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // For Google Docs, return the stored URL directly
  if (c.cv_type === "gdoc") {
    return NextResponse.json({ url: c.cv_url, type: "gdoc" });
  }

  // For PDFs in Supabase storage, extract the path and create a signed URL
  // cv_url format: https://<project>.supabase.co/storage/v1/object/public/apply-cvs/<path>
  // or:           https://<project>.supabase.co/storage/v1/object/sign/apply-cvs/<path>
  try {
    const urlObj = new URL(c.cv_url);
    // Extract everything after /apply-cvs/
    const match = urlObj.pathname.match(/\/apply-cvs\/(.+)$/);
    if (!match) {
      // Fallback: return stored URL
      return NextResponse.json({ url: c.cv_url, type: "pdf" });
    }
    const filePath = match[1];
    const { data: signedData, error: signErr } = await db.storage
      .from("apply-cvs")
      .createSignedUrl(filePath, 3600); // 1 hour

    if (signErr || !signedData?.signedUrl) {
      // Fallback to stored URL
      return NextResponse.json({ url: c.cv_url, type: "pdf" });
    }
    return NextResponse.json({ url: signedData.signedUrl, type: "pdf" });
  } catch {
    return NextResponse.json({ url: c.cv_url, type: "pdf" });
  }
}
