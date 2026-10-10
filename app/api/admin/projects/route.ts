import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";

export async function GET() {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase.from("projects").select("id,title,location").order("updated_at", { ascending: false }).limit(200);
    if (error) return NextResponse.json({ ok: false, error: { message: "Projects could not be loaded." } }, { status: 503 });
    return NextResponse.json({ ok: true, data });
  } catch { return NextResponse.json({ ok: false, error: { message: "Admin access required." } }, { status: 401 }); }
}
