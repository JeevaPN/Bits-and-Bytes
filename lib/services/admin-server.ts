import { createClient } from "@/lib/supabase/browser";
import { requireAdmin } from "@/lib/auth/authorization";
import type { ApiResult } from "@/lib/contracts/v1";

export type AdminOverviewData = {
  publishedProjects: number;
  issuesAwaitingReview: number;
  urgentIssues: number;
  inspectionsDue: number;
  recentIssues: Array<{ id: string; title: string; status: string; urgent: boolean }>;
};

export async function getAdminOverview(): Promise<ApiResult<AdminOverviewData>> {
  const client = createClient();
  if (!client) return { ok: false, error: { code: "UNAVAILABLE", message: "Supabase is not configured." } };
  try { await requireAdmin(); } catch (error) { return { ok: false, error: { code: "FORBIDDEN", message: error instanceof Error ? error.message : "Admin access required." } }; }
  const [projects, issues, inspections] = await Promise.all([
    client.from("projects").select("id", { count: "exact", head: true }).eq("is_published", true),
    client.from("admin_issue_review_queue").select("id,title,review_status,urgent", { count: "exact" }).in("review_status", ["unverified", "more_info"]).order("urgent", { ascending: false }).order("created_at", { ascending: false }).limit(8),
    client.from("restoration_inspections").select("id", { count: "exact", head: true }).in("status", ["inspection_due", "reinspection_due"]),
  ]);
  if (projects.error || issues.error || inspections.error) return { ok: false, error: { code: "UNAVAILABLE", message: "Admin dashboard data is temporarily unavailable." } };
  return { ok: true, data: { publishedProjects: projects.count ?? 0, issuesAwaitingReview: issues.count ?? 0, urgentIssues: (issues.data ?? []).filter((row) => Boolean(row.urgent)).length, inspectionsDue: inspections.count ?? 0, recentIssues: (issues.data ?? []).map((row) => ({ id: String(row.id), title: String(row.title), status: String(row.review_status), urgent: Boolean(row.urgent) })) } };
}
