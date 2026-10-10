import { describe, expect, it } from "vitest";
import { canTransitionIssue, canTransitionProject, canTransitionTask } from "@/lib/domain/lifecycle";

describe("independent lifecycle rules", () => {
  it("allows public works to complete but not move back after completion", () => {
    expect(canTransitionProject("active", "completed")).toBe(true);
    expect(canTransitionProject("completed", "active")).toBe(false);
  });

  it("keeps official issue review separate from community verification", () => {
    expect(canTransitionIssue("unverified", "accepted")).toBe(true);
    expect(canTransitionIssue("accepted", "rejected")).toBe(false);
  });

  it("requires confirmation before a task can be confirmed or disputed", () => {
    expect(canTransitionTask("in_progress", "confirmed")).toBe(false);
    expect(canTransitionTask("awaiting_confirmation", "confirmed")).toBe(true);
    expect(canTransitionTask("awaiting_confirmation", "disputed")).toBe(true);
  });
});
