import type { Role } from "@/lib/domain/types";

export const DEMO_WORKSPACE_COOKIE = "civicsync-demo-workspace";

export function isDemoWorkspace(workspace: string | undefined): workspace is Role {
  return workspace === "common" || workspace === "group" || workspace === "admin";
}
