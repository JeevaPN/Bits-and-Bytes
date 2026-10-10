import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentWorkspaceRole } from "@/lib/auth/authorization";
import { workspaceHome } from "@/lib/auth/workspace-access";

export default async function PartnerDashboardLayout({ children }: { children: ReactNode }) {
  const role = await getCurrentWorkspaceRole();
  if (!role) redirect("/auth/sign-in");
  if (role !== "group") redirect(workspaceHome(role));
  return children;
}
