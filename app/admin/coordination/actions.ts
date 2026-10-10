"use server";

import { requireAdmin } from "@/lib/supabase/admin-auth";

export async function createCoordinationCase(input: { title: string; projectIds: string[]; segmentIds: string[]; reason: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.title.trim().length < 3 || input.reason.trim().length < 3 || input.projectIds.length === 0 || input.projectIds.some((id) => !/^[0-9a-f-]{36}$/i.test(id)) || input.segmentIds.some((id) => !/^[0-9a-f-]{36}$/i.test(id))) return { ok: false, error: "Provide a title, database project IDs, and a conflict reason." };
  let supabase;
  try { ({ supabase } = await requireAdmin()); } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Admin session required." }; }
  const { error } = await supabase.rpc("admin_create_coordination", { case_title: input.title.trim(), linked_projects: input.projectIds, linked_segments: input.segmentIds, conflict_reason: input.reason.trim() });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function updateCoordinationCase(input: { caseId: string; operation: "proposal" | "accepted" | "rejected"; reason: string; startDate?: string; endDate?: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!/^[0-9a-f-]{36}$/i.test(input.caseId) || input.reason.trim().length < 3) return { ok: false, error: "A database case and reason of at least 3 characters are required." };
  if (input.operation === "proposal" && (!input.startDate || !input.endDate || input.endDate < input.startDate)) return { ok: false, error: "Enter a valid proposed date range." };
  let supabase;
  try { ({ supabase } = await requireAdmin()); } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Admin session required." }; }
  const payload = input.operation === "proposal" ? { start_date: input.startDate, end_date: input.endDate } : null;
  const { error } = await supabase.rpc("admin_record_coordination", { target_case: input.caseId, operation: input.operation, operation_reason: input.reason.trim(), schedule_payload: payload });
  return error ? { ok: false, error: error.message } : { ok: true };
}
