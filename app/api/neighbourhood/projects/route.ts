import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/domain/types";

export async function GET() {
  const client = await createClient();
  if (!client) return NextResponse.json({ ok: false, error: { message: "Supabase is not configured." } }, { status: 503 });
  const { data, error } = await client.from("projects").select("id,slug,title,description,department,contractor,location,planned_start,expected_end,status,budget,updated_at").eq("is_published", true).order("updated_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ ok: false, error: { message: "Published projects are unavailable." } }, { status: 503 });
  const projects: Project[] = (data ?? []).map((row) => ({ id: String(row.id), slug: String(row.slug), title: String(row.title), description: String(row.description), department: String(row.department), contractor: String(row.contractor ?? ""), location: String(row.location), latitude: 0, longitude: 0, startDate: String(row.planned_start), expectedEndDate: String(row.expected_end), status: row.status as Project["status"], budget: Number(row.budget ?? 0), updatedAt: String(row.updated_at) }));
  return NextResponse.json({ ok: true, data: projects });
}
