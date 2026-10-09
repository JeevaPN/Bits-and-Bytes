/** Shared deterministic fixtures for the v1 mock adapters. Demo-only, process memory. */
import { adminIssues, adminProjects, coordinationCases, groupApplications, restorationInspections } from "@/lib/domain/admin-demo-data";
import { groups } from "@/lib/domain/demo-data";
import type { GroupTask } from "@/lib/domain/types";
import type { AdminIssue, AdminProject, CoordinationCase, GroupApplication, RestorationInspection } from "@/lib/domain/admin";

export const projectRows: AdminProject[] = structuredClone(adminProjects);
export const issueRows: AdminIssue[] = structuredClone(adminIssues);
export const partnerRows = structuredClone(groups);
export const coordinationRows: CoordinationCase[] = structuredClone(coordinationCases);
export const inspectionRows: RestorationInspection[] = structuredClone(restorationInspections);
export const applicationRows: GroupApplication[] = structuredClone(groupApplications);
export const taskRows: GroupTask[] = [{ id: "task-demo-001", issueId: "iss-002", groupId: "grp-001", status: "in_progress", updatedAt: "2026-10-09T10:00:00Z", confirmationCount: 0 }];
export const pledgeRows: Array<{ id: string; campaignId: string; amount: number; simulated: true }> = [];
export const campaignRows: Array<{ id: string; groupId: string; title: string; purpose: string; targetAmount: number; activity?: string; simulated: true }> = [
  { id: "campaign-grp-001", groupId: "grp-001", title: "Lakeview cleanup supplies", purpose: "Reusable gloves, bags, and safety vests for volunteer cleanups.", targetAmount: 25000, activity: "Ward 12 cleanups", simulated: true },
  { id: "campaign-grp-002", groupId: "grp-002", title: "Greener North Ward", purpose: "Tools and native plants for community planting days.", targetAmount: 30000, activity: "North Ward planting", simulated: true },
];
export const campaignUseRows: Array<{ id: string; campaignId: string; amount: number; note: string }> = [];
export const issueFlagRows: Array<{ id: string; issueId: string; reason: string; details?: string }> = [];
export const projectMatchRows: Array<{ issueId: string; projectId: string; decision: "approved" | "rejected"; reason: string }> = [];
export const follows = new Set<string>();
export const verifiedIssues = new Set<string>();

