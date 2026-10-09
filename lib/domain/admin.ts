import type { Issue, Project } from "@/lib/domain/types";

export type AdminDecision = "accept" | "reject" | "refer" | "more_info" | "duplicate";
export type CoordinationStatus = "detected" | "proposal" | "accepted" | "rejected" | "resolved";
export type RestorationStatus = "inspection_due" | "passed" | "defect_found" | "remediation" | "reinspection_due";
export type GroupApplicationStatus = "pending" | "approved" | "rejected" | "more_info" | "suspended";

export interface AdminProject extends Project {
  workType: string;
  ward: string;
  published: boolean;
  originalExpectedEndDate: string;
  knownClosure?: string;
}

export interface AdminIssue extends Issue {
  possibleProjectSlug?: string;
  duplicateOf?: string;
  reporterContactAvailable: boolean;
  reviewNote?: string;
}

export interface CoordinationCase {
  id: string;
  title: string;
  projectSlugs: string[];
  street: string;
  reason: string;
  decisionReason?: string;
  status: CoordinationStatus;
  proposedDates?: string;
}

export interface RestorationInspection {
  id: string;
  projectSlug: string;
  projectTitle: string;
  street: string;
  dueDate: string;
  status: RestorationStatus;
  inspector?: string;
  outcome?: string;
}

export interface GroupApplication {
  id: string;
  name: string;
  area: string;
  capabilities: string[];
  submittedAt: string;
  status: GroupApplicationStatus;
  reason?: string;
}

export interface AdminProjectFilters {
  query: string;
  status: AdminProject["status"] | "all";
  department: string | "all";
  ward: string | "all";
}

/** Frontend contract: replace demo implementation with authorized server action. */
export interface AdminActionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export type CreateProjectInput = Pick<AdminProject,
  "title" | "description" | "workType" | "department" | "contractor" |
  "location" | "latitude" | "longitude" | "ward" | "startDate" |
  "expectedEndDate" | "status" | "budget" | "published" | "knownClosure"
>;

export type AdminIssueActionInput = {
  issueId: string;
  action: AdminDecision;
  reason: string;
  publicResponse?: string;
  referredDepartment?: string;
  canonicalIssueId?: string;
};
