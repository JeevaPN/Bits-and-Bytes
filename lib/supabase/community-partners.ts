import type { CommunityPartnersApi, ApiResult, IssueQuery, Page, GroupApplicationDecisionInput } from "@/lib/contracts/v1";
import type { CommunityGroup, GroupTask, Issue, IssueCategory } from "@/lib/domain/types";
import type { GroupApplication } from "@/lib/domain/admin";
import { fail, matchesText, ok, paginate } from "@/lib/mock-api/helpers";
import { createClient } from "@/lib/supabase/browser";

type Row = Record<string, unknown>;
export type PartnerGroup = CommunityGroup & { approvalStatus: string };
export type PartnerCampaign = { id: string; groupId: string; title: string; purpose: string; targetAmount: number; activity?: string; status: string; simulated: true };
export type PartnerCampaignUpdate = { id: string; campaignId: string; amount: number; note: string; evidenceUrl?: string; createdAt: string };
export type PartnerTaskEvent = { id: string; taskId: string; eventType: string; note: string; createdAt: string };
export type PartnerTaskDetail = GroupTask & { title: string; description: string; category: IssueCategory; location: string; urgent: boolean; reviewStatus: string };
export type PartnerTaskReferral = { id: string; issueId: string; reason: string; targetType: "official" | "specialist" | "community_partner"; targetGroupId?: string; createdAt: string };
export type PartnerTaskEvidence = { id: string; eventType: string; note: string; evidenceUrl: string; createdAt: string };
export type PartnerPrivateTaskEvent = { id: string; eventType: string; note: string; evidenceUrl?: string; createdAt: string };
export type PartnerPublishedTaskUpdate = { id: string; sourceEventId: string; note: string; hasEvidence: boolean; createdAt: string };
export type PartnerGroupMember = { userId: string; permission: "owner" | "editor" | "viewer"; joinedAt: string };
export type PartnerCollaborationRequest = { id: string; issueId: string; requestingGroupId: string; invitedGroupId: string; note: string; status: string; createdAt: string };
export type PartnerInvitation = { id: string; groupId: string; groupName: string; permission: "editor" | "viewer"; expiresAt: string };
export type PartnerCoverage = { serviceArea: string; eligibleWork: IssueCategory[]; excludedWork: IssueCategory[]; limitations: string };
export type PublicPartnerWork = { taskId: string; issueId: string; title: string; category: string; location: string; status: string; updateId?: string; publicNote?: string; evidenceUrl?: string; updatedAt: string };

function mapIssue(row: Row): Issue {
  return {
    id: String(row.id), title: String(row.title), description: String(row.description),
    category: String(row.category) as IssueCategory, location: String(row.location),
    latitude: Number(row.latitude), longitude: Number(row.longitude),
    observedAt: String(row.observed_at), createdAt: String(row.created_at),
    verificationCount: Number(row.verification_count ?? 0),
    reviewStatus: row.review_status as Issue["reviewStatus"], urgent: Boolean(row.urgent),
    source: row.source as Issue["source"],
  };
}

function mapGroup(row: Row): CommunityGroup {
  return {
    id: String(row.id), slug: String(row.slug), name: String(row.name),
    description: String(row.description), area: String(row.area ?? ""),
    contact: String(row.contact ?? ""), capabilities: (row.capabilities ?? []) as IssueCategory[],
    approved: row.approved === undefined ? (row.approval_status === undefined || row.approval_status === "approved") : Boolean(row.approved),
  };
}

function mapMyGroup(row: Row): PartnerGroup {
  return { ...mapGroup(row), approvalStatus: String(row.approval_status) };
}

function mapTask(row: Row): GroupTask {
  return {
    id: String(row.id), issueId: String(row.issue_id), groupId: String(row.group_id),
    status: row.status as GroupTask["status"], updatedAt: String(row.updated_at),
    confirmationCount: Number(row.confirmation_count ?? 0),
  };
}

function errorResult<T>(error: { code?: string; message?: string } | null): ApiResult<T> {
  if (!error) return fail("UNKNOWN", "The request could not be completed.");
  const code = error.code === "42501" ? "FORBIDDEN"
    : error.code === "403" ? "FORBIDDEN"
    : error.code === "23505" ? "CONFLICT"
      : error.code === "23503" ? "NOT_FOUND"
      : error.code === "413" || error.code === "415" ? "VALIDATION"
      : error.code === "P0002" ? "NOT_FOUND"
        : error.code === "22023" ? "VALIDATION"
          : error.code === "PGRST116" ? "NOT_FOUND"
            : error.code === "PGRST301" ? "FORBIDDEN" : "UNAVAILABLE";
  return fail(code, error.message ?? "The request could not be completed.");
}

async function getClientAndUser() {
  const client = createClient();
  if (!client) return { client: null, user: null, error: "Supabase is not configured." };
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return { client, user: null, error: "Sign in to continue." };
  return { client, user: data.user, error: null };
}

function extensionFor(file: File): string | null {
  return ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as Record<string, string>)[file.type] ?? null;
}

async function uploadEvidence(client: NonNullable<ReturnType<typeof createClient>>, path: string, file: File) {
  const extension = extensionFor(file);
  if (!extension || file.size < 1 || file.size > 10 * 1024 * 1024) {
    return { path: null, error: { code: "22023", message: "Evidence must be a non-empty JPEG, PNG, or WebP image no larger than 10 MB." } };
  }
  const objectPath = `${path}/${crypto.randomUUID()}.${extension}`;
  const { error } = await client.storage.from("partner-evidence").upload(objectPath, file, {
    contentType: file.type, cacheControl: "3600", upsert: false,
  });
  return error ? { path: null, error: { code: error.statusCode, message: error.message } } : { path: objectPath, error: null };
}

async function publicImageCopy(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size < 1 || file.size > 10 * 1024 * 1024) throw new Error("Choose a non-empty image under 10 MB.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This image could not be prepared for public sharing.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error("The public image copy could not be created.")), "image/webp", 0.82));
  if (blob.size > 5 * 1024 * 1024) throw new Error("The processed public image is larger than 5 MB.");
  return new File([blob], `${crypto.randomUUID()}.webp`, { type: "image/webp" });
}

export async function listMyCommunityGroups(): Promise<ApiResult<PartnerGroup[]>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Supabase is not configured.");
  const { data, error } = await auth.client.rpc("my_community_groups");
  if (error) return errorResult(error);
  return ok(((data ?? []) as Row[]).map(mapMyGroup));
}

export async function listPublicCommunityGroups(query: { q?: string; area?: string; capability?: IssueCategory | "all"; page?: number; pageSize?: number } = {}): Promise<ApiResult<Page<CommunityGroup>>> {
  const client = createClient();
  if (!client) return fail("UNAVAILABLE", "Supabase is not configured.");
  const { data, error } = await client.from("public_community_groups").select("*").order("name").limit(500);
  if (error) return errorResult(error);
  let rows = ((data ?? []) as Row[]).map(mapGroup);
  rows = rows.filter((group) => (!query.area || group.area.toLocaleLowerCase().includes(query.area.toLocaleLowerCase()))
    && (!query.capability || query.capability === "all" || group.capabilities.includes(query.capability))
    && matchesText(query.q, group.name, group.description, group.area));
  return ok(paginate(rows, query));
}

export const communityPartnersSupabaseApi: CommunityPartnersApi = {
  async listOpportunities(query: IssueQuery = {}) {
    const client = createClient();
    if (!client) return fail("UNAVAILABLE", "Supabase is not configured.");
    let request = client.from("public_community_opportunities").select("*", { count: "exact" });
    if (query.category && query.category !== "all") request = request.eq("category", query.category);
    if (query.reviewStatus && query.reviewStatus !== "all") request = request.eq("review_status", query.reviewStatus);
    if (query.source && query.source !== "all") request = request.eq("source", query.source);
    if (typeof query.urgent === "boolean") request = request.eq("urgent", query.urgent);
    const { data, error } = await request.order("urgent", { ascending: false }).order("verification_count", { ascending: false }).order("created_at", { ascending: true }).limit(500);
    if (error) return errorResult(error);
    let rows = ((data ?? []) as Row[]).map(mapIssue);
    rows = rows.filter((issue) => matchesText(query.q, issue.title, issue.description, issue.location));
    return ok(paginate(rows, query));
  },

  async listMyTasks(groupId) {
    const auth = await getClientAndUser();
    if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Supabase is not configured.");
    const groups = await auth.client.rpc("my_community_groups");
    if (groups.error) return errorResult(groups.error);
    const member = ((groups.data ?? []) as Row[]).some((row) => row.id === groupId && row.approval_status === "approved");
    if (!member) return fail("FORBIDDEN", "You are not a member of this approved partner group.");
    const { data, error } = await auth.client.from("community_partner_tasks").select("*").eq("group_id", groupId).order("updated_at", { ascending: false }).limit(100);
    if (error) return errorResult(error);
    return ok(paginate(((data ?? []) as Row[]).map(mapTask)));
  },

  async getPublicProfile(slug) {
    const client = createClient();
    if (!client) return fail("UNAVAILABLE", "Supabase is not configured.");
    const { data, error } = await client.from("public_community_groups").select("*").eq("slug", slug).maybeSingle();
    if (error) return errorResult(error);
    return data ? ok(mapGroup(data as Row)) : fail("NOT_FOUND", "Approved Community Partner not found.");
  },

  async submitApplication(input) {
    const auth = await getClientAndUser();
    if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Supabase is not configured.");
    const { data, error } = await auth.client.rpc("submit_community_group_application", {
      p_name: input.name, p_description: input.description, p_service_area: input.area,
      p_contact_email: input.contact, p_eligible_work: input.capabilities, p_limitations: input.limitations,
    });
    if (error) return errorResult(error);
    const row = (((data ?? []) as Row[])[0] ?? {}) as Row;
    return ok({ applicationId: String(row.application_id), status: "pending" as const });
  },

  async updateProfile(input) {
    const auth = await getClientAndUser();
    if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
    const { data, error } = await auth.client.rpc("update_community_group_profile", {
      p_group_id: input.groupId, p_description: input.description, p_service_area: input.area,
      p_contact_email: input.contact, p_eligible_work: input.capabilities,
    });
    if (error) return errorResult(error);
    const row = (((data ?? []) as Row[])[0] ?? {}) as Row;
    return ok(mapGroup({ ...row, area: row.service_area, contact: row.contact_email, capabilities: row.eligible_work, approved: row.approval_status === "approved" }));
  },

  async acceptTask(input) {
    const auth = await getClientAndUser();
    if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
    const { data, error } = await auth.client.rpc("accept_community_issue", { p_issue_id: input.issueId, p_group_id: input.groupId });
    if (error) return errorResult(error);
    return ok(mapTask(data as Row));
  },

  async referTask(input) {
    const auth = await getClientAndUser();
    if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
    const { data, error } = await auth.client.rpc("refer_community_issue", { p_issue_id: input.issueId, p_group_id: input.groupId, p_reason: input.reason });
    return error ? errorResult(error) : ok({ referralId: String(data) });
  },

  async postProgress(input) {
    const auth = await getClientAndUser();
    if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
    let evidencePath: string | null = null;
    if (input.evidence) {
      const uploaded = await uploadEvidence(auth.client, input.taskId, input.evidence);
      if (uploaded.error) return errorResult(uploaded.error);
      evidencePath = uploaded.path;
    }
    const { data, error } = await auth.client.rpc("record_community_task_progress", { p_task_id: input.taskId, p_note: input.note, p_evidence_path: evidencePath });
    if (error) { if (evidencePath) await auth.client.storage.from("partner-evidence").remove([evidencePath]); return errorResult(error); }
    return ok(mapTask(data as Row));
  },

  async submitCompletion(input) {
    const auth = await getClientAndUser();
    if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
    const uploaded = await uploadEvidence(auth.client, input.taskId, input.evidence);
    if (uploaded.error || !uploaded.path) return uploaded.error ? errorResult(uploaded.error) : fail("UNKNOWN", "Evidence upload failed.");
    const { data, error } = await auth.client.rpc("submit_community_task_completion", { p_task_id: input.taskId, p_note: input.note, p_evidence_path: uploaded.path });
    if (error) { await auth.client.storage.from("partner-evidence").remove([uploaded.path]); return errorResult(error); }
    return ok(mapTask(data as Row));
  },

  async createCampaign(input) {
    const auth = await getClientAndUser();
    if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
    const { data, error } = await auth.client.rpc("create_community_sponsorship_campaign", {
      p_group_id: input.groupId, p_title: input.title, p_purpose: input.purpose,
      p_target_amount: input.targetAmount, p_activity: input.activity ?? null,
    });
    if (error) return errorResult(error);
    const row = data as Row;
    return ok({ campaignId: String(row.id), simulated: true as const });
  },

  async reportCampaignUse(input) {
    const auth = await getClientAndUser();
    if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
    let evidencePath: string | null = null;
    if (input.evidence) {
      const uploaded = await uploadEvidence(auth.client, `campaigns/${input.campaignId}`, input.evidence);
      if (uploaded.error) return errorResult(uploaded.error);
      evidencePath = uploaded.path;
    }
    const { data, error } = await auth.client.rpc("report_community_campaign_use", {
      p_campaign_id: input.campaignId, p_amount: input.amount, p_note: input.note, p_evidence_path: evidencePath,
    });
    if (error) { if (evidencePath) await auth.client.storage.from("partner-evidence").remove([evidencePath]); return errorResult(error); }
    return ok({ updateId: String(data) });
  },
};

export async function listPartnerCampaigns(groupId: string): Promise<ApiResult<PartnerCampaign[]>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  const groups = await auth.client.rpc("my_community_groups");
  if (groups.error) return errorResult(groups.error);
  if (!((groups.data ?? []) as Row[]).some((row) => row.id === groupId && row.approval_status === "approved")) return fail("FORBIDDEN", "You are not a member of this approved partner group.");
  const { data, error } = await auth.client.rpc("my_community_sponsorship_campaigns", { p_group_id: groupId });
  if (error) return errorResult(error);
  return ok(((data ?? []) as Row[]).map((row) => ({ id: String(row.id), groupId: String(row.group_id), title: String(row.title), purpose: String(row.purpose), targetAmount: Number(row.target_amount), activity: typeof row.activity === "string" ? row.activity : undefined, status: String(row.status), simulated: true as const })));
}

export async function listPartnerCampaignUpdates(campaignId: string): Promise<ApiResult<PartnerCampaignUpdate[]>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  const { data, error } = await auth.client.rpc("my_community_campaign_updates", { p_campaign_id: campaignId });
  if (error) return errorResult(error);
  const rows = (data ?? []) as Row[];
  try {
    const updates = await Promise.all(rows.map(async (row) => {
      const path = typeof row.evidence_path === "string" ? row.evidence_path : null;
      const signed = path ? await auth.client!.storage.from("partner-evidence").createSignedUrl(path, 300) : null;
      if (signed?.error) throw signed.error;
      return { id: String(row.id), campaignId: String(row.campaign_id), amount: Number(row.amount), note: String(row.note), ...(signed?.data?.signedUrl ? { evidenceUrl: signed.data.signedUrl } : {}), createdAt: String(row.created_at) };
    }));
    return ok(updates);
  } catch (error) {
    return errorResult({ code: "42501", message: error instanceof Error ? error.message : "Campaign evidence could not be accessed." });
  }
}

export async function listCommunityPartnerApplications(status: GroupApplication["status"] | "all" = "pending"): Promise<ApiResult<GroupApplication[]>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  const { data, error } = await auth.client.rpc("admin_list_community_group_applications", { p_status: status });
  if (error) return errorResult(error);
  return ok(((data ?? []) as Row[]).map((row) => ({
    id: String(row.id), name: String(row.name), area: String(row.service_area),
    capabilities: (row.eligible_work ?? []) as string[], submittedAt: String(row.created_at),
    status: String(row.status) as GroupApplication["status"], reason: String(row.review_note ?? "") || undefined,
  })));
}

export async function reviewCommunityPartnerApplication(input: GroupApplicationDecisionInput): Promise<ApiResult<GroupApplication>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  const { error } = await auth.client.rpc("review_community_group_application", {
    p_group_id: input.applicationId, p_decision: input.decision, p_reason: input.reason,
  });
  if (error) return errorResult(error);
  const applications = await listCommunityPartnerApplications("all");
  if (!applications.ok) return applications;
  const reviewed = applications.data.find((application) => application.id === input.applicationId);
  return reviewed ? ok(reviewed) : fail("NOT_FOUND", "Application not found after review.");
}

export async function listCommunityPartnerGroupMembers(groupId: string): Promise<ApiResult<PartnerGroupMember[]>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  const { data, error } = await auth.client.rpc("list_community_group_members", { p_group_id: groupId });
  if (error) return errorResult(error);
  return ok(((data ?? []) as Row[]).map((row) => ({ userId: String(row.user_id), permission: String(row.permission) as PartnerGroupMember["permission"], joinedAt: String(row.joined_at) })));
}

export async function setCommunityPartnerGroupMember(groupId: string, userId: string, permission: "editor" | "viewer"): Promise<ApiResult<null>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  const { error } = await auth.client.rpc("manage_community_group_member", { p_group_id: groupId, p_user_id: userId, p_permission: permission });
  return error ? errorResult(error) : ok(null);
}

export async function removeCommunityPartnerGroupMember(groupId: string, userId: string): Promise<ApiResult<null>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  const { error } = await auth.client.rpc("remove_community_group_member", { p_group_id: groupId, p_user_id: userId });
  return error ? errorResult(error) : ok(null);
}

export async function resubmitCommunityPartnerApplication(input: { groupId: string; application: { name: string; description: string; area: string; contact: string; capabilities: IssueCategory[]; limitations: string } }): Promise<ApiResult<{ applicationId: string; status: "pending" }>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  const { data, error } = await auth.client.rpc("resubmit_community_group_application", {
    p_group_id: input.groupId, p_name: input.application.name, p_description: input.application.description,
    p_service_area: input.application.area, p_contact_email: input.application.contact,
    p_eligible_work: input.application.capabilities, p_limitations: input.application.limitations,
  });
  if (error) return errorResult(error);
  const row = (((data ?? []) as Row[])[0] ?? {}) as Row;
  return ok({ applicationId: String(row.application_id), status: "pending" });
}

export async function getCommunityPartnerApplicationFeedback(groupId: string): Promise<ApiResult<{ status: string; note: string; reviewedAt?: string }>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  const { data, error } = await auth.client.rpc("my_community_application_feedback", { p_group_id: groupId });
  if (error) return errorResult(error);
  const row = (((data ?? []) as Row[])[0] ?? {}) as Row;
  if (!row.status) return fail("NOT_FOUND", "Application not found.");
  return ok({ status: String(row.status), note: String(row.review_note ?? ""), ...(row.reviewed_at ? { reviewedAt: String(row.reviewed_at) } : {}) });
}

export async function listPartnerTaskReferrals(groupId: string): Promise<ApiResult<PartnerTaskReferral[]>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  const { data, error } = await auth.client.rpc("my_community_task_referrals", { p_group_id: groupId });
  if (error) return errorResult(error);
  return ok(((data ?? []) as Row[]).map((row) => ({ id: String(row.id), issueId: String(row.issue_id), reason: String(row.reason), targetType: String(row.target_type) as PartnerTaskReferral["targetType"], ...(row.target_group_id ? { targetGroupId: String(row.target_group_id) } : {}), createdAt: String(row.created_at) })));
}

export async function referCommunityIssueTo(input: { issueId: string; groupId: string; reason: string; targetType: PartnerTaskReferral["targetType"]; targetGroupId?: string }): Promise<ApiResult<{ referralId: string }>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  const { data, error } = await auth.client.rpc("refer_community_issue_to", {
    p_issue_id: input.issueId, p_group_id: input.groupId, p_reason: input.reason,
    p_target_type: input.targetType, p_target_group_id: input.targetGroupId ?? null,
  });
  return error ? errorResult(error) : ok({ referralId: String(data) });
}

export async function updateCommunityGroupWorkCoverage(groupId: string, excludedWork: IssueCategory[]): Promise<ApiResult<null>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  const { error } = await auth.client.rpc("update_community_group_work_coverage", { p_group_id: groupId, p_excluded_work: excludedWork });
  return error ? errorResult(error) : ok(null);
}

export async function getCommunityGroupWorkCoverage(groupId: string): Promise<ApiResult<PartnerCoverage>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  const { data, error } = await auth.client.rpc("get_community_group_work_coverage", { p_group_id: groupId });
  if (error) return errorResult(error);
  const row = (((data ?? []) as Row[])[0] ?? {}) as Row;
  return ok({ serviceArea: String(row.service_area ?? ""), eligibleWork: (row.eligible_work ?? []) as IssueCategory[], excludedWork: (row.excluded_work ?? []) as IssueCategory[], limitations: String(row.limitations ?? "") });
}

export async function createCommunityGroupInvitation(groupId: string, email: string, permission: "editor" | "viewer"): Promise<ApiResult<{ invitationId: string }>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  const { data, error } = await auth.client.rpc("create_community_group_invitation", { p_group_id: groupId, p_email: email, p_permission: permission });
  return error ? errorResult(error) : ok({ invitationId: String(data) });
}

export async function listMyCommunityGroupInvitations(): Promise<ApiResult<PartnerInvitation[]>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  const { data, error } = await auth.client.rpc("my_community_group_invitations");
  if (error) return errorResult(error);
  return ok(((data ?? []) as Row[]).map((row) => ({ id: String(row.id), groupId: String(row.group_id), groupName: String(row.group_name), permission: String(row.permission) as PartnerInvitation["permission"], expiresAt: String(row.expires_at) })));
}

export async function acceptCommunityGroupInvitation(invitationId: string): Promise<ApiResult<{ groupId: string }>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  const { data, error } = await auth.client.rpc("accept_community_group_invitation", { p_invitation_id: invitationId });
  return error ? errorResult(error) : ok({ groupId: String(data) });
}

export async function revokeCommunityGroupInvitation(invitationId: string): Promise<ApiResult<null>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  const { error } = await auth.client.rpc("revoke_community_group_invitation", { p_invitation_id: invitationId });
  return error ? errorResult(error) : ok(null);
}

export async function listCommunityGroupInvitations(groupId: string): Promise<ApiResult<Array<{ id: string; email: string; permission: "editor" | "viewer"; status: string; expiresAt: string }>>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  const { data, error } = await auth.client.rpc("list_community_group_invitations", { p_group_id: groupId });
  if (error) return errorResult(error);
  return ok(((data ?? []) as Row[]).map((row) => ({ id: String(row.id), email: String(row.email), permission: String(row.permission) as "editor" | "viewer", status: String(row.status), expiresAt: String(row.expires_at) })));
}

export async function listCommunityTaskDetails(groupId: string): Promise<ApiResult<PartnerTaskDetail[]>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  const groups = await auth.client.rpc("my_community_groups");
  if (groups.error) return errorResult(groups.error);
  if (!((groups.data ?? []) as Row[]).some((row) => row.id === groupId && row.approval_status === "approved")) return fail("FORBIDDEN", "You are not a member of this approved partner group.");
  const { data, error } = await auth.client.from("community_partner_tasks").select("*").eq("group_id", groupId).order("updated_at", { ascending: false }).limit(100);
  if (error) return errorResult(error);
  return ok(((data ?? []) as Row[]).map((row) => ({
    ...mapTask(row), title: String(row.issue_title), description: String(row.issue_description),
    category: String(row.issue_category) as IssueCategory, location: String(row.issue_location),
    urgent: Boolean(row.urgent), reviewStatus: String(row.review_status),
  })));
}

export async function listPrivateCommunityTaskEvents(taskId: string): Promise<ApiResult<PartnerPrivateTaskEvent[]>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  const { data, error } = await auth.client.rpc("my_community_task_events", { p_task_id: taskId });
  if (error) return errorResult(error);
  try {
    return ok(await Promise.all(((data ?? []) as Row[]).map(async (row) => {
      const path = typeof row.evidence_path === "string" ? row.evidence_path : null;
      const signed = path ? await auth.client!.storage.from("partner-evidence").createSignedUrl(path, 300) : null;
      if (signed?.error) throw signed.error;
      return { id: String(row.id), eventType: String(row.event_type), note: String(row.note ?? ""), ...(signed?.data?.signedUrl ? { evidenceUrl: signed.data.signedUrl } : {}), createdAt: String(row.created_at) };
    })));
  } catch (error) {
    return errorResult({ code: "42501", message: error instanceof Error ? error.message : "Task history could not be accessed." });
  }
}

export async function requestCommunityCollaboration(input: { issueId: string; requestingGroupId: string; invitedGroupId: string; note: string }): Promise<ApiResult<{ requestId: string }>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  const { data, error } = await auth.client.rpc("request_community_collaboration", {
    p_issue_id: input.issueId, p_requesting_group_id: input.requestingGroupId,
    p_invited_group_id: input.invitedGroupId, p_note: input.note,
  });
  return error ? errorResult(error) : ok({ requestId: String(data) });
}

export async function listCommunityCollaborations(groupId: string): Promise<ApiResult<PartnerCollaborationRequest[]>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  const { data, error } = await auth.client.rpc("list_community_collaboration_requests", { p_group_id: groupId });
  if (error) return errorResult(error);
  return ok(((data ?? []) as Row[]).map((row) => ({ id: String(row.id), issueId: String(row.issue_id), requestingGroupId: String(row.requesting_group_id), invitedGroupId: String(row.invited_group_id), note: String(row.note), status: String(row.status), createdAt: String(row.created_at) })));
}

export async function respondCommunityCollaboration(requestId: string, decision: "accepted" | "declined"): Promise<ApiResult<{ status: string }>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  const { data, error } = await auth.client.rpc("respond_community_collaboration", { p_request_id: requestId, p_decision: decision });
  return error ? errorResult(error) : ok({ status: String(data) });
}

export async function listPublicCommunityWork(slug: string): Promise<ApiResult<PublicPartnerWork[]>> {
  const client = createClient();
  if (!client) return fail("UNAVAILABLE", "Supabase is not configured.");
  const { data, error } = await client.from("public_community_task_history").select("*").eq("group_slug", slug).order("task_updated_at", { ascending: false }).limit(100);
  if (error) return errorResult(error);
  try {
    const work = await Promise.all(((data ?? []) as Row[]).map(async (row) => {
      const path = typeof row.evidence_path === "string" ? row.evidence_path : null;
      const signed = path ? await client.storage.from("partner-evidence").createSignedUrl(path, 300) : null;
      if (signed?.error) throw signed.error;
      return {
        taskId: String(row.task_id), issueId: String(row.issue_id), title: String(row.issue_title),
        category: String(row.issue_category), location: String(row.issue_location), status: String(row.task_status),
        ...(row.update_id ? { updateId: String(row.update_id) } : {}),
        ...(row.public_note ? { publicNote: String(row.public_note) } : {}),
        ...(signed?.data?.signedUrl ? { evidenceUrl: signed.data.signedUrl } : {}),
        updatedAt: String(row.update_created_at ?? row.task_updated_at),
      };
    }));
    return ok(work);
  } catch (error) {
    return errorResult({ code: "42501", message: error instanceof Error ? error.message : "Public evidence could not be accessed." });
  }
}

export async function listPublicIssueTasksAwaitingConfirmation(issueId: string): Promise<ApiResult<GroupTask[]>> {
  const client = createClient();
  if (!client) return fail("UNAVAILABLE", "Supabase is not configured.");
  const { data, error } = await client.from("community_partner_tasks")
    .select("id,issue_id,group_id,status,updated_at,confirmation_count")
    .eq("issue_id", issueId).eq("status", "awaiting_confirmation").limit(20);
  if (error) return errorResult(error);
  return ok(((data ?? []) as Row[]).map(mapTask));
}

export async function publishCommunityTaskUpdate(input: { groupId: string; taskId: string; eventId: string; note: string; publicEvidence?: File }): Promise<ApiResult<{ updateId: string }>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  let path: string | null = null;
  try {
    if (input.publicEvidence) {
      const sanitized = await publicImageCopy(input.publicEvidence);
      path = `public-evidence/${input.groupId}/${input.taskId}/${sanitized.name}`;
      const { error: uploadError } = await auth.client.storage.from("partner-evidence").upload(path, sanitized, { contentType: "image/webp", upsert: false });
      if (uploadError) return errorResult(uploadError);
    }
    const { data, error } = await auth.client.rpc("publish_community_task_update", { p_task_id: input.taskId, p_event_id: input.eventId, p_public_note: input.note, p_public_evidence_path: path });
    if (error) {
      if (path) await auth.client.storage.from("partner-evidence").remove([path]);
      return errorResult(error);
    }
    return ok({ updateId: String(data) });
  } catch (error) {
    if (path) await auth.client.storage.from("partner-evidence").remove([path]);
    return fail("VALIDATION", error instanceof Error ? error.message : "Public update could not be prepared.");
  }
}

export async function listCommunityPublishedTaskUpdates(taskId: string): Promise<ApiResult<PartnerPublishedTaskUpdate[]>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  const { data, error } = await auth.client.rpc("my_community_public_task_updates", { p_task_id: taskId });
  if (error) return errorResult(error);
  return ok(((data ?? []) as Row[]).map((row) => ({ id: String(row.id), sourceEventId: String(row.source_event_id), note: String(row.public_note), hasEvidence: Boolean(row.evidence_path), createdAt: String(row.created_at) })));
}

export async function unpublishCommunityTaskUpdate(updateId: string): Promise<ApiResult<null>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  const { data: path, error: pathError } = await auth.client.rpc("my_community_public_task_update_path", { p_update_id: updateId });
  if (pathError) return errorResult(pathError);
  if (typeof path === "string") {
    const { error: removeError } = await auth.client.storage.from("partner-evidence").remove([path]);
    if (removeError) return errorResult(removeError);
  }
  const { error } = await auth.client.rpc("unpublish_community_task_update", { p_update_id: updateId });
  return error ? errorResult(error) : ok(null);
}

export async function listCommunityApplicationEvidence(groupId: string): Promise<ApiResult<Array<{ id: string; signedUrl: string }>>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  const { data, error } = await auth.client.rpc("my_community_application_evidence", { p_group_id: groupId });
  if (error) return errorResult(error);
  try {
    const rows = await Promise.all(((data ?? []) as Row[]).map(async (row) => {
      const { data: signed, error: signError } = await auth.client!.storage.from("partner-evidence").createSignedUrl(String(row.object_path), 300);
      if (signError) throw signError;
      return { id: String(row.id), signedUrl: signed.signedUrl };
    }));
    return ok(rows);
  } catch (error) {
    return errorResult({ code: "42501", message: error instanceof Error ? error.message : "Application evidence could not be accessed." });
  }
}

export async function submitCommunityPartnerApplicationWithEvidence(input: { application: Parameters<CommunityPartnersApi["submitApplication"]>[0]; evidence: File[] }): Promise<ApiResult<{ applicationId: string; status: "pending" }>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  if (input.evidence.length > 5) return fail("VALIDATION", "Attach no more than five application evidence files.");
  const paths: string[] = [];
  for (const file of input.evidence) {
    const uploaded = await uploadEvidence(auth.client, `applications/${auth.user.id}`, file);
    if (uploaded.error || !uploaded.path) {
      if (paths.length) await auth.client.storage.from("partner-evidence").remove(paths);
      return uploaded.error ? errorResult(uploaded.error) : fail("UNKNOWN", "Application evidence upload failed.");
    }
    paths.push(uploaded.path);
  }
  const application = await communityPartnersSupabaseApi.submitApplication(input.application);
  if (!application.ok) {
    if (paths.length) await auth.client.storage.from("partner-evidence").remove(paths);
    return application;
  }
  if (paths.length) {
    const { error } = await auth.client.rpc("attach_community_application_evidence", { p_group_id: application.data.applicationId, p_object_paths: paths });
    if (error) {
      await auth.client.storage.from("partner-evidence").remove(paths);
      return errorResult(error);
    }
  }
  return application;
}

export async function resubmitCommunityPartnerApplicationWithEvidence(input: { groupId: string; application: { name: string; description: string; area: string; contact: string; capabilities: IssueCategory[]; limitations: string }; evidence: File[] }): Promise<ApiResult<{ applicationId: string; status: "pending" }>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  if (input.evidence.length > 5) return fail("VALIDATION", "Attach no more than five application evidence files.");
  const paths: string[] = [];
  for (const file of input.evidence) {
    const uploaded = await uploadEvidence(auth.client, `applications/${auth.user.id}`, file);
    if (uploaded.error || !uploaded.path) {
      if (paths.length) await auth.client.storage.from("partner-evidence").remove(paths);
      return uploaded.error ? errorResult(uploaded.error) : fail("UNKNOWN", "Application evidence upload failed.");
    }
    paths.push(uploaded.path);
  }
  const application = await resubmitCommunityPartnerApplication(input);
  if (!application.ok) {
    if (paths.length) await auth.client.storage.from("partner-evidence").remove(paths);
    return application;
  }
  if (paths.length) {
    const { error } = await auth.client.rpc("attach_community_application_evidence", { p_group_id: input.groupId, p_object_paths: paths });
    if (error) {
      await auth.client.storage.from("partner-evidence").remove(paths);
      return errorResult(error);
    }
  }
  return application;
}

export async function listPartnerTaskEvidence(taskId: string): Promise<ApiResult<PartnerTaskEvidence[]>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  const { data, error } = await auth.client.rpc("my_community_task_evidence", { p_task_id: taskId });
  if (error) return errorResult(error);
  try {
    const evidence = await Promise.all(((data ?? []) as Row[]).map(async (row) => {
      const { data: signed, error: signedError } = await auth.client!.storage.from("partner-evidence").createSignedUrl(String(row.evidence_path), 300);
      if (signedError) throw signedError;
      return { id: String(row.id), eventType: String(row.event_type), note: String(row.note ?? ""), evidenceUrl: signed.signedUrl, createdAt: String(row.created_at) };
    }));
    return ok(evidence);
  } catch (error) {
    return errorResult({ code: "42501", message: error instanceof Error ? error.message : "Evidence could not be accessed." });
  }
}

export async function withdrawPartnerTaskCompletion(taskId: string, reason: string): Promise<ApiResult<GroupTask>> {
  const auth = await getClientAndUser();
  if (!auth.client || !auth.user) return fail(auth.client ? "FORBIDDEN" : "UNAVAILABLE", auth.error ?? "Sign in to continue.");
  const { data, error } = await auth.client.rpc("withdraw_community_task_completion", { p_task_id: taskId, p_reason: reason });
  return error ? errorResult(error) : ok(mapTask(data as Row));
}

export async function listPartnerTaskEvents(taskIds: string[]): Promise<ApiResult<PartnerTaskEvent[]>> {
  if (!taskIds.length) return ok([]);
  const client = createClient();
  if (!client) return fail("UNAVAILABLE", "Supabase is not configured.");
  const { data, error } = await client.from("public_group_task_events").select("id,task_id,event_type,note,created_at").in("task_id", taskIds).order("created_at", { ascending: true }).limit(500);
  if (error) return errorResult(error);
  return ok(((data ?? []) as Row[]).map((row) => ({ id: String(row.id), taskId: String(row.task_id), eventType: String(row.event_type), note: String(row.note ?? ""), createdAt: String(row.created_at) })));
}
