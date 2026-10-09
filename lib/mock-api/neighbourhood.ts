import type { NeighbourhoodApi } from "@/lib/contracts/v1";
import { fail, matchesText, ok, paginate, toPublicIssue, toPublicProject } from "@/lib/mock-api/helpers";
import { campaignRows, follows, issueFlagRows, issueRows, partnerRows, pledgeRows, projectRows, taskRows, verifiedIssues } from "@/lib/mock-api/state";

export const neighbourhoodMockApi: NeighbourhoodApi = {
  async listProjects(query = {}) {
    let rows = projectRows.filter((row) => row.published && (!query.status || query.status === "all" || row.status === query.status) && (!query.department || row.department === query.department) && (!query.ward || row.ward === query.ward) && matchesText(query.q, row.title, row.description, row.location, row.ward));
    return ok(paginate(rows.map(toPublicProject), query));
  },
  async getProject(slug) { const row = projectRows.find((item) => item.slug === slug && item.published); return row ? ok(toPublicProject(row)) : fail("NOT_FOUND", "Published project not found."); },
  async listIssues(query = {}) {
    const rows = issueRows.filter((row) => (!query.category || query.category === "all" || row.category === query.category) && (!query.reviewStatus || query.reviewStatus === "all" || row.reviewStatus === query.reviewStatus) && (!query.source || query.source === "all" || row.source === query.source) && (query.urgent === undefined || query.urgent === "all" || row.urgent === query.urgent) && matchesText(query.q, row.title, row.description, row.location));
    return ok(paginate(rows.map(toPublicIssue), query));
  },
  async getIssue(id) { const row = issueRows.find((item) => item.id === id); return row ? ok(toPublicIssue(row)) : fail("NOT_FOUND", "Issue not found."); },
  async listPartners(query = {}) { const rows = partnerRows.filter((row) => row.approved && (!query.area || row.area.toLowerCase().includes(query.area.toLowerCase())) && (!query.capability || query.capability === "all" || row.capabilities.includes(query.capability)) && matchesText(query.q, row.name, row.description, row.area)); return ok(paginate(rows, query)); },
  async createIssue(input) {
    if (!input.title.trim() || input.description.trim().length < 20 || !Number.isFinite(input.latitude) || Math.abs(input.latitude) > 90 || !Number.isFinite(input.longitude) || Math.abs(input.longitude) > 180) return fail("VALIDATION", "Check the title, description, and coordinates.");
    const { photo: _photo } = input;
    const row = { id: `iss-mock-${Date.now()}`, title: input.title, description: input.description, category: input.category, location: input.location, latitude: input.latitude, longitude: input.longitude, observedAt: input.observedAt, createdAt: new Date().toISOString(), verificationCount: 0, reviewStatus: "unverified" as const, urgent: false, source: "citizen" as const };
    issueRows.unshift({ ...row, reporterContactAvailable: false });
    return ok(row);
  },
  async verifyIssue(issueId) { const row = issueRows.find((item) => item.id === issueId); if (!row) return fail("NOT_FOUND", "Issue not found."); if (verifiedIssues.has(issueId)) return fail("CONFLICT", "This demo session has already verified this issue."); verifiedIssues.add(issueId); row.verificationCount += 1; return ok({ verificationCount: row.verificationCount }); },
  async flagIssue(input) { if (!issueRows.some((row) => row.id === input.issueId)) return fail("NOT_FOUND", "Issue not found."); if (!input.reason.trim()) return fail("VALIDATION", "A reason is required."); const id = `flag-mock-${Date.now()}`; issueFlagRows.push({ id, ...input }); return ok({ flagId: id }); },
  async setProjectFollow(projectId, following) { if (!projectRows.some((row) => row.id === projectId)) return fail("NOT_FOUND", "Project not found."); if (following) follows.add(projectId); else follows.delete(projectId); return ok({ following }); },
  async confirmGroupTask(input) { const task = taskRows.find((row) => row.id === input.taskId); if (!task) return fail("NOT_FOUND", "Group task not found."); if (task.status !== "awaiting_confirmation") return fail("CONFLICT", "The task is not awaiting community confirmation."); task.confirmationCount += 1; task.status = input.decision === "confirmed" ? "confirmed" : "disputed"; return ok(task); },
  async createSimulatedPledge(input) { if (!campaignRows.some((row) => row.id === input.campaignId)) return fail("NOT_FOUND", "Campaign not found."); if (input.amount <= 0) return fail("VALIDATION", "Pledge amount must be positive."); const id = `pledge-mock-${Date.now()}`; pledgeRows.push({ id, campaignId: input.campaignId, amount: input.amount, simulated: true }); return ok({ pledgeId: id, simulated: true }); },
};

