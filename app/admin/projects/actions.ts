"use client";

import { requireAdmin } from "@/lib/auth/authorization";
import type { CreateProjectInput } from "@/lib/domain/admin";

export async function createProject(input: CreateProjectInput): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  if (!input.title.trim() || !input.description.trim() || !input.department.trim() || !input.location.trim() || !input.ward.trim()) return { ok: false, error: "Complete all required project fields." };
  if (!Number.isFinite(input.latitude) || input.latitude < -90 || input.latitude > 90 || !Number.isFinite(input.longitude) || input.longitude < -180 || input.longitude > 180) return { ok: false, error: "Enter valid latitude and longitude coordinates." };
  if (!input.startDate || !input.expectedEndDate || input.expectedEndDate < input.startDate) return { ok: false, error: "Expected completion must be on or after the planned start." };
  if (input.budget !== undefined && (!Number.isFinite(input.budget) || input.budget < 0)) return { ok: false, error: "Budget must be zero or greater." };
  let supabase;
  try { ({ supabase } = await requireAdmin()); } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Admin session required." }; }
  const slugBase = input.title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "project";
  const slug = `${slugBase}-${crypto.randomUUID().slice(0, 8)}`;
  const { error } = await supabase.rpc("admin_create_project", {
    project_slug: slug,
    project_title: input.title.trim(),
    project_description: input.description.trim(),
    project_work_type: input.workType.trim(),
    project_department: input.department.trim(),
    project_ward: input.ward.trim(),
    project_contractor: input.contractor.trim(),
    project_location: input.location.trim(),
    project_latitude: input.latitude,
    project_longitude: input.longitude,
    project_start: input.startDate,
    project_expected_end: input.expectedEndDate,
    project_status: input.status,
    project_budget: input.budget ?? null,
    project_known_closure: input.knownClosure ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, slug };
}

export async function deleteProject(projectId: string): Promise<{ ok: boolean; error?: string }> {
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) return { ok: false, error: "This project is not a database record." };
  let supabase;
  try { ({ supabase } = await requireAdmin()); } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Admin session required." }; }
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  return error ? { ok: false, error: error.message } : { ok: true };
}
