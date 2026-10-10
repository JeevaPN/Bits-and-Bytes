import type { GroupTaskStatus, ProjectStatus, OfficialReviewStatus } from "@/lib/domain/types";

const projectTransitions: Record<ProjectStatus, readonly ProjectStatus[]> = {
  planned: ["active", "cancelled"], active: ["delayed", "completed", "cancelled"], delayed: ["active", "completed", "cancelled"], completed: [], cancelled: [],
};
const issueTransitions: Record<OfficialReviewStatus, readonly OfficialReviewStatus[]> = {
  unverified: ["accepted", "rejected", "referred", "more_info", "duplicate"], accepted: ["referred", "duplicate"], rejected: [], referred: ["accepted", "rejected", "more_info"], more_info: ["accepted", "rejected", "referred"], duplicate: [],
};
const taskTransitions: Record<GroupTaskStatus, readonly GroupTaskStatus[]> = {
  adopted: ["in_progress", "referred"], in_progress: ["awaiting_confirmation", "referred"], awaiting_confirmation: ["confirmed", "disputed"], confirmed: ["reopened"], disputed: ["reopened", "referred"], reopened: ["in_progress", "referred"], referred: [],
};

export function canTransition<T extends string>(graph: Record<T, readonly T[]>, from: T, to: T) { return graph[from]?.includes(to) ?? false; }
export function canTransitionProject(from: ProjectStatus, to: ProjectStatus) { return canTransition(projectTransitions, from, to); }
export function canTransitionIssue(from: OfficialReviewStatus, to: OfficialReviewStatus) { return canTransition(issueTransitions, from, to); }
export function canTransitionTask(from: GroupTaskStatus, to: GroupTaskStatus) { return canTransition(taskTransitions, from, to); }
