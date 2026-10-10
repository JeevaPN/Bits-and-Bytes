import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentWorkspaceRole } from "@/lib/auth/authorization";
import { workspaceHome } from "@/lib/auth/workspace-access";

export default async function CommunityPartnersLayout({ children }: { children: ReactNode }) {
  const role = await getCurrentWorkspaceRole();
  if (!role) redirect("/auth/sign-in");
  if (role === "admin") redirect(workspaceHome(role));

  return <><nav aria-label="Community Partners navigation" className="container" style={{ display: "flex", gap: 8, paddingTop: 15, flexWrap: "wrap" }}>
    {role === "group" && <Link className="navlink" href="/community-partners">Partner directory</Link>}
    <Link className="navlink" href="/community-partners/apply">Apply</Link>
    <Link className="navlink" href="/community-partners/application-status">Application status</Link>
    {role === "group" && <><Link className="navlink" href="/community-partners/dashboard">Find suitable work</Link><Link className="navlink" href="/community-partners/dashboard/tasks">Work board</Link><Link className="navlink" href="/community-partners/dashboard/settings">Group settings</Link><Link className="navlink" href="/community-partners/dashboard/campaigns">Campaigns</Link><Link className="navlink" href="/sponsorship">Sponsorship</Link></>}
  </nav>{children}</>;
}
