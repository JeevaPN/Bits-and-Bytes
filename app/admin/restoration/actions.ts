"use server";

import { requireAdmin } from "@/lib/supabase/admin-auth";

type InspectionStatus = "inspection_due" | "passed" | "defect_found" | "remediation" | "reinspection_due";

export async function recordRestoration(input: { inspectionId?: string; projectId: string; inspectionDate: string; status: InspectionStatus; notes: string; reinspectionDate?: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!/^[0-9a-f-]{36}$/i.test(input.projectId) || (input.inspectionId && !/^[0-9a-f-]{36}$/i.test(input.inspectionId))) return { ok: false, error: "Choose a database project or inspection." };
  if (!input.inspectionDate || input.notes.trim().length < 3) return { ok: false, error: "Inspection date and notes are required." };
  if (input.reinspectionDate && input.reinspectionDate < input.inspectionDate) return { ok: false, error: "Reinspection date must be on or after the inspection date." };
  let supabase;
  try { ({ supabase } = await requireAdmin()); } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Admin session required." }; }
  const { error } = await supabase.rpc("admin_record_restoration", {
    target_inspection: input.inspectionId ?? null,
    target_project: input.projectId,
    inspection_day: input.inspectionDate,
    inspection_status: input.status,
    inspection_notes: input.notes.trim(),
    followup_day: input.reinspectionDate || null,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}
