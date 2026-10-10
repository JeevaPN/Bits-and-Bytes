"use client";

import { createClient } from "@/lib/supabase/browser";
import type { AdminDecision } from "@/lib/domain/admin";

type SaveIssueReviewInput = {
  issueId: string;
  action: AdminDecision;
  reason: string;
  canonicalIssueId?: string;
};

export async function saveIssueReview(input: SaveIssueReviewInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuid.test(input.issueId)) return { ok: false, error: "This demo issue is not a database record yet." };
  if (!input.reason.trim() || input.reason.trim().length < 3) return { ok: false, error: "Enter a decision reason of at least 3 characters." };
  if (input.action === "duplicate" && (!input.canonicalIssueId || !uuid.test(input.canonicalIssueId) || input.canonicalIssueId === input.issueId)) {
    return { ok: false, error: "Choose another database issue as the original report." };
  }

  const supabase = createClient();
  if (!supabase) return { ok: false, error: "Supabase is not configured for this deployment." };
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Sign in with an Admin account before recording a decision." };
  const { data: profile, error: profileError } = await supabase.from("profiles").select("primary_role").eq("id", user.id).maybeSingle();
  if (profileError) return { ok: false, error: "Could not verify the account role." };
  if (profile?.primary_role !== "admin") return { ok: false, error: "Only Admin accounts can record official issue decisions." };

  const { error } = await supabase.rpc("admin_review_issue", {
    target_issue: input.issueId,
    review_action: input.action,
    review_reason: input.reason.trim(),
    canonical_issue: input.action === "duplicate" ? input.canonicalIssueId : null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
