"use client";

import { requireAdmin } from "@/lib/auth/authorization";

export async function reviewGroupApplication(input: { groupId: string; action: "approve" | "reject" | "more_info" | "suspend"; reason: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!/^[0-9a-f-]{36}$/i.test(input.groupId)) return { ok: false, error: "This application is not a database record." };
  if (input.reason.trim().length < 3) return { ok: false, error: "Enter a reason of at least 3 characters." };
  let supabase;
  try { ({ supabase } = await requireAdmin()); } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Admin session required." }; }
  const { error } = await supabase.rpc("admin_review_group_application", { target_group: input.groupId, review_action: input.action, review_reason: input.reason.trim() });
  return error ? { ok: false, error: error.message } : { ok: true };
}
