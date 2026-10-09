import type { AdminIssue, AdminProject, CoordinationCase, GroupApplication, RestorationInspection } from "@/lib/domain/admin";
import { groups, issues, projects } from "@/lib/domain/demo-data";

export const adminProjects: AdminProject[] = projects.map((project, index) => ({
  ...project,
  workType: index === 0 ? "Road resurfacing & drainage" : "Streetlight upgrade",
  ward: index === 0 ? "Ward 12" : "North Ward",
  published: true,
  originalExpectedEndDate: project.expectedEndDate,
  knownClosure: index === 0 ? "Eastbound lane, Market Street to Park Lane" : undefined,
}));

export const adminIssues: AdminIssue[] = issues.map((issue, index) => ({
  ...issue,
  possibleProjectSlug: index === 0 ? "lakeview-road-renewal" : undefined,
  reporterContactAvailable: true,
  reviewNote: index === 1 ? "Please confirm the exact blocked footpath location." : undefined,
}));

export const coordinationCases: CoordinationCase[] = [{
  id: "coord-demo-01",
  title: "Road resurfacing and drainage works may overlap",
  projectSlugs: ["lakeview-road-renewal"],
  street: "Lakeview Road · Ward 12",
  reason: "A planned utility excavation is reported near a recently resurfaced section. Confirm dates and affected segments before work is scheduled.",
  status: "detected",
  proposedDates: "Proposed shared work window not set",
}];

export const restorationInspections: RestorationInspection[] = [{
  id: "restore-demo-01",
  projectSlug: "lakeview-road-renewal",
  projectTitle: "Lakeview Road Renewal",
  street: "Lakeview Road · Ward 12",
  dueDate: "2026-12-27",
  status: "inspection_due",
}];

export const groupApplications: GroupApplication[] = groups.map((group, index) => ({
  id: group.id,
  name: index === 0 ? "Lakeview Neighbourhood Action" : "Green Streets Collective · renewal",
  area: group.area,
  capabilities: group.capabilities,
  submittedAt: index === 0 ? "2026-10-06" : "2026-10-09",
  status: index === 0 ? "pending" : "more_info",
  reason: index === 1 ? "Please provide a current coordinator contact." : undefined,
}));
