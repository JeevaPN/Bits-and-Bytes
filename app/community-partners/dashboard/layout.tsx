import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentWorkspaceRole } from "@/lib/auth/authorization";
import { workspaceHome } from "@/lib/auth/workspace-access";
import { WorkspaceSubnav } from "@/components/shared/workspace-subnav";

const nav = [["Overview", "/community-partners/dashboard"], ["Work board", "/community-partners/dashboard/tasks"], ["Group settings", "/community-partners/dashboard/settings"], ["Campaigns", "/community-partners/dashboard/campaigns"], ["Public directory", "/community-partners"]] as const;

export default async function PartnerDashboardLayout({ children }: { children: ReactNode }) {
  const role = await getCurrentWorkspaceRole();
  if (!role) redirect("/auth/sign-in");
  if (role !== "group") redirect(workspaceHome(role));
  return <><div className="container"><WorkspaceSubnav items={nav} label="Community Partner navigation" /></div>{children}</>;
}
