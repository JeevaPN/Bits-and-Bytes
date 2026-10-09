/**
 * CivicSync frontend API contract v1.
 * Frozen for parallel feature work. Changes require coordination from all owners.
 * Mock adapters are presentation fixtures only; production authorization belongs on the server.
 */
import type { Issue, IssueCategory, IssueSource, Project, ProjectStatus, OfficialReviewStatus, CommunityGroup, GroupTask, GroupTaskStatus } from "@/lib/domain/types";
import type { AdminIssueActionInput, AdminProject, CoordinationCase, GroupApplication, RestorationInspection } from "@/lib/domain/admin";

export const CONTRACT_VERSION = "1.0.0" as const;

export interface ApiError { code: "NOT_FOUND" | "VALIDATION" | "CONFLICT" | "FORBIDDEN" | "UNAVAILABLE" | "UNKNOWN"; message: string; fieldErrors?: Record<string, string> }
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };
export interface PageQuery { page?: number; pageSize?: number; q?: string }
export interface Page<T> { items: T[]; page: number; pageSize: number; total: number }
export interface ProjectQuery extends PageQuery { status?: ProjectStatus | "all"; department?: string; ward?: string }
export interface IssueQuery extends PageQuery { category?: IssueCategory | "all"; reviewStatus?: OfficialReviewStatus | "all"; source?: IssueSource | "all"; urgent?: boolean | "all" }
export interface PartnerQuery extends PageQuery { area?: string; capability?: IssueCategory | "all" }

export interface CreateIssueInput { title: string; description: string; category: IssueCategory; location: string; latitude: number; longitude: number; observedAt: string; photo?: File | null }
export interface FlagIssueInput { issueId: string; reason: string; details?: string }
export interface CreatePledgeInput { campaignId: string; amount: number; sponsorLabel?: string }
export interface GroupApplicationInput { name: string; description: string; area: string; contact: string; capabilities: IssueCategory[]; limitations: string }
export type UpdateAdminProjectInput = Partial<Pick<AdminProject, "title" | "description" | "workType" | "department" | "contractor" | "location" | "latitude" | "longitude" | "ward" | "startDate" | "expectedEndDate" | "status" | "budget" | "published" | "knownClosure">>;
export interface AcceptTaskInput { issueId: string; groupId: string }
export interface ReferTaskInput { issueId: string; groupId: string; reason: string }
export interface TaskProgressInput { taskId: string; note: string; evidence?: File | null }
export interface CompleteTaskInput { taskId: string; note: string; evidence: File }
export interface ConfirmTaskInput { taskId: string; decision: "confirmed" | "disputed"; reason?: string }
export interface GroupApplicationDecisionInput { applicationId: string; decision: "approve" | "reject" | "more_info" | "suspend"; reason: string }
export interface RestorationDecisionInput { inspectionId: string; outcome: "passed" | "defect_found"; note: string; evidence?: File | null }
export interface CreateCoordinationCaseInput { title: string; projectSlugs: string[]; street: string; reason: string }
export interface CoordinationDecisionInput { caseId: string; decision: "accepted" | "rejected"; reason: string; proposedDates?: string }
export interface PartnerProfileUpdateInput { groupId: string; description: string; area: string; contact: string; capabilities: IssueCategory[] }
export interface CreateCampaignInput { groupId: string; title: string; purpose: string; targetAmount: number; activity?: string }
export interface ReportCampaignUseInput { campaignId: string; amount: number; note: string; evidence?: File | null }

/** Neighbourhood screens depend only on this interface. */
export interface NeighbourhoodApi {
  listProjects(query?: ProjectQuery): Promise<ApiResult<Page<Project>>>;
  getProject(slug: string): Promise<ApiResult<Project>>;
  listIssues(query?: IssueQuery): Promise<ApiResult<Page<Issue>>>;
  getIssue(id: string): Promise<ApiResult<Issue>>;
  listPartners(query?: PartnerQuery): Promise<ApiResult<Page<CommunityGroup>>>;
  createIssue(input: CreateIssueInput): Promise<ApiResult<Issue>>;
  verifyIssue(issueId: string): Promise<ApiResult<{ verificationCount: number }>>;
  flagIssue(input: FlagIssueInput): Promise<ApiResult<{ flagId: string }>>;
  setProjectFollow(projectId: string, following: boolean): Promise<ApiResult<{ following: boolean }>>;
  confirmGroupTask(input: ConfirmTaskInput): Promise<ApiResult<GroupTask>>;
  createSimulatedPledge(input: CreatePledgeInput): Promise<ApiResult<{ pledgeId: string; simulated: true }>>;
}

/** Community Partners screens depend only on this interface. */
export interface CommunityPartnersApi {
  listOpportunities(query?: IssueQuery): Promise<ApiResult<Page<Issue>>>;
  listMyTasks(groupId: string): Promise<ApiResult<Page<GroupTask>>>;
  getPublicProfile(slug: string): Promise<ApiResult<CommunityGroup>>;
  submitApplication(input: GroupApplicationInput): Promise<ApiResult<{ applicationId: string; status: "pending" }>>;
  updateProfile(input: PartnerProfileUpdateInput): Promise<ApiResult<CommunityGroup>>;
  acceptTask(input: AcceptTaskInput): Promise<ApiResult<GroupTask>>;
  referTask(input: ReferTaskInput): Promise<ApiResult<{ referralId: string }>>;
  postProgress(input: TaskProgressInput): Promise<ApiResult<GroupTask>>;
  submitCompletion(input: CompleteTaskInput): Promise<ApiResult<GroupTask>>;
  createCampaign(input: CreateCampaignInput): Promise<ApiResult<{ campaignId: string; simulated: true }>>;
  reportCampaignUse(input: ReportCampaignUseInput): Promise<ApiResult<{ updateId: string }>>;
}

/** Admin screens depend only on this interface. */
export interface AdminApi {
  listProjects(query?: ProjectQuery): Promise<ApiResult<Page<AdminProject>>>;
  createProject(input: Omit<AdminProject, "id" | "slug" | "updatedAt" | "originalExpectedEndDate">): Promise<ApiResult<AdminProject>>;
  updateProject(projectId: string, patch: UpdateAdminProjectInput, reason: string): Promise<ApiResult<AdminProject>>;
  listIssues(query?: IssueQuery): Promise<ApiResult<Page<Issue>>>;
  decideIssue(input: AdminIssueActionInput): Promise<ApiResult<{ issueId: string; reviewStatus: OfficialReviewStatus }>>;
  decideProjectMatch(issueId: string, projectId: string, decision: "approve" | "reject", reason: string): Promise<ApiResult<{ issueId: string; projectId: string; decision: "approved" | "rejected" }>>;
  createCoordinationCase(input: CreateCoordinationCaseInput): Promise<ApiResult<CoordinationCase>>;
  listCoordinationCases(): Promise<ApiResult<CoordinationCase[]>>;
  decideCoordinationCase(input: CoordinationDecisionInput): Promise<ApiResult<CoordinationCase>>;
  listRestorationInspections(): Promise<ApiResult<RestorationInspection[]>>;
  listGroupApplications(): Promise<ApiResult<GroupApplication[]>>;
  decideGroupApplication(input: GroupApplicationDecisionInput): Promise<ApiResult<GroupApplication>>;
  recordRestoration(input: RestorationDecisionInput): Promise<ApiResult<RestorationInspection>>;
}

export type ContractProjectStatus = ProjectStatus;
export type ContractTaskStatus = GroupTaskStatus;
