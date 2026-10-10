import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentWorkspaceRole } from "@/lib/auth/authorization";
import { workspaceHome } from "@/lib/auth/workspace-access";
import { WorkspaceSubnav } from "@/components/shared/workspace-subnav";

const nav = [["Overview", "/neighbourhood"], ["Issues", "/issues"], ["Report an issue", "/neighbourhood/report"], ["Community groups", "/neighbourhood/groups"], ["Map", "/map"]] as const;

export default async function NeighbourhoodLayout({ children }: { children: ReactNode }) {
  const role = await getCurrentWorkspaceRole();
  if (!role) redirect("/auth/sign-in");
  if (role !== "common") redirect(workspaceHome(role));

  return <><div className="container"><WorkspaceSubnav items={nav} label="Neighbourhood navigation" /></div>{children}</>;
}
