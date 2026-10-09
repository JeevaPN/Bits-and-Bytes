import { beforeEach, describe, expect, it } from "vitest";
import { getNeighbourhoodDemoActor, getNeighbourhoodDemoConfirmation, isNeighbourhoodDemoProjectFollowed, neighbourhoodMockApi, setNeighbourhoodDemoActor, setNeighbourhoodDemoTaskStatus } from "@/lib/mock-api/neighbourhood";

describe("Neighbourhood adapter: reporting and public issue trust", () => {
  it("creates a canonical issue visible in a later list read", async () => {
    const created = await neighbourhoodMockApi.createIssue({ title: "Newly reported drain", description: "Standing water is collecting beside the school entrance after rain.", category: "open_drain", location: "School Road entrance", latitude: 13.071, longitude: 80.241, observedAt: "2026-10-10T08:30:00+05:30", photo: null });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const listed = await neighbourhoodMockApi.listIssues({ q: created.data.title });
    expect(listed.ok).toBe(true);
    expect(listed.ok && listed.data.items.some((issue) => issue.id === created.data.id)).toBe(true);
  });

  it("rejects missing or invalid coordinates instead of guessing them", async () => {
    const result = await neighbourhoodMockApi.createIssue({ title: "Invalid location report", description: "This description is long enough to pass the minimum validation rule.", category: "pothole", location: "Market Road", latitude: Number.NaN, longitude: 80.2, observedAt: "2026-10-10T08:30:00+05:30" });
    expect(result).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
  });

  it("returns public issue data without private reporter fields", async () => {
    const result = await neighbourhoodMockApi.getIssue("iss-001");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).not.toHaveProperty("reporterContactAvailable");
    expect(result.data).not.toHaveProperty("reviewNote");
    expect(result.data).not.toHaveProperty("reporterId");
  });

  it("requires a meaningful challenge reason", async () => {
    const result = await neighbourhoodMockApi.flagIssue({ issueId: "iss-001", reason: "   " });
    expect(result).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
  });
});

describe("Neighbourhood adapter: actor-aware actions", () => {
  beforeEach(() => setNeighbourhoodDemoActor(`test-actor-${Date.now()}-${Math.random()}`));

  it("allows one actor to verify once and rejects a repeat", async () => {
    const actor = getNeighbourhoodDemoActor();
    const first = await neighbourhoodMockApi.verifyIssue("iss-002");
    const second = await neighbourhoodMockApi.verifyIssue("iss-002");
    expect(first.ok).toBe(true);
    expect(second).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
    expect(getNeighbourhoodDemoActor()).toBe(actor);
  });

  it("allows a different actor to make an independent verification", async () => {
    setNeighbourhoodDemoActor(`actor-a-${Date.now()}`);
    const first = await neighbourhoodMockApi.verifyIssue("iss-001");
    setNeighbourhoodDemoActor(`actor-b-${Date.now()}`);
    const second = await neighbourhoodMockApi.verifyIssue("iss-001");
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
  });

  it("keeps verification separate from official review", async () => {
    setNeighbourhoodDemoActor(`review-separation-${Date.now()}`);
    const result = await neighbourhoodMockApi.verifyIssue("iss-001");
    expect(result.ok).toBe(true);
    const issue = await neighbourhoodMockApi.getIssue("iss-001");
    expect(issue.ok && issue.data.reviewStatus).toBe("unverified");
  });

  it("stores follows independently per actor", async () => {
    const projectId = "prj-001";
    setNeighbourhoodDemoActor(`follow-a-${Date.now()}`);
    const first = await neighbourhoodMockApi.setProjectFollow(projectId, true);
    setNeighbourhoodDemoActor(`follow-b-${Date.now()}`);
    const second = await neighbourhoodMockApi.setProjectFollow(projectId, false);
    expect(first).toMatchObject({ ok: true, data: { following: true } });
    expect(second).toMatchObject({ ok: true, data: { following: false } });
    setNeighbourhoodDemoActor("follow-a-verification");
    const third = await neighbourhoodMockApi.setProjectFollow(projectId, true);
    expect(third).toMatchObject({ ok: true, data: { following: true } });
    expect(isNeighbourhoodDemoProjectFollowed(projectId)).toBe(true);
    setNeighbourhoodDemoActor(`follow-b-${Date.now()}`);
    expect(isNeighbourhoodDemoProjectFollowed(projectId)).toBe(false);
  });
});

describe("Neighbourhood adapter: task confirmation and sponsorship", () => {
  it("requires a reason for a dispute and does not overwrite task lifecycle status", async () => {
    setNeighbourhoodDemoActor(`task-dispute-${Date.now()}`);
    setNeighbourhoodDemoTaskStatus("task-demo-001", "awaiting_confirmation");
    const invalid = await neighbourhoodMockApi.confirmGroupTask({ taskId: "task-demo-001", decision: "disputed", reason: "" });
    expect(invalid).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
    const valid = await neighbourhoodMockApi.confirmGroupTask({ taskId: "task-demo-001", decision: "disputed", reason: "The claimed cleanup is incomplete." });
    expect(valid.ok).toBe(true);
    expect(valid.ok && valid.data.status).toBe("awaiting_confirmation");
    expect(getNeighbourhoodDemoConfirmation("task-demo-001")).toMatchObject({ decision: "disputed" });
  });

  it("rejects non-positive simulated pledges and accepts positive demo pledges", async () => {
    const invalid = await neighbourhoodMockApi.createSimulatedPledge({ campaignId: "campaign-grp-001", amount: 0 });
    const valid = await neighbourhoodMockApi.createSimulatedPledge({ campaignId: "campaign-grp-001", amount: 500 });
    expect(invalid).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
    expect(valid).toMatchObject({ ok: true, data: { simulated: true } });
  });
});
